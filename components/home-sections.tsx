import Link from 'next/link';
import type { CSSProperties } from 'react';
import { formatStamp, plural } from '@/lib/format';
import type { Review, Scoreboard } from '@/lib/reviews';
import { pickStandouts, type Ticket } from '@/lib/standouts';
import { AREA_ORDER, AREAS, CRAVINGS, getSpot, SPOTS } from '@/lib/spots';
import { PickForMe, Prompt } from './hook-controls';
import { Asterisk, Barcode, orderNo } from './marks';
import { RateTrigger } from './rate-context';
import { Slip, tiltFor } from './slip';
import { TimeAgo } from './time-ago';

export function Hook({ board, recent }: { board: Scoreboard; recent: Review[] }) {
  const rated = SPOTS.filter((spot) => board.stats[spot.id]).length;
  const open = SPOTS.length - rated;
  const last = recent[0];
  const lastSpot = last && getSpot(last.spotId);

  return (
    <section className="hook" aria-labelledby="hook-title">
      <div className="hook__copy">
        <h1 id="hook-title">
          <span className="hook__q">
            <b>Q.</b>Where are we eating today?
          </span>
          <span className="hook__ar dot" lang="ar" dir="rtl">
            ناكل <em>فين؟</em>
          </span>
        </h1>
        <p className="hook__lede">
          {SPOTS.length} food spots around FUE, rated by the CS family.{' '}
          {!board.ok ? (
            'The score server is not answering right now, but the whole menu is still here.'
          ) : open === SPOTS.length ? (
            <>
              <strong>Not one has a verdict yet</strong> — yours could be the first ever printed.
            </>
          ) : open > 0 ? (
            <>
              <strong>{open} still have zero reviews</strong> — yours could be the first one printed.
            </>
          ) : (
            'Every single one has a verdict. Keep them honest.'
          )}
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
      <Totals board={board} />
    </section>
  );
}

