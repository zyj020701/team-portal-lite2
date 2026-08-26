阶段四项目说明书：优化、测试与部署（Day 28）

一、项目目的

1.1 阶段目标

在前三阶段已完成核心功能、进阶功能与联调的基础上，进行最终的性能优化、测试补齐、类型加固、CI 集成与生产部署，将项目从 "开发完成态" 推进到 "可交付的生产级产品"。本阶段是整个 4 天实战的收官之日，核心目标是通过可量化的指标（Lighthouse 96+、TS 0 Any、75%+ 测试覆盖率）证明项目的工程质量，并完成线上部署与文档交付，形成完整的简历作品。

1.2 业务价值

性能优化：将 Lighthouse 性能分冲刺到 96+，确保 30 万 DAU 场景下的首屏体验与交互流畅度

测试补齐：单元测试覆盖率达到 75%+，为项目的可维护性和后续迭代提供质量安全网

类型安全：TypeScript 严格模式下清零 any，消除运行时类型隐患，提升代码健壮性

CI 门禁：集成 Lighthouse CI，将性能指标纳入 PR 自动化检查，防止性能退化

部署交付：项目上线 Vercel 可访问，配套完整文档与简历亮点总结，形成可展示的作品集

1.3 能力沉淀目标

通过本阶段掌握前端性能优化方法论（Bundle 分析、代码分割、懒加载、渲染优化）、前端测试体系建设（单元测试策略与覆盖率管理）、TypeScript 严格模式治理、CI/CD 流水线配置、生产部署与文档输出等全链路工程化能力。这些是大厂 P6/P7 面试中 "工程化与质量保障" 维度的核心考察点，也是简历上最有说服力的量化成果。

二、项目功能

2.1 性能优化体系

Bundle 分析：使用 @next/bundle-analyzer 生成构建产物体积分析报告，识别大型依赖与重复打包

代码分割：基于 Next.js App Router 的自动代码分割，结合 dynamic() 对重型组件（图表、富文本编辑器、Modal）进行动态导入

路由级懒加载：Dashboard 图表、工单详情的时间线组件等非首屏关键内容按需加载

第三方依赖优化：对 Lodash、日期库等大型依赖做按需引入或替换为轻量方案，剔除未使用的导出

图片优化：使用 Next.js Image 组件，配置响应式尺寸、WebP/AVIF 格式、懒加载，避免大图阻塞首屏

字体优化：使用 next/font 内置字体优化，预加载关键字体，避免 FOIT（不可见文字闪烁）

运行时渲染优化：React.memo 包裹高频重渲染组件，useMemo/useCallback 缓存计算结果与回调，虚拟滚动列表渲染优化

Lighthouse 跑分调优：针对 Performance、Accessibility、Best Practices、SEO 四项指标逐项优化，冲刺总分 96+

2.2 单元测试体系

工具函数测试：对 packages/utils 中的日期格式化、防抖节流、状态机判断、主题 Token 转换等纯函数编写 Vitest 单元测试

Hooks 测试：对 useTheme、useWebSocket、useVirtualList、useTicketFilters 等自定义 Hooks 使用 @testing-library/react 的 renderHook 测试

组件测试：对 Button、Input、Modal、VirtualList、NotificationBell 等基础组件进行交互测试（渲染、事件、props）

状态管理测试：对 Zustand store 的 actions（筛选条件变更、状态更新、持久化）进行单元测试

覆盖率管理：生成覆盖率报告，识别未覆盖的代码行，针对性补齐测试，整体覆盖率 ≥ 75%

测试工具配置：Vitest 配置 jsdom 环境、@testing-library/jest-dom 扩展断言、覆盖率阈值 CI 门禁

2.3 TypeScript 严格模式治理

全量类型检查：执行 tsc --noEmit --strict 全量检查，收集所有类型错误与 any 告警

any 清零：逐文件排查 any 类型，替换为具体类型、泛型、unknown + 类型守卫，或为第三方库编写类型声明

第三方类型补丁：对缺少类型定义的第三方库，通过 declare module 或 \*.d.ts 补充类型，避免 any 兜底

ESLint 规则加固：开启 @typescript-eslint/no-explicit-any、@typescript-eslint/no-unsafe-assignment 等严格规则，CI 中阻断 any 合入

