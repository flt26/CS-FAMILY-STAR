'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SpotStats } from '@/lib/reviews';
import { useExplorer, type Explorer } from './use-explorer';

// The search prompt sits in the hero while the filters and the menu sit
// further down; both read and write this one state.
const ExplorerContext = createContext<Explorer | null>(null);

export function ExplorerProvider({
  stats,
  mean,
  children,
}: {
  stats: Record<string, SpotStats>;
  mean: number;
  children: ReactNode;
}) {
  const explorer = useExplorer(stats, mean);
  return <ExplorerContext value={explorer}>{children}</ExplorerContext>;
}

export function useExplorerState(): Explorer {
  const explorer = useContext(ExplorerContext);
  if (!explorer) throw new Error('useExplorerState needs an <ExplorerProvider>');
  return explorer;
}
