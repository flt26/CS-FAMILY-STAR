# CS Family Star

The campus food guide for **Future University in Egypt**: 100 spots around FUE,
rated by the students who actually eat there. Pick a spot, give it a verdict
from 1 to 5, add a line and a photo if you like.

Made by the CS Family — **Youssef Ahmed** and **Ahmed Abdelwahab**.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. No `.env` is needed to start: the public Supabase
project URL and publishable key are baked in as defaults (see `lib/config.ts`),
so a local copy shows the live reviews. It won't post to the live project,
though: only the deployed site on Vercel writes to it. Copy `.env.example` to
`.env.local` to point at another project (posting works there) or to add the
service-role key.

| Variable | Where | What for |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | optional | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional | Publishable key (public by design) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only, recommended in production | Lets the server write reviews so the database can refuse anonymous writes. On a fresh project, photo uploads need it: Storage has no anonymous upload policy |

Other scripts: `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`.

## The design: "the order ticket"

Input lives on the dark machine; output is printed on paper. Every spot is a
kitchen order ticket, every review a thermal receipt, and the home page is one
long receipt called **The menu**.

- **Top right now** — the first screen answers the question with the three
  best-ranked spots, then the search, "Pick for me" and the full menu.
- **On the rail** — the standouts hang from a kitchen ticket rail: top rated,
  most reviewed, best near campus, the freshest comment, and spots nobody has
  rated yet.
- **The rating sheet** — pick 1–5 (Segfault, Buggy, It compiles, Clean build,
  Ship it, with مش تاني … تحفة), add a comment and a photo, and sign with any
  nickname (first-timers get a `while(hungry)`-style one, and Shuffle picks
  another). When it posts you get "Heard! / اتسجل! تسلم إيدك", a git-style
  commit line and a printed receipt.
- **Spot pages** — the order ticket with the average, a histogram and the
  first reviewer; reviews with words or photos print as receipts, and
  rating-only reviews are summed up on one slip.
- **Type** — Archivo at 62% width for headlines, Handjet's dot-matrix for
  numbers and Arabic headlines, IBM Plex Mono for receipts, IBM Plex Sans
  Arabic for Arabic text. All self-hosted through `next/font`.
- **Colour** — ink `#161412`, chalk `#F3EFE6`, thermal paper `#F8F6F0`,
  ticket paper `#EFE7D5`, print `#1B1815`, and two reds: `#BF2A1C` on paper,
  `#FF5D40` on ink. Tokens live in `app/globals.css` (`@theme`).
- **Colour has two jobs** — red is for actions (keys, the chosen filter) and
  for "nope" (1-star) verdicts. Ranks, tags and labels print in ink. The only
  decorative red is the brand's own marks: the star, the hero's question and
  the POSTED stamp.
- **Motion** — the menu feeds out of the printer slot once per visit, the
  POSTED stamp lands, the search caret blinks on desktop. All of it switches
  off with `prefers-reduced-motion`.
- Barcodes, order numbers and dot glyphs are generated from ids
  (`components/marks.tsx`), so they render the same on the server and client.

## How it fits together

- **Next.js 16** (App Router, Cache Components), **React 19**, **Tailwind CSS v4**, **Supabase** (Postgres + Storage).
- `lib/spots.ts` — the 100 spots. A spot's `id` is what `reviews.restaurant_id`
  stores, so ids are permanent: rename or delete one and its reviews disappear.
  To add a spot, append a new entry with a new id.
- `lib/reviews.ts` — reads from Supabase inside `'use cache'` functions tagged
  `reviews`. Stats are computed from every row, paging past PostgREST's
  1000-row limit. Rows with out-of-range ratings or photo URLs that are not in
  our bucket are ignored.
- `app/actions.ts` — `submitReview`, the only way a review gets written:
  validates every field (`lib/review-input.ts`), rate-limits per address and
  nickname (`lib/rate-limit.ts`), decodes the photo and re-encodes it as WebP
  with `sharp` (so only real images are stored, without EXIF), uploads it,
  inserts the row, and refreshes the cached pages with `updateTag`.
- Photos are shrunk in the browser (`lib/compress-image.ts`) to at most 1600px
  before upload, so a 10 MB phone photo becomes a few hundred KB.
- The nickname and the verdicts a device has given live in `localStorage`
  (`lib/local-profile.ts`). There are no accounts.

### Public JSON API

- `GET /api/restaurants` — every spot with `averageRating` and `reviewCount`
  (same shape as the first version of the app), or a 503 while ratings are
  unavailable.
- `GET /api/reviews?restaurant_id=fue-cilantro` — the newest 200 reviews for
  one spot.

## Hardening

Reviews are anonymous, so anyone can still post under any nickname. What is in
place: server-side validation, a rate limit per address and per nickname, a
duplicate check, a honeypot field, photos decoded and re-encoded on the server,
and photo URLs restricted to our own bucket. The rate limit reads the client
address from `X-Real-IP` (Vercel sets it); if you host the app yourself, put it
behind a proxy that sets that header. To close the remaining gaps:

1. **Stop anonymous writes.** Add `SUPABASE_SERVICE_ROLE_KEY` to the Vercel
   project, redeploy, then run `supabase/hardening.sql` in the Supabase SQL
   editor. It adds constraints, and restrictive policies that keep the public
   key from writing reviews or touching the photo bucket, whatever other
   policies say. Other buckets keep their policies. It is safe to run again.
   Until then the database has to accept inserts with the public key, which
   lets people skip the app's checks by calling Supabase directly.
2. **Real identities.** Sign-in with an `@fue.edu.eg` email (Supabase Auth magic
   link) would allow one verdict per student per spot and editing your own.

`supabase/schema.sql` documents the table and bucket the app expects.
