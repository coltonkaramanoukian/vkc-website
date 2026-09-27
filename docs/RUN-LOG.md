# Run log — vkc-website build brief v2, run 1

Checkpoints are commits. Each has a one-line, phone-readable status.
Resume from the last checkpoint; every phase is idempotent.

## Checkpoints

| Phase | Status |
|---|---|
| 0 | Scaffolded, constitution written, identity gate passed, pushed to coltonkaramanoukian/vkc-website (private). |
| 1 | Brand, i18n spine, home/visit/quote, /v, QR, form. Preview: https://vkc-website-jaim15abr-coltonkaramanoukian-8035s-projects.vercel.app. NC-1, NC-5, NC-6, NC-8 red→green. Content birth commit ba5a12f. |

| 2 | All remaining pages, one commit per group. Laval and Quebec CUT (15 routes / 30 URLs). NC-2, NC-3, NC-4 red→green. |
| 3 | SEO plumbing: hreflang fetched (90 links, all 200), sitemap 28, privacy page. |
| 4 | Preview census 30/30, 38 screenshots opened, all eight NCs re-run on the final page set. |
| 5 | Production: https://vkc-website-zeta.vercel.app, SHA 683ccee, content parity on all 30 pages, Lighthouse medians met, handover docs written. |

## Ground-truth corrections (premise checked 2026-09-22)

- `~/Desktop/VKC Website` (with a space) already existed: an empty folder
  created at 14:34 today, the session's launch directory. It resolves to the
  home-directory repo (`git rev-parse --show-toplevel` → `/Users/coltonkaramanoukian`).
  Left untouched; the project was built at the brief's path, `~/Desktop/vkc-website`.
- Otherwise the premise held: no `vkc-website` repo on GitHub, no Vercel
  project, zero domains under the Vercel scope.
