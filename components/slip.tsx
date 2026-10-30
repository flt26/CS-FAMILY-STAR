import Link from 'next/link';
import type { CSSProperties } from 'react';
import { langOf } from '@/lib/format';
import type { Review } from '@/lib/reviews';
import { branchOf, type Spot } from '@/lib/spots';
import { Asterisk, Stars } from './marks';
import { ReviewPhoto } from './review-photo';
import { TimeAgo } from './time-ago';

const CLAMP_AT = 240;

/** One review, printed as a customer receipt. */
export function Slip({
  review,
  spot,
  first,
  tilt = 0,
  showSpot = false,
  clamp = false,
}: {
  review: Review;
  spot: Spot | undefined;
  first: boolean;
  tilt?: number;
  showSpot?: boolean;
  /** Cut long comments short, with a link to the whole thing (the home feed). */
  clamp?: boolean;
}) {
  const branch = spot && branchOf(spot);
  const long = clamp && review.comment.length > CLAMP_AT;
  return (
    <li className="slip paper torn-t torn-b shadowed" style={{ '--tilt': `${tilt}deg` } as CSSProperties}>
      <p className="slip__top label">
        <TimeAgo iso={review.createdAt} />
        {first && (
          <span className="slip__flag">
            <Asterisk />
            First review
          </span>
        )}
      </p>
      {showSpot && spot && (
        <Link className="slip__spot cond" href={`/spot/${spot.id}`}>
          {spot.brand}
          {branch && <span className="slip__branch"> · {branch}</span>}
        </Link>
      )}
      <p className="slip__who">
        <span dir="auto" lang={langOf(review.name)}>
          {review.name}
        </span>
        <Stars rating={review.rating} />
      </p>
      {review.comment && (
        <p className="slip__text" dir="auto" lang={langOf(review.comment)}>
          {long ? `${review.comment.slice(0, CLAMP_AT - 10).trimEnd()}…` : review.comment}
          {long && spot && (
            <>
              {' '}
              <Link className="link slip__more" href={`/spot/${spot.id}`}>
                Read it all<span className="sr-only"> on the {spot.brand} ticket</span>
              </Link>
            </>
          )}
        </p>
      )}
      {review.imageUrl && (
        <ReviewPhoto
          src={review.imageUrl}
          alt={`Photo by ${review.name}${spot ? ` at ${spot.brand}` : ''}`}
          caption={`${review.name}${spot ? ` · ${spot.brand}` : ''}`}
        />
      )}
    </li>
  );
}

/** A gentle, repeatable wobble so a stack of slips looks hand-pinned. */
export const tiltFor = (index: number) => [-0.6, 0.5, -0.3, 0.4, -0.5, 0.3][index % 6];
