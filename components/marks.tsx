// Small printed marks: the asterisk-star, barcodes, dot-matrix glyphs.
// All deterministic, so they render identically on the server and client.

const fnv = (text: string) => {
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
};

function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A short hex "order number" that is stable for a given id. */
export function orderNo(id: string): string {
  return fnv(id).toString(16).padStart(8, '0').slice(0, 7);
}

/** An asterisk is a star in every CS lab. */
export function Asterisk({ className, off }: { className?: string; off?: boolean }) {
  return (
    <svg viewBox="-12 -12 24 24" className={[className, off && 'off'].filter(Boolean).join(' ')} aria-hidden="true">
      <path
        d="M0 .6V-9.4M0 .6L9.04-2.34M0 .6L5.58 8.29M0 .6L-5.58 8.29M0 .6L-9.04-2.34"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Barcode({ code, className = 'barcode' }: { code: string; className?: string }) {
  const next = random(fnv(code));
  const height = 40;
  let x = 0;
  let d = '';
  const bar = (width: number) => {
    d += `M${x} 0h${width}v${height}h-${width}z`;
    x += width;
  };
  const guard = () => [2, 1, 1, 1, 2].forEach((width, i) => (i % 2 ? (x += width) : bar(width)));
  guard();
  x += 2;
  for (let i = 0; i < 40; i++) {
    bar(1 + Math.floor(next() * 3));
    x += 1 + Math.floor(next() * 2.3);
  }
  x += 1;
  guard();
  return (
    <div className={className}>
      <svg viewBox={`0 0 ${x} ${height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d={d} />
      </svg>
    </div>
  );
}

const GLYPHS = {
  all: ['#..#..#', '.#.#.#.', '..###..', '#######', '..###..', '.#.#.#.', '#..#..#'],
  coffee: ['.#..#..', '..#..#.', '.......', '######.', '#####.#', '######.', '.####..'],
  quick: ['.#####.', '#######', '.......', '#######', '.......', '#######', '.#####.'],
  sitdown: ['...#...', '..###..', '.#####.', '#######', '.......', '#######', '.......'],
  egyptian: ['.......', '#######', '#.....#', '.#...#.', '..###..', '.......', '.#####.'],
  dice: ['#######', '#.....#', '#.#.#.#', '#..#..#', '#.#.#.#', '#.....#', '#######'],
  camera: ['.......', '..##...', '#######', '#..#..#', '#.#.#.#', '#..#..#', '#######'],
} as const;

export type GlyphName = keyof typeof GLYPHS;

export function DotGlyph({ name, className = 'glyph' }: { name: GlyphName; className?: string }) {
  return (
    <svg viewBox="0 0 7 7" className={className} aria-hidden="true">
      {GLYPHS[name].flatMap((row, y) =>
        [...row].map((cell, x) => (cell === '#' ? <circle key={`${x}-${y}`} cx={x + 0.5} cy={y + 0.5} r={0.43} /> : null)),
      )}
    </svg>
  );
}

/** Five asterisks, filled up to the rating, plus "4/5" for screen readers and eyes. */
export function Stars({ rating }: { rating: number }) {
  return (
    <span className="rating" role="img" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Asterisk key={value} off={value > rating} />
      ))}
      <b aria-hidden="true">{rating}/5</b>
    </span>
  );
}
