# VKC Packaging — brand

Invented by this run (D8). Everything here is shipped and verifiable in the
repo; the video run reads this file and must match it.

## Where it comes from

The floor's own printed matter, not a generic "industrial" look: a pallet label
on a sealed-concrete floor. Thermal-print black on white label stock, a QC
ballpoint blue, hairline rules inside the label, and a mono face for the small
all-caps field names the way a label prints them. The one graphic device is the
**fill line** — the short heavy rule that opens each section — read as both the
line on a container and the line on a plant floor.

## Colour tokens — `brand/tokens.css`

| Token | Light | Dark | Role |
|---|---|---|---|
| `--vkc-floor` | `#edeff2` | `#111316` | Page ground: sealed concrete |
| `--vkc-label` | `#ffffff` | `#1a1d22` | Label stock: placards, form fields, header, footer |
| `--vkc-ink` | `#15171a` | `#e8eaee` | Thermal-print black: text, label borders |
| `--vkc-graphite` | `#525964` | `#a2a9b4` | Secondary print: field names, meta |
| `--vkc-hairline` | `#c7ccd3` | `#343a43` | Rules printed inside a label |
| `--vkc-qc` | `#1f33a6` | `#9caeff` | THE accent: links, primary button, focus ring |
| `--vkc-on-qc` | `#ffffff` | `#0e1330` | Text on the accent |

One accent, used only for what the reader can act on. Light theme is the
default; dark comes from `prefers-color-scheme` in the same file. Contrast: ink
on floor and on label passes AA at every size shipped; `--vkc-qc` on `--vkc-label`
passes AA for body text. Lighthouse accessibility scores 100 on production, in
both locales.

Other tokens: `--vkc-border: 1.5px` (a printed label's rule weight, not 1px),
`--vkc-radius: 2px` (a die-cut corner, not a rounded card), `--vkc-measure: 64ch`,
`--vkc-page-max: 72rem`, `--vkc-gutter: 16px`, and the Archivo width axis
(`--vkc-stretch-display: 112.5%`, `--vkc-stretch-body: 100%`).

## Type

| Role | Face | How |
|---|---|---|
| Display (h1–h3) | Archivo, variable | `font-stretch: 112.5%`, weight 800/760/700, `line-height: 1.08`, `letter-spacing: -0.01em`, `text-wrap: balance` |
| Body | Archivo | `1.0625rem`, `line-height: 1.6`, `font-stretch: 100%`, measure 64ch |
| Field names, eyebrows, container names | IBM Plex Mono 500 | `0.8125rem`, letter-spaced, `--vkc-graphite` — the label's printed field, never ALL-CAPS |

`h1` is `clamp(2rem, 1.35rem + 3.4vw, 3.5rem)`; `h2` is
`clamp(1.5rem, 1.2rem + 1.6vw, 2.25rem)`.

## Fonts — self-hosted, OFL

| File | Face | Licence |
|---|---|---|
| `brand/fonts/web/Archivo-latin-wdth-wght.woff2` | Archivo variable pinned to the ranges the site uses (wdth 100–112.5, wght 400–800), latin subset; rebuilt by `scripts/subset-fonts.py` | `brand/fonts/OFL-Archivo.txt` |
| `brand/fonts/web/IBMPlexMono-latin-500.woff2` | IBM Plex Mono 500, latin subset | `brand/fonts/OFL-IBMPlexMono.txt` |
| `brand/fonts/web/IBMPlexMono-latin-400.woff2` | IBM Plex Mono 400 (not currently loaded) | same |
| `brand/fonts/ttf/Archivo[wdth,wght].ttf` | Archivo variable, full | same as Archivo |
| `brand/fonts/ttf/IBMPlexMono-{Regular,Medium}.ttf` | Plex Mono statics | same as Plex |
| `brand/fonts/ttf/static/` | Archivo static instances | same as Archivo |

Both families are SIL Open Font License 1.1, which permits embedding the
rendered glyphs in a video. **The TTFs exist for the video run**: `next/font`
serves the woff2 to browsers, ffmpeg/After Effects need the TTF. The OG image
route reads the static TTFs at build time — `next.config.ts` traces
`brand/fonts/ttf/static/*.ttf` into the function bundle.

Loaded in `src/app/fonts.ts` with `next/font/local`, `display: swap`, and a
system fallback. Only the latin subset ships: French needs no more.

## Wordmark

`brand/wordmark.svg` is the single source: "VKC" set in Archivo Heavy Expanded
and "Packaging" in Archivo Medium beside it, converted to outlines (opentype.js)
so the mark needs no font at render time. `viewBox="-1 -75 783 95"`, one `<path>`
per glyph, `fill="currentColor"`, `<title>VKC Packaging</title>`. Typographic
only — no mascot, no icon-logo, no gradient.

```bash
npm run brand:sync   # regenerates src/components/wordmark-data.ts from the SVG
```

`src/components/wordmark.tsx` renders those paths inline with
`fill="currentColor"`, so the wordmark inverts with the theme and costs no
request. It is `aria-hidden`: the link around it carries the name.

## Rules

- One accent colour. If something needs a second, it needs a reason first.
- Borders are `1.5px` ink, not shadows. No card shadows, no gradient washes.
- A section opens with the fill rule, not with a coloured band.
- Placards are label-shaped: a heading row, then `dt`/`dd` field rows separated
  by hairlines. The mono field name is the label's printed caption.
- Sentence case everywhere, including buttons and eyebrows. No ALL-CAPS.
- No "→" appended to buttons, no middle-dot meta strings, no fade-slide
  entrances, no accented word inside a headline.
- Media sits inside the label rule (1.5px ink, 2px corner) and covers its
  box; the box is reserved by its aspect ratio so nothing shifts. A video is a
  silent loop with a still of the same shot as its poster, a Play / Pause
  label in the corner, and it never plays under `prefers-reduced-motion`. No
  text baked into an image; the caption is set in the mono field face.
- Motion: one easing, CSS only, and only where it draws the fill rule. The
  fill-rule tick draws as a section scrolls into view, the header's own rule
  fills from its tick to the content's right edge as the page is read, the
  shift bar fills as it scrolls into view, and the hero gauge fills once on
  load. Everything sits behind `prefers-reduced-motion: reduce`, where the
  header keeps only its tick. No fade-slide entrances, no parallax, no
  per-element timers, no JavaScript in any of it (run 2, DESIGN-DECISIONS
  §10; run 4, §12).
- Negative print: one block per page may be set in the other scheme's tokens
  (`.vkc-negative` in `tokens.css`), the way a warning label prints white on
  black. The six colours swap as a set, so the accent, the rules and the text
  keep their contrast inside it. On this site it is the closing call to
  action, and nothing else.
- Placards hold facts; rules point somewhere. A set of pages is offered as
  ruled rows (a manifest) or ruled cells, never as a grid of boxes. A group
  of facts that belong together prints as one label with several fields
  side by side (the container families), not as several labels.
- Eyebrows are information, not furniture. The page hero carries one; a
  section carries one only when the mono label says something the heading
  does not ("Straight talk"). The fill rule opens a section; the eyebrow's
  tick does not repeat it. The quote form's three legends keep theirs: each
  opens a group of the form, which is a label of its own.
