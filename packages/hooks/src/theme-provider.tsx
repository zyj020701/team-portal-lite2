'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  applyTheme as applyTokenThemeFn,
  defaultTheme,
  themeRegistry,
} from '@team-portal/design-tokens';
import type { ThemeConfig } from '@team-portal/design-tokens';

const getRegistry = (): Record<string, ThemeConfig> => themeRegistry;
const getDefaultTheme = (): ThemeConfig => defaultTheme;
const applyTokenTheme = (theme: ThemeConfig): number => applyTokenThemeFn(theme);

export interface ThemeContextValue {
  /** Current tenant identifier (e.g. "company-a"). */
  tenantId: string;
  /** The currently active ThemeConfig. */
  theme: ThemeConfig;
  /** Switch to a different tenant theme. Returns elapsed ms. */
  setTenant: (id: string) => number;
  /** Directly apply a ThemeConfig (for ad-hoc overrides). */
  setTheme: (theme: ThemeConfig) => number;
  /** Available tenant IDs. */
  availableTenants: readonly string[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  /** Initial tenant id. Defaults to "company-a". */
  defaultTenantId?: string;
  children: ReactNode;
}

/**
 * Client-side theme provider. Injects the active tenant's tokens onto
 * `document.documentElement.style` whenever the tenant changes.
 *
 * The initial paint is handled by an inline script in the root layout
 * (see `tokensToInlineScript`) — this provider takes over after
 * hydration to support runtime switching.
 */
export function ThemeProvider({ defaultTenantId = 'company-a', children }: ThemeProviderProps) {
  const [tenantId, setTenantId] = useState<string>(() => {
    if (typeof window === 'undefined') return defaultTenantId;
    return window.localStorage.getItem('tp-tenant') || defaultTenantId;
  });

  const [theme, setThemeState] = useState<ThemeConfig>(getDefaultTheme);

  // Apply on mount and whenever tenant changes.
  useEffect(() => {
    const registry = getRegistry();
    const next = registry[tenantId] ?? getDefaultTheme();
    applyTokenTheme(next);
    setThemeState(next);
    window.localStorage.setItem('tp-tenant', tenantId);
  }, [tenantId]);

  const setTenant = useCallback((id: string): number => {
    const registry = getRegistry();
    const next = registry[id] ?? getDefaultTheme();
    const elapsed = applyTokenTheme(next);
    setThemeState(next);
    setTenantId(id);
    window.localStorage.setItem('tp-tenant', id);
    return elapsed;
  }, []);

  const setTheme = useCallback((next: ThemeConfig): number => {
    const elapsed = applyTokenTheme(next);
    setThemeState(next);
    return elapsed;
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      tenantId,
      theme,
      setTenant,
      setTheme,
      availableTenants: Object.keys(getRegistry()),
    }),
    [tenantId, theme, setTenant, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Access the active theme and switch tenants.
 * Must be used inside a `<ThemeProvider>`.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}
