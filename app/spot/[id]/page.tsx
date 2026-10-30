import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Barcode, orderNo } from '@/components/marks';
import { MyVerdict } from '@/components/my-verdict';
import { RateTrigger } from '@/components/rate-context';
import { ShareButton } from '@/components/share-button';
import { Slip, tiltFor } from '@/components/slip';
import { formatDate, langOf, plural } from '@/lib/format';
import { getScoreboard, getSpotReviews, type Review, type Scoreboard, type SpotStats } from '@/lib/reviews';
import { rankOf, rankScore } from '@/lib/score';
import { AREAS, branchOf, CRAVINGS, getSpot, mapsUrl, SPOTS, type Spot } from '@/lib/spots';
import { VERDICTS } from '@/lib/verdicts';

export function generateStaticParams() {
  return SPOTS.map((spot) => ({ id: spot.id }));
}

export async function generateMetadata({ params }: PageProps<'/spot/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const spot = getSpot(id);
  // Link-preview bots wait for metadata before anything streams, so this
  // gives them a real 404. Browsers get the not-found page from SpotDetails.
  if (!spot) notFound();
  const board = await getScoreboard();
  const stats = board.stats[spot.id];
  const where = `${CRAVINGS[spot.craving].en} · ${spot.vicinity}`;
  return {
    title: `${spot.brand} · ${AREAS[spot.area].en}`,
    description: stats
      ? `${stats.average.toFixed(1)}/5 from ${plural(stats.count, 'student review')}. ${where}. On CS Family Star.`
      : `${where}. No reviews yet: be the first to rate ${spot.brand} on CS Family Star.`,
    alternates: { canonical: `/spot/${spot.id}` },
  };
}

export default function SpotPage({ params }: PageProps<'/spot/[id]'>) {
  return (
    <Suspense fallback={<p className="void label muted">Printing the ticket…</p>}>
      <SpotDetails params={params} />
    </Suspense>
  );
}

async function SpotDetails({ params }: Pick<PageProps<'/spot/[id]'>, 'params'>) {
  const { id } = await params;
  const spot = getSpot(id);
  if (!spot) notFound();
  const [board, { ok, reviews, first }] = await Promise.all([getScoreboard(), getSpotReviews(spot.id)]);
  const stats = board.stats[spot.id];
  // Rating-only verdicts print as one tally instead of a stack of empty receipts.
  const said = reviews.filter((review) => review.comment || review.imageUrl);
  const quiet = reviews.filter((review) => !review.comment && !review.imageUrl);

  return (
    <div className="spot">
      <Link className="back" href="/#menu-lines">
        <span aria-hidden="true">←</span> The menu
      </Link>
      <OrderTicket spot={spot} board={board} stats={stats} first={first} />
      <section className="receipts" aria-labelledby="receipts-title">
        <header className="sec-head">
          <h2 id="receipts-title" className="cond">
            Receipts
          </h2>
          <p className="ar" lang="ar" dir="rtl">
            قالوا إيه
          </p>
        </header>
        {!ok && <p className="notice">Reviews are offline for a moment. Try again in a minute.</p>}
        {reviews.length > 0 ? (
          <ol className="slips">
            {said.map((review, index) => (
              <Slip
                key={review.id}
                review={review}
                spot={spot}
                first={review.createdAt === stats?.firstAt}
                tilt={tiltFor(index)}
              />
            ))}
            {quiet.length > 0 && <Tally reviews={quiet} said={said.length > 0} />}
          </ol>
        ) : (
          ok && (
            <p className="empty">
              <b>No reviews yet.</b> Rate it first and your name goes on this ticket as the first reviewer.
            </p>
          )
        )}
      </section>
      <SameCounter spot={spot} board={board} />
    </div>
  );
}

/** Rating-only verdicts, summed up on one slip. */
function Tally({ reviews, said }: { reviews: Review[]; said: boolean }) {
  const counts = [5, 4, 3, 2, 1].map((star) => [star, reviews.filter((review) => review.rating === star).length]);
  return (
    <li className="slip slip--tally paper torn-t torn-b shadowed">
      <p className="slip__top label">
        <span>
          {said ? '+ ' : ''}
          {plural(reviews.length, 'review')}
        </span>
        <span>rating only</span>
      </p>
      {counts
        .filter(([, count]) => count > 0)
        .map(([star, count]) => (
          <p className="leader" key={star}>
            <span>
              {star}/5 · {VERDICTS[star].word}
            </span>
            <b>×{count}</b>
          </p>
        ))}
    </li>
  );
}

