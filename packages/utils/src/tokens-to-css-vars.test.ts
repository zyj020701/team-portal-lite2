import { describe, it, expect } from 'vitest';
import { mergeTokens, tokensToCssVars } from './tokens-to-css-vars';
import type { TokenMap } from './tokens-to-css-vars';

describe('tokensToCssVars', () => {
  it('converts a flat token map into :root custom properties', () => {
    const css = tokensToCssVars({ primary: '#3b82f6', radius: '4px' });
    expect(css).toContain(':root {');
    expect(css).toContain('--primary:#3b82f6;');
    expect(css).toContain('--radius:4px;');
    expect(css.trimEnd().endsWith('}')).toBe(true);
  });

  it('flattens nested objects into kebab-case variable names', () => {
    const tokens: TokenMap = {
      colors: { primary: { 500: '#3b82f6' } },
    };
    const css = tokensToCssVars(tokens);
    expect(css).toContain('--colors-primary-500:#3b82f6;');
  });

  it('applies a custom prefix to every variable', () => {
    const css = tokensToCssVars({ primary: '#000' }, { prefix: 'color' });
    expect(css).toContain('--color-primary:#000;');
  });

  it('wraps declarations in a custom selector', () => {
    const css = tokensToCssVars({ primary: '#000' }, { selector: '[data-theme="dark"]' });
    expect(css.startsWith('[data-theme="dark"] {')).toBe(true);
  });

  it('emits raw declarations without a block when selector is null', () => {
    const css = tokensToCssVars({ a: '1', b: '2' }, { selector: null });
    expect(css).toBe('--a:1;\n--b:2;');
    expect(css).not.toContain('{');
  });

  it('skips undefined values', () => {
    const css = tokensToCssVars({ a: '1', b: undefined as unknown as string }, { selector: null });
    expect(css).toBe('--a:1;');
  });
});

describe('mergeTokens', () => {
  const base: TokenMap = {
    color: 'blue',
    nested: { a: '1', b: '2' },
  };

  it('returns a copy of base when no overrides are provided', () => {
    const merged = mergeTokens(base);
    expect(merged).toEqual(base);
    expect(merged).not.toBe(base);
  });

  it('overrides top-level primitive values', () => {
    const merged = mergeTokens(base, { color: 'red' });
    expect(merged.color).toBe('red');
    // unchanged
    expect(merged.nested).toEqual({ a: '1', b: '2' });
  });

  it('deep-merges nested token objects', () => {
    const merged = mergeTokens(base, { nested: { b: 'two' } });
    expect(merged.nested).toEqual({ a: '1', b: 'two' });
  });

  it('does not mutate the base object', () => {
    const baseSnapshot: Record<string, unknown> = JSON.parse(JSON.stringify(base)) as Record<
      string,
      unknown
    >;
    mergeTokens(base, { nested: { a: 'X' } });
    expect(base).toEqual(baseSnapshot);
  });
});
