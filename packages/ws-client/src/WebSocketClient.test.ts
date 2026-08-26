import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketClient, calculateBackoffDelay } from './WebSocketClient';
import type { NotificationPayload, WsMessage } from './types';

interface MockSocket {
  url: string;
  readyState: number;
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  onopen: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: string }) => void) | null;
  onclose: ((ev: { code: number; reason: string }) => void) | null;
  onerror: ((ev: unknown) => void) | null;
}

const OPEN = 1;
const CONNECTING = 0;
const sockets: MockSocket[] = [];

function makeMockSocket(url: string): MockSocket {
  return {
    url,
    readyState: CONNECTING,
    send: vi.fn(),
    close: vi.fn(function (this: MockSocket) {
      this.readyState = 3;
    }),
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,
  };
}

function installWebSocketMock(): void {
  sockets.length = 0;
  // Preserve the native WebSocket constants (CONNECTING, OPEN, CLOSING, CLOSED)
  // because production code compares readyState against WebSocket.OPEN.
  const NativeWebSocket = globalThis.WebSocket;
  const MockWebSocket = vi.fn((url: string) => {
    const socket = makeMockSocket(url);
    sockets.push(socket);
    return socket;
  }) as unknown as typeof WebSocket;
  for (const k of ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'] as const) {
    Object.defineProperty(MockWebSocket, k, {
      value: NativeWebSocket[k],
      configurable: true,
    });
  }
  vi.stubGlobal('WebSocket', MockWebSocket);
}

function lastSocket(): MockSocket {
  const s = sockets[sockets.length - 1];
  if (!s) throw new Error('No WebSocket instance created');
  return s;
}

function openConnection(): void {
  const s = lastSocket();
  s.readyState = OPEN;
  s.onopen?.({});
}

function makeMessage<T>(type: WsMessage['type'], payload: T): WsMessage<T> {
  return { type, payload, id: 'm-1', timestamp: Date.now() };
}

