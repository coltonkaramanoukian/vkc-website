# VKC website — build brief v2, run 1 — report

## 1. Ground-truth corrections

Checked before acting, 2026-09-22.

- **`~/Desktop/VKC Website` (with a space) already existed** — an empty folder
  created at 14:34 that day, the session's launch directory. It resolves to the
  home-directory repo (`git rev-parse --show-toplevel` → `/Users/coltonkaramanoukian`).
  Left untouched; the project was built at the brief's path, `~/Desktop/vkc-website`.
- **`vkc-website.vercel.app` belongs to someone else** — it serves "Victory
  Kingdom Church SA", Kuils River, Cape Town. Vercel assigned this project
  `vkc-website-zeta.vercel.app`. `content/site.json:baseUrl` was corrected and
  the QR regenerated in Phase 1, not Phase 5.
- **`vercel link --yes` connected the GitHub repo by itself, and the project's
  first `vercel deploy` (no `--prod`) went to production.** Production served the
  Phase 1 build from Phase 1 onward. `vercel.json` now sets
  `git.deploymentEnabled.main = false`, so a push never deploys; production ships
  only through `vercel --prod`.
- **Deployment Protection defaults to `all_except_custom_domains`.** Previews sit
  behind Vercel Authentication (scripts use a protection-bypass header, kept in
  the session scratchpad, never printed or committed); the production domain
  answers 200 publicly.
- Otherwise the premise held: no `vkc-website` repo on GitHub, no Vercel project,
  zero domains under the scope.
- One thing this run cannot reconstruct: the **pass-1 token plan** was written
  and reviewed in Phase 1, in a stretch of the session that a context compaction
  later summarized away. `docs/DESIGN-DECISIONS.md` §1 says so in place of
  inventing the intermediate values, and documents the shipped tokens and every
  rejected alternative.

## 2. The finding

**The site is live and complete, and its one call to action cannot reach anyone.**
No environment variables exist on the Vercel project (`vercel env ls`: only
`NEXT_PUBLIC_SHOW_PLACEHOLDERS`, on Preview). So `RESEND_API_KEY`,
`QUOTE_TO_EMAIL` and `QUOTE_FROM_EMAIL` are unset, and the live form degrades
exactly as designed — and that design has a hole today:

```
POST https://vkc-website-zeta.vercel.app/api/quote
HTTP 503  {"ok":false,"code":"email_not_configured"}
```

The UI then says "Email is not set up on this site yet, so your request was not
sent. Please call us." — and `contact.json:phone` is null, so there is no number
to call. A prospect who scans the door QR today can read everything and contact
nobody. Two commands and one field close it; both are in DEGRADED.

## 3. URLs

- **Production:** https://vkc-website-zeta.vercel.app
- **Door link (QR):** https://vkc-website-zeta.vercel.app/v
- **Preview (Phase 4, protected):** https://vkc-website-2zok279b2-coltonkaramanoukian-8035s-projects.vercel.app

## 4. DONE, with evidence

**1. Repo identity.**
```
origin  https://github.com/coltonkaramanoukian/vkc-website.git (fetch/push)
git rev-parse --show-toplevel → /Users/coltonkaramanoukian/Desktop/vkc-website
```

**2. Constitution.** `grep -c '^## §' CLAUDE.md` → `7`

**3. Route census.** 30/30 on preview AND on production (15 routes × 2 locales;
Laval and Quebec cut, logged in §6). Plus the three `/v` cases, identical on both:
```
30/30 returned 200
  ✔ Accept-Language: en     → 307 /en/visit
  ✔ Accept-Language: fr-CA  → 307 /fr/visite
  ✔ no Accept-Language      → 307 /fr/visite
```

**4. NC-1 … NC-8.** Red and green pasted in §5.

**5. Nothing added to the null-at-birth files.**
```
git diff ba5a12f -- content/contact.json content/capabilities.json \
  content/clients.json content/photos.json content/media.json | wc -l → 0
```

**6. Lighthouse mobile, median of 3, on production** (thresholds: perf ≥90,
SEO ≥95, a11y ≥95, BP ≥90):

