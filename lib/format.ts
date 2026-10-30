export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

// Fixed locale and time zone so the server and the browser print the same date.
const DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Africa/Cairo',
});

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : DATE.format(date);
}

const RELATIVE = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' });

// [unit, seconds in one unit, stop using this unit at]
const UNITS: [Intl.RelativeTimeFormatUnit, number, number][] = [
  ['minute', 60, 60],
  ['hour', 60 * 60, 24],
  ['day', 24 * 60 * 60, 7],
  ['week', 7 * 24 * 60 * 60, 5],
];

/** "5 min. ago", "yesterday"; falls back to the date after about a month. */
export function formatRelative(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = (then - now) / 1000;
  if (Math.abs(seconds) < 60) return 'just now';
  for (const [unit, size, limit] of UNITS) {
    const value = Math.round(seconds / size);
    if (Math.abs(value) < limit) return RELATIVE.format(value, unit);
  }
  return formatDate(iso);
}

const STAMP = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Africa/Cairo',
});

/** Receipt-style timestamp: "30.10.26 · 13:42" (Cairo time). */
export function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    STAMP.formatToParts(date).find((p) => p.type === type)?.value ?? '';
  return `${part('day')}.${part('month')}.${part('year')} · ${part('hour')}:${part('minute')}`;
}
