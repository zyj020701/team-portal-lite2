# ADR-001：Monorepo 分层方案

> 文档编号：ADR-001
> 状态：✅ 已接受
> 日期：2026-08-18
> 决策者：架构组

---

## 一、背景

Team Portal Lite 是一个 B2B SaaS 工单管理系统，支撑 5000+ 付费企业客户、100 万客服人员。项目包含多个前端应用（管理后台、客服工作台、营销官网等）和大量可复用的业务逻辑、UI 组件、工具函数。

如果采用多仓库（Polyrepo）模式，将面临以下问题：

1. **代码复用困难**：共享的 UI 组件、工具函数、类型定义需要在多个仓库间通过 npm 发布或手动复制，版本同步成本高。
2. **依赖管理混乱**：多个应用使用不同版本的 React、Tailwind 等基础库，导致不一致和重复安装。
3. **构建配置重复**：每个仓库独立维护 tsconfig、eslint、vitest 配置，难以统一规范。
4. **跨包重构风险高**：修改一个共享包的 API 后，无法在一次提交中同时更新所有消费方，容易遗漏。
5. **原子提交不可行**：一个功能涉及多个包时，无法在单个 PR 中完成端到端变更。

因此需要一个 Monorepo 方案来统一管理 5 个应用和 10 个共享包，同时保证构建效率和依赖关系清晰。

---

## 二、决策

**采用 pnpm + Turborepo 作为 Monorepo 管理方案，按分层架构组织 5 Apps + 10 Packages。**

### 2.1 目录结构

```
team-portal-lite/
├── apps/                          # 5 个应用
│   ├── admin/                     #   企业管理后台
│   ├── agent/                     #   客服工作台（主应用）
│   ├── marketing/                 #   营销官网
│   ├── api/                       #   BFF 层（Next.js API Routes）
│   └── storybook/                 #   组件文档与可视化调试
├── packages/                      # 10 个共享包
│   ├── ui/                        #   基础组件库（Button/Input/Modal/Table）
│   ├── design-tokens/             #   Design Token 定义与主题系统
│   ├── icons/                     #   图标库
│   ├── config-eslint/             #   共享 ESLint 配置
│   ├── config-typescript/         #   共享 tsconfig 基础配置
│   ├── config-tailwind/           #   共享 Tailwind 预设
│   ├── utils/                     #   通用工具函数（日期/格式化/校验）
│   ├── types/                     #   全局 TypeScript 类型定义
│   ├── hooks/                     #   通用 React Hooks
│   └── config-store/              #   Zustand/TanStack Query 共享配置
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### 2.2 分层依赖方向（严格单向，禁止逆向）

```
apps (admin/agent/marketing/api/storybook)
        │
        ▼
packages/ui ──► packages/design-tokens
packages/hooks ──► packages/utils
packages/icons
        │
        ▼
