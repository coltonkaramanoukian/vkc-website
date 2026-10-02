# Needs Colton

Everything the site is waiting on that an agent must not do. Run 2
(2026-09-27) kept building past each of these; nothing below blocks the code.
Each item says what is missing, where it goes, and what appears once it is done.

## 1. Production: where it lives and how it moves

**Live:** https://vkc-website-wz5a.vercel.app, Vercel project `vkc-website-wz5a`
(created 2026-09-27). Its first production deploy is commit `c175c6e` (main as
of run 4). The §6 SHA check passed, and `/fr`, `/en` and `/v` return 200.

- `vercel.json` enables git deploys of `main` (since 2026-09-28), so **merging a
  PR deploys production** on `vkc-website-wz5a`. A manual deploy still works:

  ```bash
  cd "$HOME/Desktop/vkc-website" && git checkout main && git pull
  npm run build && vercel --prod
  ```

- The main checkout is linked to `vkc-website-wz5a`. The old project
  `vkc-website` (vkc-website-zeta.vercel.app) is a duplicate that also builds
  every push; delete it in the Vercel dashboard.

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

**You can now fill most of this yourself, without touching code or JSON — see
§11, the content editor at `/admin`.** The file-by-file notes below still hold
(they are what the editor writes), and photos/logos/video stay out of the editor
because they are imaging. `docs/CONTENT-INTAKE.md` lists every field as
`file:field`. The short version:

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

