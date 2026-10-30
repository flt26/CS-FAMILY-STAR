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

const RELATIVE = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'long' });
const CAIRO_DAY = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Africa/Cairo',
});

/** Days since 1970 on the Cairo calendar, so "yesterday" means the day before. */
function cairoDay(ms: number): number {
  return Math.round(Date.parse(CAIRO_DAY.format(ms)) / 86_400_000);
}

/** "5 minutes ago", "3 hours ago", "yesterday"; falls back to the date after about a month. */
export function formatRelative(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.floor((now - then) / 60_000);
  // A server clock a little ahead of this device still reads as "just now".
  if (minutes < 1) return 'just now';
  if (minutes < 60) return RELATIVE.format(-minutes, 'minute');
  const days = cairoDay(now) - cairoDay(then);
  if (days <= 0) return RELATIVE.format(-Math.floor(minutes / 60), 'hour');
  if (days < 7) return RELATIVE.format(-days, 'day');
  if (days < 35) return RELATIVE.format(-Math.floor(days / 7), 'week');
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

const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/** lang="ar" for text with Arabic letters in it, so it gets the Arabic typeface. */
export function langOf(text: string): 'ar' | undefined {
  return ARABIC.test(text) ? 'ar' : undefined;
}