类型导出规范：共享 Package 的类型统一从 index.ts 导出，内部类型不泄露，API 边界类型清晰

2.4 Lighthouse CI 集成

CI 工作流配置：在 GitHub Actions（或其他 CI）中配置 Lighthouse CI 工作流，PR 提交时自动触发

性能阈值设置：设定 Performance ≥ 96、Accessibility ≥ 95、Best Practices ≥ 95、SEO ≥ 95 的阈值，不达标则 CI 失败

多页面检测：对首页、工单列表页、工单详情页、Dashboard 四个核心页面分别跑 Lighthouse

报告归档：每次 CI 运行生成 Lighthouse HTML 报告，上传到 CI 制品或临时存储，供历史对比

预算配置：设置资源预算（JS 体积、CSS 体积、图片体积、请求数），超预算时告警

2.5 生产部署与交付

Vercel 部署配置：配置项目构建命令、输出目录、Node.js 版本，连接 Git 仓库实现自动部署

环境变量管理：在 Vercel 平台配置生产环境变量（API 地址、WebSocket 地址、i18n 默认语言等），区分 Production/Preview/Development 环境

自定义域名与 HTTPS：绑定自定义域名（可选），Vercel 自动签发 SSL 证书，强制 HTTPS

Preview 部署：每个 PR 自动生成 Preview 环境，可在线预览变更，便于评审

项目文档输出：完善 README（项目介绍、技术栈、启动方式、目录结构、部署说明）、架构图、ADR 文档汇总

简历亮点总结：提炼可量化成果（Lighthouse 96+、TS 0 Any、75%+ 覆盖率、Monorepo 5 Apps+10 Packages、5 大核心技术挑战），形成简历项目描述

三、核心约束

3.1 性能约束

Lighthouse 性能分 ≥ 96：四个核心页面（首页 / 列表 / 详情 / Dashboard）的 Performance 指标均 ≥ 96

首屏加载时间 ≤ 2s：在 4G 网络、中端设备模拟下，首屏内容渲染（FCP）≤ 2s

可交互时间（TTI）≤ 3s：页面从加载到可稳定交互的时间 ≤ 3s

JS Bundle 体积 ≤ 150KB（gzip 后）：首屏关键 JS 资源 gzip 后不超过 150KB

累积布局偏移（CLS）≤ 0.1：页面加载过程中无明显布局跳动

虚拟滚动 10 万条数据帧率 ≥ 50fps：优化后仍需保持大数据量下的流畅滚动

3.2 测试约束

整体测试覆盖率 ≥ 75%：语句覆盖率、分支覆盖率、函数覆盖率均 ≥ 75%

核心模块覆盖率 ≥ 85%：工具函数、状态管理 store、自定义 Hooks 的覆盖率不低于 85%

E2E 测试全部通过：阶段三编写的 5 条 Playwright E2E 测试在生产构建上全部通过

无 flaky 测试：单元测试与 E2E 测试连续运行 3 次均通过，无随机失败

测试运行时间 ≤ 2 分钟：全量单元测试执行时间控制在 2 分钟以内，避免 CI 等待过长

3.3 类型与代码质量约束

TypeScript 严格模式 0 any：tsc --strict 全量通过，代码中无显式 any，无隐式 any

ESLint 0 error 0 warning：全项目 ESLint 检查通过，无错误和警告

Prettier 格式统一：所有代码通过 Prettier 格式化，CI 中格式检查通过

无循环依赖：Monorepo Packages 间无循环依赖（madge 检测通过）

无未使用代码：无未使用的 import、变量、函数（ESLint no-unused-vars 规则通过）

3.4 部署与 CI 约束

Vercel 生产构建成功：next build 无错误，生产环境可正常访问

Lighthouse CI 门禁生效：PR 中性能低于阈值时 CI 失败，阻断合并

环境变量不泄露：密钥类环境变量不提交到 Git，仅在 Vercel 平台配置

Preview 环境可用：每个 PR 自动生成 Preview 链接，可正常访问

HTTPS 强制跳转：HTTP 请求自动跳转到 HTTPS

3.5 交付约束

README 文档完整：包含项目介绍、技术栈、快速启动、目录结构、脚本说明、部署指南

架构文档齐全：架构图、ADR 决策记录（至少 3 份）、状态边界文档

简历亮点可量化：项目描述中包含至少 3 个可量化数据指标

