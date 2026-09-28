HANDOFF: 2026-09-28 — `main` holds runs 1–4, the image-ban lift (#27) and Vito's cinematic redesign (#30, merged 00:53 UTC, scenes filled); run 5 is two open PRs rebased on it, #28 (every click lands, `check:clicks` gate, the home page's Lenis fixes) and #29 (the site order, slot labels, `docs/MEDIA-SLOTS.md`), for Colton to merge; since 194d361 a merge to `main` deploys production, but production still serves 194d361 (the pre-redesign site) because Vercel's daily cap refused the merge of #30.

# Handoff

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
