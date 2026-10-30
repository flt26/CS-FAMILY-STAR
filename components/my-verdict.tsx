'use client';

import { useMyVerdicts } from '@/lib/local-profile';
import { VERDICTS } from '@/lib/verdicts';

/** "You gave it 4/5" — remembered on this device only. */
export function MyVerdict({ spotId }: { spotId: string }) {
  const rating = useMyVerdicts()[spotId];
  if (!rating) return null;
  return (
    <p className="order__mine label">
      You gave it {rating}/5 · {VERDICTS[rating]?.cs ?? ''} <span className="muted">(this device)</span>
    </p>
  );
}
