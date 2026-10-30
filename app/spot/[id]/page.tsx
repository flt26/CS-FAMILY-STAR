import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Barcode, orderNo } from '@/components/marks';
import { MyVerdict } from '@/components/my-verdict';
import { RateTrigger } from '@/components/rate-context';
import { ShareButton } from '@/components/share-button';
import { Slip, tiltFor } from '@/components/slip';
import { formatDate, plural } from '@/lib/format';
import { getScoreboard, getSpotReviews, type Review, type Scoreboard, type SpotStats } from '@/lib/reviews';
import { rankScore } from '@/lib/score';
import { AREAS, CRAVINGS, getSpot, mapsUrl, SPOTS, type Spot } from '@/lib/spots';
import { VERDICTS } from '@/lib/verdicts';

export function generateStaticParams() {
  return SPOTS.map((spot) => ({ id: spot.id }));
}

export async function generateMetadata({ params }: PageProps<'/spot/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const spot = getSpot(id);
  if (!spot) return { title: 'Not on the menu' };
  const stats = (await getScoreboard()).stats[spot.id];
  const where = `${CRAVINGS[spot.craving].en} at ${AREAS[spot.area].en}, New Cairo`;
  return {
    title: `${spot.brand} · ${AREAS[spot.area].en}`,
    description: stats
      ? `${stats.average.toFixed(1)}/5 from ${plural(stats.count, 'student review')}. ${where}, rated by FUE students.`
      : `${where}. No student reviews yet — be the first on CS Family Star.`,
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
  const [board, { ok, reviews }] = await Promise.all([getScoreboard(), getSpotReviews(spot.id)]);
  const stats = board.stats[spot.id];
  const first = stats && reviews.find((review) => review.createdAt === stats.firstAt);

  return (
    <div className="spot">
      <Link className="back" href="/#menu">
        ← The menu
      </Link>
      <OrderTicket spot={spot} board={board} stats={stats} first={first} />
      <section className="receipts" aria-labelledby="receipts-title">
        <header className="sec-head">
          <h2 id="receipts-title" className="cond">
            Receipts
          </h2>
          <p className="ar" lang="ar" dir="rtl">
            الإيصالات
          </p>
        </header>
        {!ok && <p className="notice">Reviews are offline for a moment. Try again in a minute.</p>}
        {reviews.length > 0 ? (
          <ol className="slips">
            {reviews.map((review, index) => (
              <Slip
                key={review.id}
                review={review}
                spot={spot}
                first={review.createdAt === stats?.firstAt}
                tilt={tiltFor(index)}
              />
            ))}
          </ol>
        ) : (
          ok && (
            <div className="empty">
              <p>
                <b>Open ticket.</b> Nobody has rated {spot.brand} yet. Your review becomes its initial commit and
                stays first on this page.
              </p>
              <RateTrigger spotId={spot.id} open className="key key--red empty__cta">
                Be the first
              </RateTrigger>
            </div>
          )
        )}
      </section>
      <SameCounter spot={spot} board={board} />
    </div>
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
  first: Review | undefined;
}) {
  const branch = spot.name.startsWith(`${spot.brand} - `) ? spot.name.slice(spot.brand.length + 3) : null;
  const rated = SPOTS.filter((other) => board.stats[other.id]);
  const rank = stats
    ? 1 + rated.filter((other) => rankScore(board.stats[other.id], board.mean) > rankScore(stats, board.mean)).length
    : null;
  const verdict = stats ? VERDICTS[Math.round(stats.average)] : null;

  return (
    <article className="order paper torn-b shadowed" aria-labelledby="spot-title">
      <div className="order__top">
        {rank ? (
          <span className={rank <= 3 ? 'tag' : 'tag tag--ink'}>
            Rank #{String(rank).padStart(2, '0')} of {rated.length}
          </span>
        ) : (
          <span className="tag tag--open">Open ticket</span>
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
            <span className="label">Total</span>
            <span className="label">×{plural(stats.count, 'receipt')}</span>
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
      ) : (
        <div className="blank" aria-hidden="true">
          <span>Score</span>
          <span className="blank__box">
            <span />
            /5
          </span>
          <span>First review by</span>
          <span className="blank__line" />
        </div>
      )}

      <div className="order__actions">
        <RateTrigger spotId={spot.id} open={!stats} className="key key--red">
          <span>{stats ? 'Rate it' : 'Be the first'}</span>
          <span className="ar" lang="ar" dir="rtl">
            قيّمه
          </span>
        </RateTrigger>
        <a className="key key--paper" href={mapsUrl(spot)} target="_blank" rel="noopener noreferrer">
          Maps ↗
        </a>
        <ShareButton path={`/spot/${spot.id}`} title={`${spot.brand} on CS Family Star`} className="key key--paper" />
      </div>
      <MyVerdict spotId={spot.id} />
      {first && (
        <p className="order__first">
          Initial commit by <b dir="auto">{first.name}</b> · {formatDate(first.createdAt)}
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
            <span className="histogram__word">{VERDICTS[star].cs}</span>
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
    <aside className="counter paper torn-b shadowed" aria-labelledby="counter-title">
      <p className="label">Same counter</p>
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
                ) : (
                  <span className="open">open</span>
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
