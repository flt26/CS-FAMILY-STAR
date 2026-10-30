import { Menu, Pad } from '@/components/board';
import { ExplorerProvider } from '@/components/explorer-context';
import { Feed, Hook, Rail } from '@/components/home-sections';
import { getRecentReviews, getScoreboard } from '@/lib/reviews';

// No Suspense here: both reads are cached (an outage is cached too, briefly),
// so the whole page prerenders and arrives in one pass.
export default async function Home() {
  const [board, recent] = await Promise.all([getScoreboard(), getRecentReviews(8)]);
  return (
    <ExplorerProvider stats={board.stats} mean={board.mean}>
      <Hook board={board} />
      <Rail board={board} recent={recent} />
      <div className="board" id="menu">
        <Pad />
        <Menu ok={board.ok} />
        <Feed board={board} recent={recent} />
      </div>
    </ExplorerProvider>
  );
}
