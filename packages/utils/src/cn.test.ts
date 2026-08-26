import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins truthy class names with spaces', () => {
    expect(cn('btn', 'btn-primary', 'lg')).toBe('btn btn-primary lg');
  });

  it('ignores falsy values (false, null, undefined, empty string)', () => {
    expect(cn('btn', false && 'hidden', null, undefined, '', 'active')).toBe('btn active');
  });

  it('returns an empty string when no truthy classes are provided', () => {
    expect(cn(false, null, undefined, '')).toBe('');
  });

  it('returns an empty string when called with no arguments', () => {
    expect(cn()).toBe('');
  });
});
