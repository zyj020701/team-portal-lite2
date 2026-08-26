/**
 * A plain object whose leaf values are CSS token values (strings/numbers).
 * Nested objects are flattened into `--prefix-parent-child` variables.
 */
export interface TokenMap {
  [key: string]: string | number | TokenMap;
}

export interface TokenToCssVarsOptions {
  /**
   * CSS selector / block selector to wrap the variables in (default `':root'`).
   * Pass `null` to emit raw `--name:value;` declarations without a block.
   */
  selector?: string | null;
  /** Prefix prepended to every variable name (default `''`). */
  prefix?: string;
  /** String used for indentation (default two spaces). */
  indent?: string;
}

function isTokenMap(value: unknown): value is TokenMap {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep-merge {@link overrides} onto {@link base}. Arrays and primitive values
 * in `overrides` replace the base values; nested objects are merged key by
 * key. Neither input is mutated.
 *
 * @param base      - The default token values.
 * @param overrides - Partial overrides (e.g. a tenant theme).
 * @returns A new merged token map.
 */
export function mergeTokens<T extends TokenMap>(base: T, overrides?: Partial<T>): T {
  if (overrides === undefined) {
    return { ...base };
  }

  const result: TokenMap = { ...base };

  for (const key of Object.keys(overrides)) {
    const baseValue = result[key];
    const overrideValue = overrides[key];

    if (isTokenMap(baseValue) && isTokenMap(overrideValue)) {
      result[key] = mergeTokens(baseValue, overrideValue);
    } else if (overrideValue !== undefined) {
      result[key] = overrideValue as TokenMap[string];
    }
  }

  return result as T;
}

function flatten(obj: TokenMap, prefix: string, lines: string[], indent: string): void {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value === undefined) {
      continue;
    }
    const name = prefix ? `${prefix}-${key}` : key;

    if (isTokenMap(value)) {
      flatten(value, name, lines, indent);
    } else {
      lines.push(`${indent}--${name}:${String(value)};`);
    }
  }
}

/**
 * Convert a (possibly nested) token map into CSS custom-property declarations.
 *
 * Nested objects are flattened with kebab-case names, e.g.
 * `{ colors: { primary: { 500: '#3b82f6' } } }` becomes
 * `--colors-primary-500:#3b82f6;`.
 *
 * If `options.selector` is not `null`, the declarations are wrapped in a CSS
 * rule block (`:root { … }` by default).
 *
 * @param tokens  - The token map.
 * @param options - Control the selector, name prefix and indentation.
 * @returns A CSS string of custom properties.
 */
export function tokensToCssVars(tokens: TokenMap, options: TokenToCssVarsOptions = {}): string {
  const selector = options.selector === undefined ? ':root' : options.selector;
  const prefix = options.prefix ?? '';
  const indent = options.indent ?? '  ';

  const declarations: string[] = [];
  flatten(tokens, prefix, declarations, selector === null ? '' : indent);

  if (selector === null) {
    return declarations.join('\n');
  }

  return [`${selector} {`, ...declarations, '}'].join('\n');
}
