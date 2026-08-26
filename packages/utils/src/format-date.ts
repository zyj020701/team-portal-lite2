/**
 * Date formatting patterns supported by {@link formatDate}.
 */
export type DateFormat = 'datetime' | 'date' | 'time' | 'iso';

const PATTERNS: Record<DateFormat, Intl.DateTimeFormatOptions> = {
  datetime: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  },
  date: { year: 'numeric', month: '2-digit', day: '2-digit' },
  time: { hour: '2-digit', minute: '2-digit' },
  iso: {},
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Format a date-like value into a localized string.
 *
 * @param value  - A `Date`, an ISO timestamp string, or a numeric timestamp.
 * @param locale - BCP-47 locale tag (defaults to `zh-CN`).
 * @param format - One of `datetime` (default), `date`, `time`, or `iso`.
 * @returns The formatted date string.
 * @throws {TypeError} If `value` cannot be parsed into a valid date.
 */
export function formatDate(
  value: string | number | Date,
  locale: string = 'zh-CN',
  format: DateFormat = 'datetime',
): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`Invalid date: ${String(value)}`);
  }

  if (format === 'iso') {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  return new Intl.DateTimeFormat(locale, PATTERNS[format]).format(date);
}