| URL | perf | a11y | BP | SEO |
|---|---|---|---|---|
| /fr | 98 | 100 | 96 | 100 |
| /en | 98 | 100 | 96 | 100 |
| /fr/services/deuxieme-quart | 98 | 100 | 96 | 100 |
| /en/services/second-shift | 97 | 100 | 96 | 100 |
| /fr/visite | 98 | 100 | 96 | 66 |
| /en/visit | 97 | 100 | 96 | 66 |

The two 66s are `/visit`, which is `noindex` by design and exempt (D12).

**7. 38 screenshots, every one opened and described.** 30 production-mode at
390px, 4 at 1280px (home + Second Shift, both locales), 4 preview-mode
(home + visit, both locales). In `artifacts/shots/`. What they show:

- Every page: wordmark, locale switch ("Français"/"English"), the mono eyebrow,
  the fill-rule sections, footer with all five nav groups and `© 2026 17125003
  Canada Inc.` No horizontal overflow at 390px anywhere.
- Home (fr/en, both widths): tagline as the h1, "Get a quote" above the fold,
  the two service placards side by side at 1280 and stacked at 390, container
  families, industries, three steps, CTA band.
- Second Shift (fr/en, both widths): the placard carries all four facts; "Who
  does what" splits VKC / your plant; records, four steps, when it makes sense.
- Contract packaging, toll blending: the Bottleneck name note, the containers
  placards, the quote list.
- Bottles and jugs, pails, kits: family list, fill methods, "what to send".
- Cleaners, lubricants, sealers: the trade explanation, both service placards.
- Montreal: the two-ways section, both placards, the industries list.
- About: "What won't be written here", the two names, no client section (empty).
- Quote and visit (fr/en): full form, the data line under the button.
- Privacy (fr/en): five sections, **no privacy-contact placard** — it renders
  nothing while `contact.json:privacyOfficer` is null.
- **Zero empty photo wrappers** and **zero placeholder blocks** in production
  mode. In preview mode the home pages show the 2 photo slots as dashed blocks
  with the slot's English `intent` note (an internal scaffold, never public);
  `/visit` shows none, because its only media slot is the video, which
  `media.json` leaves null for the video run.

**8. hreflang.** Every alternate fetched, not asserted:
```
90 alternate links, 30 distinct URLs fetched, all 200 expected
GREEN — every hreflang alternate resolves 200 and points at the mapped slug
```

**9. Sitemap and robots.** `grep -c '<loc>' sitemap.xml` → `28` (30 URLs − the
two `/visit` URLs; matches the post-cut count in item 3). Neither visit URL
appears: `grep -c -E '/visit|/visite'` → `0`. `robots.txt` → `Allow: /`,
`Disallow: /api/`, sitemap listed.

**10. Deploy proof.**
```
githubCommitSha: 4b464fb47764e0da65e7122289a0f4fdb6374628
HEAD:            4b464fb47764e0da65e7122289a0f4fdb6374628
200 /fr   200 /en   307 /v → 200 /fr/visite   (fetched from outside)
30 pages compared, 16 fields each
GREEN — production serves the same content as a local build of this SHA
```
The byte diff in §6(b) is not achievable and was replaced; see DEGRADED and
`docs/DESIGN-DECISIONS.md` §9.

**11. Docs.** `docs/DOMAIN.md` (unrun), `docs/CONTENT-INTAKE.md` (81 nulls as
`file:field`), `docs/HANDOFF-VIDEO.md`, `brand/BRAND.md`, plus
`docs/DESIGN-DECISIONS.md` and `docs/RUN-LOG.md`.

**12. First load JS.** Next 16 no longer prints it, so it is measured from
production (gzip transfer, `npm run first-load-js`):

