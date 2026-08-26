import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { NotificationPayload } from '@team-portal/ws-client';

// ---- Mock the real-time hook so the component is fully deterministic ----
const mockUseWebSocket = vi.hoisted(() => vi.fn());

vi.mock('@team-portal/hooks', () => ({
  useWebSocket: (...args: unknown[]) => mockUseWebSocket(...args),
}));

// next-intl: return the key plus embedded params so assertions can read it.
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string, params?: Record<string, unknown>) =>
    params ? `${namespace}.${key}(${JSON.stringify(params)})` : `${namespace}.${key}`,
  useFormatter: () => ({
    dateTime: () => '2026/01/01',
  }),
}));

import { NotificationBell } from './NotificationBell';

function makeNotification(
  id: string,
  overrides: Partial<NotificationPayload> = {},
): NotificationPayload {
  return {
    id,
    type: 'ticket_assigned',
    message: `message ${id}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...overrides,
  };
}

function setMockState(state: {
  connectionStatus?: 'connected' | 'connecting' | 'reconnecting' | 'disconnected';
  unreadCount?: number;
  notifications?: NotificationPayload[];
  markAsRead?: (id: string) => void;
  markAllAsRead?: () => void;
}): void {
  mockUseWebSocket.mockReturnValue({
    connectionStatus: 'disconnected',
    unreadCount: 0,
    notifications: [],
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    ...state,
  });
}

describe('NotificationBell', () => {
  beforeEach(() => {
    mockUseWebSocket.mockReset();
    setMockState({});
  });

  it('renders an unread badge with the count and hides it at zero', () => {
    const { rerender } = render(<NotificationBell />);
    // No badge when there are no unread notifications.
    expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument();

    setMockState({ unreadCount: 3 });
    rerender(<NotificationBell />);
    expect(screen.getByTestId('unread-badge')).toHaveTextContent('3');
  });

  it('caps the displayed badge at 99+', () => {
    setMockState({ unreadCount: 150 });
    render(<NotificationBell />);
    expect(screen.getByTestId('unread-badge')).toHaveTextContent('99+');
  });

  it('opens the dropdown on click and shows the empty state', () => {
    render(<NotificationBell />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/empty/)).toBeInTheDocument();
  });

  it('lists notifications and marks a single one as read', () => {
    const markAsRead = vi.fn();
    setMockState({
      unreadCount: 1,
      notifications: [makeNotification('n-1')],
      markAsRead,
    });
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/message n-1/)).toBeInTheDocument();

    const readButton = screen.getByRole('button', {
      name: /notifications\.read n-1/i,
    });
    fireEvent.click(readButton);

    expect(markAsRead).toHaveBeenCalledWith('n-1');
  });

  it('marks all notifications as read from the dropdown header', () => {
    const markAllAsRead = vi.fn();
    setMockState({
      unreadCount: 2,
      notifications: [makeNotification('a'), makeNotification('b')],
      markAllAsRead,
    });
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: /markAllRead/i }));

    expect(markAllAsRead).toHaveBeenCalledTimes(1);
  });

  it('closes the dropdown on an outside click', async () => {
    render(
      <div>
        <NotificationBell />
        <button type="button" data-testid="outside">
          outside
        </button>
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: /unread|notification/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
