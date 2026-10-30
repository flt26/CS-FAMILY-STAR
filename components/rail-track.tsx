'use client';

import type { ReactNode } from 'react';

/** The rail's scroller. A ticket reached with the keyboard slides fully into view. */
export function RailTrack({ children }: { children: ReactNode }) {
  return (
    <ol
      className="rail__tickets"
      onFocus={(event) => {
        if (!event.target.matches(':focus-visible')) return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        event.target
          .closest('li')
          ?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      }}
    >
      {children}
    </ol>
  );
}
