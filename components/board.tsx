'use client';

import Link from 'next/link';
import { useState } from 'react';
import { plural } from '@/lib/format';
import { useMyVerdicts } from '@/lib/local-profile';
import { AREA_ORDER, AREAS, CRAVINGS, SPOTS, type AreaId } from '@/lib/spots';
import { DEPARTMENTS, type DepartmentId } from '@/lib/verdicts';
import { useExplorerState } from './explorer-context';
import { Asterisk, Barcode, DotGlyph, type GlyphName } from './marks';
import { RateTrigger } from './rate-context';
import type { Row, SortKey } from './use-explorer';

const DEPARTMENT_IDS = Object.keys(DEPARTMENTS) as DepartmentId[];
const DEPARTMENT_COUNTS = Object.fromEntries(
  DEPARTMENT_IDS.map((id) => [id, SPOTS.filter((spot) => DEPARTMENTS[id].cravings.includes(spot.craving)).length]),
);
const AREA_COUNTS = Object.fromEntries(
  AREA_ORDER.map((area) => [area, SPOTS.filter((spot) => spot.area === area).length]),
);
const GLYPHS: Record<DepartmentId, GlyphName> = {
  coffee: 'coffee',
  quick: 'quick',
  sitdown: 'sitdown',
  egyptian: 'egyptian',
};
const SORTS: { id: SortKey; label: string }[] = [
  { id: 'top', label: 'Top' },
  { id: 'most', label: 'Most' },
  { id: 'az', label: 'A–Z' },
];
const SORT_NOTES: Record<SortKey, string> = {
  top: 'top rated, weighted by receipts',
  most: 'most receipts first',
  az: 'A to Z',
};

