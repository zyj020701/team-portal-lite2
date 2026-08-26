# 状态边界文档（State Boundary）

> 本文档明确 Team Portal Lite 项目中所有状态的归属，遵循 **ADR-002** 决策：
> - 客户端 UI 状态 → **Zustand**
> - 服务端数据状态 → **TanStack Query**
> - 组件内部临时状态 → **useState**
>
> 铁律：服务端数据全部归 TanStack Query，UI 交互状态全部归 Zustand，组件内部临时状态归 useState。

---

## 1. 状态总览

| 状态名称 | 类型 | 归属 | Store / Hook | 使用页面 | 持久化 |
|----------|------|------|-------------|----------|--------|
| 侧边栏折叠 | `boolean` | Zustand | `uiStore.sidebarCollapsed` | 全局布局 | ✅ localStorage |
| 移动端导航开关 | `boolean` | Zustand | `uiStore.mobileNavOpen` | 全局布局 | ❌ |
| 通知面板开关 | `boolean` | Zustand | `uiStore.notificationPanelOpen` | 全局布局 | ❌ |
| 当前主题 | `Theme` | Zustand | `uiStore.theme` | 全局 | ✅ localStorage |
| 当前语言 | `string` | Zustand | `uiStore.locale` | 全局 | ✅ localStorage |
| 工单筛选-状态 | `TicketStatus[]` | Zustand | `ticketStore.status` | 工单列表 | ✅ localStorage |
| 工单筛选-优先级 | `TicketPriority[]` | Zustand | `ticketStore.priority` | 工单列表 | ✅ localStorage |
| 工单筛选-处理人 | `string \| undefined` | Zustand | `ticketStore.assigneeId` | 工单列表 | ✅ localStorage |
| 工单筛选-关键词 | `string` | Zustand | `ticketStore.keyword` | 工单列表 | ✅ localStorage |
| 工单筛选-日期 | `string \| undefined` | Zustand | `ticketStore.date` | 工单列表 | ✅ localStorage |
| 工单排序 | `SortState` | Zustand | `ticketStore.sort` | 工单列表 | ✅ localStorage |
| 选中工单 ID | `string[]` | Zustand | `ticketStore.selectedIds` | 工单列表 | ❌ |
| 列表滚动位置 | `number` | Zustand | `ticketStore.scrollPosition` | 工单列表 | ❌ |
| 通知面板 UI | `boolean` | Zustand | `notificationStore.panelOpen` | 全局 | ❌ |
| 工单列表数据 | `InfiniteData<TicketListResponse>` | TanStack Query | `useTicketsInfiniteQuery` | 工单列表 | — |
| 工单详情数据 | `Ticket` | TanStack Query | `useTicketDetail` | 工单详情 | — |
| Dashboard 统计 | `DashboardData` | TanStack Query | `useDashboardStats` | Dashboard | — |
| 用户列表 | `User[]` | TanStack Query | `useUsers` | 筛选栏/分配 | — |
| 通知列表 | `NotificationPayload[]` | TanStack Query | `useNotifications` | 通知铃铛 | — |
| 工单操作变更 | `Mutation` | TanStack Query | `useTicketMutations` | 工单详情 | — |
| 虚拟滚动焦点行 | `number` | useState | `TicketList` local | 工单列表 | — |
| 筛选栏本地关键词 | `string` | useState | `TicketFilterBar` local | 工单列表 | — |
| 详情页 Tab | `string` | useState | `TicketDetailClient` local | 工单详情 | — |
| WebSocket 连接状态 | `ConnectionStatus` | TanStack Query cache | WS → `queryClient.setQueryData` | 通知铃铛 | — |

---

## 2. Zustand Stores

### 2.1 `uiStore`（`stores/ui-store.ts`）

**职责**：全局 UI 布局状态。

| 字段 | 类型 | 说明 | 持久化 |
|------|------|------|--------|
| `sidebarCollapsed` | `boolean` | 桌面端侧边栏折叠状态 | ✅ |
| `mobileNavOpen` | `boolean` | 移动端汉堡菜单开关 | ❌ |
| `notificationPanelOpen` | `boolean` | 通知面板展开状态 | ❌ |
| `theme` | `'light' \| 'dark' \| 'auto'` | 当前主题 | ✅ |
| `locale` | `string` | 当前语言偏好 | ✅ |

