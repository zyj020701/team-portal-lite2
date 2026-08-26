# ADR-002：状态管理选型方案

> 文档编号：ADR-002
> 状态：✅ 已接受
> 日期：2026-08-18
> 决策者：架构组

---

## 一、背景

Team Portal Lite 作为 B2B SaaS 工单管理系统，前端需要处理两类本质不同的状态：

1. **服务端状态**：工单列表、工单详情、用户信息、Dashboard 统计数据、通知列表等。这些数据来自后端 API，具有异步获取、需要缓存、可能过期失效、需要乐观更新、需要分页/筛选等特征。
2. **客户端 UI 状态**：弹窗开关、侧边栏折叠、表单草稿、主题选择、语言偏好、虚拟滚动位置等。这些状态是同步的、瞬时的、与 UI 交互紧密相关。

如果用单一状态管理方案统一处理两类状态，会导致以下问题：

- 用 Redux/Zustand 管理服务端数据时，需要手动编写 fetch、loading、error、cache、invalidate、retry、refetch 等全部逻辑，代码量大且容易出错。
- 用 TanStack Query（React Query）管理 UI 状态则不合适，它是为服务端数据设计的，不适合存储瞬时 UI 状态。
- 在 Next.js 14 RSC（React Server Components）架构下，需要明确区分 Server Component 和 Client Component 的边界，状态管理方案必须兼容 RSC，不能在 Server Component 中使用客户端 Hooks。

因此需要为两类状态分别选择最合适的工具，并明确职责边界。

---

## 二、决策

**客户端 UI 状态使用 Zustand，服务端状态使用 TanStack Query（React Query）。两者职责严格分离，不得混用。**

### 2.1 职责划分铁律

| 状态类型 | 工具 | 典型场景 | 禁止事项 |
|---------|------|---------|---------|
| **服务端状态** | TanStack Query | 工单列表/详情、Dashboard 数据、用户信息、通知列表 | ❌ 禁止用 Zustand 存储 API 返回数据 |
| **客户端 UI 状态** | Zustand | 弹窗开关、侧边栏折叠、表单草稿、主题/语言偏好 | ❌ 禁止用 TanStack Query 存储纯 UI 状态 |

**核心原则：服务端数据（API 返回）一律走 TanStack Query，客户端 UI 状态才走 Zustand。**

### 2.2 TanStack Query 使用规范

```typescript
// ✅ 正确：服务端数据用 TanStack Query
export function useTicketList(filters: TicketFilters) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => fetchTicketList(filters),
    staleTime: 30_000,           // 30 秒内不重新请求
    gcTime: 5 * 60_000,          // 缓存保留 5 分钟
    placeholderData: keepPreviousData, // 筛选切换时保持旧数据
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: TicketStatus }) =>
      updateTicketStatus(ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
```

关键配置：
- `queryKey` 结构化，支持自动缓存和精准失效。
- `staleTime` / `gcTime` 根据数据实时性要求分级配置。
- 乐观更新通过 `onMutate` 实现，配合 `onError` 回滚。
- 分页/无限滚动使用 `useInfiniteQuery`。
- WebSocket 实时消息到达后，通过 `queryClient.setQueryData` 直接更新缓存。

### 2.3 Zustand 使用规范

```typescript
// ✅ 正确：客户端 UI 状态用 Zustand
interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  createTicketModalOpen: boolean;
  openCreateTicketModal: () => void;
  closeCreateTicketModal: () => void;

  ticketFormDraft: Partial<TicketFormValues>;
  updateFormDraft: (values: Partial<TicketFormValues>) => void;
  resetFormDraft: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  createTicketModalOpen: false,
  openCreateTicketModal: () => set({ createTicketModalOpen: true }),
  closeCreateTicketModal: () => set({ createTicketModalOpen: false }),

  ticketFormDraft: {},
  updateFormDraft: (values) =>
    set((s) => ({ ticketFormDraft: { ...s.ticketFormDraft, ...values } })),
  resetFormDraft: () => set({ ticketFormDraft: {} }),
}));
```

