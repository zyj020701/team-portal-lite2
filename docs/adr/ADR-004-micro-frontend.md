# ADR-004：微前端 / Module Federation 取舍

> 文档编号：ADR-004
> 状态：✅ 已接受（暂不引入）
> 日期：2026-08-26
> 决策者：前端架构组

---

## 一、背景

Team Portal Lite 的 Monorepo 内规划了 5 个应用（`web-app` 客服工作台、`admin-app` 管理后台、`landing-app` 营销官网、`mobile-app`、`storybook`）。在进入阶段四（性能、CI/CD、部署）前，需要明确：**是否需要引入 Module Federation / 微前端框架，将各应用在运行时拼装成一个"统一门户"？**

触发该决策的具体诉求：

1. 工作台与管理后台需要共享侧边栏、顶栏、主题、通知铃铛等"壳层（shell）"。
2. 不同业务线希望能独立部署、独立发布，避免一次小改动触发整站重建。
3. 团队担心 5 个应用各自演进后，导航跳转会产生整页刷新、体验割裂。

但同时项目也有明确约束：

- 4 天工期内必须交付可演示、可部署、Lighthouse ≥ 96 的成品。
- R1 性能红线：首屏 JS gzip ≤ 150KB，运行时不得引入额外的远程 chunk 协商开销。
- R4 框架红线：Next.js 14 App Router + RSC，微前端方案需与之兼容。
- 当前团队仅 1 名前端开发者，无多团队并行开发的组织前提。

---

## 二、决策

**不引入 Module Federation 或任何微前端运行时框架；采用"Monorepo 多应用 + 共享 packages + BFF 统一域名"的组合方案。**

具体形态：

1. **构建期组合，而非运行时组合**：跨应用复用的壳层（Sidebar、TopBar、NotificationBell、主题 Provider、i18n Provider）全部下沉到 `packages/ui`、`packages/hooks`、`packages/design-tokens`，由各 app 在构建期 import，不通过运行时 remote entry 加载。
2. **独立部署但同构**：5 个 app 仍是独立的 Next.js 应用，可由 Vercel 分别部署（Production / Preview），通过同一根域名下的路径前缀（`/`、`/admin`、`/m`）由网关 / Vercel routes 聚合，不共享运行时。
3. **应用间跳转用原生导航 + 过渡态**：跨应用跳转使用 `<a href>`（触发完整导航），仅在同应用内使用 `next/link` 做客户端转场。由于各应用首屏已做到 FCP ≤ 2s、LCP < 1s，整页跳转的体感成本可接受。
4. **公共状态不跨应用共享**：Zustand store 按 app 实例化，应用间不通过全局事件总线通信；需要跨应用同步的数据（如登录态、租户信息）走 HttpOnly Cookie + TanStack Query 初始查询，天然支持多应用。

未来触发重新评估的条件：

- 团队扩张到 ≥ 3 个独立前端团队，且各团队需要独立发布节奏。
- 单个应用的首屏 JS 逼近 150KB 红线，且通过 code splitting / dynamic import 已无法继续压缩。
- 出现强需求：在同一个页面中并排运行两个技术栈不同的子应用。

---

## 三、备选方案

### 备选方案 A：Webpack Module Federation（Next.js 官方插件）

**描述**：使用 `@module-federation/nextjs-mf`，将 `web-app` 配置为 host，`admin-app` 等配置为 remote，运行时加载各自的 `remoteEntry.js`。

**未选择原因**：

1. **与 RSC / App Router 兼容性不稳定**：Module Federation 对 Server Components、`next/dynamic`、`next/image`、流式 SSR 的支持仍在演进，生产环境踩坑成本高，可能直接威胁 R4 红线。
2. **运行时开销与版本协调**：每个 remote 需要独立的版本协商、共享依赖单例（React、React-DOM），一旦 shared 版本不匹配会出现"多实例 React"运行时错误；这对单人 4 天交付的项目风险过高。
3. **性能反作用**：远程 chunk 会引入额外的网络往返和缓存失效，且无法被 Turborepo 的构建期缓存优化，与 R1 的首屏预算和 Lighthouse ≥ 96 目标冲突。
4. **运维复杂度倍增**：需要为每个 remote 配置独立的 CDN、CORS、回退策略、版本回滚管道，远超当前 Vercel 一键部署的成熟度。
5. **YAGNI**：没有多团队独立部署的真实组织约束，当前痛点（共享壳层）已被 Monorepo + packages 完美解决。

