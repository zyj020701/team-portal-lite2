'use client';

import { create } from 'zustand';

/**
 * Notification store — manages notification panel UI state only.
 *
 * NOTE: Notification data (list, unread count) is NOT stored here.
 * It is fetched via TanStack Query. This store only controls the
 * open/closed state of the notification panel.
 */
export interface NotificationState {
  /** Whether the notification panel is open. */
  panelOpen: boolean;
  /** Set panel open state. */
  setPanelOpen: (open: boolean) => void;
  /** Toggle panel open state. */
  togglePanel: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  panelOpen: false,
  setPanelOpen: (open) => set({ panelOpen: open }),
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
}));
