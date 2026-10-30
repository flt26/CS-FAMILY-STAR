import type { Scoreboard, SpotStats } from './reviews';

// Ranking by the plain average lets one 5★ verdict beat forty 4.8★ ones.
// Every spot instead starts with PRIOR_WEIGHT imaginary verdicts at the
// campus-wide mean, so a score has to be earned by volume.
const PRIOR_WEIGHT = 3;
const FALLBACK_MEAN = 3.5;

export function rankScore(stats: SpotStats | undefined, mean: number): number {
  const prior = mean > 0 ? mean : FALLBACK_MEAN;
  if (!stats || stats.count === 0) return 0;
  return (PRIOR_WEIGHT * prior + stats.sum) / (PRIOR_WEIGHT + stats.count);
}

/** Competition rank among rated spots (1 = best), or null for a spot nobody has rated. */
export function rankOf(stats: SpotStats | undefined, board: Scoreboard): number | null {
  if (!stats) return null;
  const score = rankScore(stats, board.mean);
  return 1 + Object.values(board.stats).filter((other) => rankScore(other, board.mean) > score).length;
}
