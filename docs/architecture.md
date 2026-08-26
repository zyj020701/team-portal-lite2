# 系统架构文档（Architecture）

> 本文档描述 Team Portal Lite 的 Monorepo 分层、运行时数据流与关键技术路径。
> 关联文档：[ADR-001](adr/ADR-001-monorepo-layering.md)（Monorepo 分层）、
> [ADR-002](adr/ADR-002-state-management.md)（状态边界）、
> [ADR-003](adr/ADR-003-multi-tenant-theme.md)（多租户主题）、
> [ADR-004](adr/ADR-004-micro-frontend.md)（微前端取舍）、
> [ADR-005](adr/ADR-005-testing-strategy.md)（测试策略）、
> [状态边界](state-boundary.md)。

---

## 1. Monorepo 分层架构

采用 **pnpm + Turborepo** 管理 5 个应用与 10 个共享包，依赖方向严格自上而下，禁止循环依赖（`pnpm madge` 守门）。

```mermaid
graph TD
  subgraph Apps["apps/ — 应用层"]
    Web["web-app<br/>(Next.js 14 主工作台)"]
    Admin["admin-app"]
    Landing["landing-app"]
    Mobile["mobile-app"]
    SB["storybook"]
  end

  subgraph UILayer["packages/ — UI / 能力层"]
    UI["ui<br/>(Button/Input/Modal/Table/VirtualList)"]
    Icons["icons"]
    Hooks["hooks<br/>(useTheme/useWebSocket/useVirtualList)"]
    WS["ws-client<br/>(心跳/指数退避/消息队列)"]
    APIC["api-client"]
    I18N["i18n"]
  end

  subgraph Foundation["packages/ — 基础层"]
    DT["design-tokens<br/>(CSS 变量主题)"]
    TW["config-tailwind"]
    CStore["config-store"]
    Utils["utils<br/>(formatDate/cn/debounce/状态机)"]
    Types["types<br/>(Ticket/ThemeTokens/WSMessage)"]
  end

  Web --> UI & Hooks & WS & APIC & I18N & DT & TW
  Admin --> UI
  Landing --> UI & DT
  Mobile --> UI & Hooks
  SB --> UI & Icons

  UI --> DT & TW & Utils & Types & Icons
  Hooks --> Utils & Types
  WS --> Types
  APIC --> Types
  I18N --> Types
  Utils --> Types
  CStore --> Types
```

**分层规则**：

- **基础层**（utils、types、config-*）不依赖任何上层包
- **能力层**（ui、icons、hooks、ws-client、api-client、i18n）只能依赖基础层
- **应用层**可依赖所有 packages，应用之间禁止互相依赖

---

## 2. 运行时架构（web-app）

```mermaid
flowchart LR
  subgraph Browser["浏览器"]
    RSC["RSC Payload<br/>(Server Components)"]
    Client["Client Components<br/>(交互岛屿)"]
    ZStore["Zustand Stores<br/>(UI 状态/persist)"]
    TQ["TanStack Query Cache<br/>(服务端数据)"]
    WSClient["ws-client<br/>(心跳/重连/队列)"]
  end

  subgraph Edge["Vercel / Next.js 运行时"]
    MW["middleware.ts<br/>(next-intl locale 路由)"]
    RSCServer["App Router RSC"]
    Img["next/image 优化"]
    Font["next/font"]
  end

  subgraph Backend["后端（外部）"]
    API["REST API"]
    WSSrv["WebSocket Server"]
  end

  MW --> RSCServer
  RSCServer -->|获取初始数据| API
  RSCServer --> RSC
  RSC --> Client
  Client <-->|读取 UI 状态| ZStore
  Client <-->|queryKey 规范查询/变更| TQ
  TQ -->|HTTP| API
  Client --> WSClient
  WSClient <-->|wss 实时消息| WSSrv
  WSClient -->|setQueryData 精确更新缓存| TQ
  RSCServer --> Img & Font
```

---

## 3. 核心数据流

### 3.1 工单列表（筛选 + 无限滚动 + 实时更新）

```mermaid
sequenceDiagram
  participant U as 用户
  participant TB as TicketFilterBar
  participant TS as ticketStore (Zustand)
  participant TQ as TanStack Query
  participant API as REST API
  participant WS as ws-client

  U->>TB: 修改状态/优先级/关键词
  TB->>TS: setStatus / setKeyword (debounce)
  TS->>TS: persist 到 localStorage
  TS-->>TQ: queryKey ['tickets','list',filters] 变化
  TQ->>API: GET /api/tickets?filters&cursor
  API-->>TQ: 工单分页数据
  TQ-->>U: VirtualList 渲染（@tanstack/react-virtual）

  WS-->>TQ: 推送 ticket_updated
  TQ->>TQ: setQueryData 精确更新列表 + 详情缓存
  Note over TQ,U: 仅受影响行重渲染（React.memo + selector）
```

### 3.2 多租户主题切换

```mermaid
sequenceDiagram
  participant U as 用户/租户
  participant UT as useTheme
  participant Root as document.documentElement
  participant DT as design-tokens

  U->>UT: setTheme(tenantTokens)
  UT->>DT: tokensToCssVars(themeTokens)
  DT-->>UT: { '--color-primary-500': '#...', ... }
  UT->>Root: root.style.setProperty 逐个注入 CSS 变量
  Root-->>U: Tailwind bg-primary/text-primary 瞬间换肤
  UT->>UT: persist 主题名到 localStorage
```

---

## 4. 构建与 CI/CD 流水线

```mermaid
flowchart TD
  PR["PR / push to main"] --> GH["GitHub Actions (ubuntu)"]
  GH --> CACHE["pnpm 缓存 + Node 20"]
  CACHE --> LINT["pnpm lint (0 error 0 warning)"]
  LINT --> TC["pnpm typecheck (strict, 0 any)"]
  TC --> TEST["pnpm test (Vitest, 覆盖率 ≥75%)"]
  TEST --> BUILD["pnpm build (Turbo 增量)"]
  BUILD --> LHCI["pnpm lhci autorun (3 runs × 4 页面)"]
  LHCI -->|Performance ≥96, A11y/BP/SEO ≥95| ART["上传 Lighthouse HTML artifact"]
  LHCI -->|不达标| FAIL["CI 失败阻断合并"]
  BUILD --> DEPLOY["Vercel 部署<br/>(Production/Preview/Development)"]
  DEPLOY --> HTTPS["自动 HTTPS + 安全头"]
```

---

## 5. 关键技术决策索引

| 关注点 | 方案 | ADR |
|--------|------|-----|
| 仓库结构 | pnpm + Turborepo，5 Apps + 10 Packages | ADR-001 |
| 状态管理 | Zustand（UI）+ TanStack Query（服务端），禁止 Redux | ADR-002 |
| 多租户主题 | Design Token + 运行时 CSS 变量注入 | ADR-003 |
| 微前端 | 暂不引入 Module Federation，Monorepo 共享包 + Vercel 多应用 | ADR-004 |
| 测试策略 | Vitest + Testing Library + Playwright 三层金字塔，v8 覆盖率门禁 | ADR-005 |
| 框架 | Next.js 14 App Router + RSC，`[locale]` 动态段 | — |
| 实时通信 | 原生 WebSocket（禁 socket.io），心跳 + 指数退避 | — |
| 大数据列表 | @tanstack/react-virtual 动态行高，目标 ≥50fps | — |
| 图表 | Recharts，`next/dynamic` 懒加载 + 骨架屏 | — |
| 性能门禁 | Lighthouse CI（@lhci/cli）作为 PR Check | — |
