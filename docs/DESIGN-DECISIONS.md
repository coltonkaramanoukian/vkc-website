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

## 11. Run 3 decisions (2026-09-27, continued)

- **A media manifest, not a media file.** `content/scenes.json` is where
  generated covers and gallery stills land (one cover per page, two
  galleries), NULL AT BIRTH like the photo slots. The components reserve
  each box by aspect ratio, serve images through `next/image` and play a
  video only as a muted, in-view loop with a Play / Pause label; under
  `prefers-reduced-motion` the poster stands. `guard:media` (NC-10) is the
  gate, and `guard:numbers` reads only `alt` and `caption` from the file, so
  an aspect ratio such as "16/9" never widens the number allowlist. CLAUDE.md
  §1 still bans generated imagery; the seam exists, the rule change is
  Colton's (NEEDS-COLTON item 8).
- **A phone gets a bottom action bar.** Below `sm` the header carries no
  quote button, so a prospect on a phone saw no call to action until the
  hero. The bar is fixed at the bottom, last in tab order, absent on the
  pages whose content is the form (`/quote`, `/visit`, `/contact`).
- **Error boundaries carry their own four strings.** `lib/error-copy.ts` is
  the one exception to "prose lives in i18n/messages": a boundary may be
  the thing that failed to load messages. No facts, no numbers.
- **Accessibility is measured, not asserted.** `npm run a11y` runs axe over
  every URL at 375 and 1280 with the WCAG 2.x and best-practice tags; the
  allowlist ships empty and `--self-check` proves the scan turns red on an
  injected defect.
- **`/contact` exists, and it is thin on purpose until `contact.json` is
  filled.** A prospect looks for "Contact" in a nav before "Get a quote", and
  a search for the company name plus "contact" wants a page. It carries the
  details placard (phone, email, address, hours: each row only once it has a
  value), a short form whose email is labelled `source=contact`, and three
  "after you send it" lines. Its lead has two variants: with details on the
  page, and without. It is not a second quote page: the long form stays on
  `/quote`, which the contact page links to. ContactPage JSON-LD points at
  the Organization block; contact facts stay there, in one place.
- **A related card may point at the quote page.** `RelatedPages` looked up
  every eyebrow under `pages.<key>`; the quote page keeps its copy under
  `quote.*`, so a card for it threw at render. The lookup now falls back to
  `<key>.eyebrow`. Found by the new error boundary doing its job on the
  first render of `/contact`.
- **Service FAQs and a side-by-side table are copy, not facts.** Each service
  page ends on four or five questions a plant manager asks before the first
  shift, fill or batch, and `/services` carries a five-row table of what
  differs between the two services. Every answer is written from the
  service's own definition; no answer states a number, a client, a lead time
  or a certification. The FAQ block renders FAQPage JSON-LD from the same
  items a reader sees. The table is the third Second Shift surface on
  `/services`, so it carries all four facts in its own cells.
- **`/glossary` (`/lexique`) defines the trade's words, alphabetically per
  language.** Twenty-two terms: the two fill methods, the four kinds of
  record and role the Second Shift facts name (lead hand, QC sheet,
  production log, shift), the container families and the words a quote form
  asks for (viscosity, closure, specification, lot, safety data sheet).
  Each locale sorts by its own collator, so the French order is French and
  the letter strip differs between the two pages; the term list is authored
  separately in each language, not translated. The "Second Shift" and
  "Deuxième quart" entries carry all four §4 facts because a glossary that
  names the service is a surface that mentions it. The same entries feed a
  `DefinedTermSet` with one `DefinedTerm` per entry, anchored to the entry's
  id, so a crawler reads what a reader reads. No digits anywhere on the page.
- **Audit round one (seven read-only auditors, two skeptics per finding).**
  Nine defects confirmed, none against §1–§5; fixed in one PR:
  the header's scroll-settle animation was the one animation not behind
  `prefers-reduced-motion`; the quote form's select and textarea lacked
  `aria-invalid` / `aria-describedby`, so an error on them was neither
  announced nor focused (NC-5 now proves the select path, check (f)); a
  non-JSON reply from the quote API was swallowed, now logged with its
  status and mapped to the error state; the visit page's description named
  neither service; forty-nine French colons had a plain space before them
  while eighty-three had the espace insécable. Refuted and left alone: OG
  image URLs are already absolute in the rendered head (`metadataBase`), and
  the root `not-found.tsx` renders its own `html`/`body` on purpose because
  the root layout is a pass-through.
