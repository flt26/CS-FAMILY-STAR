import { ImageResponse } from 'next/og';
import { OG, OgBarcode, ogFonts, OgStar } from '@/lib/og';
import { getScoreboard } from '@/lib/reviews';
import { SPOTS } from '@/lib/spots';

export const alt = `CS Family Star — where are we eating today? ${SPOTS.length} food spots around FUE. Students rate them 1 to 5.`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const board = await getScoreboard();
  const rated = SPOTS.filter((spot) => board.stats[spot.id]).length;
  // During an outage the counts would all read zero; print dashes instead.
  const count = (value: number) => (board.ok ? String(value) : '--');
  const rows: [string, string, boolean][] = [
    ['SPOTS ON THE MENU', String(SPOTS.length), false],
    ['SPOTS RATED', count(rated), false],
    ['NOT RATED YET', count(SPOTS.length - rated), false],
    ['REVIEWS POSTED', count(board.total), false],
  ];

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: OG.ink, padding: '64px 72px', gap: 56 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <OgStar size={46} color={OG.hot} />
            <span style={{ fontFamily: 'Display', fontSize: 46, color: OG.chalk }}>
              CS FAMILY&nbsp;<span style={{ color: OG.hot }}>STAR</span>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <span style={{ fontFamily: 'Mono', fontSize: 24, letterSpacing: 3, color: OG.fog }}>
              <span style={{ color: OG.hot }}>Q.</span>&nbsp;WHERE ARE WE EATING TODAY?
            </span>
            <span style={{ fontFamily: 'Display', fontSize: 104, lineHeight: 0.9, color: OG.chalk }}>
              {SPOTS.length} SPOTS AROUND FUE.
            </span>
            <span style={{ fontFamily: 'Display', fontSize: 104, lineHeight: 0.9, color: OG.hot }}>
              STUDENTS RATE THEM.
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 360,
            alignSelf: 'center',
            background: OG.thermal,
            padding: '30px 28px 26px',
            gap: 10,
            boxShadow: '0 24px 40px rgba(0,0,0,.45)',
          }}
        >
          <span style={{ fontFamily: 'Display', fontSize: 38, color: OG.print }}>TOTALS SO FAR</span>
          {rows.map(([label, value, hot]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                borderBottom: `2px dashed #cfc8ba`,
                paddingBottom: 6,
              }}
            >
              <span style={{ fontFamily: 'Mono', fontSize: 15, color: OG.print, letterSpacing: 1 }}>{label}</span>
              <span style={{ fontFamily: 'Dot', fontSize: 52, lineHeight: 1, color: hot ? OG.red : OG.print }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', marginTop: 10, overflow: 'hidden' }}>
            <OgBarcode seed={`totals-${board.total}`} height={48} />
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
