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
          const origin = request?.origin;
          const link = `a[href="/spot/${request?.spot.id}"]`;
          setRequest(null);
          // The dialog hands focus back to the button that opened it. If a
          // posted review re-rendered that button away, go to the spot's link
          // where the user was (its ticket or menu line), else to the page.
          requestAnimationFrame(() => {
            if (document.activeElement !== document.body) return;
            const place = origin?.isConnected ? origin : document.getElementById('menu-lines');
            (place?.querySelector<HTMLElement>(link) ?? document.getElementById('main'))?.focus();
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
      onClick={(event) => {
        const spot = getSpot(spotId);
        if (spot) rate({ spot, open, origin: event.currentTarget.closest('li') });
      }}
    >
      {children}
    </button>
  );
}
