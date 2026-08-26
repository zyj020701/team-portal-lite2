'use client';
import { create } from 'zustand';
import type { ThemeConfig } from '@team-portal/design-tokens';
interface ThemeState {
  tenantId: string;
  setTenantTheme: (id: string, config: ThemeConfig) => void;
}
export const useThemeStore = create<ThemeState>((set) => ({
  tenantId: 'default',
  setTenantTheme: (id, config) => {
    const root = document.documentElement;
    Object.entries(config).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute('data-theme', id);
    set({ tenantId: id });
  },
}));