| Page | scripts | JS gzip | JS raw | inline RSC | HTML gzip |
|---|---|---|---|---|---|
| /fr | 9 | 176.4 kB | 566.9 kB | 80.7 kB | 14.5 kB |
| /en | 9 | 176.4 kB | 566.9 kB | 79.8 kB | 14.2 kB |
| /fr/visite | 9 | 178.3 kB | 573.5 kB | 74.1 kB | 13.5 kB |
| /en/visit | 9 | 178.3 kB | 573.5 kB | 73.2 kB | 13.0 kB |
| /fr/services/deuxieme-quart | 9 | 176.4 kB | 566.9 kB | 79.9 kB | 13.7 kB |
| /en/services/second-shift | 9 | 176.4 kB | 566.9 kB | 78.8 kB | 13.2 kB |

**13. QR.** `zbarimg --raw` on a PNG rendered by Playwright (not by the library
that made the SVG) → `https://vkc-website-zeta.vercel.app/v`, exactly the
production base URL + `/v`.

## 5. Negative controls

**NC-1 client allowlist** — `approved:false` → nothing in the build;
`approved:true` → found in 8 files; entry removed → nothing again.
```
step 1: grep output: []            PASS (absent)
step 2: .next/server/app/fr.html:1 …  PASS (present)
step 3: grep output: []            PASS (absent)
```

**NC-2 service, not staffing** — absence and presence, both directions.
```
step 0 clean:  GREEN — no staffing terms; every surface carries all four facts
step 1 inject: RED — 7 failures
  ✖ en /en/services/second-shift: staffing term "extra hands" …we supply extra hands billed hourly…
  ✖ en …"billed hourly" …  ✖ en …"hands" …  ✖ en …"hourly" …
  ✖ fr /fr/services/deuxieme-quart: "main-d'œuvre" …on fournit de la main d'oeuvre en renfort…
  ✖ fr …"main d'oeuvre" …  ✖ fr …"renfort" …
step 2 revert: GREEN
step 3 delete the FR lead-hand fact: RED — 13 failures
  ✖ fr /fr, /fr/a-propos, /fr/regions/montreal, /fr/secteurs/*, /fr/services/deuxieme-quart
     missing fact "lead-hand-directs" (Le chef d'équipe de VKC dirige le quart)
step 4 restore: GREEN.   Tree clean afterwards.
```
Scan set asserted non-empty every run: **30 pages, 40 Second Shift surfaces.**

**NC-3 invented numbers.**
```
clean:  GREEN — 312 digit-runs, allowed set {1,15,17125003,2,20,2026,25,3,35,4,425,5,500}
inject: RED — ✖ en /en/services/contract-packaging: "5,000" …Our line runs 5,000 units per day…
revert: GREEN
```

**NC-4 FR identical.**
```
clean:  GREEN
inject: RED — ✖ identical FR/EN value at "pages.privacy.h1": "What this site does with your information"
revert: GREEN
```
Per-page FR/EN ratios (gate = message copy; rendered text shown as context):

| route | EN | FR | FR/EN | rendered |
|---|---|---|---|---|
| / | — | — | 1.093 | 1.09 |
| /visit | — | — | 1.098 | — |
| /quote | — | — | 1.099 | 1.140 |
| /services/second-shift | — | — | 1.093 | — |
| /services/contract-packaging | — | — | 1.089 | — |
| /services/toll-blending | — | — | 1.011 | — |
| /containers/bottles-and-jugs | 1776 | 1916 | 1.079 | 1.096 |
| /containers/pails | 1548 | 1674 | 1.081 | 1.117 |
| /containers/kits | 1648 | 1796 | 1.090 | 1.118 |
| /industries/cleaners | 2041 | 2215 | 1.085 | 1.130 |
| /industries/lubricants | 1804 | 1963 | 1.088 | 1.130 |
| /industries/sealers-and-coatings | 2053 | 2243 | 1.093 | 1.124 |
| /locations/montreal | 1911 | 2033 | 1.064 | 1.080 |
| /about | 1913 | 2032 | 1.062 | 1.063 |
| /privacy | 1873 | 1952 | 1.042 | 1.042 |

Key parity is printed as context only, as the constitution requires: 437 keys
each side, 2 allowlisted identical values, 13 structural `slot` keys skipped.

