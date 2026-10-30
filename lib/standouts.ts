import type { Review, Scoreboard, SpotStats } from './reviews';
import { rankScore } from './score';
import { AREA_ORDER, SPOTS, type AreaId, type Spot } from './spots';

export type TicketKind = 'top' | 'most' | 'campus' | 'fresh' | 'open' | 'runner';

export interface Ticket {
  kind: TicketKind;
  spot: Spot;
  stats?: SpotStats;
  /** The latest comment, for the "fresh print" ticket. */
  review?: Review;
}

const NEAR_CAMPUS: AreaId[] = ['fue', 'dreams', 'around'];

/** Five tickets for the rail: the board's standouts, topped up with open tickets, then runners-up. */
export function pickStandouts(board: Scoreboard, recent: Review[], size = 5): Ticket[] {
  const used = new Set<string>();
  const tickets: Ticket[] = [];
  const add = (kind: TicketKind, spot: Spot | undefined, extra: Partial<Ticket> = {}) => {
    if (!spot || used.has(spot.id) || tickets.length >= size) return;
    used.add(spot.id);
    tickets.push({ kind, spot, stats: board.stats[spot.id], ...extra });
  };

  const rated = SPOTS.filter((spot) => board.stats[spot.id]);
  // The menu's own order (few verdicts count less), so a ticket's label always
  // agrees with the rank printed on it.
  const byScore = [...rated].sort(
    (a, b) => rankScore(board.stats[b.id], board.mean) - rankScore(board.stats[a.id], board.mean),
  );
  const mostCount = Math.max(0, ...rated.map((spot) => board.stats[spot.id].count));

  add('top', byScore[0]);
  // Only a spot with the most reviews gets that label. If #1 is also the most
  // reviewed it stays "Top rated" and this ticket is skipped.
  add(
    'most',
    byScore.find((spot) => board.stats[spot.id].count === mostCount && !used.has(spot.id)),
  );
  add(
    'campus',
    byScore.find((spot) => NEAR_CAMPUS.includes(spot.area) && !used.has(spot.id)),
  );
  const latest = recent.find((review) => !used.has(review.spotId));
  if (latest) add('fresh', SPOTS.find((spot) => spot.id === latest.spotId), { review: latest });

  // Point first verdicts at the spots closest to the lecture halls.
  const open = SPOTS.filter((spot) => !board.stats[spot.id]).sort(
    (a, b) => AREA_ORDER.indexOf(a.area) - AREA_ORDER.indexOf(b.area),
  );
  for (const spot of open) add('open', spot);
  // Once every spot has a verdict, the next best fill the rail instead.
  for (const spot of byScore) add('runner', spot);
  return tickets;
}