### 备选方案 B：qiankun / single-spa（HTML Entry 微前端）

**描述**：以 single-spa 为内核，qiankun 提供 HTML Entry、JS 沙箱、样式隔离，将多应用挂载到同一基座。

**未选择原因**：

1. **框架红线冲突**：R4 明确要求 Next.js App Router + RSC，qiankun 的路由劫持和沙箱机制与 App Router 的生命周期不匹配，社区也无成熟的 Next.js 14 集成方案。
2. **CSS-in-JS / Tailwind 隔离成本**：项目使用 Tailwind + CSS 变量主题，qiankun 的 Shadow DOM 样式隔离会破坏 CSS 变量继承，需要大量 hack。
3. **包体积与性能**：沙箱、HTML Entry 解析、路由拦截都会带来固定的运行时开销，直接影响 Lighthouse TBT / INP。
4. **单人维护成本高**：沙箱边界问题（定时器、全局变量、弹窗挂载点）排查困难，4 天工期内无法收敛。

### 备选方案 C：iframe 集成

**描述**：用 iframe 内嵌各子应用，通过 `postMessage` 通信。

**未选择原因**：

1. **体验割裂**：iframe 内路由不进入浏览器历史，刷新丢失、分享链接困难，无法满足"统一接单台"的产品定位。
2. **性能与 SEO 双输**：iframe 内容无法被父页 SEO 识别，且每个 iframe 独立加载一份运行时，与性能预算冲突。
3. **通信与主题同步繁琐**：主题、语言、登录态都需要 postMessage 桥接，开发量并不比 Monorepo 共享包小。

---

## 四、后果

### 正面影响

1. **交付确定性高**：所有复用走构建期 import，可被 Turborepo 缓存、可被 tree-shake，4 天内可交付并达成 Lighthouse 目标。
2. **性能最优**：无运行时 remote 协商、无沙箱开销，首屏 JS 严格可控（实测 gzip ≤ 150KB，INP ≤ 32ms）。
3. **与 Next.js 14 RSC 完全兼容**：可充分利用 Server Components、流式渲染、`next/image`、`next/font`，不被微前端框架版本绑架。
4. **部署简单**：每个 app 独立 Vercel 项目 + 共享 packages，Preview / Production 环境变量分治，符合 R9 部署红线。
5. **类型安全贯穿**：跨 app 复用的组件、Hooks、类型在同一次 `tsc --noEmit` 中被全量检查，编译期即可发现破坏性变更，优于运行时 remote 契约。

### Trade-off 与需要承担的成本

1. **无法运行时热插拔**：某子应用上线需要走完整的构建 + 部署流程，不能像 Module Federation 那样"秒级灰度"。在单人项目和 Vercel 极速部署下这一成本可接受。
2. **共享依赖必须统一版本**：React、Next.js、Tailwind 等基础库在所有 app 中必须保持同一主版本，升级时需一次性改动 5 个 app；通过 `packages/config-typescript` 与 Renovate 可缓解。
3. **整页跳转的体感**：跨应用导航是完整文档加载，需依赖 FCP/LCP 优化保证体验；当前实测 LCP < 1s 已满足。
4. **未来若组织扩张需要重评估**：当出现 ≥ 3 个独立团队时，应重新评估 Module Federation（届时 RSC 生态也会更成熟），本 ADR 需被新 ADR 取代。

---

## 五、评审记录

| 评审项 | 结果 |
|--------|------|
| 包含背景、决策、备选方案、后果四个部分 | ✅ |
| 决策明确（暂不引入微前端） | ✅ |
| 备选方案 ≥ 2 个并说明未选择原因 | ✅ 3 个（MF、qiankun、iframe） |
| 与 R1/R4/R9 红线对齐 | ✅ |
| 给出未来重评估触发条件 | ✅ 第二节末尾 |
