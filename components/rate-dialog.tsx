'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { startTransition, useActionState, useEffect, useRef, useState } from 'react';
import { submitReview, type ReviewState } from '@/app/actions';
import { formatStamp } from '@/lib/format';
import { rememberVerdict, saveNickname, useNickname } from '@/lib/local-profile';
import { cleanName, LIMITS, nameError, type FieldErrors } from '@/lib/review-input';
import { AREAS, CRAVINGS, type Spot } from '@/lib/spots';
import { NICKNAMES, VERDICTS } from '@/lib/verdicts';
import { Asterisk, Barcode, DotGlyph, orderNo } from './marks';
import { ShareButton } from './share-button';
import { usePhoto } from './use-photo';

const IDLE: ReviewState = { status: 'idle' };

export interface RateRequest {
  spot: Spot;
  /** True when the spot has no reviews yet, so this one is its first. */
  open: boolean;
}

/** Opens whenever `request` is set; calls onClose once the dialog has closed. */
export function RateDialog({ request, onClose }: { request: RateRequest | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (request && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLInputElement>('input[name="rating"]')?.focus();
    }
    if (!request && dialog.open) dialog.close();
  }, [request]);

  const close = () => dialogRef.current?.close();
  // Closing mid-submit would hide the result of a review that still posts.
  const sending = () => Boolean(dialogRef.current?.querySelector('[data-pending]'));

  return (
    <dialog
      ref={dialogRef}
      className="printer"
      aria-labelledby="rate-title"
      onClose={onClose}
      onCancel={(event) => {
        if (sending()) event.preventDefault();
      }}
      onClick={(event) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (event.target === event.currentTarget && !sending()) close();
      }}
    >
      {request && <RateForm key={request.spot.id} {...request} onDone={close} />}
    </dialog>
  );
}

async function send(previous: ReviewState, formData: FormData): Promise<ReviewState> {
  const result = await submitReview(previous, formData);
  if (result.status === 'done') {
    rememberVerdict(result.spotId, result.rating);
    saveNickname(cleanName(String(formData.get('name') ?? '')));
  }
  return result;
}

