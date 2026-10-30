'use client';

import { useSyncExternalStore } from 'react';
import { formatDate, formatRelative } from '@/lib/format';

const MINUTE = 60_000;

function subscribe(onTick: () => void) {
  const timer = window.setInterval(onTick, MINUTE);
  return () => window.clearInterval(timer);
}

// Rounded to the minute so the snapshot only changes when the label could.
const clientNow = () => Math.floor(Date.now() / MINUTE) * MINUTE;
const serverNow = () => 0;

/** Prints the date on the server, then "3 hr. ago" once the browser takes over. */
export function TimeAgo({ iso, className }: { iso: string; className?: string }) {
  const now = useSyncExternalStore(subscribe, clientNow, serverNow);
  return (
    <time dateTime={iso} title={formatDate(iso)} className={className}>
      {now ? formatRelative(iso, now) : formatDate(iso)}
    </time>
  );
}