function OrderTicket({
  spot,
  board,
  stats,
  first,
}: {
  spot: Spot;
  board: Scoreboard;
  stats: SpotStats | undefined;
  first: Review | null;
}) {
  const branch = branchOf(spot);
  const rank = rankOf(stats, board);
  const verdict = stats ? VERDICTS[Math.round(stats.average)] : null;
  // During an outage a rated spot must not look like an open ticket.
  const open = board.ok && !stats;

  return (
    <article className="order paper torn-b shadowed" aria-labelledby="spot-title">
      <div className="order__top">
        {rank ? (
          <span className="tag">
            Rank #{String(rank).padStart(2, '0')} of {Object.keys(board.stats).length} rated
          </span>
        ) : open ? (
          <span className="tag tag--open">No reviews yet</span>
        ) : (
          <span className="tag tag--ink">Scores offline</span>
        )}
        <span className="label muted">Order #{orderNo(spot.id)}</span>
      </div>
      <h1 id="spot-title" className="order__name cond">
        {spot.brand}
        {branch && <span className="order__branch">{branch}</span>}
      </h1>
      <p className="order__where label">
        {CRAVINGS[spot.craving].en} · {spot.vicinity}
      </p>
      <div className="rule-double" />

      {stats && verdict ? (
        <>
          <div className="order__total">
            <span className="label">Avg</span>
            <span className="label">{plural(stats.count, 'review')}</span>
            <p className="order__score dot">
              {stats.average.toFixed(1)}
              <small>/5</small>
            </p>
            <p className="order__verdict cond">
              {verdict.cs}
              <span className="ar" lang="ar" dir="rtl">
                {verdict.ar}
              </span>
            </p>
          </div>
          <div className="rule-dash" />
          <Histogram stats={stats} />
        </>
      ) : open ? (
        <div className="blank" aria-hidden="true">
          <span>Score</span>
          <span className="blank__box">
            <span />
            /5
          </span>
          <span>First review by</span>
          <span className="blank__line" />
        </div>
      ) : (
        <div className="order__total order__total--offline">
          <span className="label">Avg</span>
          <span className="label">Offline for a moment</span>
          <p className="order__score dot" aria-hidden="true">
            --
            <small>/5</small>
          </p>
        </div>
      )}

      <div className="order__actions">
        <RateTrigger spotId={spot.id} open={open} className="key key--red">
          <span>{open ? 'Be the first' : 'Rate it'}</span>
          <span className="ar" lang="ar" dir="rtl">
            {open ? 'يلا أول تقييم' : 'يلا نقيّمه'}
          </span>
        </RateTrigger>
        <a className="key key--paper" href={mapsUrl(spot)} target="_blank" rel="noopener noreferrer">
          Maps <span aria-hidden="true">↗</span>
        </a>
        <ShareButton
          path={`/spot/${spot.id}`}
          title={`${spot.brand}${branch ? ` (${branch})` : ''} on CS Family Star`}
          className="key key--paper"
        />
      </div>
      <MyVerdict spotId={spot.id} />
      {first && (
        <p className="order__first">
          First review by{' '}
          <b dir="auto" lang={langOf(first.name)}>
            {first.name}
          </b>{' '}
          · {formatDate(first.createdAt)}
        </p>
      )}
      <Barcode code={spot.id} />
    </article>
  );
}

function Histogram({ stats }: { stats: SpotStats }) {
  const most = Math.max(...stats.histogram, 1);
  return (
    <div className="histogram" role="img" aria-label={histogramLabel(stats)}>
      {[5, 4, 3, 2, 1].map((star) => {
        const count = stats.histogram[star - 1];
        return (
          <div className="histogram__row" key={star} aria-hidden="true">
            <span className="dot">{star}</span>
            <span className="histogram__word">{VERDICTS[star].word}</span>
            <span className="histogram__bar">
              <span style={{ width: `${(count / most) * 100}%` }} />
            </span>
            <b>{count}</b>
          </div>
        );
      })}
    </div>
  );
}

const histogramLabel = (stats: SpotStats) =>
  [5, 4, 3, 2, 1].map((star) => `${stats.histogram[star - 1]} gave ${star}`).join(', ');

function SameCounter({ spot, board }: { spot: Spot; board: Scoreboard }) {
  const neighbours = SPOTS.filter((other) => other.area === spot.area && other.id !== spot.id).sort(
    (a, b) =>
      rankScore(board.stats[b.id], board.mean) - rankScore(board.stats[a.id], board.mean) ||
      a.brand.localeCompare(b.brand),
  );
  if (neighbours.length === 0) return null;
  const shown = neighbours.slice(0, 8);

  return (
    <aside className="counter paper torn-b shadowed" aria-labelledby="counter-kicker counter-title">
      <p className="label" id="counter-kicker">
        More at
      </p>
      <h2 id="counter-title" className="cond">
        {AREAS[spot.area].en}
      </h2>
      <ul>
        {shown.map((other) => {
          const stats = board.stats[other.id];
          return (
            <li key={other.id}>
              <Link href={`/spot/${other.id}`}>
                <span className="line__name">{other.brand}</span>
                <span className="line__lead" aria-hidden="true" />
                {stats ? (
                  <span className="dot">{stats.average.toFixed(1)}</span>
                ) : board.ok ? (
                  <span className="open">no reviews</span>
                ) : (
                  <span className="dot">--</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      {neighbours.length > shown.length && (
        <p className="label counter__more">+{neighbours.length - shown.length} more on the menu</p>
      )}
    </aside>
  );
}
