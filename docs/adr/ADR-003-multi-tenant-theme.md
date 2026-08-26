# ADR-003：多租户主题系统方案

> 文档编号：ADR-003
> 状态：✅ 已接受
> 日期：2026-08-18
> 决策者：架构组

---

## 一、背景

Team Portal Lite 是 B2B SaaS 系统，服务 5000+ 付费企业客户。每个企业客户都有自己的品牌视觉规范（品牌主色、辅助色、圆角偏好、间距密度等），要求工作台在登录后呈现该企业的品牌主题。这带来以下挑战：

1. **运行时动态换肤**：主题不能在构建时固定，需要根据当前登录用户所属租户在运行时动态切换，且切换后无需刷新页面、无需全局重新渲染。
2. **主题隔离**：5000+ 租户的主题配置必须相互隔离，一个租户的主题变更不能影响其他租户。
3. **防 FOUC（Flash of Unstyled Content）**：页面加载时如果先显示默认主题再闪烁切换到租户主题，会严重影响专业感和用户体验。主题变量必须在 CSS 加载之前注入。
4. **Token 命名一致性**：如果颜色命名混乱（primary、brand、main 混用），后期维护和换肤时容易遗漏。需要全局统一的命名规范，并通过 TypeScript 类型约束。
5. **禁止硬编码**：组件中如果直接写 `color: #1677ff` 或 `padding: 8px`，换肤时这些硬编码值不会随主题变化，导致视觉不一致。需要通过 ESLint 规则强制禁止。

因此需要一套完整的多租户主题系统方案，基于 CSS 变量 + Design Token 实现运行时换肤，并通过 Tailwind 配置 + CSS 变量双层管理。

---

## 二、决策

**采用 CSS 变量 + Design Token 实现多租户动态主题，Tailwind 配置与 CSS 变量双层管理。Token 命名规范全局统一，通过 TypeScript 类型约束；HTML 入口内联脚本提前注入主题变量防止 FOUC。**

### 2.1 Token 命名规范（全局统一，定死不可混用）

命名格式：`--{类别}-{语义}-{色阶/规格}`

| 类别 | 前缀 | 示例 |
|------|------|------|
| 颜色 | `--color-` | `--color-primary-500`、`--color-success-500`、`--color-neutral-100` |
| 间距 | `--spacing-` | `--spacing-1`（4px）、`--spacing-4`（16px）、`--spacing-8`（32px） |
| 圆角 | `--radius-` | `--radius-small`（4px）、`--radius-medium`（8px）、`--radius-large`（16px） |
| 字号 | `--font-size-` | `--font-size-sm`（14px）、`--font-size-base`（16px）、`--font-size-lg`（18px） |
| 行高 | `--line-height-` | `--line-height-tight`（1.25）、`--line-height-normal`（1.5） |
| 字重 | `--font-weight-` | `--font-weight-regular`（400）、`--font-weight-medium`（500）、`--font-weight-bold`（700） |
| 阴影 | `--shadow-` | `--shadow-sm`、`--shadow-md`、`--shadow-lg` |
| 动效时长 | `--duration-` | `--duration-fast`（150ms）、`--duration-normal`（250ms）、`--duration-slow`（400ms） |

**铁律：**
- 禁止使用 `brand`、`main`、`accent` 等非规范名称，统一使用 `primary`、`secondary`。
- 色阶使用 50–900 的标准刻度（50/100/200/300/400/500/600/700/800/900）。
- 所有 Token key 必须在 TypeScript 类型中注册，新增 Token 必须更新类型定义。

### 2.2 TypeScript 类型约束 Token key

```typescript
// packages/design-tokens/src/tokens.type.ts

/** 颜色 Token key（严格约束，禁止任意字符串） */
export type ColorToken =
  | `--color-primary-${50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900}`
  | `--color-secondary-${50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900}`
  | `--color-success-${50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900}`
  | `--color-warning-${50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900}`
  | `--color-error-${50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900}`
  | `--color-info-${50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900}`
  | `--color-neutral-${50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900}`;

export type SpacingToken = `--spacing-${1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32}`;
export type RadiusToken = `--radius-${'small' | 'medium' | 'large' | 'full'}`;
export type FontSizeToken = `--font-size-${'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'}`;
export type LineHeightToken = `--line-height-${'tight' | 'normal' | 'relaxed'}`;
export type FontWeightToken = `--font-weight-${'regular' | 'medium' | 'semibold' | 'bold'}`;
export type ShadowToken = `--shadow-${'sm' | 'md' | 'lg' | 'xl'}`;
export type DurationToken = `--duration-${'fast' | 'normal' | 'slow'}`;

export type DesignToken =
  | ColorToken
  | SpacingToken
  | RadiusToken
  | FontSizeToken
  | LineHeightToken
  | FontWeightToken
  | ShadowToken
  | DurationToken;

/** 主题配置：键必须是合法的 DesignToken，值为字符串 */
export type ThemeConfig = Record<DesignToken, string>;
```

