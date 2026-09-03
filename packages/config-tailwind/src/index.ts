import type { Config } from 'tailwindcss';

type ColorResolver = (utils: { opacityValue?: string | undefined }) => string;

/**
 * Tailwind colour value backed by a CSS variable that also supports Tailwind's
 * `/opacity` modifier. As a plain string a `var(--x)` value cannot have its
 * alpha channel derived (parseColor() bails on var()), so Tailwind silently
 * skips both the utility and its `/N` variants. Wrapping it in a function lets
 * Tailwind pass the requested opacity: without a modifier we emit the raw
 * variable (identical output), and with one we emit a `color-mix` expression
 * (Tailwind 3.3+) that tints the variable while keeping runtime theming.
 *
 * Tailwind invokes function-valued theme colours at build time, but its
 * published `Config` types only model `string` colour leaves. We therefore
 * return the resolver cast through `unknown` (never `any`) so the colour map
 * still satisfies `RecursiveKeyValuePair<string, string>` while keeping the
 * runtime function that `parseColor()`/`toColorValue()` actually call.
 *
 * IMPORTANT: Tailwind passes the `/N` modifier as a unitless fraction (".15"),
 * but color-mix() needs a <percentage> ("15%") — a unitless number makes the
 * browser discard the declaration. The plain (no-modifier) utility is handed
 * `var(--tw-bg-opacity,1)`, whose `1` fallback is likewise illegal, so that
 * path emits the raw `var()` directly (valid everywhere, full opacity).
 */
function cssColor(variable: string): string {
  const resolver: ColorResolver = ({ opacityValue }) => {
    // No `/N` modifier, or a var-backed alpha we cannot format as a
    // percentage: Tailwind calls the resolver with `var(--tw-bg-opacity,1)`
    // for the plain (solid) utility. Emit the raw CSS variable — it resolves
    // in every browser and is exactly what a full-opacity colour needs.
    if (opacityValue === undefined || opacityValue.includes('var(')) {
      return `var(${variable})`;
    }
    // Tailwind passes the `/N` opacity modifier as a unitless 0–1 fraction
    // (".15", "0.05", "1"). color-mix() requires a <percentage> there: a
    // unitless number is a parse error, so the browser drops the whole
    // declaration (transparent background / inherited text colour). Convert
    // the fraction to a percentage.
    const alpha = Number.parseFloat(opacityValue);
    if (!Number.isFinite(alpha)) {
      return `var(${variable})`;
    }
    return `color-mix(in srgb, var(${variable}) ${alpha * 100}%, transparent)`;
  };
  return resolver as unknown as string;
}

const COLOR_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

/**
 * Build a full 50–900 colour scale backed by `--color-{name}-{shade}` CSS
 * variables, optionally exposing a bare DEFAULT (the brand shade) so utilities
 * like `bg-primary` / `text-error` resolve.
 */
function cssColorScale(
  name: string,
  options: { defaultShade?: (typeof COLOR_SHADES)[number] | undefined } = {},
): Record<string, string> {
  const scale: Record<string, string> = {};
  for (const shade of COLOR_SHADES) {
    scale[shade] = cssColor(`--color-${name}-${shade}`);
  }
  if (options.defaultShade !== undefined) {
    scale.DEFAULT = cssColor(`--color-${name}-${options.defaultShade}`);
  }
  return scale;
}

/**
 * Shared Tailwind preset for all Team Portal apps.
 *
 * Every design token is backed by a CSS variable so that multi-tenant
 * themes can be swapped at runtime without rebuilding Tailwind.
 *
 * Colour scales reference `var(--color-*)`, spacing references
 * `var(--spacing-*)`, etc. — no hardcoded hex / px values live here.
 */
export const tailwindPreset: Partial<Config> = {
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      // ── Colours ────────────────────────────────────────────
      // Two constraints shape this config:
      //
      // 1. Every token must resolve through a CSS variable so multi-tenant
      //    themes can be swapped at runtime (R3 / design-token red line).
      //
      // 2. Every colour scale exposes a DEFAULT shade AND supports Tailwind's
      //    opacity modifier (`bg-primary/5`, `ring-error/30`, `border-primary/20`,
      //    …). A bare string `'var(--x)'` value makes `parseColor()` bail (it
      //    cannot decompose a `var()` into rgb channels), so Tailwind silently
      //    drops the utility AND any `/N` variant of it. A function value is
      //    called with `{ opacityValue }`: with no modifier it returns the raw
      //    variable (identical output), with a modifier it emits a `color-mix`
      //    expression (Tailwind 3.3+) which applies the alpha to the variable.
      colors: {
        // NOTE: each scale MUST stay a nested object (do NOT spread its
        // 50/100/… keys into this map). Scales share identical numeric keys, so
        // spreading them collapses every scale into one set of `50…900` entries
        // and Tailwind then flattens those numeric keys into *top-level colour
        // names* — polluting global utilities (`text`, `from`, `via`,
        // `placeholder` would all alias to whichever scale spread last).
        primary: cssColorScale('primary', { defaultShade: 500 }),
        secondary: cssColorScale('secondary', { defaultShade: 500 }),
        success: cssColorScale('success', { defaultShade: 500 }),
        warning: cssColorScale('warning', { defaultShade: 500 }),
        error: cssColorScale('error', { defaultShade: 500 }),
        info: cssColorScale('info', { defaultShade: 500 }),
        neutral: cssColorScale('neutral'),
        // Surface tokens
        white: cssColor('--color-white'),
        black: cssColor('--color-black'),
        surface: cssColor('--color-white'),
        'surface-hover': cssColor('--color-neutral-100'),
        'surface-active': cssColor('--color-neutral-200'),
        onSurface: cssColor('--color-neutral-900'),
        border: cssColor('--color-neutral-200'),
        overlay: cssColor('--color-overlay'),
        // Text hierarchy tokens (kept on the neutral scale so tenant themes
        // still flow through CSS variables). Used as `text-text-primary`, …
        text: {
          primary: cssColor('--color-neutral-900'),
          secondary: cssColor('--color-neutral-600'),
          tertiary: cssColor('--color-neutral-400'),
        },
      },

      // ── Spacing (4 px grid) ────────────────────────────────
      spacing: {
        1: 'var(--spacing-1)',
        2: 'var(--spacing-2)',
        3: 'var(--spacing-3)',
        4: 'var(--spacing-4)',
        5: 'var(--spacing-5)',
        6: 'var(--spacing-6)',
        8: 'var(--spacing-8)',
        10: 'var(--spacing-10)',
        12: 'var(--spacing-12)',
        16: 'var(--spacing-16)',
        20: 'var(--spacing-20)',
        24: 'var(--spacing-24)',
        32: 'var(--spacing-32)',
      },

      // ── Radius ─────────────────────────────────────────────
      borderRadius: {
        small: 'var(--radius-small)',
        medium: 'var(--radius-medium)',
        large: 'var(--radius-large)',
        full: 'var(--radius-full)',
      },

      // ── Typography ─────────────────────────────────────────
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
      },
      lineHeight: {
        tight: 'var(--line-height-tight)',
        normal: 'var(--line-height-normal)',
        relaxed: 'var(--line-height-relaxed)',
      },
      fontWeight: {
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
      },

      // ── Shadows ────────────────────────────────────────────
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },

      // ── Motion ─────────────────────────────────────────────
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
    },
  },
};