- **French punctuation is now a gate.** `guard:fr` fails on a plain space
  before a colon and on any space before `;`, `!` or `?`, which is how the
  file was already written everywhere else (Québec usage). NC-4 step 1b
  shows it red.
- **Photos and logos measure themselves.** `lib/image-size.ts` reads the
  width and height from a PNG, JPEG, GIF or WebP header (tested on crafted
  buffers); `lib/local-image.ts` applies it to a file under `public/` at
  render. A photo slot renders through `next/image` with that size unless
  `photos.json` states one; a client logo carries `width`/`height`
  attributes. Nobody has to type dimensions into content, and a format the
  parser does not read (AVIF) still falls back to a plain `<img>`.
- **The video toggle has no `aria-pressed`.** Its label already changes
  between play and pause; a pressed state on top of a changing label reads
  as two contradictory signals.
- **Captures now include the Twitter and `og:image:alt` tags**, so every
  guard scans them (a blind spot the constitution auditor found; the text is
  the same title and description, but a guard should not have to assume so).
- **Copy links into the glossary by key, not by anchor.** A message writes
  `[QC sheets](/glossary#qc-sheet)` in English and `[feuilles CQ](/glossary#qc-sheet)`
  in French; `lib/glossary-links.ts` maps the key to that language's own
  term and its anchor (`#qc-sheet` on `/en/glossary`, `#feuille-cq` on
  `/fr/lexique`), and a test checks every key names a real entry in both
  files and that every entry has a key. `lib/inline-links.ts` resolves the
  target for `Inline`; an unknown key or route renders as plain text, so a
  typo cannot ship a dead link. First plain mention per page only, in body
  paragraphs, FAQ answers and leads: never a heading, never metadata, never
  the glossary itself, never a page's own subject. The overlap and ratio
  measurements strip link targets and keep labels, so the links change no
  reader-visible text and no gate.
- **Audit round two (six lenses: a Québec plant manager reading FR, an
  English buyer on a phone, a keyboard-only walk, docs drift, an adversary
  against the guards, a structured-data validator).** Confirmed and fixed:
  the email-not-configured message told the visitor to call while
  `contact.json` has no phone, so the no-phone variant now says to try
  again later (the with-phone variant still names the number); titles and
  descriptions that a search snippet would cut mid-thought were shortened
  where §4 allowed (the Second Shift descriptions keep their four facts and
  stay long); two hard-coded PR counts in the docs were replaced by a
  pointer to the run-log tables. Refuted and left alone: the phone header
  has no quote button because the phone action bar is the quote button;
  the `details` menu needs no `aria-expanded`; hours and turnaround times
  are absent because they are NULL AT BIRTH, not forgotten.
- **`experimental.inlineCss` stays off (belongs with §9).** Measured on
  2026-09-27: the flag inlines the stylesheet into the head and into the
  RSC payload, so `/en` grew from 28 kB to 62 kB gzip and the Lighthouse
  medians moved from 96 to 95–98 with LCP 2.4 s against 2.3 s. The
  render-blocking round trip is cheaper than the bytes. Do not "fix" the
  render-blocking stylesheet this way.
- **The ±10% gate counts the SpecGrid labels and the contact row names.**
  Audit round two's last confirmed finding (both skeptics, after the
  handoff was drafted): `scripts/lib/copy-ratio.ts` measured a service or
  container page without the `common.specLabels` strings its SpecGrid
  renders once `capabilities.json` is filled, and `/contact` without the
  `common.contact` row names its placard renders once `contact.json` is.
  Each route now lists exactly the label keys it asks for (`SPEC_LABEL_KEYS`,
  tested), so the gate measures what the page will show, not less. The
  corrected measurement put `/containers/pails` at 1.102: the French lead
  repeated "seaux" ("seaux de plastique, seaux de métal") and now reads
  "seaux de plastique, de métal", 1.098. Run 4, 2026-09-27.

## 12. Run 4 decisions (2026-09-27, the design pass)

