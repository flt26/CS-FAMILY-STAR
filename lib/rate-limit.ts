import 'server-only';

// A per-instance sliding window. On serverless hosts every instance keeps its
// own memory, so this slows a spammer down rather than stopping one; the real
// fix is signed-in reviews (see README → "Hardening").

const WINDOW_MS = 10 * 60 * 1000;
const MAX_IN_WINDOW = 6;
const MIN_GAP_MS = 15 * 1000;

const hits = new Map<string, number[]>();

export function allowReview(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  const last = recent[recent.length - 1];
  if (recent.length >= MAX_IN_WINDOW || (last !== undefined && now - last < MIN_GAP_MS)) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((at) => now - at >= WINDOW_MS)) hits.delete(k);
    }
  }
  return true;
}
