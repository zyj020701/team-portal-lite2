/**
 * A throttled function wrapper whose pending/queued invocation can be
 * cancelled.
 */
export interface ThrottledFunction<TArgs extends unknown[]> {
  (...args: TArgs): void;
  /** Cancel any pending trailing invocation. */
  cancel: () => void;
}

export interface ThrottleOptions {
  /** Invoke on the leading edge of the throttle window (default: `true`). */
  leading?: boolean;
  /** Invoke on the trailing edge of the throttle window (default: `true`). */
  trailing?: boolean;
}

/**
 * Create a throttled wrapper around {@link fn}.
 *
 * The wrapped function runs at most once per {@link wait} milliseconds. By
 * default it invokes on both the leading and trailing edges. The most recent
 * arguments are used for the trailing call.
 *
 * @param fn      - The function to throttle.
 * @param wait    - Minimum interval between invocations, in milliseconds.
 * @param options - Toggle `leading`/`trailing` invocations.
 * @returns The throttled function with a `cancel` method.
 */
export function throttle<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  wait: number,
  options: ThrottleOptions = {},
): ThrottledFunction<TArgs> {
  const leading = options.leading ?? true;
  const trailing = options.trailing ?? true;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: TArgs | undefined;
  let lastCallTime = 0;

  const invoke = (time: number): void => {
    if (lastArgs !== undefined) {
      fn(...lastArgs);
      lastArgs = undefined;
      lastCallTime = time;
      timer = setTimeout(() => {
        timer = undefined;
        if (trailing && lastArgs !== undefined) {
          invoke(Date.now());
        }
      }, wait);
    }
  };

  const throttled = (...args: TArgs): void => {
    const now = Date.now();
    lastArgs = args;

    if (lastCallTime === 0 && !leading) {
      lastCallTime = now;
    }

    const remaining = wait - (now - lastCallTime);

    if (remaining <= 0 || remaining > wait) {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      if (leading || lastCallTime !== 0) {
        fn(...args);
      }
      lastArgs = undefined;
      lastCallTime = now;
    } else if (timer === undefined && trailing) {
      timer = setTimeout(() => {
        timer = undefined;
        invoke(Date.now());
      }, remaining);
    }
  };

  throttled.cancel = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    lastArgs = undefined;
    lastCallTime = 0;
  };

  return throttled;
}