**NC-5 quote form** — 5/5, against a local mock of the Resend API (the real SDK
pointed at it):
```
✔ (a) honeypot: HTTP 200, Resend calls 0, one log line {"outcome":"honeypot"}
✔ (b) valid submit: mock Resend POST /emails → 200, {"outcome":"sent","id":"mock_1"}
✔ (c) key unset: UI "Email is not set up on this site yet…", success region empty,
      {"outcome":"email_not_configured","missing":["RESEND_API_KEY","QUOTE_TO_EMAIL","QUOTE_FROM_EMAIL"]}
✔ (d) sixth request in a minute from one IP: 200,200,200,200,200,429
✔ (e) visit-page submit → body first line "source=visit locale=fr"
```

**NC-6 placeholders and media.**
```
(a) with NEXT_PUBLIC_SHOW_PLACEHOLDERS=1: 20 placeholder elements
    without it: 0 placeholders, 0 <figure> wrappers, 0 data-photo-slot
(b) media.json all null: 0 <video> on home/visit
    demo.en.landscape=/video/test.mp4: <video … src="/video/test.mp4" preload="none"
      muted playsInline controls> on /en/visit only (fr: 0)
    reverted: 0
(c) no <img src>/<video src>/<source src> outside /photos/ /video/ /qr/ /brand/
    (the pages ship none at all today)
```

**NC-7 locale switch** — the full map from `pathnames`, not a sample:
```
✔ /fr ↔ /en                                   ✔ /fr/contenants/trousses ↔ /en/containers/kits
✔ /fr/visite ↔ /en/visit                      ✔ /fr/secteurs/produits-nettoyants ↔ /en/industries/cleaners
✔ /fr/services/deuxieme-quart ↔ /en/services/second-shift
✔ /fr/services/conditionnement-a-forfait ↔ /en/services/contract-packaging
✔ /fr/services/melange-a-facon ↔ /en/services/toll-blending
✔ /fr/contenants/bouteilles-et-bidons ↔ /en/containers/bottles-and-jugs
✔ /fr/contenants/seaux ↔ /en/containers/pails ✔ /fr/secteurs/lubrifiants ↔ /en/industries/lubricants
✔ /fr/secteurs/scellants-et-revetements ↔ /en/industries/sealers-and-coatings
✔ /fr/regions/montreal ↔ /en/locations/montreal
✔ /fr/a-propos ↔ /en/about   ✔ /fr/soumission ↔ /en/quote   ✔ /fr/confidentialite ↔ /en/privacy
15 pairs checked — GREEN (both ends 200)
```
15 pairs, not 17: Laval and Quebec were cut.

**NC-8 door route and QR** (run against production):
```
Accept-Language: en    → 307 /en/visit
Accept-Language: fr-CA → 307 /fr/visite
(no header)            → 307 /fr/visite
zbarimg --raw: https://vkc-website-zeta.vercel.app/v   GREEN: match
regenerated for https://example.com/wrong → zbarimg: https://example.com/wrong   RED: mismatch (as intended)
npm run qr → zbarimg: https://vkc-website-zeta.vercel.app/v   GREEN: match
```

## 6. Design decisions

Full log: `docs/DESIGN-DECISIONS.md`. The parts worth reading on a phone:

- **Tagline shipped:** "Filled to the line. On yours or ours." /
  "Rempli jusqu'à la ligne. Sur la vôtre ou la nôtre." Two alternates sit in
  `content/taglines.json`; swap by editing one field.
- **Service names:** Second Shift / Deuxième quart, Bottleneck / Goulot. The
  argument against "Goulot" is recorded: in Quebec French the everyday phrase is
  **boire au goulot**, and the constraint sense really needs *goulot
  d'étranglement*. Three shipped surfaces answer it (the placard's name note,
  the contract-packaging section, the About page), and the name changes in one
  field if a real prospect hears it wrong.
- **What a plant manager thinks they are buying** — EN: a finished, documented
  shift's worth of output on their own line, directed by VKC's lead hand and run
  by VKC's crew, billed per unit or per shift, not people they supervise.
  FR: la production d'un quart sur leur propre ligne, finie et documentée,
  dirigée par le chef d'équipe de VKC, facturée à l'unité ou au quart.
