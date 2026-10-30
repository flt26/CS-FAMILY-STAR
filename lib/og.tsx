import 'server-only';
import { cacheLife } from 'next/cache';

// Share images are drawn by next/og, which needs TrueType files rather than
// the woff2 next/font serves. Google Fonts hands out TTF to non-browser
// clients, subset to just the characters in the image.
async function googleFont(family: string, text: string): Promise<ArrayBuffer> {
  'use cache';
  cacheLife('max');
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`)
  ).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`No TrueType font for ${family}`);
  return (await fetch(url)).arrayBuffer();
}

export async function ogFonts(text: string) {
  const [display, dot, mono] = await Promise.all([
    googleFont('Archivo:wdth,wght@62.5,800', text),
    googleFont('Handjet:wght@600', text),
    googleFont('IBM+Plex+Mono:wght@500', text),
  ]);
  return [
    { name: 'Display', data: display, weight: 800 as const, style: 'normal' as const },
    { name: 'Dot', data: dot, weight: 600 as const, style: 'normal' as const },
    { name: 'Mono', data: mono, weight: 500 as const, style: 'normal' as const },
  ];
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
