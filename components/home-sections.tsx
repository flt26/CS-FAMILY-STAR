import Link from 'next/link';
import type { CSSProperties } from 'react';
import { formatStamp, langOf, plural } from '@/lib/format';
import type { Review, Scoreboard } from '@/lib/reviews';
import { rankOf, rankScore } from '@/lib/score';
import { pickStandouts, type Ticket } from '@/lib/standouts';
import { AREAS, branchOf, CRAVINGS, getSpot, SPOTS } from '@/lib/spots';
import { PickForMe, Prompt } from './hook-controls';
import { Asterisk, orderNo } from './marks';
import { RateTrigger } from './rate-context';
import { Slip, tiltFor } from './slip';
import { TimeAgo } from './time-ago';

export function Hook({ board }: { board: Scoreboard }) {
  const last = board.latest;
  const lastSpot = last && getSpot(last.spotId);

  return (
    <section className="hook" aria-labelledby="hook-title">
      <div className="hook__copy">
        <h1 id="hook-title">
          <span className="hook__q">
            <b>Q.</b> Where are we eating today?
          </span>
          <span className="hook__ar dot" lang="ar" dir="rtl">
            ناكل <em>فين؟</em>
          </span>
        </h1>
        <p className="hook__lede">
          {SPOTS.length} food spots around FUE, rated 1 to 5 by the students who eat there.{' '}
          {board.ok
            ? 'Search them, filter them, or let us pick.'
            : 'Scores are offline for a moment, but the whole menu is still here.'}
        </p>
        <Prompt />
        <div className="hook__actions">
          <PickForMe />
          {last && lastSpot && (
            <p className="lastprint label">
              Last printed <TimeAgo iso={last.createdAt} /> ·{' '}
              <Link className="link" href={`/spot/${lastSpot.id}`}>
                {lastSpot.brand}, {last.rating}/5
              </Link>
            </p>
          )}
        </div>
      </div>
      <TopRightNow board={board} />
    </section>
  );
}

