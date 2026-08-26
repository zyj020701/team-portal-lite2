# Team Portal Lite — Agent 执行指令集

> 本文件是 Team Portal Lite 项目的全流程 Agent 指令手册，覆盖项目概述、技术约束、代码规范、开发流程、安全合规、AI 协作、常见陷阱、决策日志、测试要求、文档要求共 10 个板块。
>
> **使用方式**：板块 4「开发流程」中每个阶段的指令块均可独立复制给 AI 执行。阶段一（Day 25，S1–S5）、阶段二（Day 26，D26-S01～D26-S05）、阶段三（Day 27，D27-S01～D27-S05）已完成；阶段四（Day 28，D28-S01～D28-S10）为当前执行阶段。

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈约束](#2-技术栈约束)
3. [代码规范](#3-代码规范)
4. [开发流程](#4-开发流程)
5. [安全与合规](#5-安全与合规)
6. [AI 协作约定](#6-ai-协作约定)
7. [常见陷阱](#7-常见陷阱)
8. [决策日志（ADR）](#8-决策日志adr)
9. [测试要求](#9-测试要求)
10. [文档要求](#10-文档要求)

---

## 1. 项目概述

### 1.1 业务定位

Team Portal Lite 是面向大型企业客服部门的 **B2B SaaS 工单管理系统前端**（"高级接单台"），支撑：

- **5000+** 付费企业客户
- **100 万** 客服人员
- **DAU 30 万**

### 1.2 个人成长目标

简历核心项目，对标大厂 P6/P7，沉淀可量化成果：

| 指标 | 目标 |
|------|------|
| Lighthouse 性能分 | ≥ 96（四个核心页面） |
| TypeScript 严格模式 | 0 个 `any` |
| 测试覆盖率 | ≥ 75%（核心模块 ≥ 85%） |
| 虚拟滚动帧率 | ≥ 50fps（10 万条数据） |
| WebSocket 消息延迟 | ≤ 100ms |
| 首屏 FCP | ≤ 2s |
| 可交互时间 TTI | ≤ 3s |
| JS Bundle（gzip） | ≤ 150KB（首屏关键资源） |
| 累积布局偏移 CLS | ≤ 0.1 |
| ESLint | 0 error 0 warning |

### 1.3 核心功能范围

- 多租户动态主题系统（运行时 CSS 变量换肤）
- WebSocket 实时通知（心跳、指数退避重连、消息队列）
- 大数据虚拟滚动列表（@tanstack/react-virtual 动态行高）
- 工单列表页（筛选、搜索、排序、批量操作）
- 工单详情页（状态机、备注、分配、时间线）
- 响应式适配（移动端→平板→桌面→大屏四断点）
- 国际化 i18n（next-intl，5 种语言，locale 路由）
- Dashboard 数据概览（Recharts 图表，实时刷新，下钻交互）
- 性能优化体系（Bundle 分析、代码分割、图片/字体优化、渲染优化）
- CI/CD 流水线（GitHub Actions + Lighthouse CI 门禁）
- 生产部署（Vercel + Preview 环境 + HTTPS）

### 1.4 工期规划

| 日期 | 阶段 | 内容 | 状态 |
|------|------|------|------|
| Day 25 | 阶段一 | 立项 + 架构设计 + 基建 + 设计系统（S1–S5） | ✅ 已完成 |
| Day 26 | 阶段二 | 核心功能开发（D26-S01～D26-S05） | ✅ 已完成 |
| Day 27 | 阶段三 | 进阶功能 + 联调 + E2E 测试（D27-S01～D27-S05） | ✅ 已完成 |
| Day 28 | 阶段四 | 性能优化 + 测试补齐 + 类型治理 + CI/CD + 部署交付（D28-S01～D28-S10） | 🔄 当前 |

---

## 2. 技术栈约束

### 2.1 十条红线（不可违反）

| 编号 | 红线名称 | 具体要求 | 违反后果 |
|------|----------|----------|----------|
| **R1** | 性能红线 | Lighthouse ≥ 96（四页面）；虚拟滚动 ≥ 50fps（10 万条）；WS 消息接收→UI ≤ 100ms；FCP ≤ 2s；TTI ≤ 3s；首屏 JS gzip ≤ 150KB；CLS ≤ 0.1；Dashboard Lighthouse ≥ 90；语言切换 ≤ 100ms | CI 阻断合并 |
| **R2** | 类型红线 | TypeScript `strict: true`（含所有严格子选项 + `noUncheckedIndexedAccess`），**0 个 `any`**；所有接口数据、WebSocket 消息、主题 Token、组件 Props、翻译 key、图表数据、Zustand State 必须有完整类型定义 | ESLint 报错 + CI 阻断 |
| **R3** | 测试红线 | 测试覆盖率 ≥ 75%（核心模块 ≥ 85%）；P0 核心业务流程必须有 Playwright E2E 覆盖（≥5 条）；组件必须有交互测试（非仅快照）；测试运行 ≤ 2 分钟；无 flaky 测试 | CI 阻断合并 |
| **R4** | 框架红线 | **Next.js 14 + RSC + App Router**；禁止 Pages Router；禁止 Vite + React Router；RSC 中禁止 useState/useEffect/事件处理；i18n 必须使用 `[locale]` 动态段路由；动态导入必须使用 `next/dynamic`；图片必须使用 `next/image`；字体必须使用 `next/font` | 构建失败 |
| **R5** | 工程红线 | **pnpm + Turborepo** Monorepo；禁止混用 npm/yarn；禁止 Lerna；5 Apps + 10 Packages 分层清晰；Zustand store 按领域拆分，单个 store 不超过 200 行；包间无循环依赖 | 构建失败 |
| **R6** | UI 红线 | **Radix UI + Tailwind CSS + shadcn/ui**；禁止 Ant Design/Element UI；**禁止 CSS-in-JS**；图表必须使用 **Recharts**；响应式必须使用 Tailwind 前缀（禁止原生 `@media` 散落组件）；禁止硬编码中文字符串 | Code Review 驳回 |
| **R7** | 状态红线 | 客户端 UI 状态 → **Zustand**；服务端数据 → **TanStack Query**；**禁止 Redux**；**禁止用 Zustand 存服务端数据**；queryKey 必须遵循 `[实体, 操作, 参数]` 规范；禁止 `useState`+`useContext` 管理全局状态 | Code Review 驳回 |
| **R8** | 测试框架红线 | 单元测试 **Vitest**（禁止 Jest）；组件测试 **@testing-library/react**（禁止 Enzyme）；E2E **Playwright**（禁止 Cypress）；覆盖率使用 Vitest 内置 `--coverage`（v8）；E2E 选择器必须使用 `getByRole`/`getByLabel`/`getByText`，禁止 CSS 类名选择器 | CI 阻断 |
| **R9** | 部署红线 | 部署至 **Vercel**（禁止 Netlify/自托管/Docker）；CI 集成 **Lighthouse CI**（必须使用 `@lhci/cli`）；禁止自建 Nginx/Node 服务器；环境变量通过 Vercel 平台配置；CI 平台使用 GitHub Actions | — |
| **R10** | 样式红线 | **Design Token + CSS 变量**；Tailwind 颜色必须引用 CSS 变量；**禁止硬编码颜色值和尺寸值**；断点必须在 `tailwind.config.ts` 统一配置；Token 命名统一 | ESLint 报错 |

### 2.2 技术栈版本基线

| 类别 | 技术 | 版本/说明 |
|------|------|-----------|
| 框架 | Next.js | 14.x，App Router，RSC |
| 语言 | TypeScript | 5.x，strict mode + noUncheckedIndexedAccess |
| Monorepo | pnpm + Turborepo | pnpm 8.x，turbo 2.x |
| UI | Radix UI + Tailwind CSS + shadcn/ui | Tailwind 3.4+ |
| 客户端状态 | Zustand | 4.x |
| 服务端状态 | TanStack Query | 5.x |
| 虚拟滚动 | @tanstack/react-virtual | 3.x |
| WebSocket | 原生 WebSocket API | 禁止 socket.io-client |
| 国际化 | next-intl | 与 App Router 集成，`[locale]` 动态段 |
| 图表 | Recharts | 基于 React 组件化声明 |
| 单元测试 | Vitest + @testing-library/react | 1.x+，jsdom 环境 |
| E2E | Playwright | 1.x+ |
| 性能分析 | @next/bundle-analyzer | 与 Next.js 构建集成 |
| CI/CD | GitHub Actions + @lhci/cli | Lighthouse CI 门禁 |
| 部署 | Vercel | Production + Preview |
| 代码质量 | ESLint + Prettier | 强制 no-explicit-any |

---

## 3. 代码规范

### 3.1 TypeScript

- 所有包启用 `strict: true`、`noUncheckedIndexedAccess: true`、`noImplicitReturns: true`、`noFallthroughCasesInSwitch: true`
- **禁止 `any`**，使用 `unknown` + 类型守卫替代
- 第三方库类型缺失时用 `declare module` 或 `*.d.ts` 补充，禁止 `as any`
- 所有公共组件 Props、Hooks 返回值、工具函数参数/返回值必须有显式类型
- 泛型组件保持业务无关（如 `VirtualList<T>`）
- Zustand store 必须定义显式 State 接口，禁止隐式类型推断
- 翻译 key 通过 TypeScript 类型约束，禁止松散字符串引用
- 数组索引访问（`noUncheckedIndexedAccess`）必须处理 `undefined` 情况
- 类型导入使用 `import type` 明确标注

### 3.2 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 包名 | `@team-portal/xxx` kebab-case | `@team-portal/ui` |
| 组件 | PascalCase | `TicketList.tsx` |
| Hooks | camelCase，`use` 前缀 | `useWebSocket.ts` |
| 工具函数 | camelCase | `formatDate.ts` |
| 类型/接口 | PascalCase，接口不加 `I` 前缀 | `TicketStatus` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RECONNECT_DELAY` |
| CSS 变量 | `--category-token-scale` | `--color-primary-500` |
| Tailwind Token | kebab-case 对应 CSS 变量 | `bg-primary` |
| 翻译命名空间 | 点分嵌套，按页面/模块组织 | `tickets.list.title` |
| queryKey | `[实体, 操作, 参数]` | `['tickets', 'list', filters]` |
| 测试文件 | `*.test.ts`/`*.test.tsx`（单元）、`*.spec.ts`（E2E） | `formatDate.test.ts` |

### 3.3 文件组织

```
packages/
  ui/src/components/    # 通用 UI 组件
  hooks/src/            # 通用 Hooks
  utils/src/            # 工具函数
  types/src/            # 共享类型
  api-client/src/       # API 客户端
  design-tokens/src/    # Token 定义
  config-tailwind/src/  # Tailwind 配置
  i18n/src/             # 国际化配置
  icons/src/            # 图标
  config-store/src/     # 配置存储
apps/web-app/           # 主工作台应用
  app/[locale]/         # App Router 路由（locale 动态段）
  components/           # 业务组件
  stores/               # Zustand stores（按领域拆分）
  e2e/                  # Playwright E2E 测试
  messages/             # 翻译 JSON 文件
.github/workflows/      # GitHub Actions CI 配置
docs/
  adr/                  # ADR 决策日志
  reports/              # Lighthouse/覆盖率等报告
```

### 3.4 组件规范

- 默认导出 Server Component；仅交互子组件加 `"use client"`
- 组件职责单一，虚拟滚动等通用组件不耦合业务字段
- 列表项 key 必须使用业务唯一 ID，**禁止数组索引**
- 所有异步操作必须有加载态反馈
- 关键操作（删除、关闭）必须有二次确认
- 图表组件使用 `React.memo` 包裹，数据用 `useMemo` 缓存
- 移动端按钮点击区域 ≥ 44px × 44px
- 重型组件（图表、Modal、富文本）使用 `next/dynamic` 动态导入
- 图片必须使用 `next/image`，禁止原生 `<img>`
- 字体必须使用 `next/font`，禁止 `@font-face` 或 Google Fonts 外链

### 3.5 样式规范

- 所有颜色/圆角/间距通过 Tailwind 类名引用 Token
- 禁止内联硬编码样式
- 主题变量统一注入 `:root`（`document.documentElement`）
- 禁止动态拼接 Tailwind 类名（如 `bg-${color}-500`）
- 响应式必须使用 Tailwind 前缀（`sm:`、`md:`、`lg:`、`xl:`），禁止原生 `@media`
- 断点统一在 `tailwind.config.ts` 的 `screens` 中配置，禁止组件内硬编码像素断点
- 移动端优先（Mobile First）：默认样式为移动端，大屏通过前缀逐步增强

### 3.6 Git 提交

- Conventional Commits：`feat:`、`fix:`、`refactor:`、`test:`、`docs:`、`chore:`
- 提交前必须通过：ESLint + Prettier + tsc 类型检查 + 全量测试
- 禁止提交 `console.log`、`debugger`、注释掉的代码

---

## 4. 开发流程

> 以下每个阶段指令块均可独立复制给 AI 执行。
>
> **阶段一（Day 25，S1–S5）已完成**，产出物：
> - `docs/01-core-questions.md`、`docs/02-use-cases.md`、`docs/adr/ADR-001～003`
> - Monorepo 骨架（5 Apps + 10 Packages）
> - Design Token 体系 + Button/Input/Modal/Table 基础组件
>
> **阶段二（Day 26，D26-S01～D26-S05）已完成**，产出物：
> - 多租户动态主题系统、WebSocket 实时通知服务、虚拟滚动列表组件
> - 工单列表页（筛选栏 + URL 同步 + TanStack Query + 批量操作 + 键盘导航）
> - 工单详情页（状态机 + 时间线 + 备注 + 分配 + 返回位置保持）
>
> **阶段三（Day 27，D27-S01～D27-S05）已完成**，产出物：
> - 响应式布局体系（四断点适配、移动端卡片布局、Dashboard 栅格）
> - 国际化 i18n 集成（next-intl，5 种语言，`[locale]` 动态段路由）
> - Dashboard 数据概览页（Recharts 三图表、TanStack Query 实时刷新、下钻交互）
> - 状态管理联调（Zustand 三 store 拆分、queryKey 规范、跨页面同步、持久化）
> - Playwright E2E 测试（5 条核心业务流程，语义化选择器）
>
> **阶段四（Day 28，D28-S01～D28-S10）为当前执行阶段**，目标：性能优化冲刺 Lighthouse 96+、单元测试覆盖率 75%+、TypeScript 0 any、Lighthouse CI 门禁、Vercel 生产部署与文档交付。

---

### 阶段一：Day 25（S1–S5）— 立项与基建 ✅

> 已完成。详见 `docs/01-core-questions.md`、`docs/02-use-cases.md`、`docs/adr/`。

---

### 阶段二：Day 26（D26-S01～D26-S05）— 核心功能 ✅

> 已完成。多租户主题、WebSocket、虚拟滚动、工单列表/详情页均已交付。

---

### 阶段三：Day 27（D27-S01～D27-S05）— 进阶功能与联调 ✅

> 已完成。响应式、i18n、Dashboard、状态管理联调、5 条 Playwright E2E 均已交付。

---

### 阶段四：Day 28（D28-S01～D28-S10）— 优化、测试与部署 🔄

#### D28-S01：Bundle 分析与代码分割优化

**本阶段做什么：**

1. 安装并配置 `@next/bundle-analyzer`，在 `apps/web-app/next.config.js` 中集成。
2. 执行 `ANALYZE=true pnpm build` 生成构建产物体积报告（HTML），识别：
   - 超过 50KB 的 chunk
   - 重复打包的依赖
   - 全量导入的库（如 `import _ from 'lodash'`）
3. 形成优化清单，记录到 `docs/reports/bundle-analysis.md`。
4. 对重型组件使用 `next/dynamic` 动态导入：
   - Dashboard 图表组件（`TrendChart`、`StatusPieChart`、`TopAssigneesBarChart`）
   - 工单详情的时间线组件（`TicketTimeline`）
   - 大型 Modal（如分配弹窗、批量操作确认弹窗）   - 配置 `ssr: false` + `loading: Skeleton` 骨架屏
5. 对大型工具库改为按需引入（如 `import debounce from 'lodash/debounce'`）或替换为原生实现。
6. 验证首屏关键 JS chunk gzip 后 ≤ 150KB。

**验收标准：**

- [ ] Bundle 分析报告已生成（`docs/reports/bundle-analysis.md`），标注至少 3 项优化点
- [ ] 至少 3 个重型组件使用 `dynamic()` 导入并有骨架屏 loading
- [ ] 首屏关键 JS chunk gzip 后 ≤ 150KB
- [ ] 无全量 `import _ from 'lodash'` 等全量导入
- [ ] 动态导入组件无白屏闪烁（骨架屏过渡）
- [ ] `pnpm build` 无错误

**红线提醒：**
- **R1 性能红线**：首屏 JS gzip ≤ 150KB
- **R4 框架红线**：动态导入必须使用 `next/dynamic`，禁止 `React.lazy`

---

#### D28-S02：图片、字体与运行时渲染优化

**本阶段做什么：**

1. 全局搜索原生 `<img>` 标签，全部替换为 `next/image`：
   - 配置 `width`/`height`（或 `fill` + `sizes`）
   - 所有图片必须有 `alt` 属性
   - 首屏关键图片加 `priority`
   - 在 `next.config.js` 的 `images.remotePatterns` 中配置远程域名
   - 配置 WebP/AVIF 格式（`formats: ['image/webp', 'image/avif']`）
2. 字体改用 `next/font` 加载：
   - 配置 `display: 'swap'` 避免 FOIT
   - 移除手动 `@font-face` 和 Google Fonts 外链
3. 运行时渲染优化：
   - 使用 React DevTools Profiler 录制筛选、滚动等高频交互
   - 列表项子组件（`TicketRow`）用 `React.memo` 包裹
   - 复杂计算用 `useMemo` 缓存
   - 事件回调用 `useCallback` 缓存
   - Zustand 使用精确选择器（selector）或 `useShallow` 减少不必要重渲染
   - 验证筛选变更时侧边栏/导航不重渲染

**验收标准：**

- [ ] 全局无原生 `<img>`，所有 `Image` 有 `alt` 且首屏图有 `priority`
- [ ] 字体通过 `next/font` 加载，无 FOIT，无手动 `@font-face`/Google Fonts 外链
- [ ] Profiler 验证筛选变更时侧边栏/导航不重渲染
- [ ] 至少 2 个高频子组件使用 `React.memo`
- [ ] Zustand 无 `useStore()` 全量订阅（均使用 selector）
- [ ] WebSocket 推送 100 条消息页面不卡顿

**红线提醒：**
- **R4 框架红线**：图片必须使用 `next/image`，字体必须使用 `next/font`
- **R1 性能红线**：CLS ≤ 0.1（图片/动态内容需预留尺寸）

---

#### D28-S03：Lighthouse 跑分与逐项调优

**本阶段做什么：**

1. 执行生产构建：`pnpm build && pnpm start`。
2. 对四个核心页面运行 Lighthouse：
   - 首页（`/[locale]`）
   - 工单列表页（`/[locale]/tickets`）
   - 工单详情页（`/[locale]/tickets/[id]`）
   - Dashboard（`/[locale]/dashboard`）
3. 记录每项分数（Performance、Accessibility、Best Practices、SEO）到 `docs/reports/lighthouse-baseline.md`。
4. 针对未达标项逐项优化：
   - **FCP 慢**：优化关键渲染路径，内联关键 CSS，减少渲染阻塞资源
   - **LCP 慢**：优化最大内容元素（图片加 `priority`，减少服务端响应时间）
   - **TBT 高**：拆分长任务，延迟非关键 JS，使用 `requestIdleCallback`
   - **CLS 高**：为图片/动态内容预留尺寸（`aspect-ratio`、骨架屏）
   - **Accessibility**：补充 `alt`、`aria-label`，修复颜色对比度
5. 重复"跑分→定位→优化→复跑"循环直到达标。
6. 将最终报告保存到 `docs/reports/lighthouse-final.md`。

**验收标准：**

- [ ] 四个核心页面均有 Lighthouse 报告（基线 + 最终）
- [ ] Performance 均 ≥ 96（Dashboard 可 ≥ 90 并在文档中说明）
- [ ] Accessibility / Best Practices / SEO 均 ≥ 95
- [ ] CLS ≤ 0.1
- [ ] FCP ≤ 2s
- [ ] 至少一轮完整的迭代优化记录可追溯

**红线提醒：**
- **R1 性能红线**：Lighthouse ≥ 96（四页面），FCP ≤ 2s，TTI ≤ 3s，CLS ≤ 0.1

---

#### D28-S04：测试环境配置与工具函数测试

**本阶段做什么：**

1. 在 Monorepo 根目录配置 Vitest（`vitest.config.ts`）：
   - `environment: 'jsdom'`
   - `globals: true`
   - `setupFiles` 引入 `@testing-library/jest-dom`
   - 覆盖率 `provider: 'v8'`，阈值 `lines/branches/functions ≥ 75`
   - 包含所有 packages 和 apps/web-app 的测试文件
2. 在根 `package.json` 添加脚本：`test`、`test:watch`、`test:coverage`。
3. 安装依赖：`vitest`、`@testing-library/react`、`@testing-library/jest-dom`、`jsdom`、`@vitejs/plugin-react`。
4. 对 `packages/utils` 中的纯函数编写单元测试：
   - 日期格式化（各种格式、边界日期、无效日期）
   - 防抖/节流（调用次数、延迟、取消、立即执行）
   - 状态机判断 `canTransition(from, to)`（合法/非法/边界状态）
   - 主题 Token 转换（对象转 CSS 变量、默认值合并、嵌套 Token）
5. 每个函数覆盖正常、边界、异常场景，每个测试文件至少 3 个用例。

**验收标准：**

- [ ] `vitest.config.ts` 配置完整，`pnpm test` 和 `pnpm test:coverage` 可正常运行
- [ ] `@testing-library/jest-dom` 断言生效（`toBeInTheDocument` 等）
- [ ] `packages/utils` 所有导出纯函数均有对应的 `.test.ts` 文件
- [ ] 每个测试文件至少 3 个用例
- [ ] 状态机 `canTransition` 覆盖所有状态转换组合
- [ ] 所有测试通过

**红线提醒：**
- **R8 测试框架红线**：单元测试必须使用 Vitest（禁止 Jest），断言使用 `@testing-library/jest-dom`
- **R3 测试红线**：覆盖率 ≥ 75%

---

#### D28-S05：Store、Hooks 与组件交互测试

**本阶段做什么：**

1. **Zustand Store 测试**（3 个 store）：
   - `ui-store`：侧边栏开关、主题切换、筛选条件变更
   - `ticket-store`：工单选择、批量操作、缓存更新
   - `notification-store`：通知列表、已读/未读、WebSocket 消息入队
   - 验证 actions 执行后 state 正确更新
   - 验证 `persist` 中间件的 localStorage 读写（mock localStorage）
2. **Hooks 测试**（4 个核心 Hooks，使用 `renderHook`）：
   - `useTheme`：验证 CSS 变量更新、主题切换副作用
   - `useWebSocket`：验证连接状态、消息回调、重连逻辑（mock WebSocket）
   - `useVirtualList`：验证初始化与滚动计算（mock ResizeObserver）
   - `useTicketFilters`：验证筛选更新、防抖搜索、URL 同步
3. **组件交互测试**（4 个基础组件）：
   - `Button`：点击事件、disabled 状态、variant 样式
   - `Input`：输入事件、placeholder、disabled、键盘事件
   - `Modal`：打开/关闭、overlay 点击、ESC 关闭、焦点陷阱
   - `NotificationBell`：未读数显示、点击展开、标记已读
   - 使用 `getByRole`/`getByLabel`/`getByText` 语义化选择器
   - 覆盖点击、输入、键盘、disabled 等行为

**验收标准：**

- [ ] 3 个 store 均有测试，覆盖核心 actions + persist 读写
- [ ] 4 个 Hooks 均有测试，`useWebSocket` 和 `useTheme` 验证副作用
- [ ] 4 个组件均有交互测试，使用语义化选择器（无 CSS 类名选择器）
- [ ] 每个组件至少覆盖 2 种交互
- [ ] disabled 状态验证不可交互
- [ ] 所有测试通过

**红线提醒：**
- **R8 测试框架红线**：组件测试必须使用 `@testing-library/react`（禁止 Enzyme），Hooks 测试必须使用 `renderHook`，选择器必须用语义化查询
- **R3 测试红线**：组件必须有交互测试（非仅快照）

---

#### D28-S06：覆盖率报告与针对性补齐

**本阶段做什么：**

1. 执行 `pnpm test:coverage` 生成全量覆盖率报告。
2. 打开 HTML 覆盖率报告（`coverage/index.html`），识别：
   - 覆盖率低于 60% 的文件
   - 未覆盖的代码行（红色标记）
3. 针对核心模块补齐测试：
   - `packages/utils`：目标 ≥ 85%
   - `apps/web-app/stores/`：目标 ≥ 85%
   - `apps/web-app/hooks/`：目标 ≥ 85%
   - 纯展示组件可适当降低，但交互逻辑必须覆盖
4. 再次运行 `pnpm test:coverage` 确认整体覆盖率达标。
5. 验证无 flaky 测试：连续运行 3 次（`pnpm test -- --run` 重复 3 次）均通过。
6. 确认全量测试运行时间 ≤ 2 分钟。

**验收标准：**

- [ ] 覆盖率 HTML 报告已生成
- [ ] 整体语句/分支/函数覆盖率均 ≥ 75%
- [ ] 核心模块（utils/store/Hooks）覆盖率 ≥ 85%
- [ ] 无完全未测试的核心文件
- [ ] 连续运行 3 次均通过（无 flaky）
- [ ] 全量测试运行时间 ≤ 2 分钟

**红线提醒：**
- **R3 测试红线**：覆盖率 ≥ 75%（核心模块 ≥ 85%），无 flaky 测试，测试运行 ≤ 2 分钟

---

#### D28-S07：TypeScript 全量检查与 any 清零

**本阶段做什么：**

1. 确认所有 `tsconfig.json` 开启严格选项：
   - `strict: true`
   - `noUncheckedIndexedAccess: true`
   - `noImplicitReturns: true`
   - `noFallthroughCasesInSwitch: true`
2. 执行 `pnpm tsc --noEmit` 全量检查，收集所有类型错误。
3. 全局搜索 `: any`、`as any`、`<any>`，逐文件清零：
   - 函数参数替换为具体接口或泛型
   - 变量替换为推断类型或具体类型
   - 第三方返回值用类型守卫收窄或 `unknown` 替代
4. 为核心数据结构定义完整 interface（在 `packages/types/src/index.ts`）：
   - `Ticket`、`TicketStatus`、`TicketPriority`
   - `ThemeTokens`
   - `WebSocketMessage<T>`
   - `User`、`Tenant`
5. 在 API 响应和 WebSocket 消息入口应用类型标注。
6. 对数组索引访问（`noUncheckedIndexedAccess`）补充 `undefined` 检查或可选链。

**验收标准：**

- [ ] 所有 `tsconfig.json` 严格子选项均开启
- [ ] 全局搜索 `: any`/`as any`/`<any>` 无匹配
- [ ] 6 个核心数据 interface 均已定义且字段完整
- [ ] API 响应和 WebSocket 消息有类型标注
- [ ] `noUncheckedIndexedAccess` 下数组访问均有 `undefined` 处理
- [ ] `pnpm tsc --noEmit` 无任何类型错误

**红线提醒：**
- **R2 类型红线**：TypeScript strict + noUncheckedIndexedAccess，0 个 `any`，所有接口数据必须有完整类型定义

---

#### D28-S08：第三方类型补丁与 ESLint 加固

**本阶段做什么：**

1. 排查第三方库类型缺失情况：
   - 执行 `pnpm tsc --noEmit` 查找 "Could not find a declaration file for module" 错误
   - 在 `packages/types/src/` 或 `apps/web-app/types/` 创建 `*.d.ts` 声明文件
   - 用 `declare module 'xxx'` 补充模块类型
2. 扩展 `Window` 接口：
   - 对 `window` 上的自定义属性（如 WebSocket 相关、主题相关）扩展 `Window` 接口
   - 禁止用 `any` 兜底
3. 在 ESLint 配置（`eslint.config.mjs`）中开启并强制：
   - `@typescript-eslint/no-explicit-any`: `'error'`
   - `@typescript-eslint/no-unsafe-assignment`: `'error'`
   - `@typescript-eslint/no-unsafe-call`: `'error'`
   - `@typescript-eslint/no-unsafe-member-access`: `'error'`
   - `@typescript-eslint/consistent-type-imports`: `'warn'`
4. 执行 `pnpm lint` 修复所有 error 和 warning。
5. 执行 `pnpm prettier --check .` 确认格式统一。

**验收标准：**

- [ ] 无类型第三方库均有 `*.d.ts` 声明文件
- [ ] `window` 自定义属性有类型扩展（非 `any`）
- [ ] ESLint 5 条类型相关规则均开启且级别正确
- [ ] `pnpm lint` 全量通过，0 error 0 warning
- [ ] 无 `any` 兜底的第三方调用

**红线提醒：**
- **R2 类型红线**：0 个 `any`，第三方库类型缺失必须用 `*.d.ts` 补充
- **R3 测试红线 / R5 工程红线**：ESLint 0 error 0 warning 是 CI 合并前提

---

#### D28-S09：Lighthouse CI 与 GitHub Actions 配置

**本阶段做什么：**

1. 安装 `@lhci/cli` 作为开发依赖。
2. 在项目根目录创建 `lighthouserc.js`（或 `.lighthouserc.json`）：
   - **collect**：`numberOfRuns: 3`（取中位数减少波动）、四个核心页面 URL、`startServerCommand: 'pnpm start'`、固定 `throttling` 设置
   - **assert**：Performance ≥ 0.96、Accessibility ≥ 0.95、Best Practices ≥ 0.95、SEO ≥ 0.95（低于阈值为 error）；添加资源预算（JS ≤ 150KB、图片 ≤ 500KB、总请求 ≤ 30，warn 级别）
   - **upload**：配置报告存储（`target: 'filesystem'` 保存到 CI 制品）
3. 在 `.github/workflows/ci.yml` 配置 CI 工作流：
   - 触发条件：`pull_request` + `push`（到 main 分支）
   - 步骤：checkout 代码 → 固定 Node.js 版本 → 配置 pnpm 缓存 → `pnpm install` → `pnpm lint` → `pnpm test` → `pnpm build` → `pnpm lhci autorun`
   - 上传 Lighthouse 报告为 CI artifact
4. 在根 `package.json` 添加 `"lhci": "lhci autorun"` 脚本。
5. 本地运行 `pnpm build && pnpm lhci autorun` 验证配置正确。
6. 确认 Lighthouse CI 作为 PR Check 可见，不达标时 CI 失败阻断合并。

**验收标准：**

- [ ] `lighthouserc.js` 配置完整（3 次运行、四页面、阈值断言、资源预算）
- [ ] 本地 `lhci autorun` 全部通过且生成 HTML 报告
- [ ] `ci.yml` 步骤完整（lint/test/build/lhci 均有），Node 版本固定，pnpm 有缓存
- [ ] 资源预算 3 项（JS/图片/请求数）均配置
- [ ] Lighthouse CI 作为 PR Check 可见且不达标时 CI 失败
- [ ] `package.json` 有 `lhci` 脚本

**红线提醒：**
- **R9 部署红线**：CI 必须使用 `@lhci/cli`，CI 平台使用 GitHub Actions
- **R1 性能红线**：Lighthouse ≥ 96 作为 CI 门禁阈值

---

#### D28-S10：Vercel 部署、文档编写与最终交付

**本阶段做什么：**

1. **Vercel 部署配置**：
   - 在 Vercel 导入 Git 仓库
   - 配置 Framework Preset 为 Next.js
   - 设置 Root Directory 为 `apps/web-app`
   - 配置 Build Command（`cd ../../ && pnpm build` 或 turbo 构建）
   - 固定 Node.js 版本
2. **环境变量管理**：
   - 在 Vercel 平台配置 Production / Preview / Development 三套环境变量
   - 客户端变量加 `NEXT_PUBLIC_` 前缀（如 `NEXT_PUBLIC_API_URL`、`NEXT_PUBLIC_WS_URL`）
   - 敏感变量（如 API Secret）不加前缀，标记为敏感
   - 确认代码中无硬编码 API 地址
3. **触发首次部署**并验证：
   - HTTPS 强制跳转
   - 四个核心页面功能完整
   - API / WebSocket 连接正常
   - Preview 环境可访问
4. **编写 README.md**（9 个章节）：
   - 项目简介、技术栈、快速开始、目录结构、核心功能、脚本说明、部署指南、性能指标、测试覆盖率
5. **整理 docs/ 文档**：
   - 架构图（Mermaid 格式）
   - 至少 3 份 ADR 决策文档
   - 状态边界文档
6. **提炼简历亮点**（200–300 字）：
   - 包含 ≥3 个量化指标（Lighthouse 96+、75%+ 覆盖率、TS 0 Any 等）
   - 包含 5 大技术挑战关键词（虚拟滚动、WebSocket、多租户主题、Monorepo、性能优化）
7. **执行最终自查清单**：
   - `pnpm build` 无错误
   - `pnpm lint` 0 error 0 warning
   - `pnpm test` 全部通过
   - `pnpm tsc --noEmit` 无类型错误
   - `pnpm lhci autorun` 达标
   - 线上环境可访问
   - 文档齐全

**验收标准：**

- [ ] Vercel 生产环境可访问，四页面功能完整，HTTPS 强制跳转
- [ ] 三套环境变量配置正确，无硬编码地址，敏感变量不暴露到客户端
- [ ] Preview 环境可访问
- [ ] `README.md` 含 9 个章节且内容完整
- [ ] `docs/` 有架构图（Mermaid）、≥3 份 ADR、状态边界文档
- [ ] 简历亮点含 ≥3 个量化指标和 5 大技术挑战关键词
- [ ] 最终自查 7 项（build/lint/test/tsc/lhci/线上可访问/文档齐全）全部通过

**红线提醒：**
- **R9 部署红线**：必须部署至 Vercel，禁止 Netlify/自托管/Docker；环境变量通过 Vercel 平台管理
- **R4 框架红线**：Next.js App Router + `[locale]` 路由在 Vercel 上需配置 rewrites/redirects 兼容

---

## 5. 安全与合规

### 5.1 环境变量

- 所有密钥（API Secret、数据库连接串等）**禁止**提交到 Git
- 客户端可访问的环境变量必须以 `NEXT_PUBLIC_` 开头
- 服务端专用变量不加前缀，确保不打包到客户端 JS
- 使用 `.env.local` 做本地开发，`.env.example` 仅列出 key 名（不含值）并提交
- Vercel 生产/预览/开发三套环境变量分别配置

### 5.2 XSS 防护

- React 默认对插值内容做转义，禁止使用 `dangerouslySetInnerHTML`（除非内容经可信 sanitize）
- 用户输入的富文本内容必须经过 sanitize（如 `DOMPurify`）后再渲染
- URL 参数在使用前做校验和白名单过滤

### 5.3 依赖安全

- 定期执行 `pnpm audit` 检查已知漏洞
- 不使用来源不明的第三方包
- 锁定依赖版本（`pnpm-lock.yaml` 必须提交）

### 5.4 HTTPS

- 生产环境强制 HTTPS（Vercel 自动处理）
- 禁止在客户端代码中硬编码 HTTP 地址

---

## 6. AI 协作约定

### 6.1 指令复制规范

- 每个阶段指令块可独立复制给 AI 执行
- 复制时包含「本阶段做什么」「验收标准」「红线提醒」三部分
- AI 执行完毕后，逐条核对验收标准，未达标项要求继续修复

### 6.2 代码生成约束

- AI 生成的代码必须符合板块 3 的代码规范
- AI 不得引入 `any` 类型，不得使用禁止的技术栈
- AI 生成的组件默认 Server Component，仅交互部分加 `"use client"`
- AI 生成的测试必须使用语义化选择器，禁止 CSS 类名选择器

### 6.3 迭代策略

- 性能优化遵循"测量→定位→优化→验证"循环，不凭感觉优化
- 测试和类型治理穿插进行，不堆到最后
- 每完成一个阶段立即运行验证命令，不积累问题

---

## 7. 常见陷阱

### 7.1 性能优化陷阱

- **只看 Bundle 体积忽略运行时性能**：JS 体积小但 TBT 依然高。对策：用 Lighthouse TBT 和 React Profiler 定位长任务。
- **动态导入过度导致首屏空白**：首屏关键组件不要懒加载。对策：仅对非首屏内容（Modal、图表）做 dynamic 导入并配骨架屏。
- **next/image fill 配置不当**：父容器需 `position: relative` + 明确尺寸。对策：使用 fill 时确保父容器有尺寸或 `aspect-ratio`。
- **Lighthouse 分数波动大**：CI 机器性能不稳定。对策：`numberOfRuns: 3` 取中位数，固定 throttling。
- **React.memo 滥用**：props 中有内联对象/函数导致浅比较永远 false。对策：配合 `useMemo`/`useCallback` 稳定引用，用 Profiler 验证效果。

### 7.2 测试陷阱

- **测试实现细节而非行为**：断言内部 state 导致重构即挂。对策：测试用户可见行为，用 `getByRole`/`getByText` 查询。
- **覆盖率虚高**：写"渲染不报错"的空测试凑数。对策：核心模块阈值 ≥ 85%，组件测试必须包含交互断言。
- **异步测试未等待**：未 await 导致 flaky。对策：使用 `findBy*`（自带等待），定时器用 `vi.useFakeTimers()`。
- **Mock 不完整**：Mock localStorage 只 mock getItem。对策：`beforeEach` 中重置所有 mock，Mock 完整方法集。
- **jsdom 无 ResizeObserver**：虚拟滚动 Hooks 测试报错。对策：在 setupFiles 中 Mock ResizeObserver。

### 7.3 TypeScript 陷阱

- **any 改 unknown 后不做类型守卫**：直接访问 unknown 变量属性。对策：unknown 必须配合类型守卫或 `as` 收窄。
- **noUncheckedIndexedAccess 引发 undefined 检查**：`arr[0]` 返回 `T | undefined`。对策：遍历用 map/forEach，或加 `?? defaultValue`。
- **ref 初始值 null**：`useRef<HTMLDivElement>(null)` 后访问 `.style` 报错。对策：加 `if (ref.current)` 守卫或可选链。

### 7.4 CI/CD 陷阱

- **服务器未启动就跑 Lighthouse**：startServerCommand 启动慢。对策：配置 `startServerReadyPattern` 匹配就绪日志。
- **阈值过高 CI 永远红**：初期设 warn 级别，达标后改 error。
- **Monorepo 部署 Root Directory 错误**：Vercel 默认根目录构建。对策：设置 Root Directory 为 `apps/web-app`。
- **环境变量未加 NEXT_PUBLIC_ 前缀**：客户端 `process.env.API_URL` 为 undefined。对策：客户端变量必须加前缀。

---

## 8. 决策日志（ADR）

| 编号 | 标题 | 状态 | 文件 |
|------|------|------|------|
| ADR-001 | Monorepo 分层架构（pnpm + Turborepo，5 Apps + 10 Packages） | ✅ 已采纳 | `docs/adr/ADR-001-monorepo-layering.md` |
| ADR-002 | 状态管理边界（Zustand 管 UI 状态 + TanStack Query 管服务端数据） | ✅ 已采纳 | `docs/adr/ADR-002-state-management.md` |
| ADR-003 | 多租户动态主题方案（CSS 变量 + 运行时切换） | ✅ 已采纳 | `docs/adr/ADR-003-multi-tenant-theme.md` |

> 阶段四执行过程中如有新的架构决策，按 `ADR-XXX-title.md` 格式追加到 `docs/adr/`。

---

## 9. 测试要求

### 9.1 测试金字塔

| 层级 | 框架 | 覆盖范围 | 覆盖率目标 |
|------|------|----------|------------|
| 单元测试 | Vitest | 工具函数、Store、Hooks | 核心模块 ≥ 85% |
| 组件测试 | @testing-library/react | 基础组件交互 | 交互逻辑必须覆盖 |
| E2E 测试 | Playwright | P0 核心业务流程 | ≥ 5 条 |

### 9.2 覆盖率阈值

- 整体语句/分支/函数覆盖率：**≥ 75%**
- 核心模块（`packages/utils`、`stores/`、`hooks/`）：**≥ 85%**
- 覆盖率在 `vitest.config.ts` 中配置 `thresholds`，CI 中不达标即失败

### 9.3 测试规范

- 单元测试文件命名：`*.test.ts` / `*.test.tsx`
- E2E 测试文件命名：`*.spec.ts`
- 测试文件与源码同目录或放在 `__tests__/` 目录
- E2E 选择器必须使用 `getByRole`/`getByLabel`/`getByText`，禁止 CSS 类名选择器
- 组件测试必须有交互断言（点击、输入、状态变化），禁止仅快照测试
- 全量测试运行时间 ≤ 2 分钟
- 连续运行 3 次必须全部通过（无 flaky）

---

## 10. 文档要求

### 10.1 必须交付的文档

| 文档 | 路径 | 内容要求 |
|------|------|----------|
| README | `README.md` | 9 个章节：简介、技术栈、快速开始、目录结构、核心功能、脚本说明、部署指南、性能指标、测试覆盖率 |
| 核心问题 | `docs/01-core-questions.md` | 业务目标、用户角色、核心场景 |
| 用例分析 | `docs/02-use-cases.md` | 用例图、主要流程、异常流程 |
| 架构图 | `docs/architecture.md` | Mermaid 格式，展示 Monorepo 分层与数据流 |
| ADR 决策日志 | `docs/adr/ADR-XXX-*.md` | 至少 3 份，记录关键架构决策 |
| 状态边界 | `docs/state-boundary.md` | Zustand vs TanStack Query 职责划分 |
| Bundle 分析报告 | `docs/reports/bundle-analysis.md` | 优化前/后体积对比、优化清单 |
| Lighthouse 基线 | `docs/reports/lighthouse-baseline.md` | 四页面初始跑分 |
| Lighthouse 最终报告 | `docs/reports/lighthouse-final.md` | 优化后跑分、迭代记录 |
| 覆盖率报告 | `coverage/index.html` | Vitest 生成的 HTML 报告 |
| 简历亮点 | `docs/resume-highlights.md` | 200–300 字，≥3 个量化指标，5 大技术挑战 |

### 10.2 文档格式

- 所有文档使用 Markdown 格式
- 架构图使用 Mermaid（可在 Markdown 中渲染）
- ADR 文档按编号命名（`ADR-001-xxx.md`）
- 报告类文档包含可量化的前后对比数据