关键规范：
- Store 按功能域拆分（uiStore、themeStore、localeStore），避免单一巨型 Store。
- 组件按需订阅最小粒度的 state，避免不必要的重渲染。
- 使用 `create` 时启用严格类型，禁止 `any`。
- 持久化状态（主题、语言）使用 `persist` 中间件，存储到 localStorage。

### 2.4 Server/Client Component 边界规范

| 规则 | 说明 |
|------|------|
| Server Component 中禁止使用客户端 Hooks | `useState`、`useEffect`、`useQuery`、`useUIStore` 等只能在 Client Component 中使用 |
| 文件顶部 `"use client"` 指令 | 所有使用 Zustand/TanStack Query 的组件文件必须在第一行添加 `"use client"` |
| 交互逻辑下沉到 Client Component | Server Component 负责数据获取（RSC）和布局，交互逻辑通过 Client Component 子组件实现 |
| TanStack QueryProvider 在根布局 | `QueryClientProvider` 必须在 Client Component 中包裹应用，通过 Next.js App Router 的 `providers.tsx` 模式实现 |

```
app/
├── layout.tsx              # Server Component：获取租户主题、布局结构
├── providers.tsx           # Client Component：QueryClientProvider + 全局 Store
├── tickets/
│   ├── page.tsx            # Server Component：RSC 初始数据获取
│   └── TicketList.tsx      # Client Component：useQuery + 交互逻辑
```

### 2.5 共享配置抽取

将 TanStack Query 的默认配置（retry、staleTime、gcTime、refetchOnWindowFocus）和 QueryClient 实例化逻辑抽取到 `packages/config-store` 包，所有应用统一引用，确保配置一致。

---

## 三、备选方案

### 备选方案 A：Redux Toolkit + RTK Query（全家桶方案）

**描述**：使用 Redux Toolkit 管理客户端状态，RTK Query 管理服务端状态。

**未选择原因**：
1. **样板代码量大**：Redux Toolkit 虽然比原生 Redux 简化，但仍需定义 slice、reducer、action、dispatch，对于简单 UI 状态（如弹窗开关）过于繁琐。Zustand 的 `create` API 只需几行代码。
2. **学习成本高**：Redux 的 reducer/action/dispatch/selector 心智模型对新人不友好，4 天工期内团队上手风险大。
3. **包体积更大**：Redux Toolkit + react-redux 约 13KB（gzip），Zustand 仅约 1KB（gzip），对性能敏感的 B2B 应用有影响。
4. **RTK Query 与 TanStack Query 功能重叠但生态更窄**：TanStack Query 社区更大、文档更完善、与 Next.js RSC 的集成模式更成熟。RTK Query 绑定 Redux 生态，不够灵活。
5. **与 RSC 架构理念冲突**：Redux 的全局 Store 模式与 Next.js App Router 的 Server-first 理念不太契合，Zustand 的轻量 Store 更容易在 Client Component 边界内使用。

### 备选方案 B：Jotai（原子化状态管理）+ TanStack Query

**描述**：使用 Jotai 的原子化模型管理客户端状态，TanStack Query 管理服务端状态。

**未选择原因**：
1. **原子化模型心智转换成本**：Jotai 的 atom 派生模型虽然优雅，但团队更熟悉 Store 模式（Zustand/Redux），4 天工期内学习 Jotai 的 atom 组合、派生 atom、异步 atom 等概念有风险。
2. **调试工具不如 Zustand 直观**：Zustand 的 Store 是普通对象，可直接在 React DevTools 中检查；Jotai 的 atom 值分散在 Provider 中，调试体验稍弱。
3. **Zustand 对简单场景更直接**：本项目的客户端状态以弹窗开关、表单草稿、侧边栏折叠等为主，Zustand 的单一 Store + selector 模式比 Jotai 的细粒度 atom 更直接。
4. **社区与生态规模**：Zustand 的 GitHub star 数和 npm 下载量均高于 Jotai，长期维护和问题排查更有保障。

### 备选方案 C：仅使用 TanStack Query + React useState/useReducer

**描述**：不引入全局状态管理库，服务端状态用 TanStack Query，客户端状态用 React 内置的 useState/useReducer + Context。