/** The first thing on a phone after the question: three places worth the walk. */
function TopRightNow({ board }: { board: Scoreboard }) {
  const rated = SPOTS.filter((spot) => board.stats[spot.id]);
  const top = [...rated]
    .sort((a, b) => rankScore(board.stats[b.id], board.mean) - rankScore(board.stats[a.id], board.mean))
    .slice(0, 3);

  return (
    <aside className="totals" aria-labelledby="top-title">
      <div className="slot" aria-hidden="true" />
      <div className="paper totals__paper torn-b shadowed">
        <header className="totals__head">
          <h2 id="top-title" className="cond">
            Top right now
          </h2>
          <p className="label">
            {board.latest ? `Last review ${formatStamp(board.latest.createdAt)}` : 'Fresh roll'} · Terminal 90
          </p>
        </header>
        <div className="rule-dash" />
        {top.length > 0 ? (
          <ol className="top3">
            {top.map((spot, index) => {
              const stats = board.stats[spot.id];
              const branch = branchOf(spot);
              return (
                <li key={spot.id}>
                  <Link className="top3__line" href={`/spot/${spot.id}`}>
                    <span className="top3__no">{String(index + 1).padStart(2, '0')}</span>
                    <span className="line__title">
                      <span className="line__name">
                        {spot.brand}
                        {branch && <span className="line__branch"> · {branch}</span>}
                      </span>
                      <span className="line__lead" aria-hidden="true" />
                    </span>
                    <span className="top3__score dot">
                      {stats.average.toFixed(1)}
                      <span className="sr-only"> out of 5 from {plural(stats.count, 'review')}</span>
                    </span>
                    <span className="top3__meta">
                      {AREAS[spot.area].en} · {CRAVINGS[spot.craving].en} · {plural(stats.count, 'review')}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="totals__empty">
            {board.ok ? 'No reviews yet. The first one prints right here.' : 'Scores are offline for a moment.'}
          </p>
        )}
        <div className="rule-dash" />
        <p className="totals__counts label">
          {SPOTS.length} spots
          {board.ok && (
            <>
              {' '}
              · {rated.length} rated · <span className="red">{SPOTS.length - rated.length} open</span> ·{' '}
              {plural(board.total, 'review')}
            </>
          )}
        </p>
        <a className="totals__all" href="#menu-lines">
          See all {SPOTS.length} on the menu <span aria-hidden="true">↓</span>
        </a>
      </div>
    </aside>
  );
}

const TAGS: Record<Ticket['kind'], { label: string; tone: string }> = {
  top: { label: 'Top rated', tone: 'tag' },
  most: { label: 'Most reviewed', tone: 'tag tag--ink' },
  campus: { label: 'Between lectures', tone: 'tag tag--ink' },
  fresh: { label: 'Fresh print', tone: 'tag tag--ink' },
  open: { label: 'Open ticket', tone: 'tag tag--open' },
  runner: { label: 'Runner-up', tone: 'tag tag--ink' },
};
const TILTS = [-1.1, 0.8, -0.5, 1.2, -0.9];

export function Rail({ board, recent }: { board: Scoreboard; recent: Review[] }) {
  // Without scores every spot would look unrated; the menu below still works.
  if (!board.ok) return null;
  const tickets = pickStandouts(board, recent);
  const ratedCount = Object.keys(board.stats).length;
  return (
    <section className="rail" id="rail" aria-labelledby="rail-title">
      <header className="sec-head">
        <h2 id="rail-title" className="cond">
          On the rail
        </h2>
        <p className="ar" lang="ar" dir="rtl">
          اللي عليهم الكلام
        </p>
        <p className="sec-head__note label">Picked by the numbers, not by us · updates with every review</p>
      </header>
      <div className="rail__track">
        <div className="rail__bar" aria-hidden="true" />
        <ol className="rail__tickets">
          {tickets.map((ticket, index) => (
            <li key={ticket.spot.id} style={{ '--tilt': `${TILTS[index]}deg` } as CSSProperties}>
              <TicketCard ticket={ticket} rank={rankOf(ticket.stats, board)} of={ratedCount} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function TicketCard({ ticket, rank, of }: { ticket: Ticket; rank: number | null; of: number }) {
  const { kind, spot, stats, review } = ticket;
  const tag = TAGS[kind];
  const branch = branchOf(spot);
  const where = `${AREAS[spot.area].en} · ${CRAVINGS[spot.craving].en}`;
  const name = (
    <h3 className="ticket__name cond">
      <Link href={`/spot/${spot.id}`}>
        {spot.brand}
        {branch && <span className="ticket__branch"> · {branch}</span>}
      </Link>
    </h3>
  );

  if (kind === 'open' || !stats) {
    return (
      <article className="ticket ticket--open paper torn-b">
        <div className="ticket__top">
          <span className={TAGS.open.tone}>{TAGS.open.label}</span>
          <Asterisk className="glyph red" />
        </div>
        <p className="ticket__order label">Order #{orderNo(spot.id)}</p>
        <div className="rule-double" />
        {name}
        <p className="ticket__where label">{where}</p>
        <div className="rule-dash" />
        <div className="blank" aria-hidden="true">
          <span>Score</span>
          <span className="blank__box">
            <span />
            /5
          </span>
          <span>First review by</span>
          <span className="blank__line" />
        </div>
        <RateTrigger spotId={spot.id} open className="claim">
          <span>
            Be the first<span className="sr-only"> to rate {spot.brand}</span>
          </span>
          <span className="ar" lang="ar" dir="rtl">
            خليك الأول
          </span>
        </RateTrigger>
        <p className="ticket__note">No reviews yet. Rate it first and your name goes on its ticket.</p>
      </article>
    );
  }

  const filled = Math.round(stats.average);
  const [one, two] = stats.histogram;
  return (
    <article className="ticket paper torn-b">
      <div className="ticket__top">
        <span className={tag.tone}>{tag.label}</span>
        {kind === 'fresh' && review ? (
          <TimeAgo iso={review.createdAt} className="ticket__ago label" />
        ) : (
          rank && (
            <span className="ticket__rank dot">
              <span aria-hidden="true">#{String(rank).padStart(2, '0')}</span>
              <span className="sr-only">
                Rank {rank} of {of}
              </span>
            </span>
          )
        )}
      </div>
      <p className="ticket__order label">Order #{orderNo(spot.id)}</p>
      <div className="rule-double" />
      {name}
      <p className="ticket__where label">{where}</p>
      <div className="rule-dash" />
      <div className="ticket__total">
        <span className="label">Avg</span>
        <span className="label">{plural(stats.count, 'review')}</span>
        <span className="ticket__score dot">
          {stats.average.toFixed(1)}
          <small>/5</small>
        </span>
        <span className="ticket__diff">
          <span>{one + two > 0 && <b className="minus">{one + two} nope</b>}</span>
          <span className="blocks" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((block) => (
              <i key={block} className={block <= filled ? undefined : 'n'} />
            ))}
          </span>
        </span>
      </div>
      {kind === 'fresh' && review && (
        <p className="ticket__note">
          Latest by{' '}
          <b dir="auto" lang={langOf(review.name)}>
            {review.name}
          </b>
          :{' '}
          <Quote text={review.comment.length > 90 ? `${review.comment.slice(0, 88)}…` : review.comment} />
        </p>
      )}
    </article>
  );
}

/** A quoted comment: «…» around Arabic, so the marks land at its two ends. */
function Quote({ text }: { text: string }) {
  const lang = langOf(text);
  return (
    <span dir="auto" lang={lang}>
      {lang ? `«${text}»` : `“${text}”`}
    </span>
  );
}

export function Feed({ board, recent }: { board: Scoreboard; recent: Review[] }) {
  return (
    <aside className="feed" id="feed" aria-labelledby="feed-title">
      <header className="sec-head">
        <h2 id="feed-title" className="cond">
          Just printed
        </h2>
        <p className="ar" lang="ar" dir="rtl">
          لسه طازة
        </p>
      </header>
      {recent.length > 0 ? (
        <ol className="slips">
          {recent.slice(0, 6).map((review, index) => (
            <Slip
              key={review.id}
              review={review}
              spot={getSpot(review.spotId)}
              first={board.stats[review.spotId]?.firstAt === review.createdAt}
              tilt={tiltFor(index)}
              showSpot
              clamp
            />
          ))}
        </ol>
      ) : (
        <p className="empty">
          {board.ok ? 'No reviews with comments yet. The first one could be yours.' : 'The feed is offline for a moment.'}
        </p>
      )}
    </aside>
  );
}