线上地址可访问：提供生产环境访问链接，功能可正常演示

四、技术限制

4.1 性能优化技术限制

Bundle 分析必须使用 @next/bundle-analyzer：与 Next.js 构建流程集成，不得使用 webpack-bundle-analyzer 独立配置

动态导入必须使用 Next.js dynamic()：不得使用原生 React.lazy（App Router 下推荐 dynamic）

图片必须使用 Next.js Image 组件：不得使用原生 <img> 标签，确保自动优化、懒加载、响应式尺寸

字体必须使用 next/font：不得使用 @font-face 或 Google Fonts 链接，确保字体优化与预加载

不得引入新的大型依赖：优化阶段禁止新增 Lodash、Moment.js 等重型库，优先使用已有依赖或原生 API

4.2 测试技术限制

单元测试框架必须使用 Vitest：不得使用 Jest

组件测试必须使用 @testing-library/react：不得使用 Enzyme

断言扩展必须使用 @testing-library/jest-dom：提供 toBeVisible()、toHaveTextContent() 等 DOM 断言

Hooks 测试必须使用 @testing-library/react 的 renderHook：不得手动实例化 Hooks

覆盖率工具使用 Vitest 内置的 --coverage（基于 c8）：不得使用 Istanbul 独立配置

E2E 测试必须使用 Playwright：与阶段三保持一致，不得引入 Cypress

4.3 TypeScript 技术限制

必须开启 strict: true 及所有严格子选项：包括 noImplicitAny、strictNullChecks、strictFunctionTypes、strictBindCallApply、noImplicitThis、alwaysStrict、useUnknownInCatchVariables

必须开启 noUncheckedIndexedAccess：数组索引访问返回 T | undefined，强制处理边界情况

必须开启 noImplicitReturns：函数所有分支必须有返回值

必须开启 noFallthroughCasesInSwitch：switch 语句禁止 case 穿透

第三方类型缺失时必须编写 \*.d.ts 声明：不得用 any 兜底

4.4 CI/CD 技术限制

部署平台必须使用 Vercel：不得使用 Netlify、自托管服务器、Docker 部署

CI 中 Lighthouse 必须使用 @lhci/cli：官方 Lighthouse CI 工具，不得使用其他第三方 Lighthouse 包装

CI 平台使用 GitHub Actions（或项目已有的 CI 平台），工作流配置文件放在 .github/workflows/

环境变量必须通过 Vercel 平台管理：不得在代码中硬编码 API 地址、密钥等

Preview 部署由 Vercel 自动提供：不得自行搭建 Preview 环境

4.5 文档技术限制

README 使用 Markdown 格式：放在项目根目录

架构图使用 Mermaid 或 Excalidraw：可在 Markdown 中渲染，不得使用无法查看的专有格式

ADR 文档使用 Markdown 格式：放在 docs/adr/ 目录，编号命名（如 001-monorepo-structure.md）

简历亮点输出为 Markdown 或纯文本：便于复制到简历中

五、完成步骤（含验收要求）

步骤 01：Bundle 分析与代码分割优化

安装并配置 @next/bundle-analyzer，执行 ANALYZE=true pnpm build 生成构建产物体积报告，识别超过 50KB 的 chunk、重复打包依赖、全量导入的库，形成优化清单。基于清单对重型组件（Dashboard 图表、富文本编辑器、大型 Modal）使用 Next.js dynamic() 动态导入，配置 ssr: false + loading: Skeleton；对 Lodash 等工具库改为按需引入（import debounce from 'lodash/debounce'）或替换为轻量原生实现。

验收要求： Bundle 分析报告已生成且标注出至少 3 项优化点；至少 3 个重型组件使用 dynamic() 导入并有骨架屏；首屏关键 JS chunk gzip 后 ≤ 150KB；无全量 import \_ from 'lodash'；动态导入组件无白屏闪烁。

步骤 02：图片、字体与运行时渲染优化

将所有原生 <img> 替换为 Next.js Image 组件，配置 width/height（或 fill+sizes）、alt、首屏关键图加 priority，在 next.config.ts 配置远程域名与 WebP/AVIF 格式。字体改用 next/font 加载，配置 display: 'swap'，移除手动 @font-face 和 Google Fonts 外链。使用 React DevTools Profiler 录制高频交互，对列表项用 React.memo、复杂计算用 useMemo、回调用 useCallback、Zustand 用精确选择器或 useShallow 减少不必要重渲染。

