# Media slots: where each image lands

The contract between the site and whoever fills `content/scenes.json`
(Colton, or the Higgsfield run he connects). Written 2026-09-27, run 5,
after the navigation fix and before the page reorder; the reorder moves
sections on the home page but not one of these slots. The page structure
around every slot below is stable.

The manifest itself is `content/scenes.json` and is not edited by a build
run (CLAUDE.md §2). This file only says where each slot renders, how big,
and what makes a file valid. Nothing in it changes the manifest's shape.

## How a slot renders

- `src/components/scene.tsx` renders one slot as a `<figure class="scene">`
  with a `.scene-frame` box: aspect ratio reserved from `aspect` before the
  file arrives (no layout shift), 1.5px ink rule, 2px corner, floor-grey
  background. The file fills the frame (`object-fit: cover`), so compose
  with the centre safe and the edges expendable.
- `kind: "image"` renders through `next/image` (`fill`, `sizes` below,
  lazy except the home cover, which preloads). `kind: "video"` renders as a
  muted loop with its `poster` underneath and a Play / Pause label in the
  corner; under reduced motion only the poster shows.
- `alt.en` / `alt.fr` are required and become the image's alt text (or the
  video's label). `caption.en` / `caption.fr` are optional and print under
  the frame in the field-name style.
- `portrait` is optional: `{ "src", "poster", "aspect" }` shown instead of
  the main file below `md` (768px). Worth doing for the 21/9 home cover,
  which is 147px tall on a 375px phone without it.
- Every slot carries `data-scene-slot="<id>"` in the DOM, so a filled slot
  can be found and measured by id. With `NEXT_PUBLIC_SHOW_PLACEHOLDERS=1`
  (`dev-placeholders` in `.claude/launch.json`, port 3201) an empty slot
  draws a dashed box in place, at its final size, labelled with its id,
  aspect and intent.

## Files

- Paths start with `/media/` and live under `public/media/`.
- Images: `.avif`, `.webp`, `.jpg`, `.jpeg`, `.png`, at most 600 kB.
  Posters: same formats, at most 300 kB. Video: `.mp4` (H.264, silent) or
  `.webm`, at most 12 MB, short loops.
- Pixel sizes that serve a 2x screen without waste: a 16/9 cover at
  2304 x 1296, the 21/9 home cover at 2304 x 988, a 4/3 gallery tile at
  1152 x 864, a 9/16 portrait at 1080 x 1920.
- `npm run guard:media` proves the file before a build: it fails on a
  missing file, a wrong extension, a video without a poster, a file over
  budget, or alt missing in either language. NC-10
  (`scripts/nc/nc10-media.sh`) shows it failing and passing.
- Nothing baked into the picture: no text, no logo, no number, nobody
  identifiable, no customer branding. The picture may not state a fact the
  copy cannot (CLAUDE.md §1).

## The thirteen covers

`sizes="(min-width: 1152px) 1152px, 100vw"`. At 1280px and up the frame is
1152px wide (the page column); on a 375px phone it is the full width.

| id | Page (EN / FR) | Where it sits | Aspect | Frame at 1280 / 375 |
|---|---|---|---|---|
| `home-cover` | `/en` / `/fr` | Directly under the home hero (tagline and gauge), above the demo-video slot and the first fill rule | 21/9 | 1152 x 494 / 375 x 161 |
| `second-shift-cover` | `/en/services/second-shift` / `/fr/services/deuxieme-quart` | Between the page hero (h1, lead, quote button) and the "On this page" strip | 16/9 | 1152 x 648 / 375 x 211 |
| `contract-packaging-cover` | `/en/services/contract-packaging` / `/fr/services/conditionnement-a-forfait` | same position | 16/9 | same |
| `toll-blending-cover` | `/en/services/toll-blending` / `/fr/services/melange-a-facon` | same position | 16/9 | same |
| `bottles-and-jugs-cover` | `/en/containers/bottles-and-jugs` / `/fr/contenants/bouteilles-et-bidons` | same position | 16/9 | same |
| `pails-cover` | `/en/containers/pails` / `/fr/contenants/seaux` | same position | 16/9 | same |
| `kits-cover` | `/en/containers/kits` / `/fr/contenants/trousses` | same position | 16/9 | same |
| `cleaners-cover` | `/en/industries/cleaners` / `/fr/secteurs/produits-nettoyants` | same position | 16/9 | same |
| `lubricants-cover` | `/en/industries/lubricants` / `/fr/secteurs/lubrifiants` | same position | 16/9 | same |
| `sealers-and-coatings-cover` | `/en/industries/sealers-and-coatings` / `/fr/secteurs/scellants-et-revetements` | same position | 16/9 | same |
| `montreal-cover` | `/en/locations/montreal` / `/fr/regions/montreal` | same position | 16/9 | same |
| `about-cover` | `/en/about` / `/fr/a-propos` | same position | 16/9 | same |
| `visit-cover` | `/en/visit` / `/fr/visite` (the QR landing page, noindex) | Under the page's intro and demo-video slot, above the first fill rule | 16/9 | same |

The intent line for each is in `content/scenes.json` and is the brief for
the picture. The three hub pages (`/services`, `/containers`,
`/industries`), the glossary, contact, quote and privacy pages have no cover
slot by design.

## The two galleries

`sizes="(min-width: 768px) 384px, 85vw"`. Each item is a full slot object
(same fields as a cover, its own `aspect`; 4/3 or 1/1 reads best as a
tile). From `md` the tiles sit in a grid: one, two or three across, and
four tiles sit two by two; five or more wrap in rows of three. On a phone
they are a sideways strip that snaps, each tile 85% of the width.

| id | Page | Where it sits | Items |
|---|---|---|---|
| `home-floor` | home | After the two service placards (and their photo row), before "Which one fits?" | three to six stills |
| `about-floor` | `/about` | After the page's last section, before "Where this leads next" | as many as tell the place |

## Not for generated media

`content/photos.json` (ten `PhotoRow` slots: two on the home page, two on
Second Shift, one each on contract packaging, toll blending, the three
container pages and About) is for real photographs only (CLAUDE.md §1:
"Real photos render only from `content/photos.json`"). Leave it null.

## Checking a filled slot

1. `npm run guard:media` GREEN.
2. `npm run build && npx next start -p 3100`, then open the page: the frame
   is where the table says, the file fills it, the caption (if any) prints
   under it, and the phone width shows the portrait variant when one is set.
3. `npm run check:clicks -- --base http://localhost:3100` still GREEN: a
   filled slot adds no link and moves no anchor.
