# Design decisions

Every choice this run made that a later run could otherwise reverse by accident.

## 1. Brand tokens

**Note on this section.** The pass-1 token plan was written and reviewed in
Phase 1, in a part of this session that a context compaction later summarized
away; the draft's exact intermediate values are not recoverable verbatim. What
follows is the shipped state, read back from `brand/tokens.css`, plus the
reasoning that survived into the file's own comments and `brand/BRAND.md`. The
rejected alternatives below are recorded as decisions, not as reconstructions:
each is a thing this site deliberately does not do.

Shipped palette — six names, one accent (full table and dark set in
`brand/BRAND.md`):

| Token | Light | Taken from |
|---|---|---|
| `--vkc-floor` | `#edeff2` | sealed concrete: the page ground |
| `--vkc-label` | `#ffffff` | thermal label stock: placards, header, footer, fields |
| `--vkc-ink` | `#15171a` | thermal-print black: text and label borders |
| `--vkc-graphite` | `#525964` | the lighter second print pass: field names, meta |
| `--vkc-hairline` | `#c7ccd3` | the rules printed inside a pallet label |
| `--vkc-qc` | `#1f33a6` | QC-sheet ballpoint blue: the only accent |

What the review changed, and why (visible in the shipped files):

- **Border weight 1.5px, not 1px.** A printed label's rule reads heavier than a
  hairline browser border, and 1px at 390px looked like a default table.
- **Radius 2px, not 0 and not 8px.** Square corners read as unstyled; 8px reads
  as a SaaS card. 2px is a die-cut corner.
- **The accent is reserved for what the reader can act on** — links, the primary
  button, focus. Nothing decorative is `--vkc-qc`.
- **Custom CSS lives inside `@layer base` / `@layer components`.** Unlayered
  `.btn { display: inline-flex }` beat Tailwind's layered `hidden sm:inline-flex`
  and the header CTA appeared on phones (SELF-RESOLVED 7 in the run log).
- **Display type runs semi-expanded** (Archivo `font-stretch: 112.5%`), which is
  where the face reads like stencilled plant signage rather than a web heading.

Rejected, each named in D8, each a live temptation:

| Rejected | Why |
|---|---|
| Warm cream + terracotta | Reads artisanal. This is a plant that fills industrial cleaners. |
| Near-black + a single acid accent | The 2021 startup look; also fails contrast at small sizes in dark mode. |
| Broadsheet hairline columns | A newspaper grid says "editorial", and the content is a spec sheet. |
| Identical rounded cards, soft grey shadows, gradient washes | Shadows imply depth this brand does not have. Labels are flat and printed. |
| ALL-CAPS eyebrow labels | Sentence case everywhere; the mono face already marks the field name. |
| Middle-dot meta strings | A pallet label separates fields with rules, not bullets. |
| "→" appended to buttons | The button already says what it does. |
| A headline with one accented word | The accent means "actionable", and a headline is not. |
| Fade-slide entrances | Motion for its own sake on a site a prospect opens beside a loud line. |

## 2. Taglines (D9)

Shipped as the default in `content/taglines.json`:

> **Filled to the line. On yours or ours.**
> **Rempli jusqu'à la ligne. Sur la vôtre ou la nôtre.**

Fill line and production line in one word, in both languages, and "yours or
ours" is the two services in four words. Swap by editing `default`.

The two alternates, kept in the same file:

| Key | EN | FR | Reading |
|---|---|---|---|
| `bottleneckTrade` | Got a bottleneck? Filling them is the job. | Un goulot? Le remplir, c'est notre métier. | The pun as a joke the trade gets. Cut as default: a question headline weakens the home page. |
| `shiftEnds` | Your line keeps running when your shift ends. | Votre ligne roule encore quand votre quart finit. | The Second Shift angle alone. Cut as default: it sits above only one of the two services. |

## 3. The two service names

**Second Shift / Deuxième quart.** Plain, and it is what a plant manager
already calls the thing. The FR keeps the D10 search term "deuxième quart de
production".