验收要求： 全局无原生 <img>，所有 Image 有 alt 且首屏图有 priority；字体通过 next/font 加载且无 FOIT；Profiler 验证筛选变更时侧边栏 / 导航不重渲染；至少 2 个高频子组件使用 React.memo；Zustand 无 useStore() 全量订阅；Web 推送 100 条消息页面不卡顿。

步骤 03：Lighthouse 跑分与逐项调优

在生产构建（pnpm build \&\& pnpm start）上对四个核心页面（首页、工单列表、工单详情、Dashboard）运行 Lighthouse，记录 Performance、Accessibility、Best Practices、SEO 四项分数。针对未达标项逐项优化：FCP 慢则优化关键渲染路径，LCP 慢则优化最大内容元素，TBT 高则拆分长任务，CLS 高则为图片 / 动态内容预留尺寸；同步修复 Accessibility 问题（alt、aria-label、颜色对比度）。重复 "跑分→定位→优化→复跑" 循环直到达标。

验收要求： 四个核心页面均有 Lighthouse 报告；Performance 均 ≥ 96；Accessibility/Best Practices/SEO 均 ≥ 95；CLS ≤ 0.1；FCP ≤ 2s；至少一轮完整的迭代优化记录可追溯。

步骤 04：测试环境配置与工具函数测试

在 Monorepo 根目录配置 Vitest：environment: 'jsdom'、globals: true、setupFiles 引入 @testing-library/jest-dom、覆盖率 provider: 'v8' + 阈值（lines/branches/functions ≥ 75），添加 test/test:watch/test:coverage 脚本。对 packages/utils 中的纯函数编写单元测试：日期格式化（各种格式与边界日期）、防抖 / 节流（调用次数、延迟、取消）、状态机判断 canTransition(from, to)（合法 / 非法 / 边界）、主题 Token 转换（对象转 CSS 变量、默认值合并），每个函数覆盖正常、边界、异常场景。

验收要求： vitest.config.ts 配置完整，pnpm test 和 pnpm test:coverage 可正常运行；@testing-library/jest-dom 断言生效；packages/utils 所有导出纯函数均有 .test.ts；每个测试文件至少 3 个用例；状态机覆盖所有状态转换组合；测试全部通过。

步骤 05：Store、Hooks 与组件交互测试

对 3 个 Zustand store（uiStore、ticketStore、notificationStore）编写测试，验证 actions 执行后 state 正确更新、persist 中间件的 localStorage 读写（mock 验证）。使用 renderHook 对 4 个核心 Hooks 编写测试：useTheme（CSS 变量更新）、useWebSocket（连接状态与消息回调，mock WebSocket）、useVirtualList（初始化与滚动计算，mock ResizeObserver）、useTicketFilters（筛选更新与防抖搜索）。对 4 个基础组件（Button、Input、Modal、NotificationBell）编写交互测试，使用 getByRole/getByLabel 语义化选择器，覆盖点击、输入、键盘、disabled 等行为。

验收要求： 3 个 store 均有测试且覆盖核心 actions + persist；4 个 Hooks 均有测试，useWebSocket 和 useTheme 验证副作用；4 个组件均有交互测试且使用语义化选择器，无 CSS 类名选择器；每个组件至少覆盖 2 种交互；disabled 状态验证不可交互；测试全部通过。

步骤 06：覆盖率报告与针对性补齐

执行 pnpm test:coverage 生成全量覆盖率报告，打开 HTML 报告识别覆盖率低于 60% 的文件和未覆盖代码行。针对核心模块（utils、store、Hooks）补齐测试，确保核心模块覆盖率 ≥ 85%；纯展示组件可适当降低要求，但交互逻辑必须覆盖。再次运行确认整体语句 / 分支 / 函数覆盖率均 ≥ 75%，并验证测试无 flaky（连续运行 3 次均通过）、全量运行时间 ≤ 2 分钟。

验收要求： 提供覆盖率 HTML 报告；整体语句 / 分支 / 函数覆盖率均 ≥ 75%；核心模块（utils/store/Hooks）覆盖率 ≥ 85%；无完全未测试的核心文件；连续运行 3 次均通过（无 flaky）；全量测试运行时间 ≤ 2 分钟。

