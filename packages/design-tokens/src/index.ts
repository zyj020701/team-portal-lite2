// ─── Design Token Types ──────────────────────────────────────

export type ColorScale = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export interface ColorScaleTokens {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface SemanticColors {
  success: ColorScaleTokens;
  warning: ColorScaleTokens;
  error: ColorScaleTokens;
  info: ColorScaleTokens;
}

export interface ThemeColors {
  primary: ColorScaleTokens;
  secondary: ColorScaleTokens;
  neutral: ColorScaleTokens;
  semantic: SemanticColors;
  white: string;
  black: string;
  overlay: string;
}

export interface ThemeRadius {
  small: string;
  medium: string;
  large: string;
  full: string;
}

export interface ThemeSpacing {
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
}

export interface ThemeTypography {
  fontSize: { xs: string; sm: string; base: string; lg: string; xl: string; '2xl': string };
  lineHeight: { tight: string; normal: string; relaxed: string };
  fontWeight: { normal: string; medium: string; semibold: string; bold: string };
}

export interface ThemeShadow {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeMotion {
  duration: { fast: string; normal: string; slow: string };
}

export interface ThemeTokens {
  colors: ThemeColors;
  radius: ThemeRadius;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  shadow: ThemeShadow;
  motion: ThemeMotion;
}

export interface ThemeMeta {
  displayName: string;
  description: string;
}

export interface ThemeConfig {
  meta: ThemeMeta;
  tokens: ThemeTokens;
}

// ─── Default Theme (Company A — Blue + White) ────────────────

const defaultTokens: ThemeTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    semantic: {
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
      },
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
      },
      error: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
      },
      info: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
    },
    white: '#ffffff',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  radius: { small: '4px', medium: '8px', large: '12px', full: '9999px' },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
    32: '128px',
  },
  typography: {
    fontSize: { xs: '12px', sm: '14px', base: '16px', lg: '18px', xl: '20px', '2xl': '24px' },
    lineHeight: { tight: '1.25', normal: '1.5', relaxed: '1.75' },
    fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' },
  },
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  motion: { duration: { fast: '150ms', normal: '250ms', slow: '400ms' } },
};

const companyATheme: ThemeConfig = {
  meta: { displayName: 'A 公司（蓝白）', description: '默认蓝色主题，适合科技/互联网企业' },
  tokens: defaultTokens,
};

// ─── Company B Theme (Red + Gold) ────────────────────────────

const companyBTokens: ThemeTokens = {
  ...defaultTokens,
  colors: {
    ...defaultTokens.colors,
    primary: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#dc2626',
      600: '#b91c1c',
      700: '#991b1b',
      800: '#7f1d1d',
      900: '#450a0a',
    },
    secondary: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#d97706',
      600: '#b45309',
      700: '#92400e',
      800: '#78350f',
      900: '#451a03',
    },
  },
  radius: { small: '2px', medium: '4px', large: '8px', full: '9999px' },
  shadow: {
    sm: '0 1px 2px rgba(120, 53, 15, 0.08)',
    md: '0 4px 6px -1px rgba(120, 53, 15, 0.12)',
    lg: '0 10px 15px -3px rgba(120, 53, 15, 0.12)',
    xl: '0 20px 25px -5px rgba(120, 53, 15, 0.12)',
  },
};

const companyBConfig: ThemeConfig = {
  meta: { displayName: 'B 公司（红金）', description: '红金主题，适合金融/传统企业' },
  tokens: companyBTokens,
};

// ─── Company C Theme (Emerald + Teal) ────────────────────────

const companyCTokens: ThemeTokens = {
  ...defaultTokens,
  colors: {
    ...defaultTokens.colors,
    primary: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    secondary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },
  },
  radius: { small: '6px', medium: '10px', large: '16px', full: '9999px' },
  shadow: {
    sm: '0 1px 2px rgba(6, 95, 70, 0.08)',
    md: '0 4px 6px -1px rgba(6, 95, 70, 0.12)',
    lg: '0 10px 15px -3px rgba(6, 95, 70, 0.12)',
    xl: '0 20px 25px -5px rgba(6, 95, 70, 0.12)',
  },
};

