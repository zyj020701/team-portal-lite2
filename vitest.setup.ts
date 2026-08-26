import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom does not implement ResizeObserver, which @tanstack/react-virtual
// relies on to measure the scroll container.
class ResizeObserverMock {
  observe(): void {
    /* no-op */
  }
  unobserve(): void {
    /* no-op */
  }
  disconnect(): void {
    /* no-op */
  }
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// jsdom returns 0 for all layout metrics; @tanstack/react-virtual needs
// non-zero dimensions to calculate virtual items.
if (!Element.prototype.getBoundingClientRect) {
  Element.prototype.getBoundingClientRect = () =>
    ({
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => '',
    }) as DOMRect;
}

// MatchMedia is used by some UI logic (e.g. theme auto mode); jsdom lacks it.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as MediaQueryList;
}

// Automatically unmount rendered components after each test so DOM state
// never leaks between cases.
afterEach(() => {
  cleanup();
  // Clear Zustand persisted state written to jsdom localStorage.
  window.localStorage.clear();
});
