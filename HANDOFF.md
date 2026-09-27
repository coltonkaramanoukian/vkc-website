HANDOFF: 2026-09-27 — `main` holds runs 1–3 (PRs #1–#18): every page built in FR and EN, every gate green on a local build, nothing deployed since run 1; next is a design pass with the new design skills and Playwright, then Colton's items in `NEEDS-COLTON.md`.

# Handoff

## Where the build stands

- 19 routes / 40 URLs (`src/i18n/pathnames.ts` is the truth): home, services
  hub + three service pages, containers hub + three, industries hub + three,
  Montreal, about, glossary, contact, quote, visit (noindex), privacy.
- Every gate green on the final local build: typecheck, lint, 64 node tests,
  build, render 40/40, `guard:staffing` (58 Second Shift surfaces),
  `guard:numbers`, `guard:fr` (now also French punctuation), `guard:claims`,
  `guard:media`, overlap 7.6% (gate 10%), hreflang 40/40, locale-switch 20
  pairs, axe 80 scans / 0 violations, NC-4, NC-5 (6/6), NC-6, NC-10 red →
  green, Lighthouse mobile medians 96 / 100 / 100 / 96 on the six D12 pages.
- Production (`vkc-website-zeta.vercel.app`) is still the run 1 build.
  Deploying is Colton's (`NEEDS-COLTON.md` item 1), as are the email
  provider, the content files (all still null), the lawyer's answer on §4,
  domain, plan, and the Higgsfield decisions (item 8).
- The record: `docs/RUN-LOG.md` (run 3 section, SELF-RESOLVED 1–15),
  `docs/DESIGN-DECISIONS.md` §11, `NEEDS-COLTON.md`.
- Two audit rounds ran as multi-agent workflows (seven lenses, then six),
  each finding refuted by two skeptics before it counted. Everything
  confirmed is fixed and merged; everything refuted is listed in
  DESIGN-DECISIONS §11 so it is not re-litigated.

## What is next

1. **Design pass** with the new skills (taste / frontend-design /
   scroll-craft) and the Playwright MCP for real visual proof at 1280 and 375
   in both languages. Constraints that do not move: `BRAND.md` (six tokens,
   Archivo + IBM Plex Mono, fill-rule device, one accent, motion only CSS
   behind reduced-motion), CLAUDE.md §1 (no stock or generated imagery: the
   media seam is `content/scenes.json` + `public/media/`, Colton's to fill),
   §4 on every Second Shift surface. Every change still goes through the
   gate chain below.
2. **One unverified audit finding** (skeptics did not finish before this
   handoff): `scripts/lib/copy-ratio.ts` `COPY_NAMESPACES` may omit
   `common.specLabels` for the three service routes and `common.contact` for
   `/contact`. Check whether those namespaces carry page copy a reader sees;
   if yes, add them and re-run `guard:fr` and `overlap`.
3. **Snippet lengths**: twelve titles are still over 70 characters (mostly
   FR, suffix included) and one description over 180 (FR Second Shift,
   which keeps its four §4 facts on purpose). Polish, not a defect.
4. **Performance**: perf 96 on mobile, simulated LCP 2.3 s on the lead
   paragraph. `experimental.inlineCss` was measured and rejected (worse);
   see DESIGN-DECISIONS. First-load JS is 150 kB gzip on every page.

## How to work here

- The repo is `~/Desktop/vkc-website` (synced to `main`, clean). During
  run 3 macOS revoked the app's access to `~/Desktop` for about an hour;
  the run finished from `gh repo clone` in the session scratchpad and
  synced Desktop when access returned. If it happens again, do the same.
- **Commit before running anything under `scripts/nc/`**: the negative
  controls restore files with `git checkout` and will erase uncommitted work.
- Proof chain: `npm run build && npx next start -p 3100` → `npm run render`
  → the five guards → `npm run overlap` → `check:hreflang` / `check:locale-switch`
  `-- --base http://localhost:3100` → `npm run a11y -- --base … --self-check`
  → NC-4 / NC-5 / NC-10 → `npm run lighthouse -- --base …`. README lists them.
- The desktop app's Preview Start prompts Colton; run `next start` from the
  shell and drive the browser pane with `navigate`, or use the Playwright MCP.
- No servers were left running at handoff.