function Totals({ board }: { board: Scoreboard }) {
  const rated = SPOTS.filter((spot) => board.stats[spot.id]).length;
  const lastAt = Object.values(board.stats).reduce<string | null>(
    (latest, stats) => (stats.lastAt && (!latest || stats.lastAt > latest) ? stats.lastAt : latest),
    null,
  );

  const areas = AREA_ORDER.map((area) => {
    const spots = SPOTS.filter((spot) => spot.area === area);
    return {
      area,
      spots,
      receipts: spots.reduce((sum, spot) => sum + (board.stats[spot.id]?.count ?? 0), 0),
      untouched: spots.filter((spot) => !board.stats[spot.id]).length,
    };
  });
  const busiest = [...areas].sort((a, b) => b.receipts - a.receipts)[0];
  const busiestSpot = busiest.spots
    .filter((spot) => board.stats[spot.id])
    .sort((a, b) => board.stats[b.id].count - board.stats[a.id].count)[0];
  const quietest = areas
    .filter((entry) => entry.spots.length >= 3)
    .sort((a, b) => b.untouched / b.spots.length - a.untouched / a.spots.length || b.spots.length - a.spots.length)[0];

  return (
    <aside className="totals" aria-label="Today’s totals">
      <div className="slot" aria-hidden="true" />
      <div className="paper totals__paper torn-b shadowed">
        <header className="totals__head">
          <p className="cond">Daily totals</p>
          <p className="label">{lastAt ? `Last receipt ${formatStamp(lastAt)}` : 'Fresh roll'} · Terminal 90</p>
          <div className="rule-dash" />
        </header>
        <dl className="totals__grid">
          <div>
            <dt>Spots on the menu</dt>
            <dd className="dot">{SPOTS.length}</dd>
          </div>
          <div>
            <dt>Rated by the family</dt>
            <dd className="dot">{board.ok ? rated : '--'}</dd>
          </div>
          <div>
            <dt>Open tickets</dt>
            <dd className="dot red">{board.ok ? SPOTS.length - rated : '--'}</dd>
          </div>
          <div>
            <dt>Receipts printed</dt>
            <dd className="dot">{board.ok ? board.total : '--'}</dd>
          </div>
        </dl>
        {board.ok && busiest.receipts > 0 && (
          <p className="totals__foot">
            Busiest counter: <b>{AREAS[busiest.area].en}</b>
            {busiestSpot && (
              <>
                {' '}
                ({plural(board.stats[busiestSpot.id].count, 'receipt')} on {busiestSpot.brand})
              </>
            )}
            . Quietest: <b>{AREAS[quietest.area].en}</b>, {quietest.untouched} of {quietest.spots.length} spots
            untouched.
          </p>
        )}
        <Barcode code={`totals-${board.total}-${rated}`} />
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
};
const TILTS = [-1.1, 0.8, -0.5, 1.2, -0.9];

export function Rail({ board, recent }: { board: Scoreboard; recent: Review[] }) {
  const tickets = pickStandouts(board, recent);
  return (
    <section className="rail" id="rail" aria-labelledby="rail-title">
      <header className="sec-head">
        <h2 id="rail-title" className="cond">
          On the rail
        </h2>
        <p className="ar" lang="ar" dir="rtl">
          اللي عليهم الكلام
        </p>
        <p className="sec-head__note label">Picked by the numbers, not by us · moves with every verdict</p>
      </header>
      <div className="rail__track">
        <div className="rail__bar" aria-hidden="true" />
        <ol className="rail__tickets">
          {tickets.map((ticket, index) => (
            <li key={ticket.spot.id} style={{ '--tilt': `${TILTS[index]}deg` } as CSSProperties}>
              <TicketCard ticket={ticket} rank={index + 1} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function TicketCard({ ticket, rank }: { ticket: Ticket; rank: number }) {
  const { kind, spot, stats, review } = ticket;
  const tag = TAGS[kind];
  const code = orderNo(spot.id);
  const where = `${AREAS[spot.area].en} · ${CRAVINGS[spot.craving].en}`;

  if (kind === 'open' || !stats) {
    return (
      <article className="ticket ticket--open paper torn-b">
        <div className="ticket__top">
          <span className={TAGS.open.tone}>{TAGS.open.label}</span>
          <Asterisk className="glyph red" />
        </div>
        <p className="ticket__order label">Order #{code}</p>
        <div className="rule-double" />
        <h3 className="ticket__name cond">
          <Link href={`/spot/${spot.id}`}>{spot.brand}</Link>
        </h3>
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
            افتتحها انت
          </span>
        </RateTrigger>
        <p className="ticket__note">
          Nobody has rated it yet. First review = its <b>initial commit</b>.
        </p>
      </article>
    );
  }

  const [one, two, , four, five] = stats.histogram;
  const filled = Math.round(stats.average);
  return (
    <article className="ticket paper torn-b">
      <div className="ticket__top">
        <span className={tag.tone}>{tag.label}</span>
        {kind === 'fresh' && review ? (
          <TimeAgo iso={review.createdAt} className="ticket__ago label" />
        ) : (
          <span className="ticket__rank dot" aria-label={`Rank ${rank}`}>
            #{String(rank).padStart(2, '0')}
          </span>
        )}
      </div>
      <p className="ticket__order label">Order #{code}</p>
      <div className="rule-double" />
      <h3 className="ticket__name cond">
        <Link href={`/spot/${spot.id}`}>{spot.brand}</Link>
      </h3>
      <p className="ticket__where label">{where}</p>
      <div className="rule-dash" />
      <div className="ticket__total">
        <span className="label">Total</span>
        <span className="label">×{plural(stats.count, 'receipt')}</span>
        <span className="ticket__score dot">
          {stats.average.toFixed(1)}
          <small>/5</small>
        </span>
        <span className="ticket__diff">
          <span>
            {four + five > 0 && <b className="plus">+{four + five}</b>}{' '}
            {one + two > 0 && <b className="minus">−{one + two}</b>}
          </span>
          <span className="blocks" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((block) => (
              <i key={block} className={block <= filled ? undefined : 'n'} />
            ))}
          </span>
        </span>
      </div>
      {kind === 'fresh' && review && (
        <p className="ticket__note">
          Latest by <b dir="auto">{review.name}</b>:{' '}
          <span dir="auto">“{review.comment.length > 90 ? `${review.comment.slice(0, 88)}…` : review.comment}”</span>
        </p>
      )}
      <Barcode code={spot.id} />
      <p className="ticket__code">
        <span>{code}</span>
        <span>{CRAVINGS[spot.craving].en}</span>
      </p>
    </article>
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
          آخر الكلام
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
            />
          ))}
        </ol>
      ) : (
        <p className="empty">Nothing printed yet. The first receipt on the roll could be yours.</p>
      )}
    </aside>
  );
}
