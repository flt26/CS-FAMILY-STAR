'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AREAS } from '@/lib/spots';
import { useExplorerState } from './explorer-context';
import { DotGlyph } from './marks';
import type { Row } from './use-explorer';

function jumpToMenu() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('menu')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

/** The terminal-style search. Filters the menu below as you type. */
export function Prompt() {
  const { query, setQuery } = useExplorerState();
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" jumps to the search, like every dev tool.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (target.closest('input, textarea, select, [contenteditable], dialog')) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <form
      className="prompt"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        inputRef.current?.blur();
        jumpToMenu();
      }}
    >
      <label className="sr-only" htmlFor="q">
        Search spots, areas or cravings
      </label>
      <span className="prompt__sigil" aria-hidden="true">
        &gt;
      </span>
      <input
        ref={inputRef}
        id="q"
        type="search"
        placeholder=" "
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <span className="prompt__ph" aria-hidden="true">
        koshary, coffee, dreams mall
        <i className="caret" />
      </span>
      {query ? (
        <button type="button" className="prompt__clear" onClick={() => setQuery('')}>
          Clear
        </button>
      ) : (
        <kbd className="prompt__kbd" title="Press / to search">
          /
        </kbd>
      )}
    </form>
  );
}

function pick(rows: Row[]): Row | undefined {
  if (rows.length === 0) return undefined;
  const rated = rows.filter((row) => row.stats);
  // Mostly the crowd favourites, sometimes a wildcard so open tickets get a shot.
  const pool = rated.length > 0 && Math.random() < 0.75 ? rated.slice(0, 10) : rows;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** "Where are we eating today?" — answered by the app, within the active filters. */
export function PickForMe() {
  const { rows, filtered } = useExplorerState();
  const [picked, setPicked] = useState<Row | null>(null);

  function roll() {
    let next = pick(rows);
    // Don't hand back the same answer twice in a row when there is a choice.
    if (next && picked && next.spot.id === picked.spot.id && rows.length > 1) next = pick(rows);
    setPicked(next ?? null);
  }

  return (
    <div className="pick-for-me">
      <button className="key key--chalk" type="button" onClick={roll} disabled={rows.length === 0}>
        <DotGlyph name="dice" />
        <span className="ar" lang="ar" dir="rtl">
          {picked ? 'غيرها' : 'اختارلي انت'}
        </span>
        <span>{picked ? 'Again' : 'Pick for me'}</span>
      </button>
      <p className="pick-for-me__out" aria-live="polite">
        {picked && (
          <Link href={`/spot/${picked.spot.id}`} className="pick-slip paper torn-b">
            <span className="label muted">{filtered ? 'From your filters' : 'Today’s pick'}</span>
            <span className="pick-slip__name cond">{picked.spot.brand}</span>
            <span className="label muted">
              {AREAS[picked.spot.area].en} ·{' '}
              {picked.stats ? `${picked.stats.average.toFixed(1)}/5 from ${picked.stats.count}` : 'open ticket'} →
            </span>
          </Link>
        )}
      </p>
    </div>
  );
}
