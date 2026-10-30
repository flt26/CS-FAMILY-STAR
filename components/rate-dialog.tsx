'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { startTransition, useActionState, useEffect, useRef, useState } from 'react';
import { submitReview, type ReviewState } from '@/app/actions';
import { formatStamp, langOf } from '@/lib/format';
import { rememberVerdict, saveNickname, useNickname } from '@/lib/local-profile';
import { cleanName, LIMITS, nameError, type FieldErrors, type ReviewField } from '@/lib/review-input';
import { AREAS, CRAVINGS, type Spot } from '@/lib/spots';
import { NICKNAMES, VERDICTS } from '@/lib/verdicts';
import { Asterisk, Barcode, DotGlyph, orderNo } from './marks';
import { ShareButton } from './share-button';
import { usePhoto } from './use-photo';

const IDLE: ReviewState = { status: 'idle' };
const OFFLINE: ReviewState = {
  status: 'error',
  message: 'Couldn’t reach the server. Your review is still here, so try again in a moment.',
};
// Where to send focus when a field is wrong, in the order the form asks for them.
const FIELD_TARGETS: [ReviewField, string][] = [
  ['rating', 'input[name="rating"]'],
  ['comment', '#rate-comment'],
  ['photo', 'input[name="photo"]'],
  ['name', '#rate-name'],
];

const STEP_NAMES: Record<ReviewField, string> = {
  spot: 'the spot',
  rating: '01 (rating)',
  comment: '02 (comment)',
  photo: '03 (photo)',
  name: '04 (nickname)',
};

/** After a refused submit, put the cursor where the first problem is. */
function focusFirstProblem(form: HTMLFormElement | null, problems: FieldErrors) {
  const target = FIELD_TARGETS.find(([field]) => problems[field]);
  if (target) form?.querySelector<HTMLElement>(target[1])?.focus();
}

export interface RateRequest {
  spot: Spot;
  /** True when the spot has no reviews yet, so this one is its first. */
  open: boolean;
}

/** Opens whenever `request` is set; calls onClose once the dialog has closed. */
export function RateDialog({ request, onClose }: { request: RateRequest | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedBackdrop = useRef(false);

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
      // Only a press and release both on the backdrop closes it, so selecting
      // text in the comment and letting go outside the sheet keeps the draft.
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (pressedBackdrop.current && event.target === event.currentTarget && !sending()) close();
        pressedBackdrop.current = false;
      }}
    >
      {request && <RateForm key={request.spot.id} {...request} onDone={close} />}
    </dialog>
  );
}

async function send(previous: ReviewState, formData: FormData): Promise<ReviewState> {
  try {
    const result = await submitReview(previous, formData);
    if (result.status === 'done') {
      rememberVerdict(result.spotId, result.rating);
      saveNickname(cleanName(String(formData.get('name') ?? '')));
    }
    return result;
  } catch {
    // A dropped connection must not take the page (and the draft) down with it.
    return OFFLINE;
  }
}

const randomNickname = (except = '') => {
  const options = NICKNAMES.filter((nickname) => nickname !== except);
  return options[Math.floor(Math.random() * options.length)];
};

