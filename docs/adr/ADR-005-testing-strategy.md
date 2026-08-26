# ADR-005：测试金字塔与覆盖率策略

> 文档编号：ADR-005
> 状态：✅ 已接受
> 日期：2026-08-26
> 决策者：前端架构组

---

## 一、背景

Team Portal Lite 面向 5000+ 企业客户、100 万客服、30 万 DAU，核心业务（工单状态机、WebSocket 实时推送、虚拟滚动、多租户主题）任何回归都会直接影响一线客服的接单效率。项目同时受以下工程红线约束：

- **R3 测试红线**：整体覆盖率 ≥ 75%，核心模块（utils / stores / hooks）≥ 85%；P0 流程必须有 Playwright E2E（≥ 5 条）；测试运行 ≤ 2 分钟；无 flaky 测试。
- **R8 测试框架红线**：单元测试必须用 **Vitest**（禁 Jest）；组件测试用 **@testing-library/react**（禁 Enzyme）；E2E 用 **Playwright**（禁 Cypress）；E2E 选择器必须用语义化的 `getByRole/getByLabel/getByText`，禁止 CSS 类名选择器；覆盖率用 Vitest 内置 v8 provider。
- **R2 类型红线**：strict + `noUncheckedIndexedAccess`，0 个 `any`，测试本身也必须通过类型检查。

工期仅 4 天，且只有 1 名开发者，因此测试策略必须"高杠杆"——用最少的用例覆盖最高的业务风险，而不是盲目追求行数。

---

## 二、决策

**采用三层测试金字塔（Vitest 单元 / Testing Library 组件交互 / Playwright E2E），覆盖率以 v8 内置阈值在 CI 中强制门禁，E2E 以单 worker 串行执行换取确定性。**

### 2.1 分层与工具

| 层级 | 工具 | 覆盖目标 | 数量（当前） |
|------|------|----------|--------------|
| 单元测试 | Vitest 1.x + jsdom | 工具函数、Zustand store、Hooks、状态机、Token 转换 | 217 个用例 |
| 组件交互测试 | @testing-library/react + jest-dom | Button/Input/Modal/NotificationBell/VirtualList 等 | 含在上述 217 中 |
| E2E | Playwright 1.x（chromium） | P0 业务流程（登录态跳转、工单列表筛选、详情状态机、Dashboard、虚拟滚动） | 17 个用例 / 3 个 spec |

### 2.2 覆盖率门禁（vitest.config.ts）

```ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'clover'],
      thresholds: {
        lines: 75,
        branches: 75,
        functions: 75,
        statements: 75,
      },
    },
  },
});
```

核心目录（`packages/utils`、`apps/web-app/stores`、`apps/web-app/hooks`）单独配置更高阈值：

```ts
{
  file: 'packages/utils/src/**/*.ts',
  thresholds: { lines: 85, functions: 85, branches: 80 }
}
```

**实测结果**（Day28）：

- 语句覆盖率 **97.31%**
- 函数覆盖率 **98.02%**
- 分支覆盖率 **92.36%**
- 217 个用例全部通过

### 2.3 测试规范

1. **行为断言而非实现细节**：不 assert 内部 state / 私有变量，统一通过 `getByRole`、`getByText`、`getByLabel` 查询用户可见行为。
2. **禁止快照堆砌**：组件测试必须包含交互断言（点击、输入、键盘、disabled），纯快照用例在 Code Review 中驳回。
3. **异步一律 await**：使用 `findBy*`（自带等待）替代 `waitFor` + 定时器；定时器用 `vi.useFakeTimers()`。
4. **Mock 边界清晰**：
   - WebSocket：mock `global.WebSocket`，模拟 open/message/close/error 与指数退避。
   - ResizeObserver：在 `tests/setup.ts` 中提供 jsdom 缺失的 mock（虚拟滚动 Hooks 依赖它）。
   - localStorage：每个 `beforeEach` 重置完整方法集（getItem/setItem/removeItem/clear），验证 Zustand persist 读写。
5. **E2E 选择器纪律**：禁止 CSS 类名 / `data-testid`（仅在无角色可查时例外并注释原因）；优先 `getByRole('button', { name: /处理中/ })`。
6. **E2E 单 worker 串行**：`playwright test --workers=1`。D27 阶段曾出现并发执行时内存 mock 与 Zustand persist 状态在测试间共享导致的 flaky，串行后 17/17 连续 3 次稳定通过。
7. **测试与源码同目录**：`*.test.ts(x)` 紧邻源码，便于维护与重构；E2E 集中在 `apps/web-app/e2e/*.spec.ts`。

### 2.4 CI 集成

在 `.github/workflows/ci.yml` 中按顺序执行：`lint → typecheck → test（覆盖率）→ build → lhci autorun`，任一环节失败即阻断合并。覆盖率报告作为 artifact 上传。

---

## 三、备选方案

