import { beforeEach, describe, expect, it } from 'vitest';
import { useNotificationStore } from './notification-store';

function resetStore(): void {
  useNotificationStore.setState({ panelOpen: false });
}

describe('notification-store', () => {
  beforeEach(() => {
    resetStore();
  });

  it('defaults to a closed panel', () => {
    expect(useNotificationStore.getState().panelOpen).toBe(false);
  });

  it('opens and closes the panel explicitly', () => {
    useNotificationStore.getState().setPanelOpen(true);
    expect(useNotificationStore.getState().panelOpen).toBe(true);

    useNotificationStore.getState().setPanelOpen(false);
    expect(useNotificationStore.getState().panelOpen).toBe(false);
  });

  it('toggles the panel open state', () => {
    useNotificationStore.getState().togglePanel();
    expect(useNotificationStore.getState().panelOpen).toBe(true);

    useNotificationStore.getState().togglePanel();
    expect(useNotificationStore.getState().panelOpen).toBe(false);
  });
});
