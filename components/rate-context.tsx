'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { getSpot } from '@/lib/spots';
import { RateDialog, type RateRequest } from './rate-dialog';

// One rating dialog for the whole app; any "Rate" button can open it.
const RateContext = createContext<(request: RateRequest) => void>(() => {});

export function RateProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<RateRequest | null>(null);
  return (
    <RateContext value={setRequest}>
      {children}
      <RateDialog
        request={request}
        onClose={() => {
          setRequest(null);
          // The dialog hands focus back to the button that opened it. If a
          // posted review re-rendered that button away, start from the page.
          requestAnimationFrame(() => {
            if (document.activeElement === document.body) document.getElementById('main')?.focus();
          });
        }}
      />
    </RateContext>
  );
}

export function RateTrigger({
  spotId,
  open = false,
  className,
  children,
}: {
  spotId: string;
  /** The spot has no reviews yet. */
  open?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const rate = useContext(RateContext);
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const spot = getSpot(spotId);
        if (spot) rate({ spot, open });
      }}
    >
      {children}
    </button>
  );
}