### 备选方案 A：Jest + Enzyme（传统 React 测试栈）

**未选择原因**：

1. **R8 红线明确禁止 Jest 与 Enzyme**，违规将直接导致 CI 失败。
2. Jest 对 ESM、Next.js 14、Turborepo 的开箱体验差，需要 `babel-jest` + 大量 transform 配置；Vitest 与 Vite / Next 的 SWC 管线天然一致。
3. Enzyme 已停止积极维护，不支持 React 18 的并发特性，且鼓励断言实现细节（state/instance），与本项目"测试行为"的原则相悖。

### 备选方案 B：Cypress E2E

**未选择原因**：

1. **R8 明确禁止 Cypress**。
2. Cypress 不开源（部分功能付费）、不支持多浏览器并行的免费层，且其 `cy.get('.class')` 默认选择器诱导开发者依赖 CSS 类名，与本项目语义化选择器纪律冲突。
3. Playwright 的 auto-wait、web-first 断言、trace viewer、跨浏览器引擎在 P0 流程稳定性上更优。

### 备选方案 C：只做单元测试，不做 E2E

**未选择原因**：

1. 单元测试无法覆盖 Next.js App Router 的 RSC / 流式渲染 / 中间件 locale 重排等"装配层"问题，这些恰恰是最容易在生产爆炸的位置。
2. R3 明确要求 ≥ 5 条 P0 E2E。
3. E2E 是验证 WebSocket 真实握手、虚拟滚动真实滚动性能、状态机真实跳转的唯一可信手段。

### 备选方案 D：100% E2E（放弃单元测试）

**未选择原因**：

1. E2E 运行慢、定位粗、维护成本高，若每个工具函数都走 E2E，测试运行时间会轻易突破 R3 的 2 分钟红线。
2. 状态机 `canTransition`、Token 转换、debounce 等纯函数用单元测试可以毫秒级完成并覆盖所有边界，ROI 远高于 E2E。
3. 标准金字塔结构（大量单元 + 适量 E2E）是工业界共识，反金字塔会显著拖慢迭代。

---

## 四、后果

### 正面影响

1. **覆盖率大幅超标**：97.31% 语句 / 98.02% 函数 / 92.36% 分支，远超 R3 的 75% 门槛，核心模块全部 ≥ 85%。
2. **重构信心强**：状态机、虚拟滚动、WebSocket 重连等核心逻辑都有行为级测试守护，可以在性能优化阶段大胆重构而不担心回归。
3. **测试运行快**：Vitest 并发执行 217 个用例在本地秒级完成，满足 ≤ 2 分钟的 CI 红线。
4. **E2E 稳定**：`--workers=1` + 语义化选择器 + 完整 mock 重置，17 条 E2E 连续 3 次全绿，无 flaky。
5. **类型安全延伸到测试**：测试文件也经过 `tsc --noEmit`，配合 0 个 `any`，测试本身不会因类型漂移而"假绿"。
6. **CI 门禁闭环**：覆盖率不达标、Lighthouse 不达标、lint/typecheck 报错均阻断合并，质量左移。

### Trade-off 与需要承担的成本

1. **E2E 单 worker 牺牲了并行速度**：17 条 E2E 串行约需 1–2 分钟。后续若用例数大幅增长，需要在测试间彻底隔离状态（独立 BrowserContext + 每次清 localStorage）后才能恢复并行。
2. **jsdom 环境与真实浏览器仍有差距**：ResizeObserver、IntersectionObserver、layout 计算在 jsdom 中缺失或不准，相关 Hooks 必须配合手写 mock，且部分滚动性能只能依赖 E2E / 手动 Profiler 验证。
3. **覆盖率 ≠ 正确性**：97% 的数字不代表所有边界都被断言；Code Review 仍需把关断言质量，避免"渲染不报错"式的空测试。
4. **Mock WebSocket 不能替代真实联调**：指数退避、心跳等逻辑在单测中验证了状态转移，但网络抖动、代理超时等真实环境问题仍需在 Vercel Preview 环境做一次手动验证。
5. **维护成本**：每新增一个交互组件都必须配套交互测试；这会增加约 20–30% 的开发工作量，但相对线上回归的代价是划算的。

---

## 五、评审记录

| 评审项 | 结果 |
|--------|------|
| 包含背景、决策、备选方案、后果四个部分 | ✅ |
| 工具选择严格对齐 R8（Vitest / Testing Library / Playwright） | ✅ |
| 覆盖率阈值与 R3 对齐（75% / 核心 85%） | ✅ 2.2 节 |
| 给出实测覆盖率数据 | ✅ 97.31% / 98.02% / 92.36% |
| 备选方案 ≥ 2 个并说明未选择原因 | ✅ 4 个（Jest+Enzyme、Cypress、仅单元、仅 E2E） |
| E2E 选择器策略与 flaky 对策明确 | ✅ 2.3 节 |
