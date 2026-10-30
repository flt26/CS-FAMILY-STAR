import { Suspense } from 'react';
import { Menu, Pad } from '@/components/board';
import { ExplorerProvider } from '@/components/explorer-context';
import { Feed, Hook, Rail } from '@/components/home-sections';
import { getRecentReviews, getScoreboard } from '@/lib/reviews';

export default function Home() {
  return (
    <Suspense fallback={<Printing />}>
      <Board />
    </Suspense>
  );
}

async function Board() {
  const [board, recent] = await Promise.all([getScoreboard(), getRecentReviews(8)]);
  return (
    <ExplorerProvider stats={board.stats} mean={board.mean}>
      <Hook board={board} recent={recent} />
      <Rail board={board} recent={recent} />
      <div className="board" id="menu">
        <Pad />
        <Menu ok={board.ok} />
        <Feed board={board} recent={recent} />
      </div>
    </ExplorerProvider>
  );
}

function Printing() {
  return (
    <section className="hook" aria-busy="true" aria-label="Loading the menu">
      <div className="hook__copy">
        <p className="hook__q">
          <b>Q.</b>Where are we eating today?
        </p>
        <p className="hook__ar dot" lang="ar" dir="rtl">
          ناكل <em>فين؟</em>
        </p>
        <p className="label muted">
          Printing the menu… <span lang="ar">ثانية بنطبع</span>
        </p>
      </div>
      <div className="totals">
        <div className="slot" aria-hidden="true" />
        <div className="paper totals__paper torn-b skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}