**Actions**：`toggleSidebar`、`setSidebarCollapsed`、`setMobileNavOpen`、`toggleMobileNav`、`setNotificationPanelOpen`、`setTheme`、`setLocale`

### 2.2 `ticketStore`（`stores/ticket-store.ts`）

**职责**：工单列表页的 UI 交互状态（筛选、排序、选择、滚动位置）。

| 字段 | 类型 | 说明 | 持久化 |
|------|------|------|--------|
| `status` | `TicketStatus[]` | 状态筛选 | ✅ |
| `priority` | `TicketPriority[]` | 优先级筛选 | ✅ |
| `assigneeId` | `string \| undefined` | 处理人筛选 | ✅ |
| `keyword` | `string` | 搜索关键词 | ✅ |
| `date` | `string \| undefined` | 日期筛选 | ✅ |
| `sort` | `SortState` | 排序字段和方向 | ✅ |
| `selectedIds` | `string[]` | 批量选中的工单 ID | ❌ |
| `scrollPosition` | `number` | 列表滚动位置（返回时恢复） | ❌ |

**Actions**：`setStatus`、`setPriority`、`setAssigneeId`、`setKeyword`、`setDate`、`setSort`、`toggleSort`、`selectAll`、`toggleSelection`、`clearSelection`、`setScrollPosition`、`resetFilters`

### 2.3 `notificationStore`（`stores/notification-store.ts`）

**职责**：通知面板的 UI 状态。通知数据本身走 TanStack Query。

| 字段 | 类型 | 说明 | 持久化 |
|------|------|------|--------|
| `panelOpen` | `boolean` | 通知面板是否展开 | ❌ |

**Actions**：`setPanelOpen`、`togglePanel`

---

## 3. TanStack Query 配置

### 3.1 全局默认选项（`QueryProvider.tsx`）

```ts
defaultOptions: {
  queries: {
    staleTime: 60_000,        // 数据 60 秒内视为新鲜
    gcTime: 5 * 60_000,       // 缓存保留 5 分钟
    retry: 2,                 // 失败重试 2 次
    refetchOnWindowFocus: false, // 窗口聚焦不自动刷新
  },
}
```

### 3.2 queryKey 规范

遵循 `[实体, 操作, 参数]` 格式：

| queryKey | 用途 | Hook |
|----------|------|------|
| `['tickets', 'list', filters]` | 工单列表（无限滚动） | `useTicketsInfiniteQuery` |
| `['tickets', 'detail', id]` | 工单详情 | `useTicketDetail` |
| `['tickets', 'users']` | 用户列表 | `useUsers` |
| `['dashboard', 'stats', locale]` | Dashboard 统计 | `useDashboardStats` |
| `['notifications', 'list']` | 通知列表 | `useNotifications` |
| `['ws', 'status']` | WebSocket 连接状态 | WS 同步 |

### 3.3 跨页面缓存同步

- **详情页修改工单**：通过 `queryClient.setQueryData` 精确更新列表缓存中对应工单，同时更新详情缓存
- **WebSocket 工单更新**：WS 收到 `ticket_updated` 消息时，通过 `queryClient.setQueryData` 更新列表和详情缓存
- **避免大范围 invalidate**：使用 `setQueryData` 精确更新而非 `invalidateQueries` 全量失效

---

## 4. 持久化策略

使用 `zustand/middleware` 的 `persist` 中间件，通过 `partialize` 配置只持久化非敏感 UI 状态：

- **持久化**：侧边栏状态、主题、语言偏好、工单筛选条件、排序
- **不持久化**：选中工单 ID、滚动位置、移动端导航开关、通知面板开关、任何服务端数据、用户 token

---

## 5. 禁止事项

- ❌ Zustand store 存储服务端返回的工单数据、用户信息、通知内容
- ❌ TanStack Query 管理纯 UI 状态（如侧边栏折叠、弹窗开关）
- ❌ 使用 `useState` + `useContext` 管理全局状态
- ❌ 散落的独立 `QueryClient` 实例
- ❌ queryKey 缺少影响响应的参数（如筛选条件、语言）
- ❌ 在 localStorage 中存储 token、用户密码等敏感数据