步骤 07：TypeScript 全量检查与 any 清零

确认 tsconfig.json 开启 strict: true 及所有严格子选项（noImplicitAny、strictNullChecks、noUncheckedIndexedAccess、noImplicitReturns、noFallthroughCasesInSwitch）。执行 pnpm tsc --noEmit 全量检查，按文件和错误类型收集问题清单。逐文件清零 any：函数参数替换为具体接口或泛型，变量替换为推断类型，第三方返回值用类型守卫收窄或 unknown 替代。为核心数据结构定义完整 interface（Ticket、TicketStatus、TicketPriority、ThemeTokens、WebSocketMessage、User），在 API 和 WebSocket 入口应用；对数组索引访问补充 undefined 检查或可选链。

验收要求： tsconfig.json 所有严格子选项均开启；全局搜索 : any/as any/<any> 无匹配；6 个核心数据 interface 均已定义且字段完整；API 响应和 WebSocket 消息有类型标注；noUncheckedIndexedAccess 下数组访问均有 undefined 处理；tsc --noEmit 无任何类型错误。

步骤 08：第三方类型补丁与 ESLint 加固

对缺少类型的第三方库，在 types/ 目录创建 \*.d.ts 声明文件，用 declare module 'xxx' 补充模块类型；对 window 上的自定义属性扩展 Window 接口，禁止用 any 兜底。在 ESLint 配置中开启并强制以下规则：@typescript-eslint/no-explicit-any（error）、no-unsafe-assignment（error）、no-unsafe-call（error）、no-unsafe-member-access（error）、consistent-type-imports（warn）。执行 pnpm lint 修复所有 error 和 warning，确保全量通过。

验收要求： 无类型第三方库均有 \*.d.ts 声明；window 自定义属性有类型扩展；ESLint 5 条类型相关规则均开启且级别正确；pnpm lint 全量通过，0 error 0 warning；无 any 兜底的第三方调用。

步骤 09：Lighthouse CI 与 GitHub Actions 配置

安装 @lhci/cli，创建 lighthouserc.js：collect 配置 numberOfRuns: 3、四个核心页面 URL、startServerCommand: 'pnpm start'、固定 throttling；assert 配置 Performance ≥ 0.96、其余三项 ≥ 0.95（低于阈值为 error），并添加资源预算（JS ≤ 150KB、图片 ≤ 500KB、总请求 ≤ 30，warn 级别）；upload 配置报告存储。在 .github/workflows/ci.yml 配置工作流：触发 pull\_request + push，步骤含 checkout、固定 Node.js 版本、pnpm 缓存、pnpm install、pnpm lint、pnpm test、pnpm build、pnpm lhci autorun。本地运行验证配置，确认 Lighthouse CI 作为 PR Check 生效、不达标则阻断合并。

验收要求： lighthouserc.js 配置完整（3 次运行、四页面、阈值、资源预算）；本地 lhci autorun 全部通过且生成报告；ci.yml 步骤完整（lint/test/build/lhci 均有）且 Node 版本固定、pnpm 有缓存；资源预算 3 项均配置；Lighthouse CI 作为 PR Check 可见且不达标时 CI 失败；package.json 有 lhci 脚本。

步骤 10：Vercel 部署、文档编写与最终交付

在 Vercel 导入仓库，配置 Framework Preset 为 Next.js、Root Directory（如 apps/web）、Build Command、Node.js 版本；配置 Production/Preview/Development 三套环境变量（NEXT\_PUBLIC\_API\_URL 等），敏感变量标记为敏感。触发首次部署，验证 HTTPS 强制跳转、四个核心页面功能完整、API/WebSocket 连接正常、Preview 环境可访问。编写 README.md（含项目简介、技术栈、快速开始、目录结构、核心功能、脚本说明、部署指南、性能指标、测试覆盖率共 9 个章节）；在 docs/ 整理架构图（Mermaid）、至少 3 份 ADR 文档、状态边界文档。提炼 200-300 字简历亮点（含 ≥3 个量化指标和 5 大技术挑战关键词）。执行最终自查清单（build/lint/test/tsc/lhci/ 线上可访问 / 文档齐全），全部通过后正式交付。

