/**
 * Conditionally join class names, dropping falsy values.
 *
 * @param classes - Class name tokens (`false`/`null`/`undefined` are ignored).
 * @returns A space-separated string of truthy class names.
 */
export function cn(...classes: Array<string | undefined | false | null>): string {
  return classes.filter(Boolean).join(' ');
}
