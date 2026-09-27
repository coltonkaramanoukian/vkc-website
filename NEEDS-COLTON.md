# Needs Colton

Everything the site is waiting on that an agent must not do. Run 2
(2026-09-27) kept building past each of these; nothing below blocks the code.
Each item says what is missing, where it goes, and what appears once it is done.

## 1. Production: where it lives and how it moves

**Live:** https://vkc-website-wz5a.vercel.app, Vercel project `vkc-website-wz5a`
(created 2026-09-27). Its first production deploy is commit `c175c6e` (main as
of run 4). The §6 SHA check passed, and `/fr`, `/en` and `/v` return 200.

- `vercel.json` disables git deploys of `main`, so **merging a PR does not
  deploy**. Production moves only when you run:

  ```bash
  cd "$HOME/Desktop/vkc-website" && git checkout main && git pull
  vercel link --yes --project vkc-website-wz5a
  npm run build && vercel --prod
  ```

- The main checkout's `.vercel/project.json` still points at the **old**
  project `vkc-website` (vkc-website-zeta.vercel.app, an older build). Run the
  `vercel link` line above once, then delete the old project in the Vercel
  dashboard if you no longer want it.
- Merged pull requests since `c175c6e` are not live until the next `vercel --prod`.

## 2. Quote form email: wired, and one real send left to prove

The form posts to `/api/quote`, which sends through Resend. The three
variables are now set on `vkc-website-wz5a` for Production and Preview:
`RESEND_API_KEY`, `QUOTE_TO_EMAIL`, `QUOTE_FROM_EMAIL`. Checked in production
on 2026-09-27: an empty POST returns `400 invalid` with field errors, so the
route is live. No real request has been sent by an agent, because that would
put an email in your inbox without your say.

To prove delivery: submit the form on `/en/quote` once with your own details
and confirm the email arrives. If it doesn't, check two things.
- `QUOTE_FROM_EMAIL` must be on a domain verified in Resend; if it isn't, the
  form shows "could not send" and the Vercel function log says `send_failed`.
- The function log (Vercel, project `vkc-website-wz5a`, Logs) records every
  attempt as `sent`, `invalid`, `honeypot`, `rate_limited`,
  `email_not_configured` or `send_failed`, with no personal details.

**Analytics** is Vercel Web Analytics, enabled on the project and verified in
production: the script and a page-view beacon load from a first-party path,
with no cookies and nothing in browser storage. That is what `/privacy` says
("Cookies and measurement"). Numbers appear in Vercel, under Analytics.

## 3. Content that renders nothing until you fill it

`docs/CONTENT-INTAKE.md` lists every field as `file:field`. The short version:

- **`content/contact.json`**: phone, email, address, hours, privacy officer.
  Phone is the one that changes the site most: "Call …" appears beside every
  quote button, in the footer, in the phone action bar, on the quote, visit
  and contact pages, and in the form's fallback message. The `/contact` page
  is form-only until this file has at least one of phone, email, address or
  hours; then its details placard appears and its lead changes.
- **`content/capabilities.json`**: run sizes, fill sizes, viscosity range,
  batch sizes, lead time, equipment, and the Second Shift crew / shifts /
  commitment / insurance lines. These are the ONLY numbers the site may print.
- **`content/photos.json`**: ten slots, each with an `intent` line. No stock,
  no generated, no third-party images.
- **`content/clients.json`**: names and logos, `approved: true` only with a
  written yes from the client.

After editing: `npm run build`, `npm run render`, `npm run guard:numbers`,
`npm run guard:claims`, then `vercel --prod`.

## 4. The lawyer's answer on Second Shift wording (CLAUDE.md §4)

Every Second Shift surface carries the four facts and none of the staffing
terms, and `npm run guard:staffing` proves the wording. Whether the wording is
enough is the lawyer's call. Until that answer arrives, no run may loosen §4.
If the answer changes the required phrasing, the phrase-sets live in
`guard/second-shift-required.json` and `guard/staffing-terms.json`.

## 5. Domain

`docs/DOMAIN.md` has the steps. Buying, DNS and attaching the custom domain are
yours. After the base URL changes, the QR must be regenerated and re-proven
(`npm run qr`, NC-8) before anything is printed.