验收要求： Vercel 生产环境可访问，四页面功能完整，HTTPS 强制跳转；三套环境变量配置正确，无硬编码地址，敏感变量不暴露到客户端；Preview 环境可访问；README.md 含 9 个章节且内容完整；docs/ 有架构图、≥3 份 ADR、状态边界文档；简历亮点含 ≥3 个量化指标（Lighthouse 96+、75%+ 覆盖率、TS 0 Any 等）和 5 大技术挑战；最终自查 7 项全部通过。

六、常见陷阱

6.1 性能优化陷阱

只看 Bundle 体积忽略运行时性能：把 JS 体积砍到很小，但主线程长任务（TBT）依然很高，Lighthouse Performance 分数上不去。对策：Bundle 体积和运行时性能并重，用 Lighthouse 的 TBT 指标和 React DevTools Profiler 定位长任务，拆分重型计算到 Web Worker 或用 requestIdleCallback 延迟执行。

动态导入过度导致首屏空白：把首屏关键组件也用 dynamic() 懒加载，导致首屏渲染延迟，FCP/LCP 变差。对策：只对非首屏关键内容（Modal、图表、富文本编辑器、下方折叠区域）做动态导入，首屏关键组件保持同步导入；动态导入时配置 loading 骨架屏，避免空白。

next/image 配置不当导致图片不显示：fill 属性需要父容器有 position: relative 和明确尺寸，否则图片高度为 0 不显示；远程图片域名未在 next.config.ts 中配置会报错。对策：使用 fill 时确保父容器 relative 且有 width/height 或 aspect-ratio；在 images.remotePatterns 中配置所有远程图片域名；开发时先用固定 width/height 验证，再改为响应式。

Lighthouse 分数波动大：本地跑 96 分，CI 里跑 88 分，因 CI 机器性能和网络不稳定。对策：Lighthouse CI 配置 numberOfRuns: 3 取中位数；固定 throttling 设置（settings.throttling），不使用默认的模拟波动；CI 中使用性能更好的 runner 或增加 CPU 配额；关注相对变化而非绝对值。

React.memo 滥用反而降低性能：给所有组件都包 memo，但 props 中有对象 / 函数（每次渲染新引用），memo 的浅比较永远返回 false，白白增加比较开销。对策：只给高频重渲染且 props 稳定的列表项子组件用 memo；配合 useMemo/useCallback 稳定 props 引用；用 Profiler 验证 memo 确实减少了渲染，否则移除。

字体预加载与 next/font 冲突：同时用 next/font 和手动 <link rel="preload"> 预加载字体，导致重复加载或控制台警告。对策：完全使用 next/font 管理字体，它会自动处理预加载、font-display: swap、子集化，不要再手动添加字体预加载链接。

6.2 单元测试陷阱

测试实现细节而非行为：测试组件时断言内部 state 值、调用内部方法，导致重构（如改变量名）时测试全挂，但功能正常。对策：遵循 Testing Library 理念 —— 测试用户可见的行为（渲染了什么文本、点击后发生了什么），不测试内部实现；用 getByRole/getByText 查询，不用 instance() 访问组件实例。

覆盖率数字虚高：为了凑 75% 覆盖率，写大量 "渲染不报错" 的空测试，或只测纯函数不测组件交互，覆盖率好看但无实际保障。对策：关注核心逻辑的覆盖率（utils、store、Hooks ≥ 85%），组件测试必须包含交互断言（点击、输入、状态变化）；用 coverageThreshold 分别设置不同目录的阈值，防止用简单文件拉高整体覆盖率。

异步测试未等待导致 flaky：测试 API 请求或定时器时，没有 await 异步操作，测试在请求完成前就结束，有时通过有时失败。对策：所有异步操作都 await；使用 findBy\*（自带等待）而非 getBy\* 查询异步渲染的元素；定时器用 vi.useFakeTimers() 模拟并 vi.advanceTimersByTime() 控制，不用真实 setTimeout。

Mock 不完整导致测试污染：Mock localStorage 时只 mock 了 getItem 没 mock setItem，或测试间未清除 mock，导致前一个测试的数据影响后一个。对策：在 beforeEach 中重置所有 mock（vi.clearAllMocks()）和全局状态；Mock 完整实现所需的所有方法；测试间不共享可变状态。