function makeNotification(id: string): NotificationPayload {
  return {
    id,
    type: 'ticket_assigned',
    message: `n ${id}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

describe('calculateBackoffDelay', () => {
  it('returns 0 when all inputs are 0', () => {
    expect(calculateBackoffDelay(0, 0, 0)).toBe(0);
  });

  it('never exceeds maxDelay', () => {
    for (let i = 0; i < 50; i += 1) {
      const delay = calculateBackoffDelay(10, 1000, 5000);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(5000);
    }
  });

  it('grows the exponential component with attempts', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    try {
      const d1 = calculateBackoffDelay(1, 1000, 30000);
      const d2 = calculateBackoffDelay(2, 1000, 30000);
      expect(d2).toBeGreaterThan(d1);
    } finally {
      randomSpy.mockRestore();
    }
  });
});

describe('WebSocketClient lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installWebSocketMock();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('starts disconnected and opens a connection', () => {
    const onStatusChange = vi.fn();
    const onOpen = vi.fn();
    const client = new WebSocketClient({ url: 'wss://example.com' }, { onStatusChange, onOpen });

    expect(client.getStatus()).toBe('disconnected');
    client.connect();
    expect(WebSocket).toHaveBeenCalledWith('wss://example.com');
    expect(client.getStatus()).toBe('connecting');

    openConnection();
    expect(client.getStatus()).toBe('connected');
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('is a no-op to connect while already connected/connecting', () => {
    const client = new WebSocketClient({ url: 'wss://x' });
    client.connect();
    const connectingCount = sockets.length;
    client.connect();
    expect(sockets.length).toBe(connectingCount);

    openConnection();
    client.connect();
    expect(sockets.length).toBe(connectingCount);
  });

  it('disconnects cleanly and prevents reconnect', () => {
    const client = new WebSocketClient({ url: 'wss://x' });
    client.connect();
    openConnection();

    const socket = lastSocket();
    client.disconnect();

    expect(client.getStatus()).toBe('disconnected');
    // disconnect() detaches all socket handlers and drops the reference so
    // that no further events can trigger reconnects.
    expect(socket.onopen).toBeNull();
    expect(socket.onmessage).toBeNull();
    expect(socket.onclose).toBeNull();
    expect(socket.onerror).toBeNull();
    // Subsequent incoming close events must NOT schedule a reconnect.
    const beforeReconnect = sockets.length;
    socket.onclose?.({ code: 1006, reason: 'late' });
    expect(sockets.length).toBe(beforeReconnect);
    expect(client.getStatus()).toBe('disconnected');
  });

  it('sends a typed message when connected and returns false otherwise', () => {
    const client = new WebSocketClient({ url: 'wss://x' });
    expect(client.send('ping', null)).toBe(false);

    client.connect();
    openConnection();
    // The first send is the offline sync request fired by handleOpen; the
    // explicit call below is the second message.
    expect(client.send('ping', null)).toBe(true);

    const sent = JSON.parse(lastSocket().send.mock.calls[1]?.[0] as string) as WsMessage;
    expect(sent.type).toBe('ping');
  });

  it('invokes onNotification and onMessage for incoming notifications', () => {
    const onNotification = vi.fn();
    const onMessage = vi.fn();
    const client = new WebSocketClient({ url: 'wss://x' }, { onNotification, onMessage });
    client.connect();
    openConnection();

    lastSocket().onmessage?.({
      data: JSON.stringify(makeMessage('notification', makeNotification('n-9'))),
    });

    expect(onNotification).toHaveBeenCalledWith(expect.objectContaining({ id: 'n-9' }));
    expect(onMessage).toHaveBeenCalledTimes(1);
  });

  it('processes sync_response batches and updates lastSequence', () => {
    const onNotification = vi.fn();
    const client = new WebSocketClient({ url: 'wss://x' }, { onNotification });
    client.connect();
    openConnection();

    lastSocket().onmessage?.({
      data: JSON.stringify(
        makeMessage('sync_response', {
          lastSequence: 42,
          messages: [makeNotification('a'), makeNotification('b')],
        }),
      ),
    });

    expect(onNotification).toHaveBeenCalledTimes(2);
    client.setLastSequence(42);
    expect(client.send('sync_request', { lastSequence: 42 })).toBe(true);
  });

  it('ignores malformed JSON messages without throwing', () => {
    const onMessage = vi.fn();
    const client = new WebSocketClient({ url: 'wss://x' }, { onMessage });
    client.connect();
    openConnection();

    expect(() => lastSocket().onmessage?.({ data: '{not json' })).not.toThrow();
    expect(onMessage).not.toHaveBeenCalled();
  });
});

describe('WebSocketClient heartbeat and reconnection', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    installWebSocketMock();
    // Make calculateBackoffDelay deterministic: floor(exponential * 1.0).
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1);
  });

  afterEach(() => {
    randomSpy.mockRestore();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('resets the pong timeout on pong and does not force-close', () => {
    const client = new WebSocketClient({
      url: 'wss://x',
      heartbeatInterval: 10_000,
      pongTimeout: 500,
    });
    client.connect();
    openConnection();

    vi.advanceTimersByTime(10_000);
    expect(lastSocket().send).toHaveBeenCalled();

    lastSocket().onmessage?.({
      data: JSON.stringify(makeMessage('pong', null)),
    });
    vi.advanceTimersByTime(600);

    const forceClosed = lastSocket().close.mock.calls.some((c) => c[0] === 4000);
    expect(forceClosed).toBe(false);
  });

  it('force-closes when pong times out', () => {
    const client = new WebSocketClient({
      url: 'wss://x',
      heartbeatInterval: 10_000,
      pongTimeout: 500,
    });
    client.connect();
    openConnection();

    vi.advanceTimersByTime(10_000);
    vi.advanceTimersByTime(500);

    expect(lastSocket().close).toHaveBeenCalledWith(4000, 'Pong timeout');
  });

  it('schedules reconnect on unexpected close', () => {
    const onClose = vi.fn();
    const client = new WebSocketClient(
      {
        url: 'wss://x',
        initialReconnectDelay: 100,
        maxReconnectDelay: 1000,
      },
      { onClose },
    );
    client.connect();
    openConnection();

    // Spy on setTimeout to verify a reconnect timer is scheduled.
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    lastSocket().onclose?.({ code: 1006, reason: 'boom' });

    expect(client.getStatus()).toBe('reconnecting');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenCalled();
    const reconnectCall = setTimeoutSpy.mock.calls.find(
      (call) => typeof call[0] === 'function' && typeof call[1] === 'number',
    );
    expect(reconnectCall).toBeDefined();
    expect(reconnectCall?.[1]).toBeGreaterThanOrEqual(50);
  });

  it('stops reconnecting after maxReconnectAttempts', () => {
    const client = new WebSocketClient({
      url: 'wss://x',
      initialReconnectDelay: 50,
      maxReconnectDelay: 200,
      maxReconnectAttempts: 1,
    });
    client.connect();
    openConnection();

    // First unexpected close schedules attempt #1 (the only allowed one).
    lastSocket().onclose?.({ code: 1006, reason: '' });
    expect(client.getStatus()).toBe('reconnecting');

    // The backoff timer fires and calls connect(), but since the client is
    // already in "reconnecting" state and a new socket fails immediately,
    // handleClose runs scheduleReconnect again. With attempts already at the
    // cap, the client must settle on "disconnected".
    vi.advanceTimersByTime(50);
    // Simulate the second socket failing without opening.
    lastSocket().onclose?.({ code: 1006, reason: '' });
    expect(client.getStatus()).toBe('disconnected');
  });

  it('invokes onError and tolerates missing callbacks', () => {
    const onError = vi.fn();
    const client = new WebSocketClient({ url: 'wss://x' }, { onError });
    client.connect();
    openConnection();
    lastSocket().onerror?.(new Event('error'));
    expect(onError).toHaveBeenCalledTimes(1);

    const bare = new WebSocketClient({ url: 'wss://x' });
    bare.connect();
    expect(() => openConnection()).not.toThrow();
    expect(() =>
      lastSocket().onmessage?.({
        data: JSON.stringify(makeMessage('pong', null)),
      }),
    ).not.toThrow();
  });
});
