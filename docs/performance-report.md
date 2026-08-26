# 性能优化前后对比报告（D27）

> **生成日期：** 2026-08-26
> **测试环境：** 生产构建（`pnpm build && pnpm start`），Node 24，桌面端，headless Chromium/Edge，throttling 关闭（RTT 40ms / 10Mbps / CPU 1×）
> **被测页面前缀：** `http://127.0.0.1:3100/zh`
> **数据来源：** Lighthouse 报告（`.lighthouse/`、`docs/reports/lighthouse-final.md`）、`next build` First Load JS、`web-vitals` RUM 采集
> **统计口径：** LCP/CLS 取 Lighthouse 模拟值；INP 取 `web-vitals` 在本地交互（筛选、滚动、切换详情）下的 `good` 评级（< 200ms）；首屏 JS 取 `next build` 输出的路由 First Load JS（未压缩）。

---

## 一、五项核心指标前后对比

| 指标 | 验收目标 | 优化前（Baseline） | 优化后（Final） | 结论 |
|------|----------|:------------------:|:---------------:|:----:|
| **LCP**（首页最大内容绘制） | < 2.5s | 1.6s（详情页曾因 500 崩溃无法测量） | **0.5s** | ✅ |
| **INP**（交互到下次绘制） | < 200ms | 未采集（无 RUM）；筛选大列表时全量渲染存在长任务风险 | **< 200ms（good）**，由 `web-vitals` 上报 `/api/v1/vitals` | ✅ |
| **CLS**（累积布局偏移） | < 0.1 | 0.02（详情页崩溃） | **0** | ✅ |
| **Lighthouse Performance 总分** | > 90（Dashboard > 90） | 首页 100 / 列表 100 / 详情 0（崩溃） / Dashboard 99 | **100 / 100 / 100 / 99** | ✅ |
| **首屏 JS 体积**（首页 First Load） | < 200KB（未压缩） | ~186KB（详情页依赖未分割，Recharts/Timeline 打进主包） | **124KB**（列表 139 / 详情 132 / Dashboard 150） | ✅ |

> 四项核心页面对照：首页/列表/详情 Performance 均为 **100**，Dashboard **99**；CLS 全部为 **0**；FCP 全部 **0.2s**。

---

## 二、优化措施与对应指标

### 1. LCP：0.5s（达成）
- 关键路径使用 RSC（Server Component）直出 HTML，首屏数据在服务端获取。
- `next/font/google`（Inter，`display: 'swap'`）自托管字体，消除外部字体请求与 FOIT。
- 所有图片统一 `next/image`，配置 `webp/avif` 与 `priority`（首屏）。
- 修复详情页生产环境 500 崩溃（`STATUS_TRANSITIONS` 值导入被 SWC 擦除），SSR 恢复后 LCP 从"不可测"降至 0.5s。

### 2. INP：< 200ms（达成）
- 工单列表采用 `@tanstack/react-virtual` 虚拟滚动，**10000 条**数据只渲染可视区行，DOM 节点恒定。
- `TicketRow` 使用 `React.memo`，筛选/选择回调使用 `useCallback`，计算结果 `useMemo`。
- Zustand 全部使用精确 selector 订阅，避免无关重渲染。
- WebSocket 消息批量合并入队，连续 100 条推送渲染次数远小于 100。
- 通过 `web-vitals` 的 `onINP` 实时采集真实交互指标并上报，持续监控回归。

### 3. CLS：0（达成）
- 图片/头像经 `next/image` 预留固定宽高（Avatar 固定尺寸）。
- 动态导入组件（图表、时间线、批量操作栏）配套骨架屏 `loading`，避免内容跳动。
- 字体 `display: 'swap'` + 自托管，无布局抖动。

### 4. Lighthouse Performance：四页 100/100/100/99（达成）
- 路由级代码分割：Dashboard 三个 Recharts 图表、工单 `TicketTimeline`、`BatchActionBar` 均使用 `next/dynamic({ ssr:false, loading: Skeleton })`。
- 修复全部控制台错误（缺失 i18n key、命名空间错误）。
- 无障碍：颜色对比度提升至 ≥ 4.5:1、修复 `aria-sort`/`aria-selected`/`label-content-name-mismatch`、补充 `htmlFor` 关联。
- SEO：canonical / hreflang 按请求 host 动态生成，favicon 404 消除。

### 5. 首屏 JS：124KB（达成，< 200KB）
- `@next/bundle-analyzer` 接入（`ANALYZE=true pnpm build` / `pnpm build:analyze`），按报告拆分重型依赖。
- Recharts 仅在 Dashboard 客户端动态加载；Timeline 仅在详情页动态加载。
- 首屏不加载 WebSocket 实际连接逻辑（`NEXT_PUBLIC_WS_URL` 未配置时 no-op）。
- lodash 等无全量引入，工具函数按需引用。

---

## 三、RUM 真实用户监控（D27 新增）

- 客户端组件 `apps/web-app/components/WebVitals.tsx` 订阅 `onLCP / onINP / onCLS / onFCP / onTTFB`。
- 采集数据通过 `navigator.sendBeacon`（兜底 `fetch keepalive`）上报到 `POST /api/v1/vitals`。
- 接收端 `app/api/v1/vitals/route.ts` 对 payload 做严格运行时校验（指标名白名单、数值有限性校验），返回 `202 Accepted`；本地/CI 无副作用，生产可转发至监控后端。
- 在根布局 `app/[locale]/layout.tsx` 中挂载一次，全页面生效。

---

## 四、Bundle 分析与代码分割

- 分析工具：`@next/bundle-analyzer`，脚本 `pnpm build:analyze`（跨平台包装 `scripts/analyze.js`）。
- `next/dynamic` 分割点：
  - `components/dashboard/DashboardClient.tsx`：TrendChart / StatusPieChart / TopAssigneesBarChart + 骨架屏
  - `components/ticket-detail/TicketDetailClient.tsx`：TicketTimeline + 骨架屏
  - `components/tickets/TicketList.tsx`：BatchActionBar（选中时才渲染）
- 路由 First Load JS（未压缩）：首页 **124KB** / 列表 **139KB** / 详情 **132KB** / Dashboard **150KB**。

---

## 五、验证命令

```bash
pnpm build:analyze          # 生成 .next/analyze/*.html Bundle 报告
pnpm build && pnpm start    # 生产构建
pnpm lhci autorun           # Lighthouse CI 四页面跑分
pnpm test                   # 单元/组件测试（27 文件 / 217 用例）
pnpm test:coverage          # 覆盖率（lines 97.31%）
pnpm test:e2e               # Playwright E2E（核心流程 + 回归）
```

---

## 六、验收结论

| D27 验收项 | 状态 |
|------------|:----:|
| LCP < 2.5s（首页 0.5s） | ✅ |
| INP < 200ms（web-vitals 采集 good） | ✅ |
| CLS < 0.1（四页 0） | ✅ |
| Lighthouse Performance > 90（100/100/100/99） | ✅ |
| 首屏 JS < 200KB（首页 124KB） | ✅ |
| Bundle 分析报告已生成（bundle-analysis.md + analyze 脚本） | ✅ |
| 路由级代码分割 ≥ 1 处（3 处 dynamic） | ✅ |
| 图片全部 next/image | ✅ |
| 字体全部 next/font（Inter 自托管） | ✅ |
| 虚拟滚动 10000 条数据丝滑 | ✅ |
| web-vitals 已接入并上报 /api/v1/vitals | ✅ |
| E2E 核心流程覆盖（查单/回复/通知/导航） | ✅ |
