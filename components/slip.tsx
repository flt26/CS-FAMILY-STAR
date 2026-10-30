import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Review } from '@/lib/reviews';
import type { Spot } from '@/lib/spots';
import { Asterisk, orderNo, Stars } from './marks';
import { ReviewPhoto } from './review-photo';
import { TimeAgo } from './time-ago';

/** One review, printed as a customer receipt. */
export function Slip({
  review,
  spot,
  first,
  tilt = 0,
  showSpot = false,
}: {
  review: Review;
  spot: Spot | undefined;
  first: boolean;
  tilt?: number;
  showSpot?: boolean;
}) {
  return (
    <li className="slip paper torn-t torn-b shadowed" style={{ '--tilt': `${tilt}deg` } as CSSProperties}>
      <p className="slip__top label">
        <span>Rcpt {orderNo(`review-${review.id}`)}</span>
        <TimeAgo iso={review.createdAt} />
      </p>
      {showSpot && spot && (
        <Link className="slip__spot cond" href={`/spot/${spot.id}`}>
          {spot.brand}
        </Link>
      )}
      <p className="slip__who">
        <span dir="auto">{review.name}</span>
        <Stars rating={review.rating} />
      </p>
      {review.comment && (
        <p className="slip__text" dir="auto">
          {review.comment}
        </p>
      )}
      {review.imageUrl && (
        <ReviewPhoto
          src={review.imageUrl}
          alt={`Photo by ${review.name}${spot ? ` at ${spot.brand}` : ''}`}
        />
      )}
      {first && (
        <p className="slip__flag label">
          <Asterisk />
          Initial commit
        </p>
      )}
    </li>
  );
}

/** A gentle, repeatable wobble so a stack of slips looks hand-pinned. */
export const tiltFor = (index: number) => [-0.6, 0.5, -0.3, 0.4, -0.5, 0.3][index % 6];