Hooks 测试依赖真实 DOM 环境：useVirtualList 依赖 ResizeObserver 和元素测量，jsdom 环境中没有真实布局，测试报错。对策：在 setupFiles 中 Mock ResizeObserver（提供 observe/unobserve/disconnect 空实现）；需要测量的 Hooks 测试只测试逻辑部分（回调触发、状态更新），布局测量用 E2E 测试覆盖；或使用 @testing-library/react 的 renderHook + 手动触发回调。

Monorepo 中测试配置不统一：每个 Package 各自配置 Vitest，覆盖率不聚合，根目录跑 pnpm test 只跑了根目录的测试。对策：在根目录统一 Vitest 配置，workspace 模式下聚合所有 Package 的测试；或用 Turborepo 的 pnpm test 递归运行所有 Package 的测试并聚合结果；覆盖率报告在根目录生成，包含所有 Package。

6.3 TypeScript 严格模式陷阱

any 改 unknown 后不做类型守卫：把 any 换成 unknown 以为安全了，但直接使用 unknown 类型的变量（如 data.name），编译报错或运行时崩溃。对策：unknown 必须配合类型守卫（typeof、instanceof、自定义 is 谓词）或类型断言（as）收窄后才能使用；在数据入口处用 Zod 等库做运行时校验，同时获得类型安全。

noUncheckedIndexedAccess 引发大量 undefined 检查：开启后 arr\[0] 返回 T | undefined，代码中到处需要加 if (item) 检查，繁琐且可能遗漏。对策：在确实确定索引存在的场景用非空断言 arr\[0]!（但要谨慎，确保逻辑上一定存在）；遍历数组用 map/forEach 而非索引访问；对可能越界的访问加合理的默认值 arr\[0] ?? defaultValue。

第三方库类型与实际不符：某些库的类型定义过时或错误，按类型写代码运行时报错。对策：不要用 as any 绕过，而是通过模块扩展（declare module 'xxx'）修正类型，或在项目中封装一层适配函数，在适配函数内处理类型差异；给库的 GitHub 提 PR 修复类型（长期方案）。

strictNullChecks 下的 ref 初始值问题：useRef<HTMLDivElement>(null) 后访问 ref.current.style 报错（可能为 null）。对策：在使用前加 if (ref.current) 守卫，或用可选链 ref.current?.style；回调 ref 模式可避免 null 问题；不要用非空断言 ref.current! 偷懒，除非确定组件已挂载。

类型导出循环依赖：A 文件导出类型给 B 文件，B 文件又导出类型给 A 文件，虽然类型在编译后会擦除，但 IDE 和 tsc 可能报循环依赖警告。对策：将共享类型抽到独立的 types.ts 文件，A 和 B 都从 types.ts 导入，避免互相导入；类型导入用 import type 明确标注，减少运行时依赖。

6.4 Lighthouse CI 陷阱

CI 中服务器未启动就跑 Lighthouse：lhci autorun 配置了 startServerCommand，但服务器启动慢，Lighthouse 开始访问时服务器还没 Ready，导致全部页面报错。对策：配置 startServerReadyPattern（如 Ready on http://localhost:3000）匹配服务器就绪日志；或在 CI 脚本中先 pnpm start \& 然后用 wait-on 等待端口可访问再跑 Lighthouse；增加 healthCheck 配置。

Preview 环境与 Production 环境变量混用：Lighthouse CI 在 PR 的 Preview 环境上跑，但 Preview 环境的 API 地址指向测试环境，数据不稳定导致 Lighthouse 分数波动或页面报错。对策：Lighthouse CI 统一在生产构建（pnpm build \&\& pnpm start）上跑，使用固定的 Mock 数据或稳定的测试 API；不要在动态 Preview 环境上跑性能基准测试。

阈值设置过高导致 CI 永远红：一开始就设 Performance ≥ 96，但项目还没优化完，所有 PR 都被阻断，无法合并。对策：分阶段设置阈值 —— 初期设 warn 级别（不阻断），优化达标后再改为 error；或先设较低阈值（如 90），逐步提升到 96；在 lighthouserc 中用 assertions 的 minScore 渐进式收紧。

Lighthouse 报告上传失败：配置了 target: 'temporary-public-storage'，但 CI 网络限制导致上传失败，CI 任务报错。对策：改用 target: 'filesystem' 将报告保存到 CI 制品（artifact），通过 CI 平台的制品功能下载查看；或配置 upload.url 到自己的存储；临时存储上传失败不应阻断 CI（可设为 warn）。

