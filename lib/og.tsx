import 'server-only';
import { cacheLife } from 'next/cache';
import { SPOTS } from './spots';

// Share images are drawn by next/og, which needs TrueType files rather than
// the woff2 next/font serves. Google Fonts hands out TTF to non-browser
// clients, subset to the characters asked for. Every image asks for the same
// set, so each family is fetched once rather than once per spot.
const PRINTABLE_ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
const CHARSET = [...new Set(`${PRINTABLE_ASCII}×·…—–’“”${SPOTS.map((spot) => spot.brand.toUpperCase()).join('')}`)].join('');

// A slow Google must not hold a share image hostage.
async function fetchOk(url: string): Promise<Response> {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  return response;
}

async function googleFont(family: string): Promise<ArrayBuffer> {
  'use cache';
  cacheLife('max');
  const css = await (
    await fetchOk(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(CHARSET)}`)
  ).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`No TrueType font for ${family}`);
  return (await fetchOk(url)).arrayBuffer();
}

/** The three share-image fonts, or none (next/og's built-in sans) if Google Fonts can't be reached. */
export async function ogFonts() {
  try {
    const [display, dot, mono] = await Promise.all([
      googleFont('Archivo:wdth,wght@62.5,800'),
      googleFont('Handjet:wght@600'),
      googleFont('IBM+Plex+Mono:wght@500'),
    ]);
    return [
      { name: 'Display', data: display, weight: 800 as const, style: 'normal' as const },
      { name: 'Dot', data: dot, weight: 600 as const, style: 'normal' as const },
      { name: 'Mono', data: mono, weight: 500 as const, style: 'normal' as const },
    ];
  } catch (error) {
    console.error('Share image fonts unavailable:', error);
    return [];
  }
}

export const OG = {
  ink: '#161412',
  chalk: '#f3efe6',
  fog: '#a9a296',
  hot: '#ff5d40',
  red: '#bf2a1c',
  thermal: '#f8f6f0',
  ticket: '#efe7d5',
  print: '#1b1815',
  print2: '#5b554c',
};

/** Thin barcode bars from a seed, like the ones printed on every ticket. */
export function OgBarcode({ seed, height = 56, count = 46 }: { seed: string; height?: number; count?: number }) {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  const bars = Array.from({ length: count }, (_, i) => 2 + ((hash >>> i % 29) & 3) * 1.6);
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 3, height }}>
      {bars.map((width, i) => (
        <div key={i} style={{ width, background: OG.print }} />
      ))}
    </div>
  );
}

/** The asterisk-star, as an inline SVG next/og can rasterise. */
export function OgStar({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="-12 -12 24 24">
      <path
        d="M0 .6V-9.4M0 .6L9.04-2.34M0 .6L5.58 8.29M0 .6L-5.58 8.29M0 .6L-9.04-2.34"
        stroke={color}
        strokeWidth="4.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
