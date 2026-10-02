HANDOFF: 2026-09-29 — `main` holds runs 1–5, the image-ban lift (#27), Vito's cinematic redesign (#30), a usability loop (#32–#34), a second usability pass (#36), a third verification-only pass, a fourth pass (#39, #40), a fifth pass (#42), a sixth verification-only pass, a seventh verification-only pass, an eighth pass (#46, print stylesheet), a ninth pass (#48, skip-link focus), and a **tenth pass (this one — verification only, no code change)**. Production is live on `vkc-website-wz5a.vercel.app`, serving current `main`; root 307s to `/en`, an FR browser to `/fr`, `/v` to `/fr/visite`. Passes 1–3 converged on a clean, diminishing-returns close; pass 4 re-audited independently and shipped two real fixes (#39 quote-form contact hint, #40 sticky glossary A–Z); pass 5 re-audited live and found the one defect every prior pass had missed by only ever measuring 375px — a 320px (WCAG 1.4.10 reflow) header overflow that clipped the mobile Menu control (#42, shipped and verified live), then swept 320/375/768 clean site-wide. Pass 6 re-audited live on **five dimensions the prior five passes never measured** (text-spacing WCAG 1.4.12, ultrawide 2560, locale-switch deep-path preservation, sticky-CTA/footer overlap, OG social-share image resolution) plus the core brief dimensions independently — all clean, no code change. Pass 7 went again at **six more dimensions no prior pass measured**, in EN and FR (form `autocomplete`/WCAG 1.3.5, menu Escape/outside/link dismissal, mid-band widths 640–1279 + the `xl` boundary/WCAG 1.4.4, focus-not-obscured/WCAG 2.4.11, content visibility under `prefers-reduced-motion`, and forced-colors/Windows High Contrast) — every one clean or already correctly coded, no code change. **Pass 8 (#46, shipped) found a real defect no prior pass had measured: the print stylesheet.** The site is dark-themed; on paper the light colour tokens (secondary prose, near-white FAQ questions, amber links) printed faint or vanished once a printer dropped the dark backgrounds — 44 failing text elements on the home page, 32 on a service page. Fixed by swapping the six colour tokens to the paper palette under `@media print` (the same set `.vkc-negative` uses) and outlining buttons; **0 failing text elements after, verified live on production.** **Pass 9 (#48, shipped) found the next un-measured defect: the skip link scrolled but never moved keyboard focus.** Every page's first Tab lands on "Skip to content", but `<main>` was not focusable (no `tabindex`), so activating it left `document.activeElement` on `<body>` — a screen-reader user heard nothing move and native fragment navigation only worked in browsers that implement the sequential-focus starting point (WCAG 2.4.1). Fixed with `tabIndex={-1}` on `<main id="main">` (page-shell.tsx) so focus lands on the landmark, plus `#main:focus{outline:none}` so a full-width container doesn't draw the 3px ring around the whole page; verified live that focus now moves to `<main>`, EN + FR, no ring, next Tab in content. The one open usability item (desktop pinned-reel keyboard focus, WCAG 2.4.11) remains in Vito's motion lane, flagged in `NEEDS-COLTON.md` §10, not fixed unseen. **Pass 10 independently measured eight dimensions/surfaces no prior pass had — WCAG 2.5.8 target size, a copy/typography anomaly scan of all 40 URLs, French non-breaking-space punctuation, link-purpose 2.4.4/2.4.9 (generic/ambiguous/duplicate link names), the `/visit` QR entry point, the error/not-found/global-error boundaries, the live quote-form empty-submit experience, and the print stylesheet's fixed/sticky chrome — in EN and FR, and found every one clean or already correctly built. No code PR; the loop is closed at genuine diminishing returns, confirmed by fresh measurement, not inherited from notes. **Pass 11 (this one, docs only) went again at six more un-measured dimensions** — landscape/short-height viewport (812×375), PWA manifest orientation lock (WCAG 1.3.4), the marquee under 2.2.2 Pause/Stop/Hide, in-page anchor landing under the *double* sticky bar (glossary A–Z, measured with a real Lenis click), heading-level hierarchy across 25 EN+FR URLs, and language-toggle/hreflang integrity on the localized FR slugs — and found **five clean and one minor Level-A finding (the marquee's pause control), routed to `NEEDS-COLTON.md` §10b as Vito's motion decision rather than fixed unseen.** Live `/en` default re-confirmed. The loop remains genuinely closed.

# Handoff

## Quality / UX overhaul — branch `quality/overhaul` (2026-10-02)

A new session was asked for a deep, continuous quality + UX overhaul of
everything **non-imaging** (copy, layout, components, responsiveness, a11y,
performance, i18n, nav, forms, SEO), on **one branch**, verified **locally**
(no Vercel/Actions quota: `next build` + `next start`, driven through the
Playwright MCP at 390/1280, EN + FR), held for **one** merge + deploy Colton
runs. Vito's imaging lane (image assets, `content/scenes.json`, the image
schema, `home-motion.tsx` motion, Vito's branches) was left untouched.

**Branch note.** `quality/overhaul` is cut from `docs/usability-pass-11`, so it
*contains* pass 11's docs (PR #51). Merging this one branch supersedes #51;
#51 can be closed as included, or merged first (it is an ancestor — no
conflict either way).

### The honest finding: the site is already in excellent shape

A full fresh audit (not inherited from the pass-1–11 notes) found every
objective gate **green** on current `main`'s code:

- **a11y:** 80 axe scans (40 URLs × 2 widths) — 3,659 rule passes, **0
  violations** (WCAG 2.2 AA + best-practice).
- **Code:** typecheck ✓, scoped lint (`src scripts guard`) ✓, **80/80 tests** ✓,
  production build ✓.
- **i18n:** FR/EN key parity ✓, FR length within ±10% every page ✓, 120 hreflang
  alternates resolve ✓, 20 locale-switch round-trips ✓, `/v` door defaults FR ✓.
- **Content guards:** numbers ✓, claims ✓, staffing (four Second Shift facts) ✓,
  copy-overlap ✓.
- **Responsive:** 0 horizontal overflow at 390px across the pages measured; the
  compare table stacks; empty states (footer, DemoVideo, scenes) render nothing
  rather than voids.
