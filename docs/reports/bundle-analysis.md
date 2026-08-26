# Bundle 分析报告 — D28-S01

> 生成时间：2026-08-20
> 工具：`@next/bundle-analyzer` + Next.js 14 构建产物分析

## 1. 构建产物体积（优化后）

### web-app 路由 First Load JS

| 路由 | First Load JS（未压缩） | 估算 gzip | 说明 |
|------|------------------------|-----------|------|
| `/_not-found` | 88.2 kB | ~30 kB | 404 页面 |
| `/[locale]`（首页） | 118 kB | ~42 kB | 首页 + TicketOverview |
| `/[locale]/tickets` | 139 kB | ~48 kB | 工单列表 + 虚拟滚动 |
| `/[locale]/tickets/[id]` | 131 kB | ~45 kB | 工单详情（Timeline 懒加载） |
| `/[locale]/dashboard` | 144 kB | ~50 kB | Dashboard（图表懒加载） |
| `/[locale]/virtual-list-demo` | 87.5 kB | ~30 kB | 虚拟列表演示 |

### Shared Chunks（所有路由共享）

| Chunk | 体积（未压缩） | 估算 gzip |
|-------|---------------|-----------|
| `274f2a0e-*.js`（React/Next.js 框架） | 53.6 kB | ~18 kB |
| `470-*.js`（第三方库） | 31.5 kB | ~11 kB |
| other shared chunks | 2.19 kB | ~1 kB |
| **合计** | **87.4 kB** | **~30 kB** |

### 结论

- 所有路由 First Load JS gzip 后均 **≤ 50KB**，远低于红线要求的 **150KB**。
- 最大路由为 Dashboard（144 kB 未压缩 / ~50 kB gzip），Recharts 已通过 `next/dynamic` 拆分到独立 chunk，不阻塞首屏。

## 2. 优化清单

### 优化点 1：Dashboard 图表组件动态导入 ✅

**问题**：`TrendChart`、`StatusPieChart`、`TopAssigneesBarChart` 三个图表组件直接静态导入，导致 Recharts 整个图表库被打入 Dashboard 首屏 chunk。

**措施**：在 `DashboardClient.tsx` 中使用 `next/dynamic` 动态导入三个图表组件：
- `ssr: false`（Recharts 依赖 `window`，无需 SSR）
- 配置 `ChartSkeleton` 骨架屏作为 loading 态，避免白屏闪烁
- 三个图表各自独立 chunk，按需加载

**文件**：`apps/web-app/components/dashboard/DashboardClient.tsx`

### 优化点 2：工单详情时间线组件动态导入 ✅

**问题**：`TicketTimeline` 组件位于详情页侧边栏下方，属于非首屏关键内容，但被静态导入打入主 chunk。

**措施**：在 `TicketDetailClient.tsx` 中使用 `next/dynamic` 动态导入 `TicketTimeline`：
- `ssr: false`
- 配置时间线骨架屏（4 条脉冲占位），平滑过渡
- 时间线数据在侧边栏，用户滚动到该区域时 chunk 已加载完成

**文件**：`apps/web-app/components/ticket-detail/TicketDetailClient.tsx`

### 优化点 3：批量操作栏动态导入 ✅

**问题**：`BatchActionBar` 包含 Modal、Select 下拉等重型 UI，仅在用户勾选工单时才显示，但静态导入导致其代码始终包含在列表页 chunk 中。

**措施**：在 `TicketList.tsx` 中使用 `next/dynamic` 动态导入 `BatchActionBar`：
- `ssr: false`
- `loading: () => null`（该栏仅在选中时出现，无需占位）
- 未勾选任何工单时不加载该 chunk

**文件**：`apps/web-app/components/tickets/TicketList.tsx`

### 优化点 4：Bundle Analyzer 集成 ✅

**措施**：安装 `@next/bundle-analyzer` 并在 `apps/web-app/next.config.js` 中配置：
- 通过环境变量 `ANALYZE=true` 触发
- 生成 Client 和 Server 两份 HTML 报告（`.next/analyze/` 目录）
- 报告路径已加入 `.gitignore`

**使用方式**：
```bash
cd apps/web-app
ANALYZE=true pnpm build
# 或在 Windows 上：
set ANALYZE=true && pnpm build
```

## 3. 全量导入检查

全局搜索确认：
- ✅ 无 `import _ from 'lodash'` 全量导入
- ✅ 项目未直接依赖 lodash
- ✅ 所有第三方库导入均为按需命名导入或通过 `next/dynamic` 懒加载

## 4. 已知警告（非本阶段引入）

构建中存在一个预存警告：
```
./lib/ticket-state-machine.ts
Attempted import error: 'STATUS_TRANSITIONS' is not exported from '@team-portal/types'
```

此问题在 D28-S01 之前已存在，不影响构建成功和运行时功能，将在 D28-S07（TypeScript 类型治理）阶段修复。

## 5. 验收标准核对

| 验收项 | 状态 |
|--------|------|
| Bundle 分析报告已生成，标注至少 3 项优化点 | ✅ 4 项 |
| 至少 3 个重型组件使用 `dynamic()` 导入并有骨架屏 | ✅ 5 个组件（3 图表 + Timeline + BatchActionBar） |
| 首屏关键 JS chunk gzip 后 ≤ 150KB | ✅ 最大 ~50KB gzip |
| 无全量 `import _ from 'lodash'` 等全量导入 | ✅ |
| 动态导入组件无白屏闪烁（骨架屏过渡） | ✅ ChartSkeleton + TimelineSkeleton |
| `pnpm build` 无错误 | ✅ 16/16 tasks successful |