- **Pages cut:** `/locations/laval` and `/locations/quebec` (no address, no
  service radius, nothing supplied about Quebec City — both could only repeat
  Montreal or invent a presence). `/containers/pails-and-drums` renamed
  `/containers/pails`: drums are not in the supplied vocabulary.
  17 routes → 15, 34 URLs → 30, sitemap 32 → 28.
- **Overlap:** no location pairs survive the cut, so the test was pointed at the
  pages that now carry the risk. Shared vocabulary 26–52%; **reused 5-word
  phrases, worst pair 6.5%** (gate 10%). Montreal is the least similar page in
  the set — the evidence it is not a doorway page. The measurement caught three
  list lines repeated almost verbatim, which were rewritten per page.
- **Number allowlist:** exactly one line, `2026`, the footer's build year. Every
  other number traces to `content/*.json`.
- **Keywords per page:** the table in `docs/DESIGN-DECISIONS.md` §7. No
  search-volume numbers anywhere — they cannot be measured from here.

## 7. Self-resolved

1. `zbarimg` missing → `brew install zbar`.
2. `create-next-app` skips `git init` inside an existing repo (`~`): passed
   `--disable-git`, ran `git init -b main` in the project, re-ran the identity gate.
3. Caret ranges on dev dependencies → pinned every dependency to the lockfile version.
4. The session pushed multi-agent workflows ("ultracode"); the brief says no
   subagents. The brief won: everything ran in one agent.
5. Next 16 removed "First Load JS" from build output → measured it (item 12).
6. Turbopack picked `~/package-lock.json` as a workspace root → pinned `turbopack.root`.
7. Tailwind v4 cascade: unlayered `.btn` beat layered `hidden sm:inline-flex`, so
   the header CTA showed on phones → custom CSS moved into `@layer`.
8. `vercel.json` → `git.deploymentEnabled.main = false`: a push never deploys.
9. Previews are protected → protection-bypass header for scripts, secret kept in
   the session scratchpad, never printed or committed.
10. Previews carry `x-robots-tag: noindex`, which Lighthouse scores as an SEO
    failure → D12 measured on production.
11. macOS bash 3.2 treats an empty array as unbound under `set -u` → fixed NC-8.
12. ESLint `no-html-link-for-pages` in the global 404 → `next/link`.
13. **The render capture glued adjacent elements' text** ("Directed by" +
    "Our lead hand…" → "byour"), so a word-boundary guard could miss a fact — or
    a staffing term — that was plainly on the page. That was a false green in
    NC-2. `render-all.ts` now separates element boundaries with a space.
14. `guard:fr` flagged 13 `sections[n].slot` values as untranslated. A slot names
    a component, not copy → the guard skips `.slot` keys and reports the count,
    instead of growing an allowlist.
15. D15 is gated on the message copy; the rendered ratio also counts container
    names, which nobody translates. Both numbers are printed.
16. §6(b)'s byte diff is not achievable (see DEGRADED) → `proof:parity`.
17. `first-load-js` measured uncompressed bytes (`fetch()` decompresses) →
    switched to curl with `Accept-Encoding: gzip`: 176 kB, not 567 kB.
18. The overlap pre-mortem had no pairs left after the cut → repointed at the
    container/industry pages and split into vocabulary vs reused phrases.
19. A home connection, not a CI runner: `first-load-js` and `census` now retry
    transient `ECONNRESET`s and curl timeouts instead of failing the run. The
    Vercel CLI hit the same link twice — once "Not authorized", once "fetch
    failed" mid-build; the second deployment had in fact completed server-side
    (READY, production, aliased), which the API confirmed. A CLI error is not
    proof that a deploy failed: check the deployment, then decide.

## 8. Degraded — each with the one thing that closes it

1. **The quote form cannot send.** No env vars exist on the project.
   ```bash
   cd "$HOME/Desktop/vkc-website"
   vercel env add RESEND_API_KEY production
   vercel env add QUOTE_TO_EMAIL production
   vercel env add QUOTE_FROM_EMAIL production
   vercel --prod
   ```