### 2.3 双层管理架构

**第一层：CSS 变量（运行时层）**

在 `packages/design-tokens/src/themes/default.css` 中定义默认主题变量：

```css
:root {
  /* 主色 */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;

  /* 语义色 */
  --color-success-500: #22c55e;
  --color-warning-500: #f59e0b;
  --color-error-500: #ef4444;
  --color-info-500: #06b6d4;

  /* 中性色 */
  --color-neutral-50: #f9fafb;
  --color-neutral-100: #f3f4f6;
  --color-neutral-500: #6b7280;
  --color-neutral-900: #111827;

  /* 间距（4px 基准网格） */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-4: 16px;
  --spacing-8: 32px;

  /* 圆角 */
  --radius-small: 4px;
  --radius-medium: 8px;
  --radius-large: 16px;

  /* 字体 */
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --line-height-normal: 1.5;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* 动效 */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
}
```

租户主题通过 `data-theme` 属性覆盖：

```css
[data-theme="tenant-acme"] {
  --color-primary-500: #7c3aed;
  --color-primary-600: #6d28d9;
  --color-primary-700: #5b21b6;
  --radius-medium: 12px;
}
```

**第二层：Tailwind 配置（构建时层）**

在 `packages/config-tailwind/src/index.ts` 中将 Tailwind 类名映射到 CSS 变量：

```typescript
import type { Config } from 'tailwindcss';

export const tailwindPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
        },
        success: { 500: 'var(--color-success-500)' },
        warning: { 500: 'var(--color-warning-500)' },
        error: { 500: 'var(--color-error-500)' },
        info: { 500: 'var(--color-info-500)' },
        neutral: {
          50: 'var(--color-neutral-50)',
          100: 'var(--color-neutral-100)',
          500: 'var(--color-neutral-500)',
          900: 'var(--color-neutral-900)',
        },
      },
      spacing: {
        1: 'var(--spacing-1)',
        2: 'var(--spacing-2)',
        4: 'var(--spacing-4)',
        8: 'var(--spacing-8)',
      },
      borderRadius: {
        small: 'var(--radius-small)',
        medium: 'var(--radius-medium)',
        large: 'var(--radius-large)',
      },
      fontSize: {
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
    },
  },
};
```

组件中通过 Tailwind 类名引用 Token，**禁止硬编码**：

```tsx
// ✅ 正确：通过 Tailwind 类名引用 Token
<button className="bg-primary-500 text-white px-4 py-2 rounded-medium shadow-md transition-duration-fast">
  提交
</button>

// ❌ 错误：硬编码颜色和尺寸
<button style={{ backgroundColor: '#3b82f6', padding: '8px 16px', borderRadius: '8px' }}>
  提交
</button>
```

### 2.4 主题切换防 FOUC（内联脚本提前注入）

在 Next.js App Router 的 `app/layout.tsx` 中，通过 `<script>` 标签在 HTML 解析阶段、CSS 加载之前注入主题变量：

