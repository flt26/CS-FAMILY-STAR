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
// overrides) have no business in a nickname or a comment. Comments keep \n.
const FORMAT_MARKS = /\p{Cf}/gu;
const CONTROLS_EXCEPT_NEWLINE = /[^\P{Cc}\n]/gu;

export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').replace(CONTROLS_EXCEPT_NEWLINE, '').replace(FORMAT_MARKS, '').trim();
}

export function cleanComment(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(CONTROLS_EXCEPT_NEWLINE, '')
    .replace(FORMAT_MARKS, '')
    .replace(/ +\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function nameError(name: string): string | undefined {
  if (name.length < LIMITS.nameMin) return 'Pick a nickname (2+ characters).';
  if (name.length > LIMITS.nameMax) return `Keep it under ${LIMITS.nameMax} characters.`;
  // FUE student IDs are 7+ digits. Reviews are public, so keep them out.
  if (/\d{6,}/.test(name)) return 'Looks like an ID number — use a nickname instead.';
  return undefined;
}

export function parseReviewForm(
  form: FormData,
): { ok: true; value: ReviewInput } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const spotId = form.get('spotId');
  if (!isSpotId(spotId)) errors.spot = 'That spot is not on our list.';

  const rating = Number(form.get('rating'));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = 'Pick a rating from 1 to 5.';

  const name = cleanName(String(form.get('name') ?? ''));
  const nameProblem = nameError(name);
  if (nameProblem) errors.name = nameProblem;

  const comment = cleanComment(String(form.get('comment') ?? ''));
  if (comment.length > LIMITS.comment) errors.comment = `Keep it under ${LIMITS.comment} characters.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
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
