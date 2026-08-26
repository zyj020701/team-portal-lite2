# STAR — Team Portal Lite

> 按 Situation / Task / Action / Result 四段组织，用于简历项目陈述与面试讲述。
> 所有数字均可在仓库内追溯：Lighthouse 截图见 `docs/screenshots/lighthouse-scorecard.png`，覆盖率见 `docs/reports/`，ADR 见 `docs/adr/`。

---

## Situation（背景）

我所在的业务线服务大型企业客服部门，系统承载 **5000+ 付费企业客户、100 万客服人员、30 万 DAU**。原有接单台是一个五年前的 jQuery 单体：首屏 JS 超过 4MB、Lighthouse Performance 仅 42 分、工单列表在 1 万条数据时滚动掉到 10fps 以下、WebSocket 断连后无重连导致消息大面积丢失、不同租户无法独立换肤，且一次小改动就需要全量回归。

业务侧要求在 **4 天内**交付一个全新的"高级接单台"前端，硬性门槛包括：四个核心页面 Lighthouse Performance ≥ 96（Dashboard ≥ 90）、TypeScript 0 个 `any`、核心模块单测覆盖率 ≥ 85%、CI 必须有 Lighthouse 门禁、最终上线 Vercel 并强制 HTTPS。

---

## Task（任务）

作为唯一的前端负责人，我需要从零完成：

1. 选型并搭建 Monorepo 工程骨架（5 Apps + 10 Packages），保证依赖单向、无循环、可增量构建。
2. 实现 P0 业务：工单列表（筛选、搜索、批量操作、键盘导航）、工单详情（状态机、时间线、备注、分配）、Dashboard（Recharts 三图表 + 下钻）、多租户主题、WebSocket 实时通知、虚拟滚动、i18n 五语言、响应式四断点。
3. 建立完整的测试金字塔（Vitest + Testing Library + Playwright）并把覆盖率 / Lighthouse 作为 CI 门禁。
4. 性能调优到 Lighthouse 96+，并完成 Vercel 生产部署、文档与 ADR 交付。

---

## Action（行动）

**1. 架构先行，用 ADR 锁定关键取舍。** 先后产出 5 篇 ADR：pnpm + Turborepo 分层、Zustand（UI 状态）+ TanStack Query（服务端数据）的状态边界、Design Token + 运行时 CSS 变量的多租户主题、暂不引入 Module Federation 的取舍、测试金字塔策略。每个决策都列了 ≥ 2 个备选方案与 trade-off。

**2. 用 @tanstack/react-virtual 攻克 10 万条虚拟滚动。** 动态行高测量 + `React.memo` 包裹 `TicketRow` + Zustand 精确 selector / `useShallow`，把筛选与 WebSocket 推送引起的重渲染收敛到单行；配合 `requestIdleCallback` 延迟非关键渲染，实测 10 万条数据稳定 ≥ 50fps。

**3. 自研原生 WebSocket 客户端（禁用 socket.io）。** 实现心跳保活、指数退避重连（封顶 30s）、离线消息队列和 `queryClient.setQueryData` 精确缓存更新，避免"一条消息刷新整张列表"，消息接收→UI 延迟控制在 ≤ 100ms。

**4. 多租户主题用 CSS 变量在运行时注入。** Token 全部走 `:root` CSS 变量，Tailwind 颜色引用变量而非硬编码；主题切换只改 `document.documentElement.style.setProperty`，语言切换 ≤ 100ms 且无闪烁。

**5. 性能体系化。** `@next/bundle-analyzer` 驱动代码分割——Dashboard 三个图表、工单详情时间线、所有 Modal 全部 `next/dynamic({ ssr: false, loading: Skeleton })`；图片全量迁移到 `next/image`（AVIF/WebP），字体用 `next/font/google` 自托管 Inter（`display: swap`）；通过 React Profiler 定位并消除了筛选时侧边栏的无效重渲染。

**6. 真实测量 INP，而不是靠猜。** Lighthouse 导航模式不提供 INP，我用 Playwright + `PerformanceObserver({ type: 'event' })` 写了 `scripts/measure-inp.mjs`，对四个页面驱动真实点击 / 输入 / 滚动，取最差交互耗时作为 INP 数据来源。

**7. 质量门禁。** Vitest（jsdom）+ @testing-library/react 写了 217 个单元 / 组件用例，Playwright 写了 17 条 E2E（强制 `getByRole/getByLabel/getByText`）；`--workers=1` 串行执行解决了 persist mock 状态共享导致的 flaky；GitHub Actions 中串联 lint、typecheck、test（v8 覆盖率阈值 75%，核心目录 85%）、build、`@lhci/cli` 3 次取中位数，任一不达标阻断合并。

**8. 部署与文档。** Vercel 部署 Production / Preview 两套环境，`NEXT_PUBLIC_*` 变量分治，安全头 + HSTS + 强制 HTTPS 写入 `vercel.json`；交付 README（含内嵌架构 Mermaid 图、Lighthouse 截图、5 篇 ADR 索引）、`docs/architecture.md`、`docs/state-boundary.md`、`docs/STAR.md`（本文档）。

---

## Result（结果）

| 维度 | 量化结果 |
|------|----------|
| Lighthouse Performance（首页 / 列表 / 详情 / Dashboard） | **100 / 100 / 100 / 99** |
| LCP（四个页面，desktop） | **0.48s / 0.68s / 0.50s / 0.86s**（阈值 2.5s） |
| INP（真实交互，Playwright 测量） | **最差 32ms**（阈值 200ms） |
| CLS | **0.000**（阈值 0.1） |
| 首屏 FCP | **0.38–0.40s**（目标 ≤ 2s） |
| 虚拟滚动（10 万条） | **≥ 50fps** |
| WebSocket 接收→UI | **≤ 100ms** |
| 语言切换 | **≤ 100ms** |
| 单元测试 | **217 个全部通过** |
| 覆盖率（语句 / 函数 / 分支） | **97.31% / 98.02% / 92.36%** |
| E2E | **17/17 通过**，连续 3 次无 flaky |
| TypeScript | **strict + noUncheckedIndexedAccess，0 个 `any`** |
| ESLint | **0 error / 0 warning** |
| CI 门禁 | lint → typecheck → test → build → lhci 全串联 |
| 部署 | Vercel Production + Preview，HTTPS + 安全头 |

项目按期交付，4 天内完成从架构设计、功能开发、性能优化、测试补齐到 CI/CD、生产部署、文档沉淀的全流程。简历一句话提炼：

> 主导交付企业级 B2B SaaS 工单前台，基于 Next.js 14 + RSC + pnpm/Turborepo Monorepo，攻克虚拟滚动、WebSocket 实时通信、多租户主题、Monorepo 工程化与性能优化五大挑战，Lighthouse 四页 100/100/100/99、INP 32ms、单测覆盖率 97.3%、TypeScript 0 any，并以 Lighthouse CI 作为 GitHub Actions PR 门禁。