Read against the three design skills (taste, frontend-design, scroll-craft)
with the site screenshotted at 1280 and 375 in both languages before a line
changed. The site read as variance 3 / motion 2 / density 5; the pass moves
it to 5 / 4 / 5 and leaves the tokens, the two faces, the slugs, the nav
labels, the copy and every guard where they were.

- **The audit, in one line each.** An eyebrow above every section (eight on
  the home page); the same three-equal-placard grid used three times on the
  home page and again as "related" on every page; the hero gauge rendered
  at 300 by 200 pixels in a corner; the shift bar's load-time animation ran
  below the fold where nobody saw it; the closing call to action was one
  more placard among placards; the longform hero's pictogram floated small.
- **Boldness spent in one place: the fill line is the spine.** The header
  now carries its own fill rule (a tick at the content's left edge, in line
  with every section tick below it) and, where `animation-timeline: scroll()`
  is supported, the rule fills from the tick to the content's right edge as
  the page is read. It is a progress line made of the brand's one device,
  CSS only, and under reduced motion only the tick stands. The section tick
  now draws over a quarter of the viewport's travel (`entry 0% cover 25%`)
  instead of two pixels. The shift bar fills on `view()` as it enters
  (`entry 0% cover 40%`; the track is `overflow: clip`, because `hidden`
  would make it the scroll container the timeline measures against).
  Verified in numbers: below the fold the bar's transform is `scaleX(0)`,
  at mid-viewport `scaleX(1)`, under reduced motion `none`.
- **The hero.** Seven columns to five from `xl`, the gauge fills its column
  (about 450 by 300 pixels at 1280), and both containers stand on a floor
  line ruled like every section (hairline and tick) inside the drawing. The
  title is 4rem from `xl`, measured so both English sentences hold their
  own line and the French runs three, never four.
- **Placards hold facts; rules point somewhere.** The three container groups
  are one label with three fields side by side (`ContainerLabel`, on the home
  page and the containers hub); industries and hub pages are ruled manifest
  rows (`Manifest`); "where this leads next" is three ruled cells under one
  hairline. The two service placards, the chooser, the split panels and the
  spec grid keep their boxes, because each is a fact.
- **Eyebrows are information, not furniture.** Two on the home page (the
  hero's and "Straight talk"); one per longform page (the hero's); the quote
  form's three legends keep theirs because each opens a group. The message
  keys the removed eyebrows read from stay in both files: they still feed
  the related cells and the copy-ratio gate, which measures messages, not
  render. The compare table, the chooser, the FAQ and "keep reading" lost
  theirs.
- **The closing band prints in negative.** `.vkc-negative` in
  `brand/tokens.css` re-points the six colour tokens to the other scheme's
  values, so the band is the darkest thing on a light page and the lightest
  on a dark one, and the accent button inside it keeps AA. Once per page, on
  purpose, and it is the last thing before the footer: the ending holds
  instead of trailing into a footer.
- **What was tried and removed.** The band's text column was capped in `ch`
  of the body font, which wrapped "Dites-nous" at its hyphen into four
  lines; the cap is now on the heading in its own font. A concrete pour-line
  texture behind the hero (`.floor-lines`, shipped unused since run 1) was
  considered and left unused: a hairline grid drawn to make a page feel
  designed is decoration, and the floor is already the page.
- **scroll-craft, applied without its pipeline.** The skill's asset step
  (generated stills and clips) is closed by CLAUDE.md §1, and its page
  grammar assumes one scroll film; this is nineteen routes of spec-sheet
  prose. What carries over: one engineered device, chosen for the brand
  (the fill), varied by span (header, section, bar), no scroll cue, no
  counter, and an ending that resolves. The self-authored brief a later
  media run would read is `docs/SCROLL-BRIEF.md`.
- **Playwright MCP is the proof surface.** Every page at 1280 and 375, both
  locales, light and dark, plus viewport captures at scroll positions for
  the scroll-driven pieces (a full-page capture reports a scroll timeline
  at its top-of-page state, so it cannot prove them). The desktop app's
  Preview Start prompt is never triggered.
- **Polish, same day.** Twelve titles ran past 70 characters with the
  " | VKC Packaging" suffix; eleven are trimmed without losing a D10
  keyword (the French home title stays at 76 because it is the absolute
  title carrying both keywords and the brand). The home titles used a
  spaced em dash as a separator; a colon does the job, and the nine
  em-dash constructions in body copy (EN five, FR four) became parentheses
  or a colon, which is how the rest of the file was already punctuated.
  Bulleted lists are marked with the fill tick (`.tick-list`) instead of
  the browser's disc, the one place the default marker still showed. The
  footer's tagline is set at display size, so the page's first and last
  words are the same words at the same weight.