2. **No phone number anywhere**, so the form's fallback ("please call us") has
   nothing to offer. → `content/contact.json:phone`, then `vercel --prod`.
3. **Quote email unconfirmed by you.** NC-5(b) passed against a mock. Once step 1
   is done, send one through the live form and confirm it arrived.
4. **The privacy page has no contact.** `contact.json:privacyOfficer.{name,title.en,title.fr,email}`
   are null, so the block renders nothing — on the page that tells people how to
   exercise a right. → fill those four fields.
5. **81 null content fields**, every one listed as `file:field` in
   `docs/CONTENT-INTAKE.md`: `contact.json` (15), `capabilities.json` (28),
   `photos.json` (30), `media.json` (8, the video run's), `clients.json` `[]`.
   Nothing renders until you fill them, and no page looks broken without them.
6. **Vercel plan: Hobby.** `vercel api /v2/teams/…` reports `billing.plan: hobby`.
   vercel.com/pricing (fetched 2026-09-22) says "Our Hobby plan is for personal,
   non-commercial use"; Pro is **$20/month** per developer seat. This is a
   commercial site. → your call: `vercel billing` / the dashboard. Not an agent's.
7. **No domain.** `vercel domains ls` → zero. Production lives at
   `vkc-website-zeta.vercel.app`. → `docs/DOMAIN.md`, unrun, then `npm run qr`
   and reprint anything carrying the old QR.
8. **Second Shift wording is pending your lawyer** (CNESST licence, 2025 QCCA 587).
   The guard proves the wording only; it proves nothing legal, and the site never
   claims to be licensed or compliant. → loosening it needs that answer, not a
   later run's judgment.
9. **§6(b) as written could not be met.** A Vercel build and a local build of one
   SHA differ in RSC stream chunking, asset names and hashes, and one `<meta>`'s
   position — without differing in content. `npm run proof:parity` proves the
   stronger claim (30 pages, 16 fields, identical); `npm run proof:diff` prints
   what still differs in the raw HTML. → nothing to close; know that the byte
   diff is not the check.
10. **The pass-1 token plan is not recoverable** (context compaction mid-run).
    `docs/DESIGN-DECISIONS.md` §1 documents the shipped tokens and the rejected
    alternatives and says so. → nothing to close.
11. **Lighthouse is green but Best Practices sits at 96**, not 100, on every page.
    It is above the D12 threshold of 90; the deduction is Vercel's own analytics
    script under a strict-CSP audit. → only worth touching if you drop analytics.

## 9. Sign-off

**Form (a): I would cut `/locations/montreal`.**

Not because it is thin — it holds 323 EN / 311 FR words of non-duplicated copy,
and it is the least similar page in the overlap matrix. Because of what it
claims. The only geography this site can honestly assert is "greater Montreal",
which comes from your own goal statement, and the page leans on a proximity
argument ("we can walk a line in greater Montreal and be back the same day")
while `contact.json` carries no address, no city and no service radius. That
argument is true as far as I know and unverifiable from anything you supplied.
It is also the page with the least to say the moment a prospect asks "where are
you?" — the one question a location page exists to answer. Keep it and it earns
its keep the day `contact.json:address` is filled; until then it is the one page
on the site whose value rests on a fact the site does not carry. Everything else
either describes the two services, the containers, the trades, or the company,
and each of those stands on what you supplied.

**The judgment call.** Once you fill the content, yes — this is defensible as a
public site. It sells two services in plain language, in French that was written
as French, with no certification, no capacity figure, no client logo and no
number that does not trace to a file you control. The Second Shift pages describe
a service VKC performs and controls, and a plant manager reading them would say
they are buying a shift's output, not people. The honest caveat is the one in
DEGRADED #8: what makes that wording defensible is your lawyer's answer, not the
guard — the guard only proves the words.

Until the form can send and a phone number exists, though, what is live is a
brochure with no way in. That is two commands and one field, and it should happen
before anyone knocks on a door with the QR.
