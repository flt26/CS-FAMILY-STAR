// Validation shared by the rating form (instant feedback) and the server
// action (the actual gate). Everything that reaches the database goes through
// parseReviewForm on the server.

import { isSpotId } from './spots';

export const LIMITS = {
  nameMin: 2,
  nameMax: 32,
  comment: 500,
  /** After client-side compression a photo is usually well under 1 MB. */
  photoBytes: 3 * 1024 * 1024,
} as const;

export type ReviewField = 'spot' | 'rating' | 'name' | 'comment' | 'photo';
export type FieldErrors = Partial<Record<ReviewField, string>>;

export interface ReviewInput {
  spotId: string;
  rating: number;
  name: string;
  comment: string;
}

// Control characters and invisible format marks (zero-width spaces, bidi
// overrides) have no business in a nickname or a comment. Comments keep \n,
// and the zero-width (non-)joiners stay: emoji like 👨‍👩‍👧 and some
// Arabic-script spellings are built with them.
const FORMAT_MARKS = /(?![\u200C\u200D])\p{Cf}/gu;
const CONTROLS_EXCEPT_NEWLINE = /[^\P{Cc}\n]/gu;
// Letters that draw nothing: the Hangul fillers and the blank Braille cell.
const BLANK_LETTERS = /[\u115F\u1160\u3164\uFFA0\u2800]/gu;
const VISIBLE = /[\p{L}\p{N}\p{S}]/gu;
// Six or more digits in any script (٢٠٢٣٠٠٤٩ too), even split by spaces or dashes.
const ID_LIKE = /\p{Nd}(?:[\s._-]*\p{Nd}){5,}/u;

/** Far past any real nickname or comment. Longer fields are refused before cleanup runs. */
const RAW_MAX = { name: 200, comment: 4000 };

export function cleanName(raw: string): string {
  return raw
    .replace(CONTROLS_EXCEPT_NEWLINE, '')
    .replace(FORMAT_MARKS, '')
    .replace(BLANK_LETTERS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanComment(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(CONTROLS_EXCEPT_NEWLINE, '')
    .replace(FORMAT_MARKS, '')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function nameError(name: string): string | undefined {
  if (name.length > LIMITS.nameMax) return `Keep it under ${LIMITS.nameMax} characters.`;
  if ((name.match(VISIBLE) ?? []).length < LIMITS.nameMin) return 'Pick a nickname (2+ letters or numbers).';
  // FUE student IDs are 7+ digits. Reviews are public, so keep them out.
  if (ID_LIKE.test(name)) return 'Looks like an ID number — use a nickname instead.';
  return undefined;
}

/** A field's cleaned value, or null when it is too long to be worth cleaning. */
function field(form: FormData, key: string, max: number, clean: (raw: string) => string): string | null {
  const raw = String(form.get(key) ?? '');
  return raw.length > max ? null : clean(raw);
}

export function parseReviewForm(
  form: FormData,
): { ok: true; value: ReviewInput } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const spotId = form.get('spotId');
  if (!isSpotId(spotId)) errors.spot = 'That spot is not on our list.';

  const rating = Number(form.get('rating'));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = 'Pick a rating from 1 to 5.';

  const name = field(form, 'name', RAW_MAX.name, cleanName);
  const nameProblem = name === null ? `Keep it under ${LIMITS.nameMax} characters.` : nameError(name);
  if (nameProblem) errors.name = nameProblem;

  const comment = field(form, 'comment', RAW_MAX.comment, cleanComment);
  if (comment === null || comment.length > LIMITS.comment) {
    errors.comment = `Keep it under ${LIMITS.comment} characters.`;
  }

  if (Object.keys(errors).length > 0 || name === null || comment === null) return { ok: false, errors };
  return { ok: true, value: { spotId: spotId as string, rating, name, comment } };
}

const SIGNATURES: { mime: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  { mime: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/png',
    ext: 'png',
    test: (b) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, i) => b[i] === byte),
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    test: (b) =>
      String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP',
  },
];

/** Identify a photo by its bytes, not by the name or type the browser claims. */
export function sniffImage(bytes: Uint8Array): { mime: string; ext: string } | null {
  if (bytes.length < 12) return null;
  const match = SIGNATURES.find((signature) => signature.test(bytes));
  return match ? { mime: match.mime, ext: match.ext } : null;
}
