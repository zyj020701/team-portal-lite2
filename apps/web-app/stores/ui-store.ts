'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Supported theme modes. */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * UI store — manages global layout / appearance state.
 *
 * Persisted fields (non-sensitive only):
 * - `sidebarCollapsed`
 * - `theme`
 * - `locale`
 *
 * Non-persisted (session-only):
 * - `mobileNavOpen`
 * - `notificationPanelOpen`
 */
export interface UiState {
  /** Desktop sidebar collapsed (icon-only) state. */
  sidebarCollapsed: boolean;
  /** Mobile hamburger nav open state. */
  mobileNavOpen: boolean;
  /** Notification panel open state. */
  notificationPanelOpen: boolean;
  /** Current theme preference. */
  theme: ThemeMode;
  /** Current locale preference (BCP-47 language tag). */
  locale: string;

  /** Toggle sidebar collapsed state. */
  toggleSidebar: () => void;
  /** Set sidebar collapsed state explicitly. */
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Set mobile nav open state. */
  setMobileNavOpen: (open: boolean) => void;
  /** Toggle mobile nav open state. */
  toggleMobileNav: () => void;
  /** Set notification panel open state. */
  setNotificationPanelOpen: (open: boolean) => void;
  /** Set theme mode. */
  setTheme: (theme: ThemeMode) => void;
  /** Set locale preference. */
  setLocale: (locale: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      notificationPanelOpen: false,
      theme: 'light',
      locale: 'zh',

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
      setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'team-portal-ui',
      // Only persist non-sensitive UI preferences
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        locale: state.locale,
      }),
    },
  ),
);