packages/utils ──► packages/types
packages/config-* (eslint/typescript/tailwind/store)
```

**铁律：**
- `common` 层（utils、types、config-*）不依赖任何上层包。
- `ui` 层（ui、design-tokens、icons、hooks）可依赖 common 层，不依赖 apps。
- `apps` 层可依赖所有 packages，但 apps 之间禁止互相依赖。
- 共享逻辑必须下沉到更底层的 common 包，禁止在 apps 之间复制粘贴。

### 2.3 pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### 2.4 turbo.json 任务配置

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

关键设计：
- `build` 使用 `^build` 语法，确保依赖包先构建完成。
- `dev` 设置 `cache: false` 和 `persistent: true`，适合长期运行的开发服务器。
- `test` 和 `typecheck` 依赖 `^build`，确保被测包的依赖已构建。

### 2.5 循环依赖防护

- 在 CI 中集成 `madge` 进行循环依赖检测：`madge --circular packages/ apps/`。
- 在 ESLint 中配置 `import/no-cycle` 规则，开发时实时检测。
- 通过 Code Review 强制检查跨包 import 方向。

---

## 三、备选方案

### 备选方案 A：npm + Lerna（传统方案）

**描述**：使用 npm workspaces 管理依赖，Lerna 负责版本发布和任务编排。

**未选择原因**：
1. **npm workspaces 性能差**：npm 使用扁平化 node_modules，安装速度慢于 pnpm 的硬链接+符号链接机制，在 15 个包的规模下安装时间差距明显。
2. **磁盘空间浪费**：npm 将依赖提升到根 node_modules，多个包使用同一依赖时仍存在多份副本；pnpm 通过全局 store 硬链接，节省大量磁盘空间。
3. **幽灵依赖风险**：npm 扁平化后，包可以访问未在 package.json 中声明的依赖（phantom dependency），导致运行时隐患；pnpm 默认严格隔离，只能访问显式声明的依赖。
4. **Lerna 已进入维护模式**：Lerna 团队已被 Nrwl 收购，核心功能与 Turborepo 重叠且更新缓慢，社区重心已转向 Turborepo/Nx。
5. **构建缓存能力弱**：Lerna 没有内置的远程缓存和增量构建能力，Turborepo 的内容寻址缓存和远程缓存显著提升 CI 速度。

### 备选方案 B：Nx（全功能 Monorepo 工具）

**描述**：使用 Nx 作为 Monorepo 管理工具，提供项目图、任务编排、代码生成器等完整功能。

**未选择原因**：
1. **学习曲线陡峭**：Nx 提供大量概念（project graph、generators、executors、affected commands），团队上手成本高。本项目工期仅 4 天，需要快速启动。
2. **配置复杂度高**：Nx 倾向于用自己的插件体系接管构建配置（如 @nx/next、@nx/react），与 Next.js 原生配置存在额外适配层，可能产生版本兼容问题。
3. **过度工程化**：Nx 的代码生成器、依赖图可视化等功能在 15 个包的中等规模项目中收益有限，Turborepo 的零配置理念更适合本项目。
4. **锁定风险**：Nx 的插件体系与 Nx 版本强绑定，升级 Nx 大版本时可能需要同步升级所有插件，增加维护负担。Turborepo 对各框架无侵入，保持工具链原生体验。

### 备选方案 C：Yarn Workspaces + Lerna

**描述**：使用 Yarn Classic（v1）workspaces 管理依赖，Lerna 负责任务编排。

**未选择原因**：
1. **Yarn v1 已停止积极维护**：Yarn 团队重心转向 Yarn Berry（v2/v3/v4），但 Berry 的 PnP 机制与部分 Next.js 生态工具兼容性不佳。
2. **无内置构建缓存**：与 Lerna 组合后仍缺乏 Turborepo 的内容寻址缓存和远程缓存能力。
3. **pnpm 在 Monorepo 场景综合最优**：pnpm 的安装速度、磁盘效率、严格依赖隔离均优于 Yarn，且与 Turborepo 无缝集成。

---

## 四、后果

### 正面影响

1. **统一依赖管理**：所有包在根目录一次 `pnpm install` 即可，React、Tailwind、TypeScript 等基础库版本全局统一，避免版本漂移。
2. **增量构建与缓存**：Turborepo 根据文件内容哈希自动缓存构建结果，未变更的包直接复用缓存，CI 构建时间可缩短 60%+。
3. **原子提交**：一个功能涉及多个包时可在单个 PR 中完成，Code Review 和回滚都更简单。
4. **依赖隔离严格**：pnpm 的非扁平化 node_modules 杜绝幽灵依赖，每个包只能访问显式声明的依赖，运行时更可靠。
5. **共享配置集中**：ESLint、TypeScript、Tailwind 配置抽取为 config 包，所有应用和包统一继承，规范一致性有保障。
6. **循环依赖可检测**：madge + ESLint 双重防护，在开发和 CI 阶段阻断循环依赖。

### Trade-off 与需要承担的成本

1. **Turborepo 缓存配置需要调优**：`outputs` 配置不准确会导致缓存命中失败或缓存过期文件。需要在项目初期仔细验证每个包的构建产物路径。
2. **pnpm 的严格隔离可能导致兼容性问题**：少数依赖未正确声明子依赖的包在 pnpm 下会报错，需要通过 `pnpm.packageExtensions` 或 `.npmrc` 的 `shamefully-hoist` 临时修复。
3. **Monorepo 工具链版本需要统一管理**：Turborepo、pnpm、Node.js 版本需要在团队和 CI 中锁定（通过 `packageManager` 字段和 `.nvmrc`），否则可能出现"在我机器上能跑"的问题。
4. **分层纪律需要持续维护**：随着功能增加，开发者可能图方便在 apps 之间或逆向引入依赖，需要通过 madge 检测、ESLint 规则和 Code Review 持续守护。
5. **POC 验证要求**：在大规模创建 15 个包之前，先用 1 个 App + 1 个 Package 跑通构建与引用的最小原型，验证 pnpm workspace + Turborepo + Next.js + TypeScript 路径别名的端到端可行性。

---

## 五、评审记录

| 评审项 | 结果 |
|--------|------|
| 包含背景、决策、备选方案、后果四个部分 | ✅ |
| 决策明确选择 pnpm + Turborepo | ✅ |
| 备选方案至少 2 个并说明未选择原因 | ✅ 3 个（npm+Lerna、Nx、Yarn+Lerna） |
| 后果说明正面影响与 trade-off | ✅ 6 项正面 + 5 项 trade-off |
| 规划分层依赖方向（common → ui → apps） | ✅ 2.2 节 |
| 规划 madge 循环依赖检测 | ✅ 2.5 节 |
| turbo.json 使用 ^build 语法 | ✅ 2.4 节 |
| 明确 POC 验证要求 | ✅ 后果第 5 条 |