# 简历亮点（Resume Highlights）

## 项目：Team Portal Lite — 企业级 B2B SaaS 工单管理系统前端

> 面向大型企业客服部门的"高级接单台"，支撑 5000+ 企业客户、100 万客服、30 万 DAU。
> 基于 **Next.js 14 + RSC + App Router + pnpm/Turborepo Monorepo**，4 天完成从架构设计到性能优化、CI/CD、生产部署的全流程交付。

---

## 亮点陈述（约 280 字）

主导设计并交付企业级工单管理系统前端，采用 **pnpm + Turborepo Monorepo** 架构，沉淀 5 应用 + 10 共享包的分层工程体系，包间依赖单向可控。核心突破五大技术挑战：

- **虚拟滚动**：基于 `@tanstack/react-virtual` 实现动态行高虚拟列表，支撑 **10 万条数据流畅滚动（≥50fps）**，配合 React.memo、精确 selector 与 `useShallow` 将筛选/推送更新的重渲染收敛到单行。
- **WebSocket 实时通信**：自研原生 WebSocket 客户端（禁 socket.io），实现心跳保活、指数退避重连与离线消息队列，消息**接收→UI 延迟 ≤100ms**，并通过 `queryClient.setQueryData` 精确更新缓存而非全量失效。
- **多租户动态主题**：Design Token + 运行时 CSS 变量注入方案，支持租户级换肤与亮/暗/自动三态，**语言切换 ≤100ms**，主题与文案切换无闪烁。
- **Monorepo 工程化**：Turborepo 增量缓存、严格依赖分层、Zustand（UI）+ TanStack Query（服务端）状态边界治理，store 单文件 ≤200 行。
- **性能优化体系**：`@next/bundle-analyzer` 驱动代码分割（图表/Modal 全部 `next/dynamic` + 骨架屏）、next/image + next/font、运行时 Profiler 调优，最终 **Lighthouse 四个核心页面 Performance 达 100/100/100/99**（Dashboard），**首屏 FCP ≤2s、CLS ≤0.1**。

工程质量方面，TypeScript strict + `noUncheckedIndexedAccess` 实现 **0 个 `any`**；Vitest + Testing Library + Playwright 三层测试，**单元测试覆盖率 97.3%（语句）/ 98.0%（函数）**；集成 **Lighthouse CI 作为 GitHub Actions PR 门禁**，阈值不达标即阻断合并；最终部署至 Vercel，配置 Production/Preview/Development 三套环境变量与安全头，强制 HTTPS。

---

## 量化指标汇总

| 维度 | 指标 | 结果 |
|------|------|------|
| 性能 | Lighthouse Performance（首页/列表/详情/Dashboard） | 100 / 100 / 100 / 99 |
| 性能 | 首屏 FCP | ≤ 2s |
| 性能 | CLS | ≤ 0.1 |
| 性能 | 虚拟滚动帧率（10 万条） | ≥ 50fps |
| 性能 | WebSocket 接收→UI | ≤ 100ms |
| 性能 | 语言切换 | ≤ 100ms |
| 质量 | 单元测试语句覆盖率 | 97.31% |
| 质量 | 单元测试函数覆盖率 | 98.02% |
| 质量 | 分支覆盖率 | 92.36% |
| 质量 | TypeScript `any` 数量 | 0 |
| 质量 | ESLint | 0 error / 0 warning |
| 工程 | Monorepo 规模 | 5 Apps + 10 Packages |
| CI | Lighthouse CI 运行 | 4 页面 × 3 次（取中位数） |

## 五大技术挑战关键词

**虚拟滚动 · WebSocket · 多租户主题 · Monorepo · 性能优化**