只测首页不测内页：Lighthouse CI 只配置了首页 URL，工单列表和 Dashboard 的性能问题发现不了。对策：配置所有核心页面 URL（至少 4 个），每个页面独立跑 Lighthouse；对需要登录的页面，配置 puppeteerScript 先登录再检测，或用已登录的 cookie/header。

6.5 Vercel 部署陷阱

Monorepo 部署配置错误：Vercel 默认从根目录构建，但 Next.js app 在 apps/web 子目录，构建找不到 next.config 导致失败。对策：在 Vercel 项目设置中配置 Root Directory 为 apps/web；或在根目录 package.json 中配置 scripts.build 指向子目录构建；确保 pnpm-workspace.yaml 和 Vercel 的安装命令兼容（Vercel 自动识别 pnpm）。

环境变量未加 NEXT\_PUBLIC\_ 前缀：在 Vercel 配置了 API\_URL 环境变量，但前端代码中 process.env.API\_URL 为 undefined，因为 Next.js 只将 NEXT\_PUBLIC\_ 前缀的变量暴露到客户端。对策：所有需要在客户端访问的环境变量加 NEXT\_PUBLIC\_ 前缀；仅在服务端使用的变量（如 API Secret）不加前缀，确保不暴露到客户端；部署后检查 .next/static 中的 JS 不包含敏感变量。

构建时环境变量与运行时不一致：Next.js 在构建时（next build）会内联环境变量到静态页面，如果构建时和运行时的变量不同，页面显示旧值。对策：对于会变化的变量（如 API 地址），在页面中使用运行时读取（runtime config 或客户端 process.env），或确保 Vercel 的构建环境和生产环境变量一致；触发重新部署时变量会重新内联。

i18n 路由与 Vercel 重写冲突：next-intl 的 \[locale] 动态路由在 Vercel 上访问 /tickets 时 404，因为没有匹配到 locale 段。对策：配置 next.config.ts 的 rewrites 或 redirects，将无 locale 的路径重定向到默认 locale（如 /tickets → /zh/tickets）；或在 middleware.ts 中检测并重定向；确保 next-intl 的 routing 配置与 Vercel 兼容。

Preview 部署消耗大量构建时间：每个 PR 都触发完整构建，Monorepo 大了之后构建时间长，Vercel 免费额度用完。对策：配置 Ignored Build Step，仅当 apps/web 或相关共享 Package 有变更时才构建；使用 Turborepo Remote Caching 加速 Vercel 构建；非关键 PR 可手动触发部署。

6.6 通用避坑建议

优化前先测量，不要凭感觉：性能优化最忌讳 "我觉得这个慢"。先用 Lighthouse、Bundle Analyzer、React Profiler 测出具体瓶颈，再针对性优化。优化后再次测量验证效果，避免做无用功甚至负优化。

测试和类型治理穿插进行，不要堆到最后：本阶段任务密集，如果先花 2 小时优化性能，再发现类型错误一堆、测试全挂，时间会不够。建议：先跑一次全量 tsc/lint/test 摸清底数，然后性能优化和测试 / 类型治理穿插进行，每完成一个模块就验证一次。

Lighthouse 96+ 是目标不是教条：如果某个页面（如 Dashboard 图表多）确实很难到 96，优先保证核心页面（列表、详情）达标，Dashboard 可设 90+ 并在文档中说明原因。不要为了凑分数砍掉真实功能或做虚假优化（如隐藏内容不渲染）。

部署后一定要做线上全量回归：本地全通过不代表线上没问题。部署到 Vercel 后，手动走一遍核心流程（列表→筛选→详情→状态流转→通知→Dashboard），验证 API 地址、WebSocket、环境变量、i18n、主题都在线上环境正常工作。

文档和简历亮点不要敷衍：这是项目交付的最后一环，也是别人（面试官）了解你项目的第一入口。README 要让人 5 分钟内知道项目是什么、怎么跑、技术亮点在哪；简历描述要量化、有细节，避免 "负责前端开发" 这种空话。

保留所有报告和截图：Lighthouse 报告、覆盖率报告、构建产物分析、线上部署截图，这些都是面试时可以展示的证据。整理到 docs/reports/ 目录或在线链接，简历中提到 "96 分" 时能拿得出报告。