function RateForm({ spot, open, onDone }: RateRequest & { onDone: () => void }) {
  const savedName = useNickname();
  const [state, dispatch, pending] = useActionState(send, IDLE);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  // First-timers start with a fun handle instead of an empty required field.
  const [name, setName] = useState(() => savedName || randomNickname());
  const [localErrors, setLocalErrors] = useState<FieldErrors>({});
  const photo = usePhoto();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const errors: FieldErrors = { ...(state.status === 'error' ? state.fields : {}), ...localErrors };
  const missing = FIELD_TARGETS.filter(([field]) => errors[field]).map(([field]) => STEP_NAMES[field]);

  useEffect(() => {
    if (state.status === 'error' && state.fields) focusFirstProblem(formRef.current, state.fields);
  }, [state]);

  if (state.status === 'done') {
    return (
      <Printed
        spot={spot}
        name={cleanName(name)}
        comment={comment.trim().length}
        hasPhoto={Boolean(photo.file)}
        result={state}
        onDone={onDone}
      />
    );
  }

  return (
    <form
      ref={formRef}
      className="sheet paper torn-b"
      noValidate
      data-pending={pending || undefined}
      // onSubmit rather than action={…}: React resets a form after every form
      // action, which would wipe the photo and nickname on a validation error.
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const formData = new FormData(event.currentTarget);
        const problems: FieldErrors = {};
        if (!rating) problems.rating = 'Pick a rating from 1 to 5.';
        const nameProblem = nameError(cleanName(name));
        if (nameProblem) problems.name = nameProblem;
        if (photo.status === 'working') problems.photo = 'Still shrinking your photo…';
        setLocalErrors(problems);
        if (Object.keys(problems).length > 0) {
          focusFirstProblem(event.currentTarget, problems);
          return;
        }
        if (photo.file) formData.set('photo', photo.file);
        else formData.delete('photo');
        startTransition(() => dispatch(formData));
      }}
    >
      <div className="sheet__top">
        <p className="label sheet__kicker">Rate</p>
        <button type="button" className="sheet__close" onClick={onDone} disabled={pending} aria-label="Close">
          ×
        </button>
      </div>
      <h2 id="rate-title" className="sheet__title cond">
        {spot.brand}
      </h2>
      <p className="label sheet__where">
        {CRAVINGS[spot.craving].en} · {AREAS[spot.area].en}
      </p>
      {open && (
        <p className="sheet__first">
          <Asterisk /> First review on this spot: your name goes on its ticket.
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
                <span className="dot">{value}</span>
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
            <span className="label">Tap a number</span>
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
          lang={langOf(comment)}
          rows={2}
          maxLength={LIMITS.comment}
          value={comment}
          placeholder="What did you order? Was it worth it?"
          aria-invalid={Boolean(errors.comment)}
          aria-describedby={errors.comment ? 'rate-comment-error' : undefined}
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
          <p className="error" id="rate-comment-error" role="alert">
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
              aria-describedby={errors.photo ? 'rate-photo-error' : undefined}
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
                <span className="photo__note">Goes on your receipt. Tap it there to see it full size.</span>
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
                Remove photo
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
          <p className="error" id="rate-photo-error" role="alert">
            {errors.photo}
          </p>
        )}
      </div>

      <div className="step">
        <label className="step__head" htmlFor="rate-name">
          <span>
            <b>04</b> Nickname
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
            lang={langOf(name)}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setLocalErrors((current) => ({ ...current, name: undefined }));
            }}
            autoComplete="nickname"
            maxLength={LIMITS.nameMax}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'rate-name-hint rate-name-error' : 'rate-name-hint'}
          />
          <button
            type="button"
            className="key key--paper handle__shuffle"
            onClick={() => {
              setName(randomNickname(name));
              setLocalErrors((current) => ({ ...current, name: undefined }));
            }}
          >
            <DotGlyph name="dice" />
            Shuffle<span className="sr-only"> nickname</span>
          </button>
        </div>
        <p className="step__hint step__hint--stack" id="rate-name-hint">
          <span>No student ID, no login. Any name you like — it’s what prints on your receipt.</span>
          <span lang="ar" dir="rtl">
            أي اسم — مش لازم اسمك الحقيقي
          </span>
        </p>
        {errors.name && (
          <p className="error" id="rate-name-error" role="alert">
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

      <div className="sheet__send">
        {missing.length > 0 && <p className="sheet__missing">Check {missing.join(' and ')} above.</p>}
        {state.status === 'error' && !state.fields && (
          <p className="sheet__error" role="alert">
            {state.message}
          </p>
        )}
        <button type="submit" className="key key--red sheet__submit" aria-disabled={pending}>
          <span className="sheet__submit-label">
            <Asterisk />
            {pending ? 'Printing…' : 'Post my review'}
          </span>
          <span className="ar" lang="ar" dir="rtl">
            انشر
          </span>
        </button>
        <p className="sheet__fine">Reviews are public and can’t be edited or deleted. Keep it honest, keep it kind.</p>
      </div>
    </form>
  );
}

function Printed({
  spot,
  name,
  comment,
  hasPhoto,
  result,
  onDone,
}: {
  spot: Spot;
  name: string;
  /** Length of the comment that was posted. */
  comment: number;
  hasPhoto: boolean;
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
        اتسجل! تسلم إيدك
      </p>
      <pre className="heard__git" aria-hidden="true">
        [main{result.first && <span className="hot"> (root-commit)</span>} {receipt}] {spot.id.replace(/^fue-/, '')}{' '}
        {result.rating}/5{'\n'} 1 review, 1 insertion(+)
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
        <div className="rule-dash" />
        <div className="heard__lines">
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
          {comment > 0 && (
            <p className="leader">
              <span>Comment</span>
              <b>{comment} chars</b>
            </p>
          )}
          {hasPhoto && (
            <p className="leader">
              <span>Photo</span>
              <b>attached</b>
            </p>
          )}
          <p className="leader">
            <span>Printed as</span>
            <b dir="auto" lang={langOf(name)}>
              {name}
            </b>
          </p>
          <p className="stamp" aria-hidden="true">
            Posted
            <small>{formatStamp(result.at).split(' · ')[0]}</small>
          </p>
        </div>
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
            See your review <span aria-hidden="true">→</span>
          </button>
        ) : (
          <Link className="key key--chalk" href={`/spot/${spot.id}`} onClick={onDone}>
            See your review <span aria-hidden="true">→</span>
          </Link>
        )}
        <ShareButton path={`/spot/${spot.id}`} title={`${spot.brand} on CS Family Star`} />
      </div>
    </div>
  );
}