function RateForm({ spot, open, onDone }: RateRequest & { onDone: () => void }) {
  const savedName = useNickname();
  const [state, dispatch, pending] = useActionState(send, IDLE);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState(savedName);
  const [localErrors, setLocalErrors] = useState<FieldErrors>({});
  const photo = usePhoto();
  const fileRef = useRef<HTMLInputElement>(null);

  const errors: FieldErrors = { ...(state.status === 'error' ? state.fields : {}), ...localErrors };
  const where = `${CRAVINGS[spot.craving].en} · ${AREAS[spot.area].en}`;

  if (state.status === 'done') {
    return <Printed spot={spot} name={cleanName(name)} result={state} onDone={onDone} />;
  }

  return (
    <form
      className="sheet paper torn-b"
      noValidate
      data-pending={pending || undefined}
      // onSubmit rather than action={…}: React resets a form after every form
      // action, which would wipe the photo and nickname on a validation error.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const problems: FieldErrors = {};
        if (!rating) problems.rating = 'Pick a number first.';
        const nameProblem = nameError(cleanName(name));
        if (nameProblem) problems.name = nameProblem;
        if (photo.status === 'working') problems.photo = 'Still shrinking your photo…';
        setLocalErrors(problems);
        if (Object.keys(problems).length > 0) return;
        if (photo.file) formData.set('photo', photo.file);
        else formData.delete('photo');
        startTransition(() => dispatch(formData));
      }}
    >
      <div className="sheet__top">
        <p className="label">Order #{orderNo(spot.id)}</p>
        <button type="button" className="sheet__close" onClick={onDone} disabled={pending} aria-label="Close">
          ×
        </button>
      </div>
      <p className="label sheet__kicker">Rate</p>
      <h2 id="rate-title" className="sheet__title cond">
        {spot.brand}
      </h2>
      <p className="label sheet__where">{where}</p>
      {open && (
        <p className="sheet__first">
          <Asterisk /> First review on this spot. It becomes the initial commit.
        </p>
      )}
      <input type="hidden" name="spotId" value={spot.id} />

      <fieldset className="step">
        <legend className="step__head">
          <span>
            <b>01</b> Your rating
          </span>
          <span>Required</span>
        </legend>
        <div className="scale">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                aria-describedby={errors.rating ? 'rate-rating-error' : undefined}
                onChange={() => {
                  setRating(value);
                  setLocalErrors((current) => ({ ...current, rating: undefined }));
                }}
              />
              <span className="scale__key">
                <span className="dot" aria-hidden="true">
                  {value}
                </span>
                <span className="scale__word">{VERDICTS[value].word}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="scale__readout" aria-live="polite">
          {rating ? (
            <>
              <span className="dot scale__score">{rating}/5</span>
              <span className="cond">{VERDICTS[rating].cs}</span>
              <span className="ar" lang="ar" dir="rtl">
                {VERDICTS[rating].ar}
              </span>
            </>
          ) : (
            <span className="label">1 = segfault · 5 = ship it</span>
          )}
        </p>
        {errors.rating && (
          <p className="error" id="rate-rating-error" role="alert">
            {errors.rating}
          </p>
        )}
      </fieldset>

      <div className="step">
        <label className="step__head" htmlFor="rate-comment">
          <span>
            <b>02</b> Comment
          </span>
          <span>Optional</span>
        </label>
        <textarea
          id="rate-comment"
          className="lined"
          name="comment"
          dir="auto"
          rows={3}
          maxLength={LIMITS.comment}
          value={comment}
          placeholder="What did you order? Was it worth it?"
          aria-invalid={Boolean(errors.comment)}
          onChange={(event) => setComment(event.target.value)}
        />
        <p className="step__hint">
          <span>
            {comment.length} / {LIMITS.comment}
          </span>
          <span lang="ar" dir="rtl">
            طلبت إيه؟ وكان عامل إزاي؟
          </span>
        </p>
        {errors.comment && (
          <p className="error" role="alert">
            {errors.comment}
          </p>
        )}
      </div>

      <div className="step">
        <p className="step__head">
          <span>
            <b>03</b> Photo
          </span>
          <span>Optional</span>
        </p>
        <div className="photo">
          <label className="photo__pick">
            <input
              ref={fileRef}
              type="file"
              name="photo"
              accept="image/*"
              onChange={(event) => photo.pick(event.target.files?.[0])}
            />
            <span className="photo__face">
              <span className="photo__icon">
                <DotGlyph name="camera" />
              </span>
              <span>
                <span className="cond photo__title">
                  {photo.status === 'working' ? 'Shrinking…' : photo.preview ? 'Change photo' : 'Add a photo'}
                </span>
                <span className="photo__note">Prints in halftone on your receipt, opens in full colour.</span>
              </span>
            </span>
          </label>
          {photo.preview && (
            <div className="photo__chosen">
              <figure className="photo__preview">
                {/* eslint-disable-next-line @next/next/no-img-element -- a local blob: preview, nothing to optimize */}
                <img src={photo.preview} alt="Your photo" />
              </figure>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  photo.clear();
                  // Otherwise picking the same file again fires no change event.
                  if (fileRef.current) fileRef.current.value = '';
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
        {photo.status === 'unreadable' && (
          <p className="error" role="alert">
            This browser can’t read that photo. Try a JPG, PNG or a screenshot.
          </p>
        )}
        {errors.photo && (
          <p className="error" role="alert">
            {errors.photo}
          </p>
        )}
      </div>

      <div className="step">
        <label className="step__head" htmlFor="rate-name">
          <span>
            <b>04</b> Print name as
          </span>
          <span>Required</span>
        </label>
        <div className="handle">
          <span className="handle__at" aria-hidden="true">
            @
          </span>
          <input
            id="rate-name"
            className="handle__input"
            name="name"
            dir="auto"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="nickname"
            maxLength={LIMITS.nameMax}
            aria-invalid={Boolean(errors.name)}
            aria-describedby="rate-name-hint"
          />
          <button
            type="button"
            className="key key--paper handle__shuffle"
            onClick={() => {
              const options = NICKNAMES.filter((nickname) => nickname !== name);
              setName(options[Math.floor(Math.random() * options.length)]);
              setLocalErrors((current) => ({ ...current, name: undefined }));
            }}
          >
            <DotGlyph name="dice" />
            Shuffle
          </button>
        </div>
        <p className="step__hint step__hint--stack" id="rate-name-hint">
          <span>No student ID, no login. Any name you like — it’s what prints on your receipt.</span>
          <span lang="ar" dir="rtl">
            أي اسم — مش لازم اسمك الحقيقي
          </span>
        </p>
        {errors.name && (
          <p className="error" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      <div hidden>
        <label>
          Leave this empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="rule-double sheet__rule" />
      <dl className="summary">
        <div>
          <dt>Rating</dt>
          <dd>{rating ? `${rating}/5 · ${VERDICTS[rating].cs.toLowerCase()}` : '—'}</dd>
        </div>
        <div>
          <dt>Comment</dt>
          <dd>{comment.trim() ? `${comment.trim().length} chars` : 'none'}</dd>
        </div>
        <div>
          <dt>Photo</dt>
          <dd>{photo.file ? `${Math.max(1, Math.round(photo.file.size / 1024))} KB` : 'none'}</dd>
        </div>
        <div>
          <dt>Print name</dt>
          <dd dir="auto">{cleanName(name) || '—'}</dd>
        </div>
      </dl>

      {state.status === 'error' && !state.fields && (
        <p className="sheet__error" role="alert">
          {state.message}
        </p>
      )}
      <button type="submit" className="key key--red sheet__submit" disabled={pending}>
        <span className="sheet__submit-label">
          <Asterisk />
          {pending ? 'Printing…' : 'Print my review'}
        </span>
        <span className="ar" lang="ar" dir="rtl">
          اطبع
        </span>
      </button>
      <p className="sheet__fine">Keep it honest, keep it kind. Receipts are public.</p>
    </form>
  );
}

function Printed({
  spot,
  name,
  result,
  onDone,
}: {
  spot: Spot;
  name: string;
  result: Extract<ReviewState, { status: 'done' }>;
  onDone: () => void;
}) {
  const verdict = VERDICTS[result.rating];
  const receipt = orderNo(`${spot.id}:${result.at}`);
  const onSpotPage = usePathname() === `/spot/${spot.id}`;
  const heardRef = useRef<HTMLDivElement>(null);

  // The form was scrolled to its submit button; start the receipt from the top
  // so "Heard!" is the first thing you see, and Tab moves on to the actions.
  useEffect(() => {
    heardRef.current?.closest('dialog')?.scrollTo({ top: 0 });
    heardRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="heard" tabIndex={-1} ref={heardRef}>
      <div className="sheet__top">
        <p className="label muted">Success</p>
        <button type="button" className="sheet__close sheet__close--ink" onClick={onDone} aria-label="Close">
          ×
        </button>
      </div>
      <p className="heard__big dot">Heard!</p>
      <p className="heard__ar" lang="ar" dir="rtl">
        اتسجل يا معلم
      </p>
      <pre className="heard__git">
        [main{result.first && <span className="hot"> (root-commit)</span>} {receipt}] {spot.id.replace(/^fue-/, '')}:{' '}
        {result.rating}/5{'\n'} 1 review changed, 1 insertion(+)
      </pre>
      <div className="slot" aria-hidden="true" />
      <div className="paper heard__receipt torn-b">
        <p className="heard__brand cond">
          <Asterisk /> CS Family Star <Asterisk />
        </p>
        <p className="label heard__meta">
          Customer receipt · rcpt {receipt}
          <br />
          {formatStamp(result.at)}
        </p>
        <div className="rule-dash" />
        <h2 id="rate-title" className="heard__spot cond">
          {spot.brand}
        </h2>
        <p className="label heard__meta">
          {AREAS[spot.area].en} · {CRAVINGS[spot.craving].en}
        </p>
        <p className="stamp" aria-hidden="true">
          Posted
          <small>{formatStamp(result.at).split(' · ')[0]}</small>
        </p>
        <div className="rule-dash" />
        <p className="leader">
          <span>Rating</span>
          <b>{result.rating}/5</b>
        </p>
        <p className="leader">
          <span>Verdict</span>
          <b>
            {verdict.cs} ·{' '}
            <span lang="ar" dir="rtl">
              {verdict.ar}
            </span>
          </b>
        </p>
        <p className="leader">
          <span>Printed as</span>
          <b dir="auto">{name}</b>
        </p>
        {result.first && (
          <p className="slip__flag label">
            <Asterisk />
            First review on this spot
          </p>
        )}
        <Barcode code={receipt} className="barcode heard__code" />
        <p className="heard__thanks">{receipt} · thanks for feeding the family</p>
      </div>
      <div className="heard__actions">
        {onSpotPage ? (
          <button type="button" className="key key--chalk" onClick={onDone}>
            See it on the ticket →
          </button>
        ) : (
          <Link className="key key--chalk" href={`/spot/${spot.id}`} onClick={onDone}>
            See it on the ticket →
          </Link>
        )}
        <ShareButton path={`/spot/${spot.id}`} title={`${spot.brand} on CS Family Star`} />
      </div>
    </div>
  );
}