- **Copy:** genuinely strong, bilingual, no filler. **First-load JS** ~154 kB
  gzip (the bulk is GSAP/Lenis motion — Vito's lane).

So most *perceived* roughness is **pending content** (Colton's lane) and
**imagery** (Vito's lane), not code — see "What's actually rough" below.

### Shipped on this branch (two real, in-lane fixes)

1. **Mobile home: the fixed "Get a quote" action bar overlapped the hero's own
   "Which one fits your plant?" button by 34px** (two-thirds of it, hard to tap
   at first view). The hero is full-height and bottom-aligned, so its CTAs sat
   exactly where the fixed bar is; axe can't see fixed-overlay occlusion, so the
   eleven prior passes missed it. Fixed with a `--vkc-action-bar-h` token (reused
   by `.action-bar-spacer`) and a `max-width: 639px` bottom-padding on
   `.cine-hero-inner` that lifts the hero foot clear of the bar. Desktop is
   provably untouched (bar is `display:none` ≥640px; measured hero padding
   unchanged at 1280). After: both CTAs sit 38–98px above the bar, neither
   covered. `globals.css` only — no Scene/media/motion touched.
2. **SEO: Organization JSON-LD had no `logo`.** Added `logo: {baseUrl}/icon.svg`
   (the brand mark the manifest already ships; schema.org-valid, not a claim) so
   search has a logo for the Organization entity. `src/components/json-ld.tsx`.

Both re-verified green after the change: production build, a11y (0 violations),
all guards, typecheck, lint, 80 tests.

### Taste calls (flagged, not decided — no AskUserQuestion per brief)

- **The mobile action bar is always-on** and duplicates the hero CTA. Many sites
  reveal the sticky CTA only after you scroll past the hero. That needs client JS
  + touches the shared `action-bar.tsx`, and "always reachable" is a valid
  choice — so it is Colton's call, not shipped.
- **The dark cinematic theme** is image-heavy and can read as murky where the
  imagery is still placeholder-ish. That is Vito's design lane.

### What's actually "rough" — and whose lane it is

- **`content/contact.json` is all null** → no phone / email / address / hours
  anywhere (footer, contact page, action bar). For a B2B site, no visible way to
  reach VKC besides the form is the biggest real gap. **Colton's lane** (can't
  invent facts, §1); the empty state already renders gracefully.
- `content/capabilities.json` null → no spec numbers · `content/clients.json`
  `[]` → no social proof · `content/media.json` demo null → no demo video.
  **Colton's / the video run's lanes.**
- Final imagery (dark Higgsfield stills/videos) and motion — **Vito's lane.**

### Verification & deploy posture

Local only. **Not merged, not deployed, no Vercel build triggered.** One branch
(`quality/overhaul`), pushed once. Screens captured before/after via the
Playwright MCP against `next start -p 3100`.

## Usability pass 11 — fresh independent audit, one finding routed (2026-09-29)

A new session reopened the "full-send" usability loop. Rather than inherit the
pass-1–10 close from notes, it ran its own live, measurement-first audit against
production (`vkc-website-wz5a`) through the Playwright MCP, deliberately
targeting **six dimensions and surfaces no prior pass had measured**, in EN and
FR. Five came back clean or already-correct; one produced a single, minor,
Level-A finding that lives in Vito's motion lane, so it was **routed to
`NEEDS-COLTON.md` §10b rather than fixed unseen — no code PR, docs only.**
Vito's lane untouched (no `content/scenes.json`, no media, no image schema, no
`home-motion.tsx`, no Vito branches). Live `/en` default re-confirmed:
root (no/EN `Accept-Language`) → 307 → `/en`, FR `Accept-Language` → `/fr`,
`/en` `/fr` 200, `/v` → `/fr/visite`.

The six, each measured or read this pass:

- **Landscape / short-height viewport (812×375).** Every prior pass measured
  *portrait* widths only (320 / 375 / 768); none had ever loaded the site on a
  short landscape phone, where a full-bleed `100svh` hero and a sticky header
  most often collide. Measured live: **0 horizontal document overflow**
  (`scrollWidth === clientWidth === 812`); the one element wider than the
  viewport is the `.marquee-track` ticker, correctly contained by its
  `overflow: hidden` parent so it adds no document scroll. The `.cine-hero`
  (`min-height: min(100svh, 62rem)`, `align-items: end`) grows to contain its
  ~800px of content and is reached by a normal scroll — **nothing is clipped**
  (the box expands past the 375px min, so `overflow: hidden` never cuts it).
  Header stays a 65px sticky bar. Clean.
- **PWA manifest orientation lock (WCAG 1.3.4 Orientation, AA).** A manifest
  that pins `"orientation": "portrait"` restricts the content to one orientation
  and fails 1.3.4. Read `src/app/manifest.ts`: `display: "browser"` and **no
  `orientation` key** — the site never locks orientation. Clean, and confirmed
  by the landscape test above rendering fine.
- **The container-name marquee under "Pause, Stop, Hide" (WCAG 2.2.2, A).** Pass
  7 checked general content-visibility under reduced motion; no pass had held the
  *auto-scrolling ticker* against 2.2.2 specifically. It is well built —
  `aria-hidden="true"` and the `animation` gated behind
  `prefers-reduced-motion: no-preference` — but 2.2.2 asks for a pause mechanism
  available to *every* visitor, not only those who set the OS reduced-motion
  flag. The one real finding of the pass. **Routed to `NEEDS-COLTON.md` §10b**
  (Vito's motion lane): the only complete fix is a visible pause control on one
  of his signature home elements, and a CSS hover-pause half-measure helps
  neither touch nor keyboard, so it is not shipped unseen.
- **In-page anchor landing under the sticky bars.** Pass 10 verified `#book`'s
  `scroll-margin-top`; this pass measured the tightest case — the glossary A–Z
  strip, which stacks a **second** sticky bar (the letter strip, ~47px) under the
  65px header. The mechanism: `html { scroll-padding-top: calc(4rem + 1rem) }`
  (80px) on the scroll container, plus `--vkc-jump-stick` (`4rem + 3.75rem` =
  124px) as each letter/term's `scroll-mt`. Verified not by reading CSS but by
  a **real, Lenis-handled click** on "S" (a programmatic `location.hash` does
  *not* trigger this site's smooth scroll — anchors are driven from
  `window.scrollY`): the S heading lands at `top: 204px`, **92px clear** of the
  strip's 112px bottom. Nothing lands under the chrome. Clean.
- **Heading-level hierarchy across 25 URLs, EN + FR.** Prior passes counted `h1`
  (exactly 1); none had checked for *level skips* (an `h2`→`h4` jump a screen
  reader reports as a missing level). Fetched and parsed every main route in both
  locales: **exactly one `h1` per page and zero level skips on all 25** (home,
  services + the three service pages, about, glossary/lexique, industries,
  containers, quote/soumission, visit/visite, privacy, montreal). The outline is
  sound site-wide.
- **Language-toggle / hreflang targets on the localized-slug pages.** The FR
  slugs are true translations (`/fr/lexique`, `/fr/soumission`), not `/fr/`+the
  English word — a class of route where a stale toggle would 404 in production.
  Read the actual toggle and `<link rel="alternate" hreflang>` off `/en/glossary`
  and `/en/quote`: both point at the real localized FR slug, and each resolves
  **200** with a clean heading outline. (The two 404s in this pass's console were
  the audit script's own wrong-guess fetches — `/fr/glossaire`, `/fr/devis` — not
  links the site emits.) Clean.

**GOTCHA for the next session.** To measure where an in-page anchor *actually*
lands on this site, you must **click the link** — setting `location.hash` looks
like it works but skips Lenis, which drives anchor scroll from `window.scrollY`
(a `location.hash` test here reported the target at `top: 908` — off-screen —
while a real click put it at the correct `top: 204`). And when auditing routes,
resolve FR slugs from the page's own `hreflang`/toggle, not by translating the
English path: the FR slugs are localized (`lexique`, `soumission`, `deuxieme-
quart`), so guessed paths 404 and pollute the console with false errors.

### §7 sign-off (pass 11)

**Nothing should be cut.** Eleven passes — five of them (3, 6, 7, 10, 11) fresh,
independent, measurement-first audits that each went at *un*measured dimensions
rather than redoing the sweep — converge on one read: the fundamentals were built
right, and every dimension checked (now including landscape/short-viewport,
1.3.4 orientation, heading-level hierarchy, localized-slug toggle integrity, and
the tightest double-sticky-bar anchor landing) is clean or already handled in
code. The single new finding — the marquee's strict 2.2.2 pause control — is a
minor Level-A item on a decorative, `aria-hidden`, reduced-motion-gated element
that is Vito's design to change, and it is routed to him in `NEEDS-COLTON.md`
§10b, not fixed unseen. This loop stays genuinely closed; further in-lane
usability change would be churn without new content or a Vito motion decision.

## Usability pass 10 — verification only (2026-09-29)

A fresh session reopened the "full-send" usability loop. Rather than inherit the
pass-1–9 close from notes, or redo the 320/375/768 overflow sweep (pass 5) or the
dimension sets of passes 6 and 7, it ran its own live audit against production
(`vkc-website-wz5a`) through the Playwright MCP, deliberately targeting **eight
dimensions and surfaces no prior pass had measured**, in EN and FR. It found new
work on none of them: **no code PR — the site is clean on every dimension checked,
or the correct handling was already in the code.** Vito's lane untouched (no
`content/scenes.json`, no media, no image schema, no `home-motion.tsx`, no Vito
branches).

The eight, each measured or read this pass:

- **WCAG 2.5.8 Target Size (Minimum, AA).** Prior passes checked ≥44px on real
  controls (that is AAA 2.5.5) and dismissed inline links as exempt, but never
  measured the AA 24px rule on the site's tightest non-inline control — the
  **glossary A–Z jump strip** (single-letter links reusing `.jump-nav a`).
  Measured live: letters render **24.8px wide × 44.8px tall** (the narrowest,
  "W", is 23.8px — 0.2px under), but the **centre-to-centre spacing is ~40px**,
  so a 24px-diameter circle centred on each target cannot intersect a neighbour.
  2.5.8's spacing provision is satisfied; the strip passes. Nothing else on the
  site puts two small non-inline targets closer than that.
- **Copy / typography anomaly scan of all 40 URLs.** Prior passes checked
  metadata, titles and descriptions, never the *rendered body copy* end to end.
  A fetch-and-parse sweep of every route (block elements separated so `innerText`
  joins don't create false hits) scanned for unresolved `{tokens}`, literal
  `undefined`/`null`/`NaN`, doubled periods/commas, doubled words, placeholder
  text, and `h1` count. **Zero real defects** (every "doubled-word" hit was a
  breadcrumb-then-H1 or two adjacent list items across a block boundary; `h1`
  count is exactly 1 on all 40). The `Inc..` class of defect (pass 2) is gone
  site-wide.
- **French non-breaking-space punctuation.** French typography wants a
  no-break space before `: ; ! ?` and inside guillemets, or the punctuation can
  orphan to the start of a line. Source check of `i18n/messages/fr.json`: **139
  `U+00A0` non-breaking spaces, 0 plain spaces before `: ; ! ?`, and all four
  `«` guillemets use `« `.** Already correct — the scan's "space-before-
  punct" hits were NBSPs normalised to a plain space before matching.
- **Link purpose (WCAG 2.4.4 / 2.4.9).** axe flags empty/missing link names,
  not *ambiguous* ones; no pass had measured link-text quality. Swept all 40
  URLs for generic link text ("here", "read more", "learn more", … and the FR
  equivalents), empty accessible names, and the same accessible name pointing at
  different hrefs (confusing in a screen-reader link list). **Zero of each** —
  the design's descriptive labels ("How Second Shift works", "More on
  Bottleneck") hold up bilingually.
- **The `/visit` QR entry point.** `/v` (→ `/fr/visite`) is a real doorway (a
  scanned QR on a card or at a show), but prior passes centred on home / services
  / quote / glossary. Checked live: **0 document overflow**, a sound heading
  outline, the empty `content/media.json` video slot correctly renders **nothing**
  (no reserved dead space), and the primary CTA "Book a walkthrough" resolves to
  a real `#book` section carrying the visit-mode form (company / name / contact /
  service radios / notes / honeypot) with `scroll-margin-top: 96px` clearing the
  65px header. Clean and functional.
- **The error / not-found / global-error boundaries** — surfaces that never
  render in a normal sweep. **`error.tsx` uses `retry`, which is correct for this
  Next.js version (16.3.5): the App-Router error-boundary recovery prop is
  `retry` — stable since v16.3.0, per `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md` — not the pre-16 `reset`.** (Exactly the
  AGENTS.md trap: the instinct "it should be `reset`" is stale; the bundled docs
  settle it.) `global-error.tsx` also uses `retry`, is bilingual with `lang` on
  parts and both home links; `[locale]/not-found.tsx` is localized inside
  `PageShell` (full nav for recovery); the root `not-found.tsx` offers both home
  links. All correctly built and recoverable.
- **The quote-form empty-submit experience, observed live.** Prior passes
  verified the *mechanism* (labels, `aria-invalid`, `inputmode`, focus-to-first-
  invalid). This pass watched it *render*: an empty submit sets
  `data-form-status="invalid"`, marks the three offending fields `aria-invalid`,
  shows clear per-field messages ("This field is required.", "Enter a phone
  number or an email address.", "Choose one of the options.") plus a
  `role="alert"` summary ("Check the fields marked below."), and moves focus to
  the first invalid field. Server-driven (the form POSTs and the route returns
  `400` with field errors, per `NEEDS-COLTON` item 2 — the `400` in the console
  is expected REST semantics, not a bug). The conversion path's error UX is
  clear and accessible.
- **The print stylesheet's fixed/sticky chrome.** Pass 8 fixed print *contrast*;
  this pass closed the sub-dimension it opened. In `@media print` the sticky
  header and footer are `display:none`, and the fixed mobile **"Get a quote"
  action bar carries `no-print`** (`action-bar.tsx:23`), so no fixed chrome
  prints over content. External links append their URL (`a[href^="http"]::after`).
  Clean.

**Considered and deliberately not shipped** (on record so pass 11 need not
re-derive them, and so the choice is honest, not an omission):

- **No-JS quote submit.** The form has a native `action="/api/quote"
  method="post"` fallback, so with JavaScript off (or a failed bundle) a submit
  navigates to the JSON API and shows raw JSON. Real but an edge for a modern
  marketing-site visitor, and the correct fix (server content-negotiation →
  redirect to a result page) is feature-shaped and touches the conversion
  backend — Colton's lane, alongside the null `content/contact.json` and the
  Resend wiring (`NEEDS-COLTON` items 2–3). Not an unattended backend change.
- **Root `not-found.tsx` lang-of-parts.** Its bilingual heading ("Page
  introuvable / Page not found") does not wrap the English half in
  `lang="en-CA"` the way `global-error.tsx` does. Genuine but on the
  outside-`/fr`-and-`/en` 404, an ultra-rare surface with minimal content; a PR
  here is closer to churn than fix.

**GOTCHA for the next session.** When an `error.tsx`/`global-error.tsx` prop
name "looks wrong" against your memory of Next.js, check the **bundled** docs for
the installed version (`node_modules/next/dist/docs/`) before calling it a bug —
this Next is modified and versioned APIs move (here, `reset` → `retry`, stable in
16.3.0). And for WCAG 2.5.8, a target under 24px is not a failure if the
centre-to-centre spacing to its neighbours is ≥24px (a 24px circle on each must
not intersect another target); measure the spacing, not just the box.

### §7 sign-off (pass 10)

**Nothing should be cut.** Ten passes — four of them (3, 6, 7, 10) fresh,
independent, measurement-first audits that each targeted *un*measured dimensions
rather than redoing the sweep — converge on the same read: the fundamentals were
built right, and every dimension the brief names plus every accessibility and
robustness dimension checked since (2.5.8, 2.4.4/2.4.9, print, error boundaries,
copy quality, FR typography, the `/visit` doorway) is clean or already handled in
code. The one open in-lane candidate stays Vito's motion lane (the pinned-reel
keyboard focus, `NEEDS-COLTON.md` §10), not fixed unseen; the two micro-items
above are named and declined with rationale. **This loop is genuinely closed;
further in-lane usability change would be churn without new content or a Vito
design change.** No new Colton item surfaced.

## Usability pass 9 — the skip link now moves focus (2026-09-29, #48 shipped)

A fresh session reopened the "full-send" usability loop. Passes 1–8 had swept
the screen experience, the accessibility dimensions and the print page. This
pass first confirmed several genuinely un-measured dimensions were already
built right — the viewport config does **not** disable pinch-zoom (no
`maximum-scale`/`user-scalable`), the locale switch already carries `lang` of
parts (`Français`/`English` tagged for the other language), `CompareTable` is a
real semantic `<table>` with `scope="col"`/`scope="row"`, and a **landscape
phone (667×375)** has 0 horizontal overflow. Then it found one real defect no
prior pass had measured: **the skip link.**

**The defect (WCAG 2.4.1 Bypass Blocks).** Every page's first Tab lands on
"Skip to content" (`<a href="#main">`), as intended. Measured live on
production before the fix: after Tab → Enter on the skip link,
`document.activeElement` was **`BODY`**, `main === activeElement` was **false**,
and `<main>` had **no `tabindex`**. A `<main>` is not focusable by default, so
the browser's fragment navigation only set the next-Tab starting point — it
never landed focus on the landmark. A screen-reader user heard nothing move,
the focus ring vanished for a Tab, and engines that never implemented the
sequential-focus starting point wouldn't skip the header at all. The stated
intent was already wrong: `home-motion.tsx` said the skip link's job "is to
move focus to `<main>`, which only the browser's fragment navigation does for
free" — but native fragment navigation only lands focus on a *focusable* target.

**#48 `fix/skip-link-focus-main` (merged 8424d43).** Two lines + a comment fix,
all in-lane:
- `page-shell.tsx` — `tabIndex={-1}` on `<main id="main">`, so the fragment jump
  actually lands focus on the main landmark (`-1` keeps it out of the Tab order;
  focusable only as the skip target).
- `globals.css` — `#main:focus { outline: none }`. Focusing a full-width
  container via keyboard triggers `:focus-visible`, which would draw the global
  3px amber ring around the **entire page**. Suppressed on this one container:
  `<main>` is not an interactive control, so no 2.4.7 indicator is owed, and the
  focus move + landmark announcement are the point, not a box. Every real
  control keeps its `:focus-visible` ring (verified).
- `home-motion.tsx` — comment corrected to say focus lands *because* `<main>` is
  now focusable.

**Proven on a local `next build && next start` via the Playwright MCP, EN + FR,
then re-verified live on production.** Tab → Enter →
`document.activeElement === <main id="main">` (**true**), computed `outline:
none` (no full-page ring), and the **next** Tab lands on the first control in
`<main>` ("Pause the video") which keeps its full amber ring
`solid 3px rgb(240,179,35)`. 320px document overflow still **0** (no layout
regression). Gates green: typecheck, `eslint src scripts guard` (0), 80 node
tests, build, render 40/40, guards numbers/fr/claims/staffing/media, **axe 80
scans / 0 violations**, **click-through 1790 clicks / 0 failed**. CSS + markup +
a comment only — **Vito's scenes/motion lane untouched** (no
`content/scenes.json`, no media, no image schema, no Vito branches). Live after
merge: root still 307s → `/en`, FR browser → `/fr`, `/en` + `/fr` 200, and the
skip link moves focus to `<main>` on production, EN + FR.

**GOTCHA for the next session.** To test a skip link, the authoritative check is
`document.activeElement` **after** activating it (Tab → Enter), not whether the
page scrolled. Native fragment navigation to a non-focusable container sets only
the *next-Tab starting point* — the next Tab reaches content in Chromium, but
focus never lands on the target, so `activeElement` stays on `<body>`. A
skip-link target needs `tabindex="-1"` to actually receive focus. And when a
large container becomes focusable, keyboard activation triggers `:focus-visible`
on it (the global ring wraps the whole page) — suppress with `#main:focus{
outline:none}`; it does not touch discrete controls' rings.

### §7 sign-off (pass 9)

**Nothing should be cut.** Nine passes deep. This one confirmed four more
un-measured dimensions were already correct (zoom, lang-of-parts, table
semantics, landscape phone) and found + shipped the last obviously-un-swept
interaction defect: the skip link moved the page but not focus. The screen and
print experiences are now exhaustively verified. The one remaining candidate
stays Vito's motion lane (the pinned-reel keyboard focus, `NEEDS-COLTON.md`
§10), not fixed unseen. The live quote form's `unconfigured` fallback ("email is
not set up yet") was reviewed and left as-is: it is the site's designed
graceful degradation while `content/contact.json` is null and Resend is unwired
(Colton's lane, `NEEDS-COLTON` item 1) — there is no contact fact to offer
instead without inventing one (§1), so a copy rewrite would be lipstick, not a
fix. **Further in-lane usability change is now genuine diminishing returns.** No
new Colton item surfaced.

## Usability pass 8 — the print stylesheet (2026-09-29, #46 shipped)

A fresh session reopened the "full-send" usability loop. Passes 1–7 had swept
the screen experience deep (interaction, a11y, overflow 320→2560, reduced-motion,
forced-colors, text-spacing, autocomplete, focus-not-obscured, …). This pass
targeted a surface **no prior pass had touched at all: the printed page** — a
real use for a B2B marketing site (a plant manager printing or saving a service
page or a quote to circulate internally).

**The defect.** The site is set on a dark floor for screen (`brand/tokens.css`),
but `@media print` (`globals.css`) only forced `body` to white/black. Every
element that sets its own colour from a token kept its **dark-theme** value, so
on paper the light text tokens printed faint or vanished the moment a printer
dropped the dark backgrounds — the common *economy / no-background* default.
Measured under `print` media via the Playwright MCP against live production:

- **Home `/en`: 44 text elements** failing contrast vs. white paper.
- **`/en/services/second-shift`: 32.** Offenders were the three light tokens:
  `.text-graphite` secondary prose (leads, field labels, legends) at **2.42:1**;
  near-white ink on the **FAQ questions** and `.btn-secondary` at **1.17:1**
  (effectively invisible); the **amber accent** on inline links at **1.88:1**.
  The spec table and cards printed as heavy dark ink blocks with illegible text.

**#46 `fix/print-legibility-dark` (merged 9a09dfc).** In `@media print` only:
(1) **swap the six colour tokens on `:root`** to the paper palette — the *same
set* `.vkc-negative` already uses for a block set on paper — so every
token-driven surface recolours to dark ink on white **from one place** (the
codebase's own light-theme mechanism, applied for print); (2) **render buttons
outlined** (ink text + hairline border, transparent background) so they stay
legible with or without printed backgrounds, including in the `.vkc-negative`
context where a filled pill drops out in economy print. Base links already carry
`text-decoration: underline`, so they stay distinguishable once the amber token
goes to ink.

**Proven before writing a line**, then re-verified on the built CSS and live:
the token swap alone took the service page 32→1 (the lone holdout the closing-
band button, fixed by the outline rule → 0). After merge + deploy: **0 failing
text elements under print media** on `/en`, `/en/quote`, `/en/glossary`,
`/en/services/second-shift`, `/fr`, `/fr/soumission` — home 44→0 confirmed on
**live production** (prod CSS carries `@media print{:root{--vkc-graphite:#4f5560;
…color-scheme:light}}`). Before/after full-page print screenshots captured
(`print-before-second-shift.png` / `print-after-second-shift.png`, untracked).

Gates green: typecheck, `eslint src scripts guard` (0), 80 node tests, build,
render 40/40, guards numbers/fr/claims/staffing/media. CSS only — **Vito's
scenes/motion lane untouched** (no `content/scenes.json`, no media, no image
schema, no `home-motion.tsx`). Live root still 307s → `/en`, `/en` + `/fr` 200.

**GOTCHA for the next session.** To test print, use the Playwright MCP's
`browser_emulate_media({media:'print'})` then scan computed text `color` against
**white** (economy print drops backgrounds, so light text = invisible on paper) —
a screenshot under print emulation renders *with* backgrounds and hides the
economy failure. The measurement, not the screenshot, is authoritative for this
dimension. `getComputedStyle` **does** reflect print `@media` token swaps here
(unlike the forced-colors gotcha from pass 7).

### §7 sign-off (pass 8)

**Nothing should be cut.** Eight passes deep; this one found the last obviously
un-swept surface (print) and shipped a real, contained, in-lane fix. The screen
experience is exhaustively verified; the print page is now legible in both
locales. Remaining candidates are Vito's motion lane (the pinned-reel keyboard
focus, `NEEDS-COLTON.md` §10) or genuine churn. No new Colton item surfaced.

## Usability pass 7 — verification only (2026-09-29)

A fresh session reopened the "full-send" usability loop. Rather than inherit the
pass-1–6 diminishing-returns close from notes, or redo the 320/375/768 sweep
(that only redoes pass 5) or pass 6's five dimensions, it ran its own live audit
against production (`wz5a`) through the Playwright MCP, deliberately targeting
**six dimensions the prior six passes never measured**, in **both EN and FR**. It
found new work on none of them: **no code PR — the site is clean on every
dimension checked, or the correct handling was already in the code.** Vito's lane
untouched (no `content/scenes.json`, no media, no image schema, no
`home-motion.tsx`, no Vito branches).

Before measuring the browser, two dimensions were checked in source and found
**already correctly handled** (so no live test was needed to confirm a gap that
does not exist):

- **WCAG 1.3.5 Identify Input Purpose (`autocomplete`).** Prior passes checked
  the quote form's focus-to-first-invalid, live regions and `inputmode`, but
  never its `autocomplete` tokens. `quote-form.tsx` already sets
  `autocomplete="organization"` (company), `"name"`, `"email"` and `"tel"` on
  the full form, and `"on"` on the short-mode combined contact field —
  confirmed live on the rendered DOM at `/fr/soumission` too
  (`organization`/`name`/`email`/`tel`). Mobile autofill works; 1.3.5 satisfied,
  bilingually.
- **Mobile menu dismissal.** The header Menu is a native `<details>`/`<summary>`;
  `nav-menu.tsx` already layers on exactly what a keyboard/pointer user expects —
  **Escape** closes it and returns focus to the summary, a **pointerdown
  outside** closes it, and **following any link** inside it closes it. Nothing to
  add.

Four dimensions measured live, all clean:

- **Mid-band viewport widths + the `xl` breakpoint boundary.** Every prior pass
  measured only 320/375/768 and 1280/1440/2560, never the awkward **600–1080
  band** a desktop layout collapses through (and what a 1280 window reflows to at
  200% browser zoom, WCAG 1.4.4). At **640, 900, 1279 and 1280** on `/en`, and
  **640** on `/fr` + `/fr/soumission` (longest French labels): **0 document
  overflow**, 0 un-clipped offenders. Navigation stays reachable across the whole
  band — the primary top nav is `hidden xl:block` (appears from 1280), and below
  1280 the **Menu** control + language switch are always present and visible
  (verified at 900 and 1279). The 1279→1280 swap is clean both sides.
- **WCAG 2.4.11 Focus Not Obscured (sequential Tab under the sticky header).**
  Prior passes flagged only the desktop pinned-reel (Vito's lane); no pass tested
  general sequential focus under the 65px sticky header. `html` carries
  `scroll-padding-top: 80px` (> the 65px header) — the exact mechanism — and a
  spread of in-content links focused across the page depth land **below** the
  header (tops 269–514px); nothing interactive ends up **entirely** hidden (the
  AA threshold), and real sequential Tab honours scroll-padding at least as well
  as the programmatic probe. Satisfied.
- **Content visibility under `prefers-reduced-motion: reduce`** (the highest-risk
  dimension for a cinematic scroll site — scroll-reveal blocks that start at
  `opacity:0` would leave reduced-motion users staring at blank sections). With
  reduced-motion emulated on `/en`, a scan of every `section`/heading/`p`/`a`/`li`
  for `opacity<0.05`, `visibility:hidden` or a >100px hiding transform returned
  **0 hidden text-bearing elements** across the full 11,702px document. Motion is
  CSS-gated, so under reduced-motion content resolves to its natural, visible
  state. Correct.
- **Forced-colors / Windows High Contrast Mode (WCAG 1.4.1 robustness)** — never
  measured; a real risk for a dark, custom-styled site. With `forced-colors:
  active` emulated on `/en`: **0 elements opt out** via `forced-color-adjust:
  none` (nothing fights the system palette), and a screenshot confirms the
  "Get a quote" CTA keeps a clear rounded pill boundary, "Français" reads as a
  proper underlined link, and the hero eyebrow + H1 render on white backplates —
  all legible. (Note for the next session: `getComputedStyle` does **not** reflect
  Chromium's forced-colors paint — the button's border/background/outline all read
  as absent/transparent while the render shows a boundary. Trust the screenshot,
  not the computed style, for this dimension.)

One more was settled by markup rather than a live keyboard walk: the **home
service chooser** — the site's primary decision aid, only ever exercised by
click/programmatically before — uses native `<input type="radio">` inside
`<label>`s, grouped by `name` in `<fieldset>`s, with the result in an
`aria-live="polite"` region (`service-chooser.tsx`). Native radio semantics
guarantee arrow-key selection within a group and Tab traversal between groups; the
markup is definitively keyboard-operable, no defect possible.

Core dims re-confirmed live: root still 307s to `/en`, `/en` and `/fr` both 200.

### §7 sign-off (pass 7)

**Nothing should be cut.** Seven passes — three of them (3, 6, 7) fresh,
independent, measurement-first audits that deliberately targeted *un*measured
dimensions rather than redoing the sweep — converge on the same verdict: the
fundamentals were built right, and every dimension the brief names (clear nav,
CTAs, mobile, fast loads, no dead clicks, section order, contrast/tap targets, no
broken links) plus the newer accessibility dimensions (1.3.5, 1.4.4/mid-band,
2.4.11, reduced-motion, forced-colors) is clean or already handled in code. The
one remaining candidate stays Vito's motion lane (the pinned-reel keyboard focus,
`NEEDS-COLTON.md` §10), not to be fixed unseen. **This loop is genuinely closed;
further in-lane usability change would be churn without new content or a Vito
design change.** No new Colton item surfaced.

## Usability pass 6 — verification only (2026-09-29)

A fresh session reopened the loop and, rather than inherit the pass-1–5
diminishing-returns close from notes, ran its own live audit against production
(`wz5a`) through the Playwright MCP — deliberately targeting **dimensions the
prior five passes had never actually measured**, since re-running the same
320/375/768 overflow sweep would only redo pass 5. It found new work on none of
them: **no code PR — the site is clean on every dimension checked.** Vito's lane
untouched (no `content/scenes.json`, no media, no image schema, no
`home-motion.tsx`, no Vito branches).

New dimensions measured for the first time, all clean:

- **WCAG 1.4.12 text spacing** (the failure mode fixed-height chrome usually
  trips on): applied the standard override — `line-height 1.5`,
  `letter-spacing 0.12em`, `word-spacing 0.16em`, paragraph `margin 2em` — to
  `/en`, `/en/quote`, `/en/glossary` at 375px and scanned every text-bearing
  element for content clipped by an `overflow:hidden`/`clip` ancestor. **0
  clipped, 0 document overflow** on all three (the header and its fixed-height
  controls ride every page, so this covers the chrome). The layout is fluid, so
  spacing reflows rather than clips.
- **Ultrawide / wide viewport** (every prior pass used only 1280 and 375). At
  **2560×1400** the `.wrap` content column caps at **1312px and centres** with
  equal 624px gutters, **0 document overflow**, and the top nav is present (it is
  `hidden xl:block`, so it correctly appears from 1280 up). Nothing stretches or
  strands.
- **Locale-switch deep-path preservation.** On a deep page
  (`/en/containers/pails`) the language switch points at the **translated deep
  path** `/fr/contenants/seaux`, not a dump to the FR home — verified from the
  live DOM. Core to a bilingual site; correct.
- **Sticky mobile CTA vs. footer overlap.** At 375px scrolled fully to the
  bottom, the fixed full-width "Get a quote" bar (top 739) sits below the
  footer's last link (bottom 716) with a 23px clearance and the page carries the
  bottom padding to clear it — **no overlap**, no content hidden behind the bar.
- **OG / social-share image resolution** (prior passes checked titles and
  descriptions were unique, not that the share image *resolves*). Home
  `og:image` = `…/og/en/home` returns **200 image/png**; `twitter:card` is
  `summary_large_image` with the same image; canonical + og:url point at the
  live domain. Shares render, not broken.

Core brief dimensions re-confirmed independently (measured live, not inherited):

- **Link integrity** — a single in-page `fetch` of **all 40 content URLs**
  (19 routes × 2 locales, minus the shared root) returned **200 on every one**;
  root and `/v` return manual-redirect responses (root 307→`/en` per `curl`).
- **Home chooser end-to-end** — answering both questions programmatically
  (`pressure=shifts`, `want=ownLine`) updates the `aria-live` region to
  "**Second Shift, at your plant**" with the four §4 facts and a working link
  "How Second Shift works" → `/en/services/second-shift`. The decision aid works.
- **Desktop visual** (1440) — polished hero, clear nav (Services · Industries ·
  Containers · About · Contact + language + Menu + amber Get-a-quote), obvious
  CTAs, sensible section order. Nothing confusing.
- **375 overflow** — 0 document overflow on every page loaded this pass.

**Closed at diminishing returns — six passes deep, this one confirmed by
measurement on new dimensions rather than inherited from notes.** The
fundamentals were built right and passes 1–5 already swept the brief; pass 6
went looking specifically where the prior passes had *not* looked and still
found nothing in-lane to fix. The remaining candidate stays Vito's motion lane
(the pinned-reel keyboard focus, `NEEDS-COLTON.md` §10); a code change here would
be churn. No new Colton item surfaced.

## Usability pass 5 (2026-09-29)

A fresh session reopened the loop and, instead of inheriting the pass-1–4
"diminishing returns" close from notes, ran its own live audit against
production (`wz5a`) through the Playwright MCP. It confirmed the earlier passes
on every dimension they measured (chooser end-to-end, contact null-state,
mobile overflow at 375, forms) **and found one genuine defect they had not: the
site was only ever measured at 375px, never at 320px.**

- **#42 `fix/header-reflow-320` (merged 227e558).** At the WCAG 1.4.10 reflow
  benchmark width (320 CSS px), the header's three items — the VKC wordmark
  (140px), the language switch (83px "Français") and the **Menu** control
  (77px) — need ~332px side by side with the default 16px gutter. So at 320px
  the **"Menu" label clipped off the right edge** and the page carried ~12px of
  horizontal scroll, degrading the only route to navigation on the smallest
  phones (the top-level nav is `hidden xl:block`; "Get a quote" is
  `hidden sm:inline-flex`, so at 320 the row is brand + language + Menu only).
  Fix: one `@media (max-width: 360px)` block trimming the header's own inline
  gutter (`.site-header .header-bar` 16px → 10px) and the Menu summary's inner
  padding (`.site-header .menu-summary` 0.5rem → 0.25rem, glyph gap 0.6 → 0.4rem).
  At 320px the row now fits with ~11px to spare, EN and FR, and the Menu opens
  to a full-width panel with 0 horizontal scroll. **Capped at 360px on purpose:**
  361px and up are byte-identical, so the verified-clean 375px layout is
  untouched; the 44px tap-target height is untouched (only inline padding moves).
  Header/CSS only — outside Vito's motion/scenes lane. An initial
  `[data-locale-switch]` override was dropped as dead code: it sat in
  `@layer components` but targeted a Tailwind utility (`px-2`), which wins by
  layer order, so it never applied — and the header gutter + Menu padding alone
  already clear the row. Verified on a local `next start` via Playwright at 320
  and 375, EN+FR (overflow 0, Menu unclipped/clickable, panel within viewport,
  375 unchanged). Gates green: typecheck, `eslint src scripts guard`, 80 node
  tests, build, guards numbers/fr/claims/staffing/media. Live after merge: root
  still 307s `/en`, and production CSS carries the rule (320px overflow 0, Menu
  right edge 315/320, 44px tap target).

**Also checked and confirmed clean this pass** (measured live, not inherited).
After the header fix, a fresh 320px reflow sweep of the content-heavy pages
(`/services`, `/containers/pails`, `/industries`, `/glossary`, `/quote`,
`/about`, `/locations/montreal`, plus `/fr`, `/fr/services`, `/fr/soumission`,
`/fr/lexique`) — **document overflow 0 on every one**; the only per-element
widths past the viewport are the intentional horizontal scrollers (the glossary
A–Z strip `overflow-x:auto`, the "where this leads" rails) and the collapsed
`.menu-panel` (absolute, clipped) — none of which scroll the page. Widths 375
and 768 also 0 document overflow (the marquee and Vito's pinned reel exceed the
box but are clipped by an `overflow:hidden` ancestor). The 404 (`/en/<bogus>`)
returns HTTP 404 with a clear H1, a home link, the full footer nav for recovery
and the sticky quote CTA. Keyboard focus: first Tab lands on "Skip to content"
with the 3px solid amber ring. The home chooser still resolves end-to-end (two
clicks → "Bottleneck, at our facility" with a link and Start-over), and the
contact page still degrades to form-only under null content.

**Closed at diminishing returns — now five passes deep.** This pass did NOT
inherit the pass-1–4 close; it re-audited live and found the one real defect
those passes had structurally missed by only ever measuring 375px, never the
320px WCAG reflow width (#42, shipped). With that fixed and the 320/375/768
sweep clean, the remaining candidates are Vito's motion/scenes lane (the
pinned-reel keyboard focus, `NEEDS-COLTON.md` §10) or would be churn. No new
Colton item surfaced. Further in-lane usability change here is not warranted
without new content or a Vito design change.

## Usability pass 4 (2026-09-29)

A fresh session picked up the loop and ran a full independent audit against live
production (`wz5a`) — metadata/titles/descriptions (38 pages, all unique, all
200), contrast (measured; nothing within 0.3 of AA on home), mobile at 375 (0
overflow, header tap targets ≥44px), nav/CTAs, and the quote form. Passes 1–3
were confirmed correct on every dimension. A cross-page automated sweep of all
38 URLs also came back clean (no dead links, unnamed controls, duplicate ids,
heading-level skips, unsafe new-tab links, or missing `alt`), as did breadcrumb
consistency (every sub-page, correctly absent on home) and per-page quote CTAs
(7–8 each). **Two genuine in-lane fixes found and shipped:**

- **#40 `usability/glossary-sticky-az` (merged da6ef56).** The glossary
  (`/glossary`, `/lexique`) is a ~5-screen page whose only cross-navigation is
  the A–Z jump strip, which was `position: static` — after jumping to a letter
  near the bottom the strip was stranded far above. Made it sticky under the
  header (`.glossary-jump`: `top: calc(var(--vkc-header-h) + 1px)`, z-30 below
  the header/menu at z-40, floor background), and retuned the anchor clearance
  with a new `--vkc-jump-stick` token (replaces `scroll-mt-24` on the letter
  sections and term entries) so a jumped-to heading lands below the strip, not
  under it. Glossary-only; `HomeMotion`'s Lenis anchor scroll is home-only so
  the native fragment jump here honours the CSS. Verified `check:clicks --only
  /glossary` (102 clicks, 0 failed, 0 hidden, EN+FR 1280/375) + all four gates
  + guards. Live: strip sticks (nav top = header bottom = 65px), root still
  307s `/en`. Vito's lane untouched.

- **#39 `fix/quote-contact-hint` (merged daa5f61).** The full quote form
  requires at least one of email or phone (server-side `contact` check in
  `src/lib/quote/validate.ts:91`), but neither field carries a `(required)`
  marker — correctly, since only one is needed — so a visitor discovered the
  rule only after a rejected submit, friction on the site's only conversion
  path. Added a note under the email/phone pair ("Leave a phone number or an
  email so we can reply."), given an id and wired to **both** inputs via
  `aria-describedby` (extended the `text()` helper with an optional shared
  `describedById`). Full mode only; short mode (contact/visit) already uses a
  single required "Phone or email" field. FR written native
  ("Laissez un téléphone ou un courriel pour qu'on vous réponde."). Gates green:
  typecheck, `eslint src scripts guard`, 80 node tests, build, guards
  fr/numbers/claims/staffing (copy ratio /quote 1.084 < 1.10). Verified on a
  local `next start` build via Playwright at 1280/375 EN+FR (note renders,
  `aria-describedby` on both inputs, both stay optional, 0 overflow), note
  contrast 7.41:1. Verified live after merge: EN + FR notes on production, root
  still 307s `/en`, key routes all 200. Vito's lane untouched.

**Also checked and confirmed already clean** (measured, not inherited): focus
visibility — every interactive element takes a `3px solid` amber outline on
keyboard focus, logical tab order (skip link first); decision support — the home
chooser (two clicks → a recommended service in an `aria-live` region) plus the
services hub's `CompareTable` (Second Shift vs Bottleneck); breadcrumbs on every
sub-page; 7–8 quote CTAs per page.

**Closed at diminishing returns.** Four passes now converge: the fundamentals
were built right, and passes 1–3 plus this one have swept every usability
dimension the brief names (nav, CTAs, mobile, load speed, dead/confusing clicks,
section order, contrast, tap targets, broken links) by independent measurement.
Pass 4 found and shipped the two remaining real, in-lane gaps (#39, #40); the
next-nearest items are Vito's visual/motion lane (the pinned-reel keyboard focus,
`NEEDS-COLTON.md` §10) or would be churn. Further usability change here is not
warranted without new content or a Vito design change.

## Usability pass 3 — verification only (2026-09-29)

A fresh session picked up the usability loop and, before touching anything, ran
a full independent audit against **live production** (`wz5a`), not against a
local build or prior run's notes. The purpose was to either find genuine new
in-lane work or confirm the diminishing-returns close honestly. It confirmed
the close: **no code PR — the site is clean on every dimension checked.** Vito's
lane untouched (no `content/scenes.json`, no media, no image schema, no
`home-motion.tsx`, no Vito branches).

What was checked live, through the Playwright MCP at 1280 and 375, EN and FR,
plus production `curl`:

- **Load speed** (the dimension no prior pass had measured on the live deploy):
  home `/en` returns TTFB 104 ms, first-contentful-paint 228 ms, DOM
  interactive 163 ms, load 356 ms, 39 requests / 338 KB transferred, **0
  console errors or warnings**. Fast by any bar.
- **Nav** — clear on both widths: Services · Industries · Containers · About ·
  Contact, plus the language toggle, a native `<details>`/`<summary>` Menu
  (keyboard-operable, `aria-haspopup`) and the persistent amber Get-a-quote.
- **CTAs** — obvious and repeated without being noisy: the hero pair
  (Get a quote + "Which one fits your plant?"), a sticky bottom Get-a-quote
  that follows the scroll, and the closing band. FR renders them native
  ("Obtenir une soumission", "Lequel convient à votre usine?").
- **Mobile responsiveness** — `document.scrollWidth === clientWidth` (0 px
  horizontal overflow) at 375 on home, `/en/quote` and `/fr`.
- **Tap targets** — the apparent small-target hits are all false positives:
  the chooser and quote radios are 20 px inputs wrapped in 301×77 px `<label>`
  tap areas, and the rest are footer/inline prose text links (conventionally
  exempt). Real controls: form fields 48–49 px, submit 56 px.
- **Interactive flows** — the home chooser works end-to-end (two clicks
  recommend a service and surface its link in an `aria-live` region); the quote
  form is sound (required-marking, `autocomplete`/`inputmode` on the contact
  fields, progressive disclosure of the shift options under Second Shift, a
  honeypot, first-invalid-field focus per the pass-2 note).
- **Contrast / a11y structure** — no images missing `alt` (EN or FR), `lang`
  correct per locale (`en-CA` / `fr-CA`), skip link first in tab order (carried
  over from pass 2's full axe/reduced-motion/heading sweep, re-spot-checked and
  unchanged).
- **Links** — all **38** sitemap URLs return 200 on production; root 307s
  `/en`, `/v` 307s `/fr/visite` (FR-default, deliberate — D17). No broken
  links, no dead clicks.

**Conclusion.** Three passes now converge on the same read: the fundamentals
were built right and the two earlier loops (#32–#34, #36) already did the
in-lane work. A code change here would be churn or Vito's visual lane. The
loop is closed at diminishing returns, this time confirmed by an independent
live sweep rather than inherited from notes.

## Usability pass 2 (2026-09-29)

A fresh full audit on top of the first usability loop, one PR merged to `main`
(Colton's standing authorization; the Vercel deploy check is the signal, GitHub
Actions is billing-blocked). Vito's lane untouched (no `content/scenes.json`,
no media, no image schema, no `home-motion.tsx`, no Vito branches).

- **#36 `fix/about-legal-double-period` (merged f90e12d).** `/about` shipped a
  visible double period — `17125003 Canada Inc..` — in **both** locales.
  `content/site.json` `legalName` already ends in the abbreviation's period,
  and the About lead template (`pages.about.lead`) added its own after
  `{legal}`. A sentence ending in an abbreviation takes one period, so the
  template now leaves it to `Inc.` The coupling (no period after `{legal}` in
  the source, on purpose) is written down in `docs/DESIGN-DECISIONS.md` §15 so
  it is not "restored". Guards fr/numbers/claims/staffing, typecheck,
  `eslint src scripts guard` and the 80 node tests all green; verified live on
  `wz5a` — `/en/about` reads "Canada Inc. We", `/fr/a-propos` reads
  "Canada Inc. On", root still 307s `/en`, `/en /fr /v /en/quote
  /en/services/second-shift` all 200.

**What the audit checked and found already clean** (so a later run does not
redo it). At 375 and 1280, FR and EN, through the Playwright MCP: contrast
(every text pair AA+; the amber button, links and secondary graphite all pass
on the floor and on cards; hairlines are non-text rules), `prefers-reduced-
motion` (every animation and the marquee are gated behind `no-preference`;
smooth scroll too), the ambient/demo video (preload none, honours reduced data
and reduced motion, always-present pause control), the quote/contact form
(labels, `aria-invalid`, `inputmode`/`type`, honeypot, live regions, focus
moves to the first invalid field on a rejected submit), the menu and FAQ
(native `<details>`, Escape/outside-click/link close), no horizontal overflow,
no missing `alt`, no duplicate ids, no skipped heading levels, `lang` per
locale (`fr-CA`/`en-CA`), the null-content states (contact and the client
sections degrade to form-only / nothing), the 404 (clear heading, home link,
full footer for recovery), `aria-current="page"` on the current nav link, the
skip link + `<main>` landmark first in tab order, a visible amber focus ring
on every control, and the glossary's A–Z jump strip. The single visible
typographic defect across all 40 pages was the double period above.

- **Flagged, not fixed — `NEEDS-COLTON.md` §10 (Vito's lane).** On desktop with
  the motion on, the home "what we fill" reel is a pinned horizontal pan; a
  keyboard user tabbing onto cards 3–5 focuses a card the pin holds clipped
  off-screen (WCAG 2.4.11). Minor — every reel destination is also a plain link
  in the menu and footer, and the phone / reduced-motion / no-JS reel is a
  normal keyboard-reachable scroller — and the safe fix is additive but belongs
  in Vito's `home-motion.tsx`, so it waits for him rather than an agent editing
  his showcase unseen.

**Closed at diminishing returns.** The first loop (#32–#34) and runs 1–5 had
already done the usability work; this pass confirmed it against a full fresh
sweep and found one real, in-lane defect (shipped) plus one motion-lane
consideration (routed to Vito). Further change here would be churn or Vito's
visual lane.

## Usability loop (2026-09-28)

A usability pass on top of run 5, merged directly to `main` (Colton's
standing authorization; Vercel deploy check is the signal, Actions is
billing-blocked). Each PR verified live on `vkc-website-wz5a` after merge;
root still defaults to `/en` after every one. Found the work with an
axe/tap-target/link-integrity sweep and Playwright at 1280/375 FR+EN; the
click-nav, forms, a11y and reduced-motion fundamentals were already clean
(see memory `vkc-website-usability-audit`), so this pass is link/routing
correctness, not redesign. Vito's lane untouched (no `content/scenes.json`,
no media, no image schema, no Vito branches).

- **#32 `fix/apple-icon-proxy` (merged e18692e).** The `<link rel="apple-touch-icon" href="/apple-icon?…">`
  in every page 307-redirected to `/en/apple-icon` (a 404) because the proxy
  matcher's dot rule missed the extension-less `/apple-icon`; iOS home-screen
  bookmarks got no icon. Added `apple-icon` to the matcher exclusions
  (`src/proxy.ts`). Live: `/apple-icon` → 200 image/png; root → 307 /en.
- **`fix/canonical-live-domain`.** `content/site.json` `baseUrl` still pointed at
  `vkc-website-zeta.vercel.app` — the project deleted 2026-09-28, which now 404s.
  Every canonical, hreflang alternate (120 of them), OG URL, JSON-LD `@id`/`url`,
  sitemap entry and the `/v` QR code therefore resolved to a dead domain (a
  share, a crawler or a scanned QR landed on a 404). Flipped `baseUrl` to the
  live `wz5a`, regenerated `public/qr/v.svg` (`npm run qr`, now encodes
  `wz5a/v`), and corrected the stale `docs/DOMAIN.md` line. `check:hreflang`
  went from 404s to 120/120 resolving 200; guard:numbers/fr/staffing/claims/media
  all green. `vkcpack.com` is still the eventual domain (human-gated,
  `docs/DOMAIN.md`); this only corrects the interim value away from a dead one.
- **`fix/manifest-theme-dark`.** The PWA manifest still declared the
  pre-redesign light palette (`theme_color #ffffff`, `background_color #edeff2`)
  while the site (and the page's `<meta name="theme-color">`) is dark
  (`:root` `--vkc-floor #0b0c0e`, `color-scheme: dark`). On add-to-home-screen
  that gave a white toolbar and a white splash flash. Set both manifest colours
  to `#0b0c0e` (the shipped floor token) so install/splash match the site. Only
  `src/app/manifest.ts`; no page content changed.

**Closed at diminishing returns.** A link-integrity crawl of all 40 pages now
reports **0 broken links** (was 39: the 38 dead-domain URLs + the icon);
robots.txt and sitemap.xml carry the live domain. axe (0 violations), tap
targets (≥44px), `check:clicks` (0 dead clicks), forms, reduced-motion, skip
link, focus, and the sticky nav / persistent CTAs were already clean before
this loop — the three fixes above were the real, in-lane defects; further
usability change would be churn or Vito's visual lane. Every fix verified live
on `wz5a`; root still `/en` after each.

**Flagged, not fixed (not a usability item, out of this loop's lane):**
`npm run lint` is red locally — ~1583 errors, all from
`.claude/worktrees/*/.next/**` (build output of other sessions' worktrees).
eslint's `globalIgnores` covers root `.next/**` but not nested ones, so bare
`eslint` walks into them. CI is unaffected (no worktrees there) and the real
source (`eslint src scripts guard`) is clean, but the documented "lint green"
gate can't be satisfied locally until either `.claude/worktrees/` is gitignored
or `**/.next/` is added to the eslint ignores. A one-line `chore:` when someone
wants the local gate honest.

## Run 5 (2026-09-27): navigation and order

- Every route link opened its page part-way down (Next 16 + the site's
  smooth scroll); PR #28 fixes it and adds `npm run check:clicks`, which
  clicks every link and control on every page in both locales at 1280 and
  375 and asserts where each lands. Run it after any change to chrome,
  links or scroll behaviour. `docs/RUN-LOG.md` run 5 has the trace.
- Vito's redesign (#30) merged mid-run; both PRs now sit on top of it. The
  gate found four things on the new home page, fixed in #28: the skip link
  was intercepted by the anchor handler, the hero video's Pause control sat
  under the copy overlay, two Play buttons rendered inside reel links, and
  the chooser anchor landed short after a native scroll (Lenis measured from
  a stale position) while the page's `scroll-behavior: smooth` fought Lenis
  frame by frame. If Lenis stays, keep `html.lenis { scroll-behavior: auto
  !important }` and keep buttons out of links; the gate catches both.
- The site order is `src/lib/nav.ts` (Services, Industries, Containers,
  Regions, Company); the menu, footer, inline bar and the home page follow
  it (PR #29). The inline bar carries five of the six: see
  `docs/DESIGN-DECISIONS.md` §14 for why Montréal is not in it.
- **AI-generated imagery is permitted** (CLAUDE.md §1, amended by Colton,
  PR #27). Vito is filling the thirteen covers and two galleries;
  `docs/MEDIA-SLOTS.md` is the contract (positions, sizes, files, checks).
  A build run stays out of `content/scenes.json`, `public/media/` and the
  scenes schema; render changes go in `src/components/scene.tsx` only.
- The auto-mode permission classifier refuses `gh pr merge` (merge without
  review). Open the PR, report it, and let Colton merge.
- Every branch push deploys a preview on both linked Vercel projects, the
  stale `vkc-website` and the live `vkc-website-wz5a`; `[skip vercel]` in
  the commit message does not stop it (proven on #28 and #29). The Hobby
  cap is 100 deploys a day and the account hit it on 2026-09-27, so a
  "Deployment rate limited" check on a PR is the cap, not the build.
  Turning previews off, or disconnecting the stale project, is a project
  setting: Colton's (`NEEDS-COLTON.md`).

## Where the build stands

- 19 routes / 40 URLs (`src/i18n/pathnames.ts` is the truth): home, services
  hub + three service pages, containers hub + three, industries hub + three,
  Montreal, about, glossary, contact, quote, visit (noindex), privacy.
- Run 4 (2026-09-27) was the design pass with the taste, frontend-design and
  scroll-craft skills, proven through the Playwright MCP at 1280 and 375 in
  both languages, light and dark. What changed and why is
  `docs/DESIGN-DECISIONS.md` §12; the rules it added are in
  `brand/BRAND.md`. In one paragraph: the fill line is now the site's spine
  (the header's rule fills with scroll, section ticks draw on entry, the
  shift bar fills as it enters), placards hold facts and rules point
  somewhere (one label with three fields for the containers, manifest rows
  for industries and hubs, ruled cells for "where this leads next"), the
  hero gauge is twice its size and stands on a ruled floor, eyebrows are
  down to the ones that carry information, and the closing band prints in
  negative. Titles are under 70 characters, there is no em dash in the
  copy, lists are marked with the tick.
- Every gate green on the final local build: typecheck, lint, 68 node
  tests, build, render 40/40, `guard:staffing` (58 Second Shift surfaces),
  `guard:numbers`, `guard:fr` (ratio gate now counts the SpecGrid labels and
  the contact row names), `guard:claims`, `guard:media`, overlap 7.6% (gate
  10%), hreflang 40/40, locale-switch 20 pairs, axe 80 scans / 0
  violations, Lighthouse mobile medians 96 / 100 / 96 / 100 on the six D12
  pages (best-practices 96 is the local `/_vercel/insights` 404; production
  will read 100).
- Production (`vkc-website-wz5a.vercel.app`) serves 194d361: the pre-redesign
  site with the navigation bug. The redesign (#30) is on `main` but its deploy
  was rate-limited; the next push to `main` after the cap resets (or
  `vercel --prod`) ships it, and #28 with it once merged. The old project
  `vkc-website` is gone (2026-09-28).
  Deploying is Colton's (`NEEDS-COLTON.md` item 1), as are the email
  provider, the content files (all still null), the lawyer's answer on §4,
  domain, plan, and the Higgsfield decisions (item 8, which now says where
  every seam sits in the new layout).
- The record: `docs/RUN-LOG.md` (run 4 section), `docs/DESIGN-DECISIONS.md`
  §11–12, `docs/SCROLL-BRIEF.md` (the self-authored brief a media run reads
  first), `NEEDS-COLTON.md`.

## What is next

1. **Colton's list**, in `NEEDS-COLTON.md`. Nothing in the code waits on
   anything but that list.
2. **After the content files are filled**, re-read the pages with real
   values in them: the SpecGrid placards, the contact placard, the photo
   rows and any scene cover change the page's weight, and the design pass
   composed around empty slots (the `dev-placeholders` launch config shows
   where each one lands). The copy-ratio gate will move when the labels
   render; it is measured on messages, so it will not turn red for data.
3. **A real phone.** Headless Chrome proves layout, not touch scrolling, a
   phone's video decoder or Low Power Mode. The scroll-driven pieces are
   CSS and degrade to static where unsupported, so the risk is small, but a
   walk through the site on an actual iPhone and an actual Android is the
   check no script here can run.
4. **Left as is, on purpose:** the FR home title at 76 characters (the
   absolute title carrying both keywords and the brand), the longform
   sidehead layout on every section (it is a spec sheet, and the variation
   lives in the objects inside it), and `.floor-lines` (unused since run 1;
   a texture drawn to make a page feel designed is decoration).

## How to work here

- The repo is `~/Desktop/vkc-website` (synced to `main`, clean). Run 4
  worked from the `website-design` worktree under `.claude/worktrees/`;
  the branch there is `main`'s content, not a place work is kept.
- **Commit before running anything under `scripts/nc/`**: the negative
  controls restore files with `git checkout` and will erase uncommitted work.
- Proof chain: `npm run build && npx next start -p 3100` → `npm run render`
  → the five guards → `npm run overlap` → `check:hreflang` / `check:locale-switch`
  `-- --base http://localhost:3100` → `npm run a11y -- --base … --self-check`
  → NC-4 / NC-5 / NC-10 → `npm run lighthouse -- --base …`. README lists them.
- **Visual proof goes through the Playwright MCP**, not the desktop app's
  preview pane: it runs its own Chromium, never prompts, and a
  `browser_run_code_unsafe` snippet can shoot every page at both widths in
  both locales in one call. Two things it taught run 4: a full-page capture
  reports a scroll-driven animation at its top-of-page state (shoot the
  viewport at a real scroll position to prove one), and a capture taken
  during a smooth scroll can draw the sticky header mid-animation (scroll
  instantly, or under reduced motion, before shooting).
- No servers were left running at handoff.