## 6. Vercel plan

The project is on Hobby (run 1's log, 2026-09-22). Vercel's own FAQ says Hobby
is for personal, non-commercial use. A plan change is a paid action an agent
must not take.

## 7. Video (the video run's file)

`content/media.json` is reserved for the video run; the demo video slot on
`/visit` renders nothing until that run fills it.

## 8. Higgsfield: where generated media plugs in

Built in run 3 (2026-09-27), nothing filled. The seam is one file and one
folder:

- **`content/scenes.json`** — thirteen covers (one per page, each with an
  `intent` line and an `aspect`) and two galleries (home, about). Set `kind`
  (`image` or `video`), `src`, `alt.en`, `alt.fr`; a video also needs `poster`.
  Optional `caption` and a `portrait` variant for phones.
- **`public/media/`** — where the files go. Paths in the manifest start with
  `/media/`. Budgets: image 600 kB, poster 300 kB, video 12 MB. Prefer `.webp`
  or `.avif` for stills and `.mp4` (H.264, silent) for loops; keep loops short.
- **`npm run guard:media`** before every build: it fails on a missing file, a
  wrong extension, a video without a poster, or alt missing in either
  language. NC-10 (`scripts/nc/nc10-media.sh`) shows it failing and passing.
- Preview the slots before filling them: `dev-placeholders` in
  `.claude/launch.json` (or `NEXT_PUBLIC_SHOW_PLACEHOLDERS=1 npm run dev`)
  draws every empty slot as a dashed box with its intent.

Two things only you can do first:

1. **Amend CLAUDE.md §1.** It reads "No stock, generated or third-party
   imagery". Generated covers need that line changed (for example: "generated
   media renders only from `content/scenes.json`, marked as such where it
   appears"). A run will not loosen §1 on its own.
2. **Decide what a generated scene may depict.** The `intent` lines describe
   a floor, containers and equipment with nobody identifiable and no customer
   branding. Anything showing a real customer's plant or product needs their
   written OK (`photos.json` has the same rule).

Not built, on purpose: no Higgsfield API call, no upload endpoint, no CMS.
Generated files are committed like any other asset and go live with the next
`vercel --prod`.

Where each seam sits after the run 4 design pass (2026-09-27), so a generated
scene lands in a composed place rather than an afterthought:

- **`home-cover` (21/9)** renders full width directly under the home hero,
  above the first fill rule. The hero keeps its drawing (the two containers)
  whether or not the cover is filled: the drawing is the brand's device, the
  cover is the floor it stands on. A silent loop plays in view with a
  Play / Pause label; the poster stands under reduced motion.
- **Page covers (16/9)** render between a longform page's hero and its
  "on this page" strip, inside the same column as the copy, framed by the
  1.5px ink rule like every placard.
- **The two galleries (home, about)** render as three tiles from `md` and a
  snap strip on a phone, after the two service placards on the home page and
  after the page's sections on `/about`.
- **Preview them before generating**: `NEXT_PUBLIC_SHOW_PLACEHOLDERS=1` draws
  every empty slot as a dashed box with its `intent` line, in place, at the
  size it will render. `docs/SCROLL-BRIEF.md` (self-authored in run 4) says
  how each page should feel, which is what a scene brief should read first.
- Nothing on the site fades, slides or parallaxes, and a generated scene
  must not either: the motion rule in `brand/BRAND.md` (CSS only, the fill
  line only, everything behind reduced motion) covers media too. A clip is a
  still that happens to move; it is not a transition.

## Things that look like problems and are not

- **Lighthouse best-practices 96 on a local build.** The only failing audit is
  a 404 for `/_vercel/insights/script.js`, which exists on Vercel and not on
  `next start`. Re-measure on production after item 1 (`npm run lighthouse`).
- **`npm run overlap:rendered` is red.** Rendered text carries content data
  (container family names) that repeats on every page that lists them. The
  gate is the copy-mode measurement, `npm run overlap`, which is green. See
  `docs/DESIGN-DECISIONS.md` §10.
- **`npm run check:hreflang` against production is red until item 1 ships.**
  It fetches the alternates from production, which does not yet have the
  hub pages, `/contact` or `/glossary`. Against a local build
  (`--base http://localhost:3100`) it is 40/40.