- **`vkc-website.vercel.app` belongs to someone else**: it serves "Victory
  Kingdom Church SA" (Kuils River, Cape Town). Vercel assigned this project
  `vkc-website-zeta.vercel.app`. `content/site.json` baseUrl corrected and the
  QR regenerated in Phase 1 (the brief's Phase 5 correction, done early).
- `vercel link --yes` connected the GitHub repo automatically, and Vercel
  assigned the project's FIRST `vercel deploy` (no `--prod`) to production.
  Production therefore served the Phase 1 build from Phase 1 onward.
- The team's default Deployment Protection is `all_except_custom_domains`.
  Previews are behind Vercel Authentication; the assigned production domain
  answered 200 publicly (checked with curl, no credentials).

## Environment facts

- Node v26.7.0, npm 11.19.0, gh 2.88.1 (account `coltonkaramanoukian`, not
  DavidSabb), Vercel CLI 59.3.0.
- `vercel whoami` → `coltonkaramanoukian-8035`; scope
  `coltonkaramanoukian-8035s-projects`. The CLI's whoami does not print the
  plan; `vercel api /v2/teams/coltonkaramanoukian-8035s-projects` reports
  `billing.plan: hobby`, `status: active`.
- vercel.com/pricing (fetched 2026-09-22): Pro "$20/mo.", "Developer seat |
  $20 / month"; FAQ: "Our Hobby plan is for personal, non-commercial use."
- Session model argv: `--model claude-opus-5`.

## SELF-RESOLVED (mechanisms fixed on the run's own authority)

1. `zbarimg` missing → `brew install zbar` (zbarimg 0.23.93).
2. `create-next-app` skips `git init` when the target sits inside an existing
   repo (here, `~`). Passed `--disable-git` and ran `git init -b main` inside
   the project explicitly; identity gate then printed the project dir.
3. `create-next-app` left caret ranges on dev dependencies. Pinned every
   dependency to the exact lockfile version.
4. The session environment asked for multi-agent workflows ("ultracode"); the
   brief says NO SUBAGENTS. The brief wins: everything runs in the orchestrator.
5. Next.js 16 removed "First Load JS" from `next build` output (its upgrade
   guide says the numbers were inaccurate under RSC). Measured instead by
   summing the JS each page's HTML loads (`scripts/first-load-js.ts`).
6. Turbopack picked up `~/package-lock.json` as a workspace-root candidate;
   pinned `turbopack.root` to the repo.
7. Tailwind v4 cascade: unlayered custom CSS (`.btn { display:inline-flex }`)
   beat layered utilities (`hidden`), so the header CTA showed on phones.
   Moved custom CSS into `@layer base` / `@layer components`.
8. `vercel.json` sets `git.deploymentEnabled.main = false`, so a push to main
   never deploys production; production ships only via `vercel --prod`.
9. Previews are protected. `vercel curl` generated a Protection Bypass for
   Automation secret; scripts send it as the `x-vercel-protection-bypass`
   header. The value is kept in the session scratchpad, never printed or
   committed.
10. Previews carry `x-robots-tag: noindex`, which Lighthouse scores as an SEO
    failure, so D12 is measured on production (and on local builds while
    iterating).
11. macOS bash 3.2 treats an empty array as unbound under `set -u` (NC-8
    script); switched to `${H[@]+...}` expansion.
12. ESLint `no-html-link-for-pages` in the global 404; switched to next/link.
13. The render capture joined adjacent elements' text with no separator, so a
    placard label glued to its value ("Directed by" + "Our lead hand…" →
    "byour") and a word-boundary guard could miss a fact that was plainly on
    the page — or a staffing term. `render-all.ts` now serializes element
    boundaries as spaces. This had been a false green in NC-2.
14. `guard:fr` flagged 13 `pages.*.sections[n].slot` values as untranslated FR.
    A slot names a component, not copy: the guard now skips keys ending in
    `.slot` and reports how many it skipped, rather than growing an allowlist.
15. D15's ±10% is measured on the message copy, not the rendered page: the
    rendered text also carries content DATA (container family names) that
    nobody translates. The rendered ratio is printed beside the gate.
16. §6(b)'s byte diff is not achievable — a Vercel build and a local build of
    one SHA differ in RSC stream chunking, asset names and hashes, and one
    `<meta>`'s position. `proof:parity` proves content equality across all 30
    pages instead; `proof:diff` still prints what differs in the raw HTML.
17. `first-load-js.ts` measured uncompressed bytes, because `fetch()`
    decompresses transparently; switched to curl with `Accept-Encoding: gzip`
    (176 kB gzip, not 567 kB).
18b. A re-read for IMPLIED claims (after the report was written) found three
    lines no guard watched: "the fastest way to the next step" on /visit — a
    §6 banned superlative — and two lines on /locations/montreal that promised
    logistics outcomes by implication ("can't bring a pallet back the same
    afternoon", "we can walk a line and be back the same day"). Copy fixed, and
    `guard:claims` + NC-9 added so the class cannot return.
18. The pre-mortem-2 overlap test had no location pairs left after the cut, so
    it was pointed at the container and industry pages and split into shared
    vocabulary vs reused 5-word phrases. It then found three list lines that
    repeated almost verbatim, which were rewritten per page.

## Page cuts (D7 cut rule)

- `/locations/laval` and `/locations/quebec` CUT in Phase 2, before drafting.
  Everything true about VKC in Laval is the same sentence as Montreal with the
  city swapped: the site carries no facility address (`contact.json` is null),
  no service radius (`contact.serviceRadiusKm` null) and no travel claim, so a
  Laval page could only repeat the Montreal page or invent a local presence.
  Quebec City is a second problem: nothing supplied says VKC serves it, and
  writing that it does would be an invented fact. Two thin doorway pages would
  also have failed the ≤40% pairwise-overlap pre-mortem by construction.
  Routes: 17 → 15, URLs 34 → 30, sitemap 32 → 28.
- `/containers/pails-and-drums` renamed `/containers/pails` (fr `/contenants/seaux`).
  Drums are not in the §1 container vocabulary; naming them in the slug would
  advertise a container VKC was never said to run.

---

# Run log — run 2 (2026-09-27), "monster build"

Model: Claude Fable 5.1, `MAX_THINKING_TOKENS=31999`, permissions in dontAsk
mode, no subagents. Brief: premium on-brand design, every page fully built in
both languages, performance / SEO / accessibility, net-new sections that
convert. Never wait on Colton; log what needs him in `NEEDS-COLTON.md`.

## Checkpoints (one pull request each, self-merged, main NOT deployed)

| PR | Merge | What |
|---|---|---|
| #1 | 5fc1317 | Design system: motion tokens, type scale, sticky header with a details-based menu panel, footer with nav groups, icon / apple icon / manifest, `.claude/launch.json`. |
| #2 | d9fe638 | Home: hero fill gauge (SVG, CSS rise), service chooser (two questions → one of four routes, `lib/chooser.ts` tested), pictogram cards for containers and industries, steps, FAQ with FAQPage JSON-LD. |
| #3 | cd3cf67 | Inner pages: hub pages `/services`, `/containers`, `/industries` (18 routes, 36 URLs, sitemap 34), breadcrumbs with BreadcrumbList JSON-LD, jump strip, related cards, Second Shift shift bar, Service JSON-LD on the service pages. |
| #4 | 1672fed | Quote and visit: form in three groups, choice cards with pictograms, success placard, focus to the first invalid field; sticky aside on `/quote`; visit page placards. NC-5 selectors untouched, 5/5. |
| #5 | 0caa045 | Per-page Open Graph cards (`/og/{locale}/{key}`, prerendered), Archivo pinned to the used axis ranges (90.1 → 57.9 kB), security headers, primary nav from `xl`. |
| #6 | f0d2e8f | `NEEDS-COLTON.md`, README, DESIGN-DECISIONS §10, BRAND motion rule, `npm run overlap` gates on copy. |
| #7 | 84dc1bc | Home hero at xl: title column 8/12, display capped at 3.75rem (EN two lines, FR three, was four). |

## Proof, each PR

Every PR: `typecheck`, `lint`, `test` (35), `build`; `render` 36/36;
`guard:staffing`, `guard:numbers`, `guard:fr`, `guard:claims` GREEN;
`overlap --copy` worst pair ≤ 8.8%; `census` 36/36; browser at 1280 and 375 in
FR and EN, light and dark, no horizontal overflow. Lighthouse mobile on the
final local build: performance 97 on all six D12 pages, accessibility 100,
SEO 100 (visit 66 = noindex by design), best-practices 96 (analytics 404 on
localhost only). `check:hreflang --base local` 36/36. NC-5 5/5 after #4 and #5.

## SELF-RESOLVED

1. **`npm run overlap` (rendered mode) was already red on `main`** before run 2
   touched a page: 18 pairs over 10%, all from container family names that
   repeat on every page listing that family. Confirmed with a clean worktree
   build of main. The documented gate (DESIGN-DECISIONS §6/§9) is the copy
   measurement; `npm run overlap` now runs `--copy`, and the rendered
   measurement moved to `npm run overlap:rendered` as context.
2. Turbopack refuses a worktree whose `node_modules` is a symlink out of the
   tree ("points out of the filesystem root"); `npm ci` inside the worktree.
3. Hub ratios ran 1.14–1.16 on first draft; FR trimmed and EN extended per page
   to land 1.05–1.09. Home FAQ questions reworded to break repeated 5-word
   phrases that the chooser result and the Second Shift facts created.
4. A related card that names Second Shift on the industries hub turned the
   staffing guard red (16): the card carries the name without the four facts.
   The industries hub has no Second Shift card; the services hub renders the
   full placard instead.
5. BreadcrumbList JSON-LD on the Second Shift page names the service; the
   page's JSON-LD surface now also carries a Service entity whose description
   is `services.json:summary`, which holds all four facts.
6. `fontTools` is installed but `brotli` is not, so woff2 cannot be written
   from Python here; `scripts/subset-fonts.py` pins and subsets with fontTools
   and compresses with `npx wawoff2`.
7. The locale proxy matcher caught `/og/*` and 307'd the cards to a locale
   path; `/og/` is exempt, and `/v`, `/fr`, `/en` still route as before.

## Not done, on purpose

- No production deploy. `main` is seven PRs ahead of production; the command
  and the proof steps are in `NEEDS-COLTON.md` item 1. A preview deploy of
  f0d2e8f built Ready on Vercel (79 static pages, 36 of them OG cards).
- No value written into `contact`, `capabilities`, `clients`, `photos` or
  `media` (§2). Every null is still null.
- No `lastModified` in the sitemap: there is no honest per-page date to render
  (DESIGN-DECISIONS §10).

---

# Run log — run 3 (2026-09-27), "keep going"

Model: Claude Fable 5.1, `MAX_THINKING_TOKENS=31999`, dontAsk, no subagents.
Brief: continue the monster build; media-ready seams for a later Higgsfield
run (not the integration); prove every change in a real browser at 1280 and
375 in FR and EN; never wait on Colton. Started by recovering state: eight
PRs merged, nothing uncommitted, nothing to revert.

## Checkpoints (one pull request each, self-merged, main NOT deployed)

| PR | Merge | What |
|---|---|---|
| #9 | b33f65a | Media seams: `content/scenes.json` (NULL AT BIRTH, thirteen covers, two galleries), `lib/scenes/` validator (17 tests), `Scene` / `SceneCover` / `SceneGalleries`, `AmbientVideo` (poster stands under reduced motion or save-data, plays only in view, always has a pause), `guard:media` + NC-10, next/image budgets, `.btn` no longer wraps. |
| #10 | 3086772 | Phone action bar (quote + call, absent on the form pages), `error.tsx` / `global-error.tsx` with their own four strings, `npm run a11y` (axe, every URL, 375 and 1280, `--self-check`). |
| #11 | 000910c | `/contact` / `/nous-joindre`: details placard (rows only with a value), short form labelled `source=contact`, ContactPage JSON-LD; related-card fallback for the quote page. |
| #12 | 9340602 | FAQs on the three service pages (FAQPage JSON-LD) and a five-row side-by-side table on `/services` that is itself a Second Shift surface. |
| #13 | 51f2ad2 | `/glossary` / `/lexique`: twenty-two terms per language, each list authored natively and sorted by its own collator, DefinedTermSet JSON-LD, `tag` pictogram. |
| #14 | — | This close-out: run log, NEEDS-COLTON refresh, README, final proofs. |

## Proof, each PR

Every PR: `typecheck`, `lint`, `test` (53 → 54), `build`; `render` 38/38 →
40/40; `guard:staffing` (58 Second Shift surfaces at the end),
`guard:numbers`, `guard:fr`, `guard:claims`, `guard:media` GREEN; `overlap`
worst pair ≤ 7.4% phrases; `census`; `check:hreflang --base local` 40/40;
`check:locale-switch` 20 pairs; `a11y` 80 scans, 0 violations; browser at
1280 and 375 in FR and EN through the desktop app's own pane. NC-5 5/5 after
#11 (the form gained a third source). NC-6 and NC-10 red → green after #9.
The media seam was proven with injected test files (a recorded webm, two
PNGs), then the files were deleted and the manifest restored to null: the
loop plays in view, pauses out of view, the toggle flips `aria-pressed`,
FR labels render, the gallery snaps at 375, the portrait variant swaps on a
phone, and under `reducedMotion: "reduce"` the video sits at 0 with "Play
the video" showing. Final re-run from the clone after PR #13: NC-5 5/5, NC-6
pass (placeholders only behind the flag, no `img`/`video` outside the allowed
prefixes), NC-10 red → green with the manifest byte-identical after.

Lighthouse (mobile, three runs, medians) on the final local build served
from the scratchpad clone (see SELF-RESOLVED 12): performance 96 on all six
D12 pages, accessibility 100, SEO 100 (`/visit` 66 = noindex by design),
best-practices 96 (the `/_vercel/insights/script.js` 404 that only exists off
Vercel). A first pass against the Desktop-served build read performance 100
with accessibility 96 and best-practices 96: that server was answering 500 on
its CSS after the access drop, so the page was measured unstyled. Discarded.

## SELF-RESOLVED

1. `react-hooks/set-state-in-effect` on the ambient video: the component kept
   an "ambient" state set from an effect. Removed the state; the toggle is
   always rendered and reduced motion simply returns before observing.
2. **NC-10 ran while a manual injection was in flight on an untracked
   `content/scenes.json`**, so `git checkout --` had nothing to restore and
   the two injections stacked. Recovered by resetting every slot to null;
   NC-10 now copies the file to `mktemp` first and proves the restore with
   `cmp`. Lesson, written down: never run a negative control concurrently
   with a hand injection of the same file.
3. `guard:numbers` accepted every string in `scenes.json`, so aspect ratios
   ("16/9", "21/9") widened the allowed set. Only `alt` and `caption` count now.
4. Playwright's bundled ffmpeg has no `lavfi`, so test media came from a
   Playwright `recordVideo` session and screenshots, not from a filter graph.
5. "Obtenir une soumission" in the FR header wrapped to two lines at 1280
   (pre-existing). `.btn { white-space: nowrap }`, verified at 48 px.
6. Next 16 refuses a second `next dev` in one directory; the placeholder
   server (3201) and the plain one (3200) take turns.
7. `@next/next/no-html-link-for-pages` in `global-error.tsx`: `next/link`.
8. `@axe-core/playwright` came in with a caret; pinned to `4.13.0` like the
   other tooling.
9. `RelatedPages` read every eyebrow under `pages.<key>`; the quote page's
   copy lives under `quote.*`, so a card pointing at it threw. Fallback to
   `<key>.eyebrow`. The new error boundary reported it on the first render.
10. `overlap` went red on `/contact` vs `/quote` (66%) through shared form
    labels. The form is site furniture: `data-shared="form"` on the wrapper
    and `form` left out of the contact page's copy namespaces. 0% after.
11. FR/EN ratio drifted past 1.10 on `/services/contract-packaging` (1.118)
    and `/services` (1.114) once the FAQ and table copy landed, and on the
    glossary's first draft (1.139). EN extended and FR trimmed per page;
    1.074, 1.089 and 1.029 after.
12. **macOS revoked the desktop app's access to `~/Desktop` mid-run**, right
    as the final Lighthouse pass started: every read under the repo path
    returned `EPERM`, sandboxed or not, while `~/Documents` and `/private/tmp`
    stayed readable. Nothing in the tree was lost: the Desktop checkout was
    clean on `main` at 51f2ad2 (PR #13 merged and pulled) when access
    dropped. The close-out finished from a fresh `gh repo clone` of the same
    private remote in the session's scratchpad. §5's identity check is the
    remote (`coltonkaramanoukian/vkc-website`), which held; the path check
    could not be satisfied and the reason is this line. The Desktop checkout
    needs a `git pull` to pick up PR #14.

## Not done, on purpose

- No production deploy (`NEEDS-COLTON.md` item 1). `main` is fourteen PRs
  past production.
- No value in `contact`, `capabilities`, `clients`, `photos`, `scenes` or
  `media`. Every null is still null; the two negative-control injections
  were reverted in the same step and proven byte-identical.
- No Higgsfield call, upload path or CMS: the seam is a manifest and a
  folder (`NEEDS-COLTON.md` item 8). CLAUDE.md §1 still bans generated
  imagery; changing that is Colton's.
- No component tests: the pure logic (scenes validator, chooser, slug,
  structured data, quote email) is under `node --test`; the pages are
  proven by render, guards, axe and the browser.

## Page cuts

None. Every page that exists should exist once the content is filled:
`/contact` is thin until `contact.json` has a value but is honest about it
(form-only lead), and `/glossary` states no fact about VKC beyond the two
service definitions, which carry the §4 facts. Nothing should be cut.
