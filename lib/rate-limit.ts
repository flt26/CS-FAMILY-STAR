import 'server-only';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

// Per-instance sliding windows. On serverless hosts every instance keeps its
// own memory, so this slows a spammer down rather than stopping one; the real
// fix is signed-in reviews (see README → "Hardening").
//
// A whole campus can share one public IP (Wi-Fi, carrier NAT), so the budget
// per address is generous and the tight one is per address + nickname.

const MINUTE = 60 * 1000;
const MAX_KEYS = 5000;

/** A reserved slot (give it back with release) or how long to wait. */
export type Slot = { ok: true; release: () => void } | { ok: false; wait: 'seconds' | 'minutes' };

class SlidingWindow {
  private hits = new Map<string, number[]>();

  constructor(
    private max: number,
    private windowMs: number,
    private gapMs = 0,
  ) {}

  /** Records a hit unless the key is over its limit. */
  take(key: string, now: number): Slot {
    const recent = (this.hits.get(key) ?? []).filter((at) => now - at < this.windowMs);
    const last = recent[recent.length - 1];
    if (recent.length >= this.max || (last !== undefined && now - last < this.gapMs)) {
      this.store(key, recent);
      return { ok: false, wait: recent.length >= this.max ? 'minutes' : 'seconds' };
    }
    recent.push(now);
    this.store(key, recent);
    const release = () => {
      const times = this.hits.get(key);
      const index = times?.lastIndexOf(now) ?? -1;
      if (times && index !== -1) times.splice(index, 1);
    };
    return { ok: true, release };
  }

  private store(key: string, times: number[]) {
    // Re-inserting keeps the Map in least-recently-used order.
    this.hits.delete(key);
    if (times.length > 0) this.hits.set(key, times);
    for (const oldest of this.hits.keys()) {
      if (this.hits.size <= MAX_KEYS) break;
      this.hits.delete(oldest);
    }
  }
}

const perAddress = new SlidingWindow(30, 10 * MINUTE);
const perAuthor = new SlidingWindow(6, 10 * MINUTE, 15 * 1000);
const repeats = new SlidingWindow(1, 10 * MINUTE);

/**
 * Reserves one review for this address and nickname. Release the slot when
 * the review failed on our side (storage, database), so a retry isn't counted
 * twice. A client's own mistake keeps it.
 */
export function reserveReview(address: string, name: string, now = Date.now()): Slot {
  const byAddress = perAddress.take(address, now);
  if (!byAddress.ok) return byAddress;
  const byAuthor = perAuthor.take(`${address} ${name.toLowerCase()}`, now);
  if (!byAuthor.ok) {
    byAddress.release();
    return byAuthor;
  }
  return {
    ok: true,
    release: () => {
      byAddress.release();
      byAuthor.release();
    },
  };
}

/**
 * Claims this exact review (same spot, nickname, rating and comment from the
 * same address) for ten minutes, so a resend after a lost response isn't
 * posted twice. Two students who shuffle the same nickname both get through.
 * Release it when the review did not save.
 */
export function claimReview(
  address: string,
  review: { spotId: string; name: string; rating: number; comment: string },
  now = Date.now(),
): Slot {
  const key = [address, review.spotId, review.name.toLowerCase(), review.rating, review.comment].join('\n');
  return repeats.take(createHash('sha256').update(key).digest('base64url'), now);
}

/**
 * The client address for rate limiting. Vercel sets both headers itself; a
 * self-hosted proxy should set X-Real-IP, because the first X-Forwarded-For
 * entry is whatever the client sent. IPv6 is grouped by /64, which is what
 * one household or phone usually gets.
 */
export function clientAddress(headers: Headers): string {
  const candidate =
    headers.get('x-real-ip')?.trim() || headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const mapped = candidate.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)?.[1];
  const address = mapped ?? candidate;
  const version = address.length <= 45 ? isIP(address) : 0;
  if (version === 4) return address;
  if (version === 6) return `${ipv6Groups(address).slice(0, 4).join(':')}::/64`;
  return 'unknown';
}

function ipv6Groups(address: string): string[] {
  const [head, tail] = address.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const zeros = Array<string>(Math.max(0, 8 - left.length - right.length)).fill('0');
  return [...left, ...(tail === undefined ? [] : zeros), ...right].map((group) => group.toLowerCase());
}