## 13. Run 5 decisions (2026-09-27, the cinematic redesign)

Asked for by the owners, who picked "Option A" from two hosted previews.
brand/BRAND.md "Run 5" is the rulebook; this is the why.

- **D5.1 Dark floor, amber fill.** A single dark scheme reads as a plant at
  night under its lights and lets the generated scenes carry the page. The
  accent moved from QC blue to fill amber so the page still has one accent,
  now the colour of product at its fill line. Contrast checked by axe at 375
  and 1280 on all 40 URLs: green.
- **D5.2 Scenes filled.** content/scenes.json holds 13 covers and 6 gallery
  stills generated with Higgsfield (CLAUDE.md §1, as amended), plus three
  silent loops: the home hero (hero.mp4), toll blending (blend.mp4) and
  lubricants (oil.mp4). None shows a person, a brand, readable text or a
  number; guard:media green. Written by the Higgsfield run the owners
  connected; review before merge.
- **D5.3 Motion is progressive.** GSAP, ScrollTrigger and Lenis are imported
  inside an effect after first paint, so the static HTML is the page. The
  only hidden states sit behind `html.js-motion`, which is not set under
  reduced motion or when an import fails. The sideways reel and the frame
  reveal run from 900px only, where they can't crop copy.
- **D5.4 New home copy, same facts.** New keys: home.statement, home.fill*,
  home.reel.*, home.why*. They restate what other pages already say; no new
  fact, number or claim. "The recipe never changes hands" was rewritten after
  guard:staffing caught "hands"; the French was trimmed to 1.093 of the
  English (guard:fr).
- **D5.5 The closing frame on the home page** replaces the negative band
  there (the band stays on every other page) and uses the "shiftEnds"
  tagline from content/taglines.json.

## 14. Run 5 decisions (2026-09-27, the navigation fix and the site order)

- **One order, everywhere it is listed.** `lib/nav.ts` is the order:
  Services (Second Shift, then the two Bottleneck pages), Industries,
  Containers, Regions, Company (About, Contact, quote, glossary, privacy).
  The Menu panel, the footer, the header's inline bar and the home page's
  sections follow it; the home page ends on three ruled cells (Montréal,
  About, Contact), the pages that end the order, before the negative band.
- **Five items inline, not six.** The French row with Montréal plus the
  French quote button overflows the 72rem column by 58px at every width.
  The bar carries Services, Industries, Containers, About, Contact; Regions
  keeps its place in the menu, the footer and the closing cells. Shrinking
  the bar to 14px would have fit with 10px to spare, and a nav that fits by
  ten pixels is a nav that wraps on someone's machine.
- **A related cell's eyebrow is never its own name.** About's eyebrow is
  "About"; the cell shows the group instead ("Company" / "L'entreprise"),
  so the small line says where the page lives and the large line says what
  it is.
- **The hero's secondary button is a link, not an anchor.** "The two
  services" now opens the Services hub. A same-page anchor on the one
  button that says "services" was the literal shape of Colton's complaint.
- **The menu panel fades only.** Its 4px drop, with the html smooth scroll,
  left the next page 3px down after a menu click (RUN-LOG run 5). Nothing
  else about the panel changed.
- **One wrapper element around the page.** The app router scrolls a route
  segment's top-level nodes into view one by one after a navigation; with
  five nodes the landing depended on their order. `PageShell` returns one
  `<div data-page>` and the router scrolls one thing.
- **Media slots are labelled by id.** The Preview placeholder prints
  `SCENE <id> (<aspect>): <intent>`, `GALLERY <id>: <intent>` and
  `PHOTO <id>: <intent>`, so a fill run maps a file to a slot by reading
  the page. `docs/MEDIA-SLOTS.md` is the slot list with positions and
  sizes; the manifest's shape did not change.
- **Four gallery tiles sit two by two.** `Math.min(count, 3)` columns put a
  fourth tile alone on a second row; `data-count` now carries the real
  count and the CSS gives four a 2x2 grid (frontend-design: a grid has as
  many cells as it has content).