Also on Hobby: 100 deploys a day, and every branch push spends two, because
both linked projects (`vkc-website`, the stale one, and `vkc-website-wz5a`,
the live one) deploy a preview; `[skip vercel]` in a commit message does not
stop it (proven on #28 and #29). The account hit the cap on 2026-09-27, so a
"Deployment rate limited" check on a PR is the cap, not the build. Two
settings only you can change: disconnect the stale project's git
integration, and turn previews off on the live one (Ignored Build Step) if
Vito's image PRs do not need preview links.

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

Two things that were yours first (one is done):

1. **Done (PR #27, 2026-09-27): CLAUDE.md §1 permits AI-generated imagery.**
   Stock and third-party imagery stay banned; real photos still render only
   from `content/photos.json`. Where each slot sits, how big, and what makes
   a file valid: `docs/MEDIA-SLOTS.md`.
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

## 9. Client quotes and case studies (social proof)

The home page has an "In their words" section built and waiting. It renders
**nothing** on the live site until `content/clients.json` has an approved
client with a quote or case study written in both languages (fields in
`docs/CONTENT-INTAKE.md`, under clients.json). No agent may write a quote,
name or logo: each one needs the client's written yes.

What you need to supply, per client:

- their written permission to be named (that is what `approved: true` means);
- a logo file, if you want the logo rather than the name (put it under
  `public/photos/` and point `logo` at it);
- the quote in English and in French, the person's name, and optionally their
  title; and/or a short paragraph on what VKC ran for them, in both languages.

**Before you approve the first client, rewrite two sentences.** The home
"Straight talk" block (`home.plain.body`) and the about page ("What won't be
written here") both say the site shows no client logos. `npm test` fails the
moment a client is approved while either sentence still says that (a
negative control proved it red with an injected client, then green after the
revert).

To see the empty slots laid out, run the `dev-placeholders` launch config
(port 3201); the live site never shows them.

## 10. The home "what we fill" reel and the keyboard, on desktop (Vito's lane)

Found in the 2026-09-29 usability sweep; left for Vito because it lives in his
cinematic motion, not in the chrome an agent owns.

On a phone, and under reduced motion, and if the motion libraries fail to load,
the reel is a normal horizontal scroller and a keyboard reaches every card
fine. On desktop with the motion on, the reel is a **pinned** horizontal pan
(`src/components/home-motion.tsx`, the `#fill` ScrollTrigger with `pin: true`):
the section holds still while vertical scroll drives the reel sideways. A
keyboard user who tabs onto card 3, 4 or 5 focuses a card that is panned
off-screen and clipped by the section's `overflow: hidden`, because the pin
absorbs the browser's "scroll the focused thing into view" (measured: `scrollY`
stays put while the focused card sits partly outside the viewport). It is a
minor issue, not a blocker — every reel destination (cleaners, lubricants,
sealers, toll blending, kits) is also a plain link in the menu and the footer,
so nothing is unreachable; it is WCAG 2.4.11 (focus not obscured) on a
decorative, duplicate row.

The safe fix is additive and belongs with the motion: on `focusin` of a reel
card, scroll the window to the position where the pinned ScrollTrigger has that
card in view (reuse `distance()` and the existing `lenis.scrollTo`, the way the
in-page anchor handler already does). It changes nothing for mouse or touch —
they never focus a card without also seeing it. It is Vito's call how his reel
should behave for a keyboard, so it waits for him rather than an agent editing
his showcase unseen.

### 10b. The container-name marquee and "pause, stop, hide" (Vito's lane)

Found in the 2026-09-29 usability pass 11, and left here for the same reason as
10 above: it lives in Vito's cinematic motion, not the chrome an agent owns.

The home page runs a container-name ticker (`.marquee` / `.marquee-track` in
`src/app/globals.css`, rendered from `src/app/[locale]/page.tsx`) that scrolls
sideways forever (`animation: marquee 50s linear infinite`). It is built
carefully: it is `aria-hidden="true"` (a decorative, duplicated brand flourish,
invisible to a screen reader) and the animation is gated behind
`@media (prefers-reduced-motion: no-preference)`, so a visitor who has asked
their OS for reduced motion sees it standing still.

The gap is narrow and strict: **WCAG 2.2.2 "Pause, Stop, Hide" (Level A)** asks
that any content which moves automatically, lasts more than five seconds, and
sits beside other content offers the visitor a way to pause it — and it asks
this of *every* visitor, not only the ones who set the OS reduced-motion flag.
A sighted visitor with vestibular or attention sensitivity who has never found
that setting gets a ticker that never stops. The reduced-motion gate and the
`aria-hidden` already cover the two cohorts most sites forget; what 2.2.2 wants
on top is a control anyone can reach.

Why it is not fixed unseen: the only *complete* fix is a visible pause/play
control on the ticker, which is a design decision on one of Vito's signature
home elements. A cheaper CSS-only half-measure —
`.marquee:hover .marquee-track { animation-play-state: paused }` — gives a
mouse user a pause but does nothing for touch (the mobile majority) or a
keyboard, so shipping it alone would look done without being done. It is Vito's
call how his ticker should offer a pause; it waits for him. Minor, not a
blocker — the content is decorative and repeated as real text elsewhere on the
page.

## 11. The content editor at `/admin` (built 2026-10-02) — turn it on

A password-protected editor so you can fill the content in §3 and §9 yourself —
contact details, capabilities/specs, and the client list — with a form instead
of editing JSON. It writes the same `content/*.json` files by hand, so every
guard still runs on what you save, and the editor itself refuses, at save time,
any staffing wording (§4) or forbidden claim (§1) — the same matchers
`guard:staffing` and `guard:claims` use. **It is off until you set two secrets**,
and that is deliberate: with nothing set, `/admin` shows a login page but no
password works, so the surface cannot be used.

**What is NOT in the editor, on purpose:** photos (`photos.json`), client logos
(the `logo` field), generated scenes (`scenes.json`) and the demo video
(`media.json`). All of that is imaging — Vito's lane (§8). The editor rounds a
client's existing logo through untouched; it never sets one.

### Turn it on (two secrets, both required)

Set these on Vercel (project `vkc-website-wz5a`, Settings → Environment
Variables, Production — and Preview if you want to use it there too):

- `ADMIN_PASSWORD` — the one password that signs you in. Pick a long, random
  one; it is the only credential.
- `ADMIN_SESSION_SECRET` — a random string, **16+ characters** (e.g.
  `openssl rand -hex 32`). It signs the login cookie; it is not typed anywhere.
  Changing it later signs everyone out.

With both set, go to `https://<the site>/admin`, sign in, and edit. The session
lasts 12 hours, in an httpOnly cookie; "Sign out" clears it.

### Make saving publish (production persistence)

In local development the editor writes the files on disk. **In production it has
nowhere to write unless you give it a GitHub token** — then a save becomes a
commit to the repo, which (because merging to `main` deploys, §1) rebuilds and
publishes the site a minute or two later. Until the token is set, a save in
production returns "nothing was saved — no content store configured" and writes
nothing (a fail-safe, never a silent loss).

Set, on the same project:

- `ADMIN_GITHUB_TOKEN` — a GitHub token with **write access to the `Contents`**
  of `coltonkaramanoukian/vkc-website` (a fine-grained PAT scoped to just that
  repo is best). This is what commits your edits.
- `ADMIN_GITHUB_REPO` — `coltonkaramanoukian/vkc-website`.
- `ADMIN_GITHUB_BRANCH` — optional, defaults to `main`. Leave it on `main` to
  publish; point it at a branch if you'd rather review edits as PRs first.
- `ADMIN_GITHUB_AUTHOR_NAME` / `ADMIN_GITHUB_AUTHOR_EMAIL` — optional, the name
  on the commit.

Each save commits one file with a message like `content: update contact via
admin editor`. You can watch them land in the repo's commit history.

### Two things the editor does NOT check (that the full gate does)

- **Numbers (NC-3)** and **FR/EN parity (NC-4)** are not enforced at save. A
  capability number you type becomes the content the number guard trusts, by
  design; and the editor lets you save an English value without its French yet.
  Write both languages for anything public, the way the rest of the site does.
- It proves wording, not law: §4's lawyer answer (§4 above) is still yours.

### Flagged for you (an agent could not do these)

- **`.env.example` was not updated** with the five `ADMIN_*` keys: this
  environment blocks agents from reading or writing any `.env*` file. Add them
  there yourself so the next person sees them. Your local `.env.local` already
  has `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` (added for local testing);
  change them to real values before relying on them.
- **Pick the real production password and secret** — the local ones are
  throwaway test values.

Built branch-only, verified locally (login → edit contact → save → both
`/en/contact` and `/fr/nous-joindre` re-render; staffing/claim saves refused).
Nothing was deployed. Code: `src/app/admin/`, `src/app/api/admin/`,
`src/components/admin/`, `src/lib/admin/`, the `/admin` gate in `src/proxy.ts`.

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
