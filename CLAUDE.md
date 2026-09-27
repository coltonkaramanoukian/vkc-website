@AGENTS.md

# vkc-website — constitution

Public, bilingual (FR/EN) marketing site for VKC Packaging (17125003 Canada Inc.).
Two services: **Second Shift** (VKC runs the customer's line at the customer's
plant) and **Bottleneck** (overflow filling, packaging and toll blending at VKC's
facility). Next.js App Router + next-intl, deployed to Vercel. No database, no
auth, no CMS, no CRM. Later briefs reference the sections below by name.

The repo path has no space: `~/Desktop/vkc-website`. `~` is itself a git repo on
this machine — see §5.

## §1 NO INVENTED FACTS

Every fact on the site is either supplied by Colton or visibly absent.

- Facts live only in `content/*.json` (§2). A `null` or missing field renders
  NOTHING: no "TBD", no "coming soon", no placeholder number, no fabricated
  presence and no fabricated absence.
- Never write, in copy or metadata: certifications (ISO, GMP, FDA, Health
  Canada), years in business, square footage, headcount, client counts,
  "leading", "largest", "fastest", or any capability number (run sizes, fill
  speeds, minimums, viscosity ranges, batch sizes, tank sizes, lead times, crew
  sizes, equipment counts). Capability numbers render only from
  `content/capabilities.json`.
- Client names and logos render only from `content/clients.json` entries with
  `approved: true`. The file ships as `[]`; an empty file renders no section.
- No pricing, no dollar amounts. "Priced per unit or per shift" describes how
  Second Shift is billed; it is not a price.
- AI-generated imagery (Higgsfield) is PERMITTED (Colton, 2026-09-27). It
  renders only through `content/scenes.json` (§2) and must not depict a fact
  the site cannot otherwise state (§1: no invented certifications, equipment
  counts, client logos, etc.). Still no stock or third-party imagery; no
  scraping (not SCI's site, not anyone's). Real photos render only from
  `content/photos.json`.
- Guard: `npm run guard:numbers` (NC-3). Every digit-run in rendered text must
  come from `content/*.json` or `guard/number-allowlist.json` (each line
  justified in `docs/DESIGN-DECISIONS.md`). Red on a clean tree = a number was
  invented = stop.
- Guard: `npm run guard:claims` (NC-9). The claims above that no content field
  could ever make true — certifications, tenure, square footage, headcount,
  client counts, superlatives, and §4's licensed/compliant/approved — in both
  languages, from `guard/forbidden-claims.json`. It is negation-aware: `/about`
  says "no certifications, no production figures", and a denial is not a claim.
  It exists because run 1 shipped "fastest" on `/visit` with every other guard
  green.

## §2 CONTENT LIVES IN /content

Three classes of file. Pages render from them; prose lives in
`i18n/messages/{fr,en}.json` and carries no facts.

| Class | Files | Who writes |
|---|---|---|
| Seeded | `containers.json`, `services.json`, `taglines.json`, `site.json` | the build run; Colton edits |
| NULL AT BIRTH | `contact.json`, `capabilities.json`, `clients.json`, `photos.json`, `scenes.json` | **Colton only** (`scenes.json`: Colton, or the Higgsfield run he connects) |
| Reserved | `media.json` | **the video run only** |

- An agent writing a value into a NULL-AT-BIRTH or reserved file is a KILL,
  except a negative-control injection reverted in the same step.
- Message files are deliberately NOT under `content/`: the number guard allows
  any number found in `content/`, so prose must not live there.
- `docs/CONTENT-INTAKE.md` lists every null as `file:field`.
- `scenes.json` is the media manifest (covers and galleries, image or video).
  `npm run guard:media` (NC-10) proves every `src` exists under `public/media/`,
  is typed, sized, under budget and described in both languages. Generated
  (Higgsfield) media is permitted here per §1 (amended by Colton,
  2026-09-27).

## §3 FR IS NOT A TRANSLATION OF EN

