HANDOFF: 2026-09-29 — `main` holds runs 1–5, the image-ban lift (#27), Vito's cinematic redesign (#30), a usability loop (#32–#34) and a second usability pass (#36). Production is live on `vkc-website-wz5a.vercel.app`, serving current `main`; root 307s to `/en`, an FR browser to `/fr`. The second pass shipped one real copy fix and closed at diminishing returns; its one deeper finding sits in Vito's motion lane and is flagged in `NEEDS-COLTON.md` §10, not fixed unseen.

# Handoff

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
