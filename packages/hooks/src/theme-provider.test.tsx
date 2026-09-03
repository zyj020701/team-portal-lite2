import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './theme-provider';
import { defaultTheme, themeRegistry } from '@team-portal/design-tokens';

// applyTheme writes CSS variables onto document.documentElement.style.
// We assert on those side effects.

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultTenantId="company-a">{children}</ThemeProvider>;
}

describe('useTheme', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.style.cssText = '';
  });

  it('throws when used outside a ThemeProvider', () => {
    // Suppress the expected error log from React's error boundary.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useTheme())).toThrow(/must be used within a <ThemeProvider>/);
    spy.mockRestore();
  });

  it('exposes the default tenant, theme and available tenants', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.tenantId).toBe('company-a');
    expect(result.current.theme).toEqual(defaultTheme);
    expect(result.current.availableTenants).toContain('company-a');
    expect(result.current.availableTenants).toContain('company-b');
    expect(result.current.availableTenants).toContain('company-c');
    expect(result.current.availableTenants).toContain('company-d');
    expect(result.current.availableTenants).toContain('company-e');
  });

  it('applies theme tokens to document.documentElement on mount', () => {
    renderHook(() => useTheme(), { wrapper });

    // applyTheme sets at least one CSS custom property.
    const inlineStyle = document.documentElement.style;
    expect(inlineStyle.length).toBeGreaterThan(0);
  });

  it('switches tenant theme via setTenant and persists the choice', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    let elapsed = 0;
    act(() => {
      elapsed = result.current.setTenant('company-b');
    });

    expect(typeof elapsed).toBe('number');
    expect(result.current.tenantId).toBe('company-b');
    expect(result.current.theme).toEqual(themeRegistry['company-b']);
    expect(window.localStorage.getItem('tp-tenant')).toBe('company-b');
  });

  it('switches to every registered tenant theme (c, d and e included)', () => {
    const tenantIds = ['company-c', 'company-d', 'company-e'] as const;

    for (const id of tenantIds) {
      const expectedTheme = themeRegistry[id];
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTenant(id);
      });

      expect(result.current.tenantId).toBe(id);
      expect(result.current.theme).toEqual(expectedTheme);
      expect(window.localStorage.getItem('tp-tenant')).toBe(id);
    }
  });

  it('applies an arbitrary theme override via setTheme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    const override = { ...defaultTheme, meta: { ...defaultTheme.meta, tenantId: 'custom' } };
    act(() => {
      result.current.setTheme(override);
    });

    expect(result.current.theme).toEqual(override);
  });

  it('falls back to the default theme for an unknown tenant', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTenant('does-not-exist');
    });

    expect(result.current.tenantId).toBe('does-not-exist');
    expect(result.current.theme).toEqual(defaultTheme);
  });
});