const companyCConfig: ThemeConfig = {
  meta: { displayName: 'C 公司（翠绿）', description: '翠绿主题，适合医疗/环保/新兴行业' },
  tokens: companyCTokens,
};

// ─── Company D Theme (Violet + Fuchsia) ──────────────────────

const companyDTokens: ThemeTokens = {
  ...defaultTokens,
  colors: {
    ...defaultTokens.colors,
    primary: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    secondary: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef',
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
    },
  },
  radius: { small: '8px', medium: '12px', large: '20px', full: '9999px' },
  shadow: {
    sm: '0 1px 2px rgba(76, 29, 149, 0.08)',
    md: '0 4px 6px -1px rgba(76, 29, 149, 0.12)',
    lg: '0 10px 15px -3px rgba(76, 29, 149, 0.12)',
    xl: '0 20px 25px -5px rgba(76, 29, 149, 0.12)',
  },
};

const companyDConfig: ThemeConfig = {
  meta: { displayName: 'D 公司（紫罗兰）', description: '紫罗兰主题，适合创意/娱乐/时尚行业' },
  tokens: companyDTokens,
};

// ─── Company E Theme (Orange + Steel) ────────────────────────

const companyETokens: ThemeTokens = {
  ...defaultTokens,
  colors: {
    ...defaultTokens.colors,
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  radius: { small: '2px', medium: '4px', large: '6px', full: '9999px' },
  shadow: {
    sm: '0 1px 2px rgba(124, 45, 18, 0.08)',
    md: '0 4px 6px -1px rgba(124, 45, 18, 0.12)',
    lg: '0 10px 15px -3px rgba(124, 45, 18, 0.12)',
    xl: '0 20px 25px -5px rgba(124, 45, 18, 0.12)',
  },
};

const companyEConfig: ThemeConfig = {
  meta: { displayName: 'E 公司（橙钢）', description: '橙色工业主题，适合制造/能源/重工业' },
  tokens: companyETokens,
};

// ─── Theme Registry ──────────────────────────────────────────
// Build registry from local constants first, then expose named exports.
// This avoids a CJS circular-reference issue where `exports.defaultTheme`
// is still `undefined` at the time the object literal is evaluated when
// consumed via Next.js server bundling.

const themeRegistryInternal: Record<string, ThemeConfig> = {
  'company-a': companyATheme,
  'company-b': companyBConfig,
  'company-c': companyCConfig,
  'company-d': companyDConfig,
  'company-e': companyEConfig,
};

export const themeRegistry: Record<string, ThemeConfig> = themeRegistryInternal;
export const defaultTheme: ThemeConfig = companyATheme;
export const companyBTheme: ThemeConfig = companyBConfig;
export const companyCTheme: ThemeConfig = companyCConfig;
export const companyDTheme: ThemeConfig = companyDConfig;
export const companyETheme: ThemeConfig = companyEConfig;

export type TenantId = keyof typeof themeRegistry;

// ─── Token → CSS Variable Conversion ─────────────────────────

const COLOR_SCALES: ColorScale[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const SPACING_KEYS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32] as const;

function colorScaleToCSSVars(prefix: string, scale: ColorScaleTokens): string {
  return COLOR_SCALES.map((step) => `  --color-${prefix}-${step}:${scale[step]};`).join('\n');
}

export function tokensToCSS(theme: ThemeConfig = defaultTheme): string {
  const t = theme.tokens;
  const lines: string[] = [':root {'];
  lines.push(colorScaleToCSSVars('primary', t.colors.primary));
  lines.push(colorScaleToCSSVars('secondary', t.colors.secondary));
  lines.push(colorScaleToCSSVars('neutral', t.colors.neutral));
  lines.push(colorScaleToCSSVars('success', t.colors.semantic.success));
  lines.push(colorScaleToCSSVars('warning', t.colors.semantic.warning));
  lines.push(colorScaleToCSSVars('error', t.colors.semantic.error));
  lines.push(colorScaleToCSSVars('info', t.colors.semantic.info));
  lines.push(`  --color-white:${t.colors.white};`);
  lines.push(`  --color-black:${t.colors.black};`);
  lines.push(`  --color-overlay:${t.colors.overlay};`);
  lines.push(`  --radius-small:${t.radius.small};`);
  lines.push(`  --radius-medium:${t.radius.medium};`);
  lines.push(`  --radius-large:${t.radius.large};`);
  lines.push(`  --radius-full:${t.radius.full};`);
  for (const k of SPACING_KEYS) {
    lines.push(`  --spacing-${k}:${t.spacing[k]};`);
  }
  lines.push(`  --font-size-xs:${t.typography.fontSize.xs};`);
  lines.push(`  --font-size-sm:${t.typography.fontSize.sm};`);
  lines.push(`  --font-size-base:${t.typography.fontSize.base};`);
  lines.push(`  --font-size-lg:${t.typography.fontSize.lg};`);
  lines.push(`  --font-size-xl:${t.typography.fontSize.xl};`);
  lines.push(`  --font-size-2xl:${t.typography.fontSize['2xl']};`);
  lines.push(`  --line-height-tight:${t.typography.lineHeight.tight};`);
  lines.push(`  --line-height-normal:${t.typography.lineHeight.normal};`);
  lines.push(`  --line-height-relaxed:${t.typography.lineHeight.relaxed};`);
  lines.push(`  --font-weight-normal:${t.typography.fontWeight.normal};`);
  lines.push(`  --font-weight-medium:${t.typography.fontWeight.medium};`);
  lines.push(`  --font-weight-semibold:${t.typography.fontWeight.semibold};`);
  lines.push(`  --font-weight-bold:${t.typography.fontWeight.bold};`);
  lines.push(`  --shadow-sm:${t.shadow.sm};`);
  lines.push(`  --shadow-md:${t.shadow.md};`);
  lines.push(`  --shadow-lg:${t.shadow.lg};`);
  lines.push(`  --shadow-xl:${t.shadow.xl};`);
  lines.push(`  --duration-fast:${t.motion.duration.fast};`);
  lines.push(`  --duration-normal:${t.motion.duration.normal};`);
  lines.push(`  --duration-slow:${t.motion.duration.slow};`);
  lines.push('}');
  return lines.join('\n');
}

export function tokensToInlineScript(theme: ThemeConfig = defaultTheme): string {
  const t = theme.tokens;
  const assignments: string[] = [];
  const add = (key: string, value: string): void => {
    assignments.push(`s.setProperty('${key}','${value}')`);
  };
  for (const step of COLOR_SCALES) {
    add(`--color-primary-${step}`, t.colors.primary[step]);
    add(`--color-secondary-${step}`, t.colors.secondary[step]);
    add(`--color-neutral-${step}`, t.colors.neutral[step]);
    add(`--color-success-${step}`, t.colors.semantic.success[step]);
    add(`--color-warning-${step}`, t.colors.semantic.warning[step]);
    add(`--color-error-${step}`, t.colors.semantic.error[step]);
    add(`--color-info-${step}`, t.colors.semantic.info[step]);
  }
  add('--color-white', t.colors.white);
  add('--color-black', t.colors.black);
  add('--color-overlay', t.colors.overlay);
  add('--radius-small', t.radius.small);
  add('--radius-medium', t.radius.medium);
  add('--radius-large', t.radius.large);
  add('--radius-full', t.radius.full);
  for (const k of SPACING_KEYS) {
    add(`--spacing-${k}`, t.spacing[k]);
  }
  add('--font-size-xs', t.typography.fontSize.xs);
  add('--font-size-sm', t.typography.fontSize.sm);
  add('--font-size-base', t.typography.fontSize.base);
  add('--font-size-lg', t.typography.fontSize.lg);
  add('--font-size-xl', t.typography.fontSize.xl);
  add('--font-size-2xl', t.typography.fontSize['2xl']);
  add('--line-height-tight', t.typography.lineHeight.tight);
  add('--line-height-normal', t.typography.lineHeight.normal);
  add('--line-height-relaxed', t.typography.lineHeight.relaxed);
  add('--font-weight-normal', t.typography.fontWeight.normal);
  add('--font-weight-medium', t.typography.fontWeight.medium);
  add('--font-weight-semibold', t.typography.fontWeight.semibold);
  add('--font-weight-bold', t.typography.fontWeight.bold);
  add('--shadow-sm', t.shadow.sm);
  add('--shadow-md', t.shadow.md);
  add('--shadow-lg', t.shadow.lg);
  add('--shadow-xl', t.shadow.xl);
  add('--duration-fast', t.motion.duration.fast);
  add('--duration-normal', t.motion.duration.normal);
  add('--duration-slow', t.motion.duration.slow);
  return `(function(){var s=document.documentElement.style;${assignments.join(';')}})();`;
}

export function applyTheme(
  theme: ThemeConfig,
  target: CSSStyleDeclaration = typeof document !== 'undefined'
    ? document.documentElement.style
    : ({} as CSSStyleDeclaration),
): number {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const t = theme.tokens;
  for (const step of COLOR_SCALES) {
    target.setProperty(`--color-primary-${step}`, t.colors.primary[step]);
    target.setProperty(`--color-secondary-${step}`, t.colors.secondary[step]);
    target.setProperty(`--color-neutral-${step}`, t.colors.neutral[step]);
    target.setProperty(`--color-success-${step}`, t.colors.semantic.success[step]);
    target.setProperty(`--color-warning-${step}`, t.colors.semantic.warning[step]);
    target.setProperty(`--color-error-${step}`, t.colors.semantic.error[step]);
    target.setProperty(`--color-info-${step}`, t.colors.semantic.info[step]);
  }
  target.setProperty('--color-white', t.colors.white);
  target.setProperty('--color-black', t.colors.black);
  target.setProperty('--color-overlay', t.colors.overlay);
  target.setProperty('--radius-small', t.radius.small);
  target.setProperty('--radius-medium', t.radius.medium);
  target.setProperty('--radius-large', t.radius.large);
  target.setProperty('--radius-full', t.radius.full);
  for (const k of SPACING_KEYS) {
    target.setProperty(`--spacing-${k}`, t.spacing[k]);
  }
  target.setProperty('--font-size-xs', t.typography.fontSize.xs);
  target.setProperty('--font-size-sm', t.typography.fontSize.sm);
  target.setProperty('--font-size-base', t.typography.fontSize.base);
  target.setProperty('--font-size-lg', t.typography.fontSize.lg);
  target.setProperty('--font-size-xl', t.typography.fontSize.xl);
  target.setProperty('--font-size-2xl', t.typography.fontSize['2xl']);
  target.setProperty('--line-height-tight', t.typography.lineHeight.tight);
  target.setProperty('--line-height-normal', t.typography.lineHeight.normal);
  target.setProperty('--line-height-relaxed', t.typography.lineHeight.relaxed);
  target.setProperty('--font-weight-normal', t.typography.fontWeight.normal);
  target.setProperty('--font-weight-medium', t.typography.fontWeight.medium);
  target.setProperty('--font-weight-semibold', t.typography.fontWeight.semibold);
  target.setProperty('--font-weight-bold', t.typography.fontWeight.bold);
  target.setProperty('--shadow-sm', t.shadow.sm);
  target.setProperty('--shadow-md', t.shadow.md);
  target.setProperty('--shadow-lg', t.shadow.lg);
  target.setProperty('--shadow-xl', t.shadow.xl);
  target.setProperty('--duration-fast', t.motion.duration.fast);
  target.setProperty('--duration-normal', t.motion.duration.normal);
  target.setProperty('--duration-slow', t.motion.duration.slow);
  const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return end - start;
}
