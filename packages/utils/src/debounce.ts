/**
 * A function wrapper whose pending invocation can be cancelled.
 */
export interface DebouncedFunction<TArgs extends unknown[]> {
  (...args: TArgs): void;
  /** Cancel any pending invocation. */
  cancel: () => void;
}

/**
 * Create a debounced wrapper around {@link fn}.
 *
 * Each call within {@link wait} milliseconds resets the timer; the wrapped
 * function only runs after calls stop for the full wait period.
 *
 * @param fn   - The function to debounce.
 * @param wait - Debounce delay in milliseconds.
 * @returns The debounced function with a `cancel` method.
 */
export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  wait: number,
): DebouncedFunction<TArgs> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: TArgs): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, wait);
  };

  debounced.cancel = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return debounced;
}