**未选择原因**：
1. **Context 性能问题**：当全局 UI 状态（如侧边栏折叠、主题）通过 Context 传递时，任何状态变更都会导致所有消费该 Context 的组件重渲染，即使它们只关心其中一个字段。Zustand 的 selector 机制支持精确订阅，避免不必要的重渲染。
2. **状态提升繁琐**：表单草稿等需要跨组件共享的状态，如果只用 useState 需要层层 props drilling 或大量 Context 嵌套，维护成本高。
3. **持久化需要手动实现**：主题、语言等需要持久化的状态，用 useState + localStorage 需要手动编写序列化/反序列化/ hydration 逻辑；Zustand 的 `persist` 中间件一行配置即可。
4. **DevTools 支持弱**：Zustand 提供内置的 Redux DevTools 集成，可时间旅行调试；useState/Context 没有 comparable 的调试能力。

---

## 四、后果

### 正面影响

1. **职责清晰**：Zustand 管 UI、TanStack Query 管服务端数据，开发者不需要纠结"这个状态该放哪"，铁律一目了然。
2. **服务端状态能力完备**：TanStack Query 自动处理缓存、失效、重试、乐观更新、分页、窗口聚焦刷新，无需手写大量 loading/error 样板代码。
3. **客户端状态轻量高效**：Zustand 体积仅 ~1KB，API 简洁，selector 精确订阅避免不必要的重渲染。
4. **RSC 兼容性好**：两个库都明确支持在 Client Component 中使用，与 Next.js App Router 的 Server/Client 边界模式天然契合。
5. **TypeScript 友好**：Zustand 和 TanStack Query 都有一流的 TypeScript 支持，queryKey 自动推断、Store 状态类型约束，减少 any 混入。
6. **实时更新集成简单**：WebSocket 消息到达后通过 `queryClient.setQueryData` / `invalidateQueries` 更新缓存，通知列表等实时场景实现简洁。

### Trade-off 与需要承担的成本

1. **需要学习两个库**：团队成员需要同时掌握 Zustand 和 TanStack Query 的 API。但两者学习曲线都比 Redux 平缓，且职责分离后每个库的使用场景明确。
2. **QueryClient 必须是 Client Component**：在 Next.js App Router 中，`QueryClientProvider` 必须在 `"use client"` 组件中，需要通过 `providers.tsx` 模式包装，增加了一层文件。
3. **缓存失效策略需要设计**：TanStack Query 的 `staleTime`、`gcTime`、`invalidateQueries` 需要根据数据实时性要求分级配置，配置不当会导致数据不新鲜或请求过多。需要在 `config-store` 中预设合理默认值。
4. **Zustand Store 拆分纪律**：如果不加约束，所有 UI 状态可能堆进一个巨型 Store。需要在 Code Review 中检查 Store 按功能域拆分，组件使用最小粒度 selector。
5. **Server/Client 边界需要持续守护**：开发者可能误在 Server Component 中使用客户端 Hooks 导致构建报错。需要 ESLint 规则检测 `"use client"` 指令缺失，并在 Code Review 中检查。
6. **POC 验证要求**：在大规模开发前，用最小原型验证 TanStack Query 在 RSC 中的 Provider 配置、Zustand persist 中间件的 SSR hydration、以及 WebSocket 消息驱动 queryClient 更新的端到端可行性。

---

## 五、评审记录

| 评审项 | 结果 |
|--------|------|
| 包含背景、决策、备选方案、后果四个部分 | ✅ |
| 决策明确选择 Zustand + TanStack Query | ✅ |
| 备选方案至少 2 个并说明未选择原因 | ✅ 3 个（Redux Toolkit、Jotai、纯 useState/Context） |
| 后果说明正面影响与 trade-off | ✅ 6 项正面 + 6 项 trade-off |
| 明确 Server/Client Component 边界规范 | ✅ 2.4 节 |
| 写明"use client"指令规范 | ✅ 2.4 节 |
| 写明铁律：服务端数据走 TanStack Query，UI 状态走 Zustand | ✅ 2.1 节 |
| 明确 POC 验证要求 | ✅ 后果第 6 条 |