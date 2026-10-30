'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { plural } from '@/lib/format';
import { useMyVerdicts } from '@/lib/local-profile';
import { AREA_ORDER, AREAS, branchOf, CRAVINGS, SPOTS, type AreaId } from '@/lib/spots';
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
  { id: 'top', label: 'Top rated' },
  { id: 'most', label: 'Most reviews' },
  { id: 'az', label: 'A–Z' },
];
const SORT_NOTES: Record<SortKey, string> = {
  top: 'best first · a few reviews count less',
  most: 'most reviews first',
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
        <h2 className="cond">Filter the menu</h2>
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

      <fieldset className="pad__group">
        <legend className="label">Food type</legend>
        <div className="keys keys--dept">
          <label className="pick">
            <input type="radio" name="department" checked={!department} onChange={() => setDepartment(null)} />
            <span className="pick__face">
              <span className="pick__row">
                <DotGlyph name="all" />
                <span className="pick__count" aria-hidden="true">
                  {SPOTS.length}
                </span>
              </span>
              <span className="pick__label">
                All<span className="sr-only"> ({SPOTS.length} spots)</span>
              </span>
            </span>
          </label>
          {DEPARTMENT_IDS.map((id) => (
            <label className="pick" key={id}>
              <input type="radio" name="department" checked={department === id} onChange={() => setDepartment(id)} />
              <span className="pick__face">
                <span className="pick__row">
                  <DotGlyph name={GLYPHS[id]} />
                  <span className="pick__count" aria-hidden="true">
                    {DEPARTMENT_COUNTS[id]}
                  </span>
                </span>
                <span className="pick__label">
                  {DEPARTMENTS[id].en}
                  <span className="sr-only"> ({DEPARTMENT_COUNTS[id]} spots)</span>
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="pad__group">
        <legend className="label">Area</legend>
        <div className="select">
          <label className="sr-only" htmlFor="zone-select">
            Area
          </label>
          <select
            id="zone-select"
            value={area ?? ''}
            onChange={(event) => setArea((event.target.value as AreaId) || null)}
          >
            <option value="">All areas · {SPOTS.length}</option>
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
                <span className="zone__name">{id ? AREAS[id].en : 'All areas'}</span>
                <span className="zone__n">{id ? AREA_COUNTS[id] : SPOTS.length}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      </div>
      <p className="echo" aria-hidden="true">
        <b>$</b> <span>spots {flags}</span>
        <br />→ {plural(rows.length, 'line')}
        {sort === 'top' ? ' · weighted' : ''}
      </p>
      <p className="sr-only" role="status">
        {rows.length === 1 ? '1 spot matches' : `${rows.length} spots match`}
      </p>
    </aside>
  );
}

export function Menu({ ok }: { ok: boolean }) {
  const { rows, sort, limit, showMore, stale, filtered, query, reset } = useExplorerState();
  const mine = useMyVerdicts();

  // Once the paper has fed out, don't make the reader wait for it again.
  useEffect(() => {
    const timer = setTimeout(() => {
      document.documentElement.dataset.printed = '1';
      try {
        sessionStorage.setItem('csfs:printed', '1');
      } catch {
        // Storage blocked: the animation just plays again next time.
      }
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  // With scores offline nothing can be called unrated, so the list stays whole.
  const split = ok && sort !== 'az';
  const rated = split ? rows.filter((row) => row.stats) : rows;
  const open = split ? rows.filter((row) => !row.stats) : [];
  const shownRated = rated.slice(0, limit);
  const shownOpen = open.slice(0, Math.max(0, limit - shownRated.length));
  const left = rows.length - shownRated.length - shownOpen.length;

  const linesRef = useRef<HTMLOListElement>(null);
  const focusFrom = useRef<number | null>(null);
  useEffect(() => {
    if (focusFrom.current === null) return;
    const links = linesRef.current?.querySelectorAll<HTMLElement>('.line__main');
    links?.[focusFrom.current]?.focus();
    focusFrom.current = null;
  }, [limit]);

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
          {!ok && <p className="notice">Scores are offline for a moment. The menu still works; ratings will be back.</p>}
        </header>

        {rows.length === 0 ? (
          <div className="nothing">
            <p className="cond">Nothing on the menu</p>
            <p>
              {query.trim() ? (
                <>
                  Nothing matches “<span dir="auto">{query.trim()}</span>”. Try a shorter word
                </>
              ) : (
                'No spot matches that. Try another zone'
              )}
              {filtered ? ', or clear the filters.' : '.'}
            </p>
            {filtered && (
              <button type="button" className="key key--paper" onClick={reset}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <ol className="lines" id="menu-lines" ref={linesRef}>
            {split && shownRated.length > 0 && (
              <li className="rated-head label" aria-hidden="true">
                <span>Rated · {rated.length}</span>
                <span>avg /5</span>
              </li>
            )}
            {shownRated.map((row, index) => (
              <Line key={row.spot.id} row={row} index={index} mine={mine[row.spot.id]} offline={!ok} />
            ))}
            {shownOpen.length > 0 && (
              <li className="open-head">
                <div className="open-head__title">
                  <p className="cond">Open tickets</p>
                  <p className="dot">{open.length}</p>
                </div>
                <p>No reviews yet. Rate one first and your name goes on its ticket as the first reviewer.</p>
                <p className="ar" lang="ar" dir="rtl">
                  محدش قيّمهم لسه — خليك إنت الأول
                </p>
              </li>
            )}
            {shownOpen.map((row, index) => (
              <Line key={row.spot.id} row={row} index={shownRated.length + index} mine={mine[row.spot.id]} />
            ))}
          </ol>
        )}

        {left > 0 && (
          <button
            className="more"
            type="button"
            onClick={() => {
              focusFrom.current = shownRated.length + shownOpen.length;
              showMore();
            }}
          >
            Show {Math.min(left, 40)} more {Math.min(left, 40) === 1 ? 'spot' : 'spots'}
          </button>
        )}
        {left === 0 && rows.length > 0 && (
          <footer className="menu__end">
            <div className="rule-stars" aria-hidden="true" />
            <span className="label">End of menu · {plural(rows.length, 'spot')}</span>
            <Barcode code="fue-menu" />
            <small>Ranked by average, adjusted for how many people rated: a spot with only a few reviews starts near the campus average.</small>
          </footer>
        )}
      </div>
    </section>
  );
}

function Line({
  row,
  index,
  mine,
  offline = false,
}: {
  row: Row;
  index: number;
  mine: number | undefined;
  offline?: boolean;
}) {
  const { spot, stats } = row;
  const no = String(index + 1).padStart(2, '0');
  const branch = branchOf(spot);
  const meta = `${AREAS[spot.area].en} · ${CRAVINGS[spot.craving].en}`;
  const title = (
    <span className="line__title">
      <span className="line__name">
        {spot.brand}
        {branch && <span className="line__branch"> · {branch}</span>}
      </span>
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
            {!offline && <span className="sr-only">, no reviews yet</span>}
          </span>
        </Link>
        <RateTrigger spotId={spot.id} open={!offline} className="line__rate">
          <Asterisk />
          Rate<span className="sr-only"> {spot.brand}</span>
        </RateTrigger>
      </li>
    );
  }

  const nope = stats.histogram[0] + stats.histogram[1];
  // One or two verdicts are a hint, not a reputation; the score prints lighter.
  const thin = stats.count < 3;
  return (
    <li className="line" data-thin={thin || undefined}>
      <Link className="line__main" href={`/spot/${spot.id}`}>
        <span className="line__no">{no}</span>
        {title}
        <span className="line__score dot">
          {stats.average.toFixed(1)}
          <span className="sr-only"> out of 5 from {plural(stats.count, 'review')}</span>
        </span>
        <span className="line__meta">{meta}</span>
        <span className="line__count">
          {plural(stats.count, 'review')}
          {nope > 0 && <b className="minus"> · {nope} nope</b>}
          {mine !== undefined && <span className="line__mine"> · you {mine}</span>}
        </span>
      </Link>
    </li>
  );
}