**Bottleneck / Goulot.** Deliberately double: the constraint in the plant, and
the neck of the bottle we fill. The pun survives translation, which is rare.

*The argument against "Goulot", recorded because it is real:* in Quebec French,
the everyday collocation is **boire au goulot** — drinking straight from the
bottle. On its own, "goulot" means the bottle's neck; the constraint sense needs
the full **goulot d'étranglement**. So a FR reader can meet "Goulot" and hear
only glassware, or something faintly uncouth, where an EN reader hears the
constraint immediately. Three things answer it, and they are all shipped: the
service placard carries `nameNote` ("Pourquoi « Goulot » : on remplit des
contenants à goulot, et on soulage l'étape qui ralentit votre usine"), the
contract-packaging page spends a section on it, and the `/about` page states the
pair outright. If Colton hears the wrong reading from a real prospect, the name
changes in one field: `content/services.json` → `bottleneck.name.fr`. Every
string on the site says `{bn}` and follows.

## 4. The plant-manager read (D16 pre-mortem 1)

Both pages read top to bottom, in both locales. One line each, answering "what
would a plant manager think they are buying?":

- **EN:** A finished, documented shift's worth of output on their own line,
  directed by VKC's lead hand and run by VKC's crew, billed per unit or per
  shift — not people they have to supervise.
- **FR:** La production d'un quart sur leur propre ligne, finie et documentée,
  dirigée par le chef d'équipe de VKC et réalisée par son équipe, facturée à
  l'unité ou au quart — pas des gens qu'ils doivent encadrer.

Passing `npm run guard:staffing` proves the wording only. It proves nothing
legal, and the copy never claims to be licensed, compliant or approved.

## 5. Pages cut, and why

| Page | Decision |
|---|---|
| `/locations/laval` | **CUT.** Everything true about VKC in Laval is the Montreal sentence with the city swapped. The site carries no facility address (`contact.json` null), no service radius (`serviceRadiusKm` null) and no travel claim, so the page could only repeat Montreal or invent a local presence. |
| `/locations/quebec` | **CUT.** Nothing supplied says VKC serves Quebec City, ~250 km away. Writing that it does would be an invented fact, and it is exactly the claim a prospect there would test with one phone call. |
| `/containers/pails-and-drums` | **RENAMED** `/containers/pails` (`/contenants/seaux`). Drums are not in the §1 container vocabulary; naming them in a slug advertises a container VKC was never said to run. |
| `/locations/montreal` metadata | **NARROWED.** The title and description named Second Shift, and D16 applies to metadata: there is no room in a description for all four facts. The metadata now describes the facility side; the page body carries Second Shift with the full placard. |

Result: 17 routes → 15, 34 URLs → 30, sitemap 32 → 28.

## 6. Near-duplicate copy (D7 / pre-mortem 2)

The brief's ≤40% pairwise test was written for three location pages. Two were
cut, so there are **zero location pairs left**. Measuring nothing and calling it
a pass would be the wrong answer, so the test was pointed at the pages that now
carry the duplication risk — the three container pages and the three industry
pages, plus Montreal — and it is reported two ways (`npm run overlap`):

- **Shared vocabulary** (unique words, `|A∩B| / min`): 26–52%. Pages in one
  trade share `product`, `container`, `fill`, `label`, `run`, `quote`. That is
  the subject matter, not duplication.
- **Reused sentences** (5-word phrases): **worst pair 6.5%**, gate ≤10%. This is
  the measure that catches copy-paste, and it is the one to watch.

Montreal against every other page: 26–34% vocabulary, and it is the least
similar page in the set — which is the evidence that the one surviving location
page is not a doorway page.

Three list lines that had been reused almost verbatim across the container and
industry pages were rewritten per page when this measurement surfaced them.

## 7. Keywords per page (D10)

FR terms are the ones a Quebec buyer types; they are not translations of the EN.

| Route | EN | FR |
|---|---|---|
| `/` | contract packaging, toll blending, co-packer, greater Montreal | conditionnement à forfait, mélange à façon, remplissage de liquides, Grand Montréal |
| `/services/second-shift` | second shift production, production shift at your plant | deuxième quart de production, quart de production |
| `/services/contract-packaging` | contract packaging, co-packer, liquid filling | conditionnement à forfait, sous-traitance d'emballage |
| `/services/toll-blending` | toll blending, blending to your formula | mélange à façon, selon votre formule |
| `/containers/bottles-and-jugs` | liquid filling, HDPE bottles, D-jugs | remplissage de liquides, bouteilles PEHD, bidons |
| `/containers/pails` | pail filling, plastic and metal pails, Ropak | remplissage de seaux, seaux de plastique et de métal |
| `/containers/kits` | kitting, kit assembly, consumer kits | assemblage de trousses, trousses pour la vente au détail |
| `/industries/cleaners` | contract packaging for cleaners, degreasers | conditionnement de produits nettoyants, dégraissants |
| `/industries/lubricants` | contract packaging for lubricants, oils, greases | conditionnement de lubrifiants, huiles, graisses |
| `/industries/sealers-and-coatings` | contract packaging for sealers, coatings, colourants | conditionnement de scellants, revêtements, colorants |
| `/locations/montreal` | contract filling and packaging, greater Montreal | remplissage et conditionnement, Grand Montréal |
| `/about`, `/privacy`, `/quote` | brand terms only | termes de marque seulement |
| `/visit` | none: `noindex` by design | aucun : `noindex` par choix |

No search-volume numbers appear anywhere in this repo or in the report. They
cannot be measured from here.

## 8. The number allowlist (NC-3)

`guard/number-allowlist.json` has exactly **one** line:

- `2026` — the copyright year in the footer. The footer prints the build year,
  so the first build of 2027 turns the guard red until this line is updated.
  That is the intended behaviour: a number nobody can point at in `content/` has
  to be justified again every year.

Everything else the guard allows comes from `content/*.json` itself: the digit
runs in the container family names (`500`, `1`, `15`, `2`, `35`, `5`, `425`,
`20` — separators are folded, so `1.5G` normalizes to `15` and `4.25G` to `425`)
and `17125003` from `site.json:legalName`. The guard's allowed set is printed on
every run, so a new number in content shows up in the output rather than
silently widening the rule.

## 9. Measurement decisions a later run should not "fix"

- **D15 is gated on the copy, not the rendered page.** The rendered FR/EN ratio
  also counts content DATA — "Seau de plastique 3,5G" against "3.5G plastic
  pail" — which nobody translates and which pushes a page past ±10% while the
  prose is in range. `npm run guard:fr` gates on the message strings and prints
  the rendered ratio beside it as context, so both are visible.
- **A section's `slot` is not copy.** It names a component, so an identical
  FR/EN value there is by design; the guard skips keys ending in `.slot` and
  says how many it skipped.
- **§6(b) cannot be a byte diff.** A Vercel build and a local build of the same
  SHA differ in RSC stream chunking, asset file names and hashes, and one
  `<meta>`'s position — without differing in content. `npm run proof:parity`
  proves the stronger thing instead: all 30 pages, both origins, identical in
  status, title, metadata, canonical, alternates, JSON-LD, body text, guard
  surfaces, image and video sources. `npm run proof:diff` keeps the raw
  two-page comparison and prints exactly what still differs.
- **Lighthouse runs on production, not on a preview.** Previews carry
  `x-robots-tag: noindex`, which Lighthouse scores as an SEO failure.
- **`/visit` is excluded from the overlap gate, not from the measurement.** It
  exists to restate the whole site in thirty seconds (D17), and D16 requires the
  four Second Shift facts as fixed phrases wherever the service is named — so
  its pairs run 10–19% reused phrases by design. They are printed with the
  reason; the gate covers the pages that are supposed to be distinct (worst
  pair 9.5%).
- **A guard now covers the §6 DON'T words.** NC-3 covers invented numbers and
  the staffing guard covers the D16 wording, but nothing watched for
  certifications, tenure, square footage, headcount, client counts,
  superlatives, or "licensed / compliant / approved". `npm run guard:claims`
  does, in both languages, and NC-9 proves it fails. It found the word
  "fastest" sitting on `/visit` — shipped, live, with five other guards green.
  A guard nobody wrote is not a standard, it is a hope.
- **The render capture separates element boundaries with a space.** `textContent`
  glued a placard label to its value ("Directed by" + "Our lead hand…" →
  "byour"), which could hide a required fact — or a staffing term — from a
  word-boundary guard. That was a false green in NC-2 and is now fixed.

## 10. Run 2 decisions (2026-09-27)

- **The motion rule changed from "none" to "one easing, CSS only, behind
  reduced-motion".** Run 1 wrote "no motion" because nothing had earned it.
  Run 2 gives motion one job: drawing the fill rule. The rule's tick advances
  with `animation-timeline: view()` where supported (static elsewhere), the
  header's rule settles on scroll, the hero gauge and the shift bar fill once.
  No entrance fades, no parallax, no per-element JavaScript timers. BRAND.md
  carries the rule; `prefers-reduced-motion: reduce` turns all of it off.
- **Hub pages exist because the nav needed a place to point.** `/services`,
  `/containers` and `/industries` each hold the group's cards plus the shared
  placards (services) or the family list (containers). Their copy is short and
  their FR/EN ratios sit at 1.05–1.09. Breadcrumbs derive from `lib/nav.ts`,
  so a page cannot claim a parent it does not have.
- **A related card may not name Second Shift unless the page already carries
  the four facts.** The staffing guard reads every surface that names the
  service (§4), and a card with the name alone is a surface with none of the
  facts. The industries hub therefore has no Second Shift card; the services
  hub renders the full placard. `lib/related.ts` encodes this.
- **The overlap gate is the copy measurement.** The rendered measurement was
  red on `main` before run 2 began: container family names repeat on every
  page that lists the family, which is data, not prose. `npm run overlap` now
  runs `--copy`; `npm run overlap:rendered` prints the old view as context.
  Worst pair after run 2: 8.8% reused 5-word phrases (gate 10%).
- **Service JSON-LD on the three service pages**, description from
  `services.json:summary`, provider `#organization`. The Second Shift summary
  is where the four facts live, so the page's structured data passes §4 on its
  own.
- **One Open Graph card per page.** A route handler at `/og/{locale}/{key}`,
  prerendered from `generateStaticParams`, with `dynamicParams=false` so any
  other key is a 404. The home card carries the tagline; every other card its
  `meta.<key>.title`. The per-locale file-convention image is gone because a
  page-level `openGraph.images` would have overridden it anyway.
- **The font is pinned to the axes the CSS uses.** Archivo's variable file
  shipped with wdth 62–125 and wght 100–900; the site uses wdth 100 (body),
  106 and 112.5 (display) and wght 400–800. `scripts/subset-fonts.py` pins
  those ranges and latin-subsets: 90.1 kB → 57.9 kB on the LCP path, with the
  same outlines at every value the CSS asks for. `src/app/fonts.ts` declares
  the same ranges so the browser never synthesises outside them.
- **No `lastModified` in the sitemap.** The build date would be a lie about
  pages that did not change, and a per-page date needs git history the Vercel
  build does not reliably have. Absent beats wrong.
- **Security headers without a script-src CSP.** Every page is prerendered, so
  there is no per-request nonce, and `'unsafe-inline'` would be a header that
  says nothing. `frame-ancestors 'none'`, nosniff, DENY, a referrer policy and
  a permissions policy are set in `next.config.ts`.
- **The primary nav shows from `xl`, not `lg`.** French labels ("Deuxième
  quart", "Nos services", "À propos") wrapped onto two lines between 1024 and
  1279px, and a wrapped nav item reads as two items. Below `xl` the menu panel
  carries everything.
- **Lighthouse on a local build is context, not the D12 number.** Best
  practices scores 96 locally because `/_vercel/insights/script.js` 404s on
  `next start`; the audit passes on Vercel. §9 still stands: the D12 medians
  come from production.
