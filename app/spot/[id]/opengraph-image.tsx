import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { orderNo } from '@/components/marks';
import { plural } from '@/lib/format';
import { OG, OgBarcode, ogFonts, OgStar } from '@/lib/og';
import { getScoreboard } from '@/lib/reviews';
import { AREAS, CRAVINGS, getSpot, SPOTS } from '@/lib/spots';
import { VERDICTS } from '@/lib/verdicts';

export const alt = 'A spot on CS Family Star, the FUE food guide';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Drawn at build time like the pages, so crawlers get a cached image.
export function generateStaticParams() {
  return SPOTS.map((spot) => ({ id: spot.id }));
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spot = getSpot(id);
  if (!spot) notFound();
  const board = await getScoreboard();
  const stats = board.stats[spot.id];
  const name = spot.brand.toUpperCase();
  const where = `${AREAS[spot.area].en} · ${CRAVINGS[spot.craving].en}`.toUpperCase();
  const score = stats ? stats.average.toFixed(1) : '?';
  const footnote = stats
    ? `${plural(stats.count, 'REVIEW', 'REVIEWS')} · ${VERDICTS[Math.round(stats.average)].cs.toUpperCase()}`
    : board.ok
      ? 'NO REVIEWS YET · BE THE FIRST TO RATE IT'
      : 'RATED BY FUE STUDENTS';
  const order = `ORDER #${orderNo(spot.id).toUpperCase()}`;

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: OG.ink, padding: '56px 64px', gap: 48 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            background: OG.ticket,
            padding: '34px 40px 30px',
            boxShadow: '0 24px 40px rgba(0,0,0,.45)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'Mono',
                fontSize: 18,
                letterSpacing: 2,
                color: stats ? OG.thermal : OG.red,
                background: stats ? OG.print : 'transparent',
                border: stats ? 'none' : `2px dashed ${OG.red}`,
                padding: '6px 12px',
              }}
            >
              {stats ? 'RATED BY FUE STUDENTS' : 'OPEN TICKET'}
            </span>
            <span style={{ fontFamily: 'Mono', fontSize: 18, letterSpacing: 2, color: OG.print2 }}>{order}</span>
          </div>
          <span style={{ fontFamily: 'Display', fontSize: name.length > 14 ? 92 : 120, lineHeight: 0.9, color: OG.print, marginTop: 26 }}>
            {name}
          </span>
          <span style={{ fontFamily: 'Mono', fontSize: 22, letterSpacing: 3, color: OG.print2, marginTop: 14 }}>{where}</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 'auto' }}>
            <span style={{ fontFamily: 'Dot', fontSize: 190, lineHeight: 0.8, color: OG.print }}>{score}</span>
            <span style={{ fontFamily: 'Mono', fontSize: 30, color: OG.print2, paddingBottom: 10 }}>/5</span>
            <span style={{ fontFamily: 'Mono', fontSize: 20, letterSpacing: 2, color: OG.red, paddingBottom: 14, marginLeft: 'auto' }}>
              {footnote}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 250 }}>
          <OgStar size={120} color={OG.hot} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <span style={{ fontFamily: 'Display', fontSize: 64, lineHeight: 0.9, color: OG.chalk }}>CS FAMILY</span>
            <span style={{ fontFamily: 'Display', fontSize: 64, lineHeight: 0.9, color: OG.hot }}>STAR</span>
            <div style={{ display: 'flex', background: OG.thermal, padding: 12, overflow: 'hidden' }}>
              <OgBarcode seed={id} height={44} count={28} />
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
