'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { plural } from '@/lib/format';
import { AREAS } from '@/lib/spots';
import { useExplorerState } from './explorer-context';
import { DotGlyph } from './marks';
import type { Row } from './use-explorer';

function jumpToMenu() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('menu-lines')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

/** The terminal-style search. Filters the menu below as you type. */
export function Prompt() {
  const { query, setQuery } = useExplorerState();
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" jumps to the search, like every dev tool.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      // Only from "nowhere": never steal a key meant for a focused control.
      if (document.activeElement && document.activeElement !== document.body) return;
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
        koshary, latte, burgers
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

function pick(rows: Row[], previous: Row | null): Row | undefined {
  // Never hand back the same answer twice in a row when there is a choice.
  const choices = rows.length > 1 && previous ? rows.filter((row) => row.spot.id !== previous.spot.id) : rows;
  if (choices.length === 0) return undefined;
  // Mostly the crowd favourites (by score, whatever the list is sorted by),
  // sometimes a wildcard so open tickets get a shot.
  const favourites = choices
    .filter((row) => row.stats)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  const pool = favourites.length > 0 && Math.random() < 0.75 ? favourites : choices;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** "Where are we eating today?" — answered by the app, within the active filters. */
export function PickForMe() {
  const { rows, filtered } = useExplorerState();
  const [picked, setPicked] = useState<Row | null>(null);

  function roll() {
    setPicked(pick(rows, picked) ?? null);
  }

  return (
    <div className="pick-for-me">
      <button className="key key--chalk" type="button" onClick={roll} disabled={rows.length === 0}>
        <DotGlyph name="dice" />
        <span>{picked ? 'Again' : 'Pick for me'}</span>
        <span className="ar" lang="ar" dir="rtl">
          {picked ? 'غيرها' : 'اختارلي إنت'}
        </span>
      </button>
      <p className="pick-for-me__out" aria-live="polite">
        {picked && (
          <Link href={`/spot/${picked.spot.id}`} className="pick-slip paper torn-b">
            <span className="label muted">{filtered ? 'From your filters' : 'Try this'}</span>
            <span className="pick-slip__name cond">{picked.spot.brand}</span>
            <span className="label muted">
              {AREAS[picked.spot.area].en} ·{' '}
              {picked.stats
                ? `${picked.stats.average.toFixed(1)}/5 · ${plural(picked.stats.count, 'review')}`
                : 'no reviews yet'}{' '}
              <span aria-hidden="true">→</span>
            </span>
          </Link>
        )}
      </p>
    </div>
  );
}