- French copy is written as French, not translated from the English. Service
  names: "Deuxième quart" / "Goulot".
- Per page, FR copy length is within ±10% of EN, measured in characters.
- A FR message value identical to its EN counterpart is a defect unless its key
  is in `i18n/identical-allowlist.json` (brand names, SKUs, URLs, container
  codes).
- KEY-SET PARITY IS A PROXY AND PROVES NOTHING. Origin: vkc-workforce's
  check-translations reported 100% while 2,096 strings were untranslated.
- Guard: `npm run guard:fr` (NC-4).

## §4 SERVICE, NOT STAFFING

Second Shift is a service VKC performs and controls. It is never workers the
customer directs.

**Origin — why this wording is load-bearing** (context, not a legal conclusion):
Quebec requires a CNESST licence for any business that leases personnel to client
enterprises to meet their labour needs. The Court of Appeal (2025 QCCA 587,
May 2025) held that this applies even when leasing is only a secondary or
occasional activity. What separates a service contract from personnel leasing
is the contract's purpose and who controls the work, and both the supplier and
the client face fines. Colton is having a lawyer confirm. Loosening this rule
requires that lawyer's answer, not a later run's judgment.

Every surface that mentions Second Shift (its page, its home block, the visit
page, metadata, the quote form, JSON-LD) must:

- (a) PRESENT, in substance, all four facts: (1) VKC's lead hand directs the
  shift; (2) VKC's crew does the work; (3) VKC's QC sheets and production log
  document it; (4) it is priced per unit or per shift. Phrase-sets:
  `guard/second-shift-required.json`.
- (b) CONTAIN NONE of the terms in `guard/staffing-terms.json` (case- and
  accent-insensitive, word boundaries).

Copy that merely dodges the list fails the intent: read the page top to bottom
and ask what a plant manager thinks they are buying. If the answer is
"workers", rewrite. Passing the guard proves the WORDING only. Never describe
VKC, Second Shift or any guard as licensed, compliant, legal or approved, in
either language. Guard: `npm run guard:staffing` (NC-2); logic in
`guard/lib.ts`.

## §5 REPO IDENTITY

- `git rev-parse --show-toplevel` must print
  `/Users/coltonkaramanoukian/Desktop/vkc-website`. If it prints
  `/Users/coltonkaramanoukian`, you are inside the home-directory repo, not this
  one. Stop.
- The GitHub remote is `coltonkaramanoukian/vkc-website`, PRIVATE. Never
  `DavidSabb` (the developer's account; it holds vkc-workforce).
- Never `git add -A`; stage named paths.
- Nothing from vkc-workforce or puddingforce.com is imported, linked or
  mentioned. One venture per site: the automation / machine-integration venture
  is not on this site.
- Rollback: `git revert` for source (never `reset --hard`); `vercel rollback`
  for deploys.

## §6 DEPLOY PROOF

A deploy is proven, not assumed. After `vercel --prod`:

- (a) the deployment's commit SHA (`vercel inspect <url>`) equals
  `git rev-parse HEAD`;
- (b) `/fr` and `/en` fetched from production and from a local
  `next build && next start` of the same SHA are identical after stripping
  build ids (`npm run proof:diff`);
- (c) HTTPS 200 on both locale roots and `/v`, fetched from outside.

Gates handed to a human, never run by an agent: domain purchase, DNS,
custom-domain attach (`docs/DOMAIN.md`), any Vercel plan change, any paid
signup. The site is built and deployed on whatever plan the account is on.

## §7 SIGN-OFF FORMS

A run's sign-off takes one of two forms only:

- (a) name the specific page or feature that should be cut, and why; or
- (b) state plainly that nothing should be cut.

Then the judgment call: once Colton fills the content, is what shipped
defensible as a public site, or should a page not exist? "We shouldn't have
built this page" is an acceptable answer, named in advance. A guard that was
never watched failing is an assumption, not a check: every negative control
pastes its red output and its green output.
