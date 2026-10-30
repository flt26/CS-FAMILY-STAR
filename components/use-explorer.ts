'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import type { SpotStats } from '@/lib/reviews';
import { rankScore } from '@/lib/score';
import { matches } from '@/lib/search';
import { AREA_ORDER, SPOTS, type AreaId, type Spot } from '@/lib/spots';
import { DEPARTMENTS, type DepartmentId } from '@/lib/verdicts';

export type SortKey = 'top' | 'most' | 'az';

export interface Row {
  spot: Spot;
  stats: SpotStats | undefined;
  score: number;
}

const PAGE = 28;

const byArea = (a: Spot, b: Spot) =>
  AREA_ORDER.indexOf(a.area) - AREA_ORDER.indexOf(b.area) || a.brand.localeCompare(b.brand);

const COMPARE: Record<SortKey, (a: Row, b: Row) => number> = {
  top: (a, b) => b.score - a.score || byArea(a.spot, b.spot),
  most: (a, b) =>
    (b.stats?.count ?? 0) - (a.stats?.count ?? 0) || b.score - a.score || byArea(a.spot, b.spot),
  az: (a, b) => a.spot.brand.localeCompare(b.spot.brand) || byArea(a.spot, b.spot),
};

export function useExplorer(stats: Record<string, SpotStats>, mean: number) {
  const [query, setQueryState] = useState('');
  const [department, setDepartmentState] = useState<DepartmentId | null>(null);
  const [area, setAreaState] = useState<AreaId | null>(null);
  const [sort, setSortState] = useState<SortKey>('top');
  const [limit, setLimit] = useState(PAGE);
  const deferredQuery = useDeferredValue(query);

  const all = useMemo(
    () => SPOTS.map((spot) => ({ spot, stats: stats[spot.id], score: rankScore(stats[spot.id], mean) })),
    [stats, mean],
  );

  const rows = useMemo(() => {
    const cravings = department ? DEPARTMENTS[department].cravings : null;
    return all
      .filter(
        ({ spot }) =>
          (!cravings || cravings.includes(spot.craving)) &&
          (!area || spot.area === area) &&
          matches(spot, deferredQuery),
      )
      .sort(COMPARE[sort]);
  }, [all, department, area, sort, deferredQuery]);

  // Any change to what is shown starts the receipt from the top again.
  const fresh =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setLimit(PAGE);
    };

  return {
    query,
    setQuery: fresh(setQueryState),
    department,
    setDepartment: fresh(setDepartmentState),
    area,
    setArea: fresh(setAreaState),
    sort,
    setSort: fresh(setSortState),
    rows,
    limit,
    showMore: () => setLimit((current) => current + 40),
    filtered: Boolean(query.trim() || department || area),
    stale: query !== deferredQuery,
    reset: () => {
      setQueryState('');
      setDepartmentState(null);
      setAreaState(null);
      setLimit(PAGE);
    },
  };
}

export type Explorer = ReturnType<typeof useExplorer>;