export function Pad() {
  const { query, department, setDepartment, area, setArea, sort, setSort, rows, filtered, reset } = useExplorerState();

  const flags = [
    query.trim() && `-q "${query.trim()}"`,
    department && `--${department}`,
    area && `--zone=${area}`,
    `--sort=${sort}`,
  ]
    .filter(Boolean)
    .join(' ');

  // On phones the pad folds to one line so the menu isn't 800px away.
  const [open, setOpen] = useState(false);

  return (
    <aside className="pad" aria-label="Filters and sort" data-open={open}>
      <div className="pad__head">
        <h2 className="cond">Modify order</h2>
        <button className="pad__reset" type="button" onClick={reset} disabled={!filtered}>
          Reset
        </button>
      </div>
      <button
        type="button"
        className="pad__toggle key"
        aria-expanded={open}
        aria-controls="pad-body"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? 'Done' : 'Filters & sort'}
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      <div className="pad__body" id="pad-body">

      <fieldset className="pad__group">
        <legend className="label">Department</legend>
        <div className="keys keys--dept">
          <label className="pick">
            <input type="radio" name="department" checked={!department} onChange={() => setDepartment(null)} />
            <span className="pick__face">
              <span className="pick__row">
                <DotGlyph name="all" />
                <span className="pick__count">{SPOTS.length}</span>
              </span>
              <span className="pick__label">All</span>
            </span>
          </label>
          {DEPARTMENT_IDS.map((id) => (
            <label className="pick" key={id}>
              <input type="radio" name="department" checked={department === id} onChange={() => setDepartment(id)} />
              <span className="pick__face">
                <span className="pick__row">
                  <DotGlyph name={GLYPHS[id]} />
                  <span className="pick__count">{DEPARTMENT_COUNTS[id]}</span>
                </span>
                <span className="pick__label">{DEPARTMENTS[id].en}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="pad__group">
        <legend className="label">Pickup zone</legend>
        <div className="select">
          <label className="sr-only" htmlFor="zone-select">
            Pickup zone
          </label>
          <select
            id="zone-select"
            value={area ?? ''}
            onChange={(event) => setArea((event.target.value as AreaId) || null)}
          >
            <option value="">All zones · {SPOTS.length}</option>
            {AREA_ORDER.map((id) => (
              <option key={id} value={id}>
                {AREAS[id].en} · {AREA_COUNTS[id]}
              </option>
            ))}
          </select>
        </div>
        <ul className="zones">
          {[null, ...AREA_ORDER].map((id) => (
            <li key={id ?? 'all'}>
              <label className="zone">
                <input type="radio" name="zone" checked={area === id} onChange={() => setArea(id)} />
                <span className="zone__radio" aria-hidden="true" />
                <span className="zone__name">{id ? AREAS[id].en : 'All zones'}</span>
                <span className="zone__n">{id ? AREA_COUNTS[id] : SPOTS.length}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset className="pad__group">
        <legend className="label">Sort</legend>
        <div className="keys keys--sort">
          {SORTS.map((option) => (
            <label className="pick" key={option.id}>
              <input type="radio" name="sort" checked={sort === option.id} onChange={() => setSort(option.id)} />
              <span className="pick__face">
                <span className="pick__label">{option.label}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      </div>
      <p className="echo" aria-live="polite">
        <b>$</b> <span>spots {flags}</span>
        <br />→ {plural(rows.length, 'line')}
        {sort === 'top' ? ' · weighted' : ''}
      </p>
    </aside>
  );
}

export function Menu({ ok }: { ok: boolean }) {
  const { rows, sort, limit, showMore, stale, filtered, reset } = useExplorerState();
  const mine = useMyVerdicts();

  const rated = sort === 'az' ? rows : rows.filter((row) => row.stats);
  const open = sort === 'az' ? [] : rows.filter((row) => !row.stats);
  const shownRated = rated.slice(0, limit);
  const shownOpen = open.slice(0, Math.max(0, limit - shownRated.length));
  const left = rows.length - shownRated.length - shownOpen.length;

  return (
    <section className="menu" aria-labelledby="menu-title">
      <div className="slot" aria-hidden="true" />
      <div className="paper menu__paper torn-b shadowed" data-stale={stale}>
        <div className="rule-stars" aria-hidden="true" />
        <header className="menu__head">
          <h2 id="menu-title" className="cond">
            The menu
          </h2>
          <p className="dot" lang="ar" dir="rtl">
            المنيو
          </p>
          <p className="menu__meta label">
            {plural(rows.length, 'spot')} · {SORT_NOTES[sort]}
          </p>
          <p className="legend">
            <span>
              <b className="plus">+</b> loved it (4–5)
            </span>
            <span>
              <b className="minus">−</b> nope (1–2)
            </span>
            <span>× = receipts</span>
          </p>
          {!ok && <p className="notice">Scores are offline for a moment. The menu still works; ratings will be back.</p>}
        </header>
        <div className="cols label" aria-hidden="true">
          <span>#</span>
          <span>Spot</span>
          <span>Score</span>
        </div>

        {rows.length === 0 ? (
          <div className="nothing">
            <p className="cond">Nothing on the menu</p>
            <p>No spot matches that. Try a shorter word, or clear the filters.</p>
            {filtered && (
              <button type="button" className="key key--paper" onClick={reset}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <ol className="lines">
            {sort !== 'az' && shownRated.length > 0 && (
              <li className="rated-head label" aria-hidden="true">
                <span>Rated · {rated.length}</span>
                <span>{sort === 'top' ? 'weighted score' : 'by receipts'}</span>
              </li>
            )}
            {shownRated.map((row, index) => (
              <Line key={row.spot.id} row={row} index={index} mine={mine[row.spot.id]} />
            ))}
            {shownOpen.length > 0 && (
              <li className="open-head">
                <div className="open-head__title">
                  <p className="cond">Open tickets</p>
                  <p className="dot">{open.length}</p>
                </div>
                <p>
                  No reviews yet. The first review on each spot becomes its <em>initial commit</em> — and stays on
                  top of its receipt forever.
                </p>
                <p className="ar" lang="ar" dir="rtl">
                  محدش جربهم لسه — افتتحها انت
                </p>
              </li>
            )}
            {shownOpen.map((row, index) => (
              <Line key={row.spot.id} row={row} index={shownRated.length + index} mine={mine[row.spot.id]} />
            ))}
          </ol>
        )}

        {left > 0 && (
          <button className="more" type="button" onClick={showMore}>
            Print {Math.min(left, 40)} more {Math.min(left, 40) === 1 ? 'line' : 'lines'}
          </button>
        )}
        <footer className="menu__end">
          <div className="rule-stars" aria-hidden="true" />
          <span className="label">End of menu · {SPOTS.length} spots all day</span>
          <Barcode code="fue-menu" />
          <small>Menu · weighted average · prior 3 receipts</small>
        </footer>
      </div>
    </section>
  );
}

function Line({ row, index, mine }: { row: Row; index: number; mine: number | undefined }) {
  const { spot, stats } = row;
  const no = String(index + 1).padStart(2, '0');
  const meta = `${AREAS[spot.area].en} · ${CRAVINGS[spot.craving].en}`;
  const title = (
    <span className="line__title">
      <span className="line__name">{spot.brand}</span>
      <span className="line__lead" aria-hidden="true" />
    </span>
  );

  if (!stats) {
    return (
      <li className="line line--open">
        <Link className="line__main" href={`/spot/${spot.id}`}>
          <span className="line__no">{no}</span>
          {title}
          <span className="line__meta">
            {meta}
            <span className="sr-only">, no reviews yet</span>
          </span>
        </Link>
        <RateTrigger spotId={spot.id} open className="line__rate">
          <Asterisk />
          Rate<span className="sr-only"> {spot.brand}</span>
        </RateTrigger>
      </li>
    );
  }

  const [one, two, , four, five] = stats.histogram;
  return (
    <li className="line">
      <Link className="line__main" href={`/spot/${spot.id}`}>
        <span className="line__no">{no}</span>
        {title}
        <span className="line__score dot">
          {stats.average.toFixed(1)}
          <span className="sr-only"> out of 5 from {plural(stats.count, 'review')}</span>
        </span>
        <span className="line__meta">{meta}</span>
        <span className="line__count">
          ×{stats.count}
          {four + five > 0 && <b className="plus"> +{four + five}</b>}
          {one + two > 0 && <b className="minus"> −{one + two}</b>}
          {mine !== undefined && <span className="line__mine"> · you {mine}</span>}
        </span>
      </Link>
    </li>
  );
}
