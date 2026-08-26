import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUiStore, type ThemeMode } from './ui-store';

// Persisted store key used by the persist middleware.
const PERSIST_KEY = 'team-portal-ui';

function resetStore(): void {
  // Reset to the initial state by setting every field directly.
  useUiStore.setState({
    sidebarCollapsed: false,
    mobileNavOpen: false,
    notificationPanelOpen: false,
    theme: 'light',
    locale: 'zh',
  });
  window.localStorage.removeItem(PERSIST_KEY);
}

describe('ui-store', () => {
  beforeEach(() => {
    resetStore();
  });

  it('has the expected default state', () => {
    const s = useUiStore.getState();
    expect(s.sidebarCollapsed).toBe(false);
    expect(s.mobileNavOpen).toBe(false);
    expect(s.notificationPanelOpen).toBe(false);
    expect(s.theme).toBe('light');
    expect(s.locale).toBe('zh');
  });

  it('toggles and explicitly sets the sidebar collapsed state', () => {
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);

    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);

    useUiStore.getState().setSidebarCollapsed(true);
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
  });

  it('toggles and sets the mobile nav open state', () => {
    useUiStore.getState().toggleMobileNav();
    expect(useUiStore.getState().mobileNavOpen).toBe(true);

    useUiStore.getState().setMobileNavOpen(false);
    expect(useUiStore.getState().mobileNavOpen).toBe(false);
  });

  it('sets the notification panel open state', () => {
    useUiStore.getState().setNotificationPanelOpen(true);
    expect(useUiStore.getState().notificationPanelOpen).toBe(true);
  });

  it('updates theme and locale preferences', () => {
    useUiStore.getState().setTheme('dark' as ThemeMode);
    expect(useUiStore.getState().theme).toBe('dark');

    useUiStore.getState().setLocale('en');
    expect(useUiStore.getState().locale).toBe('en');
  });

  it('persists only the non-sensitive UI fields to localStorage', () => {
    useUiStore.getState().setSidebarCollapsed(true);
    useUiStore.getState().setTheme('dark');
    useUiStore.getState().setLocale('ja');
    useUiStore.getState().setMobileNavOpen(true);
    useUiStore.getState().setNotificationPanelOpen(true);

    const raw = window.localStorage.getItem(PERSIST_KEY);
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw as string) as {
      state: Record<string, unknown>;
    };

    // Persisted fields.
    expect(persisted.state.sidebarCollapsed).toBe(true);
    expect(persisted.state.theme).toBe('dark');
    expect(persisted.state.locale).toBe('ja');

    // Session-only fields must NOT be persisted.
    expect(persisted.state.mobileNavOpen).toBeUndefined();
    expect(persisted.state.notificationPanelOpen).toBeUndefined();
  });

  it('rehydrates persisted state from localStorage', async () => {
    window.localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        state: {
          sidebarCollapsed: true,
          theme: 'auto',
          locale: 'ko',
        },
        version: 0,
      }),
    );

    // Reset the module registry so the store factory runs again and the
    // persist middleware re-reads localStorage during initialization.
    vi.resetModules();
    const rehydrated = await import('./ui-store');

    // Allow the persist middleware's synchronous storage read to settle.
    await Promise.resolve();

    expect(rehydrated.useUiStore.getState().sidebarCollapsed).toBe(true);
    expect(rehydrated.useUiStore.getState().theme).toBe('auto');
    expect(rehydrated.useUiStore.getState().locale).toBe('ko');
    // Non-persisted fields fall back to defaults.
    expect(rehydrated.useUiStore.getState().mobileNavOpen).toBe(false);
    expect(rehydrated.useUiStore.getState().notificationPanelOpen).toBe(false);
  });
});
