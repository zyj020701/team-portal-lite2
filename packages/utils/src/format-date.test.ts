import { describe, it, expect } from 'vitest';
import { formatDate } from './format-date';

describe('formatDate', () => {
  it('formats an ISO date string using the default zh-CN datetime pattern', () => {
    // 2024-03-15T14:05:00Z → formatted in local time; we assert structural pieces
    const result = formatDate('2024-03-15T14:05:00Z');
    expect(typeof result).toBe('string');
    // zh-CN datetime always includes a 4-digit year
    expect(result).toMatch(/2024/);
    expect(result.length).toBeGreaterThan(0);
  });

  it('supports the "date" format without time', () => {
    const result = formatDate('2024-03-15T14:05:00Z', 'en-US', 'date');
    expect(result).toMatch(/2024/);
    expect(result).not.toMatch(/AM|PM/);
  });

  it('supports the "time" format without date', () => {
    const result = formatDate(new Date('2024-03-15T14:05:00Z'), 'en-US', 'time');
    // en-US time should contain AM or PM
    expect(result).toMatch(/AM|PM/);
    expect(result).not.toMatch(/2024/);
  });

  it('supports the "iso" format as YYYY-MM-DDTHH:mm:ss', () => {
    const date = new Date(2024, 2, 15, 14, 5, 0); // local time
    const result = formatDate(date, 'en-US', 'iso');
    expect(result).toMatch(/^2024-03-15T14:05:00$/);
  });

  it('accepts a numeric timestamp', () => {
    const date = new Date(2024, 0, 1, 0, 0, 0);
    const result = formatDate(date.getTime(), 'en-US', 'iso');
    expect(result).toMatch(/^2024-01-01T00:00:00$/);
  });

  it('pads single-digit month/day/hour/minute/second with leading zero', () => {
    const date = new Date(2024, 0, 5, 9, 7, 3);
    const result = formatDate(date, 'en-US', 'iso');
    expect(result).toBe('2024-01-05T09:07:03');
  });

  it('throws a TypeError for an invalid date string', () => {
    expect(() => formatDate('not-a-date')).toThrow(TypeError);
  });

  it('throws a TypeError for an invalid Date object', () => {
    expect(() => formatDate(new Date('invalid'))).toThrow(TypeError);
  });
});