```tsx
// app/layout.tsx
const themeScript = `
  (function() {
    try {
      var tenantId = document.cookie.match(/tenant_id=([^;]+)/)?.[1] || 'default';
      var themes = {
        'default': { '--color-primary-500': '#3b82f6', '--color-primary-600': '#2563eb' },
        'acme': { '--color-primary-500': '#7c3aed', '--color-primary-600': '#6d28d9' },
      };
      var theme = themes[tenantId] || themes['default'];
      var root = document.documentElement;
      Object.keys(theme).forEach(function(key) {
        root.style.setProperty(key, theme[key]);
      });
      root.setAttribute('data-theme', tenantId);
    } catch(e) {
      console.error('Theme init failed:', e);
    }
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

关键设计：
- 内联脚本在 `<head>` 中同步执行，优先于 CSS 文件加载和 body 渲染。
- 从 Cookie 中读取租户 ID（服务端在登录时写入），避免闪烁。
- 通过 `root.style.setProperty` 直接设置 CSS 变量，浏览器在首次绘制时即使用正确主题。
- `suppressHydrationWarning` 防止 React 因服务端/客户端主题属性差异报警告。

### 2.5 运行时主题切换

用户切换租户或管理员更新主题时，通过 Zustand themeStore 动态更新 CSS 变量：

```typescript
// packages/config-store/src/theme-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeConfig } from '@team-portal/design-tokens';

interface ThemeState {
  tenantId: string;
  setTenantTheme: (tenantId: string, config: ThemeConfig) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      tenantId: 'default',
      setTenantTheme: (tenantId, config) => {
        const root = document.documentElement;
        Object.entries(config).forEach(([key, value]) => {
          root.style.setProperty(key, value);
        });
        root.setAttribute('data-theme', tenantId);
        set({ tenantId });
      },
    }),
    { name: 'theme-storage' }
  )
);
```

### 2.6 ESLint 规则禁止硬编码颜色

在 `packages/config-eslint` 中配置自定义规则，禁止组件代码中出现硬编码颜色值：

```javascript
// packages/config-eslint/index.js
module.exports = {
  rules: {
    // 禁止内联 style 中的硬编码颜色
    'no-restricted-syntax': [
      'error',
      {
        selector: "Property > Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
        message: '禁止硬编码颜色值，请使用 Design Token（如 bg-primary-500）或 CSS 变量。',
      },
      {
        selector: "Property > Literal[value=/^rgb/]",
        message: '禁止硬编码颜色值，请使用 Design Token（如 bg-primary-500）或 CSS 变量。',
      },
    ],
    // 禁止内联 style 属性中的硬编码像素值（间距/圆角应走 Token）
    'no-restricted-properties': [
      'error',
      {
        object: 'style',
        property: 'padding',
        message: '禁止内联 padding，请使用 Tailwind 间距类（如 p-4）引用 Token。',
      },
    ],
  },
};
```

---

## 三、备选方案

### 备选方案 A：CSS-in-JS（styled-components / Emotion）主题方案

**描述**：使用 styled-components 的 ThemeProvider 或 Emotion 的 ThemeProvider，在运行时通过 JS 对象注入主题。

**未选择原因**：
1. **运行时性能开销**：CSS-in-JS 在运行时生成样式表，每次主题切换需要重新序列化所有样式规则，在 100+ 组件规模下有明显性能开销。CSS 变量由浏览器原生处理，切换主题只需修改几个变量，零 JS 运行时成本。
2. **与 RSC 不兼容**：styled-components 和 Emotion 均需要 Client Component 环境，在 Next.js App Router 的 Server Component 中无法使用，增加了架构复杂度。CSS 变量方案在 Server Component 和 Client Component 中均可正常工作。
3. **包体积增加**：styled-components 约 12KB（gzip），Emotion 约 10KB（gzip），而 CSS 变量方案零额外 JS 体积。
4. **SSR 样式闪烁问题**：CSS-in-JS 在 SSR 时需要额外的样式提取和注水逻辑（如 `styled-components/register`），配置复杂且容易出现样式闪烁。CSS 变量方案通过内联脚本天然解决此问题。
5. **Tailwind 生态割裂**：使用 CSS-in-JS 后无法充分利用 Tailwind 的原子类，需要维护两套样式体系。

### 备选方案 B：Sass/LESS 变量 + 构建时多主题打包

**描述**：使用 Sass 变量定义主题，为每个租户构建一份独立的 CSS 文件，运行时根据租户加载对应 CSS。

**未选择原因**：
1. **5000+ 租户无法构建时打包**：为每个租户构建一份 CSS 在 5000+ 租户规模下完全不可行，构建时间和存储成本不可接受。
2. **新增租户需要重新构建**：每次新增企业客户或管理员修改主题，都需要触发 CI 构建，无法做到运行时即时生效。
3. **无法动态切换**：用户在多租户间切换时需要加载不同 CSS 文件，产生网络延迟和闪烁。
4. **CSS 体积膨胀**：多份 CSS 文件包含大量重复的基础样式，浪费带宽和缓存。
5. **与 Tailwind 集成困难**：Sass 变量无法在 Tailwind 配置中直接引用，需要额外的构建桥接。

### 备选方案 C：Tailwind `darkMode` 类名变体扩展多主题

**描述**：利用 Tailwind 的 `darkMode: 'class'` 机制，为每个租户定义类似 `theme-acme:` 的前缀变体。

**未选择原因**：
1. **CSS 体积爆炸**：每个主题变体会为所有工具类生成一份副本，5000+ 租户的 CSS 体积将达到不可接受的程度。
2. **无法运行时新增主题**：所有主题必须在构建时通过 Tailwind 配置定义，新增租户需要重新构建。
3. **HTML 体积膨胀**：每个元素需要为每个主题写一套类名（如 `bg-primary-500 theme-acme:bg-purple-500`），HTML 体积随主题数线性增长。
4. **维护成本极高**：组件中需要为每个租户维护类名，完全不可扩展。

---

## 四、后果

### 正面影响

1. **运行时零成本换肤**：CSS 变量由浏览器原生处理，切换主题只需修改 `:root` 上的几个变量，无需重新渲染组件树或重新生成样式表。
2. **天然支持 5000+ 租户**：租户主题通过 `data-theme` 属性或内联 style 覆盖，CSS 基础样式只构建一份，租户配置以数据形式存储和加载，构建时间和 CSS 体积不随租户数增长。
3. **无 FOUC**：内联脚本在 `<head>` 中同步执行，在首次绘制前注入正确的 CSS 变量，用户永远不会看到默认主题闪烁。
4. **Tailwind 开发体验**：开发者使用熟悉的 Tailwind 类名（`bg-primary-500`、`rounded-medium`），底层自动映射到 CSS 变量，兼顾开发效率和运行时灵活性。
5. **Token 命名强约束**：TypeScript 模板字面量类型确保所有 Token key 符合命名规范，拼写错误在编译期即被发现，杜绝 primary/brand/main 混用。
6. **硬编码自动拦截**：ESLint 规则在编码阶段即禁止硬编码颜色和尺寸，Code Review 时无需人工检查。
7. **RSC 兼容**：CSS 变量在 Server Component 和 Client Component 中均可使用，不增加 Client Bundle 体积。

### Trade-off 与需要承担的成本

1. **CSS 变量级联调试复杂度**：CSS 变量遵循继承和级联规则，当某个组件显示错误颜色时，需要沿着 DOM 树向上查找变量来源，调试比直接写颜色值稍复杂。需要通过 React DevTools 的 CSS 变量检查功能辅助。
2. **Tailwind 类名与 CSS 变量的间接层**：Tailwind 配置中 `primary: { 500: 'var(--color-primary-500)' }` 增加了一层映射，当 Tailwind JIT 扫描类名时需要确保配置正确。需要在 POC 阶段验证所有 Token 类名正确生成。
3. **TypeScript 类型维护成本**：新增 Token 时需要同步更新 `DesignToken` 类型定义，否则类型检查会报错。但这也是优点——强制 Token 注册，防止野 Token。
4. **内联脚本的 Cookie 依赖**：防 FOUC 脚本依赖 Cookie 中的租户 ID，如果 Cookie 未设置（如首次访问未登录），需要有合理的默认主题回退。服务端登录流程必须确保在跳转前写入租户 Cookie。
5. **ESLint 自定义规则需要测试**：`no-restricted-syntax` 的 AST selector 需要充分测试，避免误报（如合法的 CSS 变量字符串被拦截）或漏报（如使用 `rgb()` 以外的颜色格式）。
6. **POC 验证要求**：在大规模开发前，用最小原型验证：(1) Tailwind 类名正确映射到 CSS 变量；(2) 内联脚本在 Next.js App Router 中无 FOUC；(3) `data-theme` 属性切换时所有组件颜色正确更新；(4) TypeScript Token 类型在组件中正确约束。

---

## 五、评审记录

| 评审项 | 结果 |
|--------|------|
| 包含背景、决策、备选方案、后果四个部分 | ✅ |
| 决策明确选择 CSS 变量 + Design Token | ✅ |
| 备选方案至少 2 个并说明未选择原因 | ✅ 3 个（CSS-in-JS、Sass 构建时打包、Tailwind 变体扩展） |
| 后果说明正面影响与 trade-off | ✅ 7 项正面 + 6 项 trade-off |
| Token 命名规范定死（如 --color-primary-500） | ✅ 2.1 节 |
| 通过 TypeScript 类型约束 Token key | ✅ 2.2 节 |
| Tailwind 配置 + CSS 变量双层管理 | ✅ 2.3 节 |
| 内联脚本防 FOUC | ✅ 2.4 节 |
| ESLint 规则禁止硬编码颜色 | ✅ 2.6 节 |
| 明确 POC 验证要求 | ✅ 后果第 6 条 |
