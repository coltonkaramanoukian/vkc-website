# Content intake — every field the site is waiting on

81 nulls across four files, plus one empty array, plus the media manifest
(`scenes.json`: thirteen empty covers and two empty galleries). Nothing here is
invented, and nothing renders until you fill it: a null field renders NOTHING —
no "TBD", no placeholder, no fabricated absence (CLAUDE.md §1).

**These five files are yours alone** (`contact`, `capabilities`, `clients`,
`photos`, `scenes`). `media.json` belongs to the video run. An agent writing a
value into any of them is a kill condition, so they will still be null when you
open them.

After editing any of these: `npm run build && vercel --prod`. No rebuild is
needed to check what you typed — run `npm run test` and `npm run guard:numbers`
after a render to prove nothing you added contradicts a guard.

## What appears the moment you fill it

| Fill this | And this appears |
|---|---|
| `contact.json:phone` | "Call …" beside every "Get a quote" button, the footer phone row, `telephone` in JSON-LD, and the phone in the form's unconfigured-email fallback |
| `contact.json:email` | The footer email row and `email` in JSON-LD |
| `contact.json:address.*` | The footer address block and `PostalAddress` in the LocalBusiness JSON-LD |
| `contact.json:hours.*` | The footer hours row; `hours.schema` feeds `openingHours` |
| `contact.json:privacyOfficer.*` | The privacy-contact placard on `/privacy`, which is empty today |
| `capabilities.json:*` | The Specifications placard on the matching service or container page |
| `clients.json` | The "Who we work for" section on `/about` — **only** for entries with `approved: true` |
| `photos.json:src` + `alt` | The photo in that page's slot (see the `intent` note on each slot). It renders through `next/image` (sized, no layout shift): the size is read from the file's header (PNG, JPEG, GIF, WebP), or from `width` and `height` if you add them |
| `scenes.json:slots[n]` | The page's cover: a still or a silent loop under the page head (home: under the hero, before the demo video) |
| `scenes.json:galleries[n].items` | A row of tiles on the home page (after the two services) or on `/about` (after the sections) |

## contact.json

```
content/contact.json:phone
content/contact.json:email
content/contact.json:address.street
content/contact.json:address.city
content/contact.json:address.province
content/contact.json:address.postalCode
content/contact.json:address.country
content/contact.json:hours.en
content/contact.json:hours.fr
content/contact.json:hours.schema
content/contact.json:serviceRadiusKm
content/contact.json:privacyOfficer.name
content/contact.json:privacyOfficer.title.en
content/contact.json:privacyOfficer.title.fr
content/contact.json:privacyOfficer.email
```

`serviceRadiusKm` is the one field with no UI yet: it exists so a future
"we serve X km around the plant" line has a fact to render from. The Laval and
Quebec pages were cut partly because it is null (docs/DESIGN-DECISIONS.md).

## capabilities.json

Every value is `{en, fr}`. Write both, in the trade's own words, with units —
these are the ONLY numbers allowed on the site (CLAUDE.md §1, NC-3).

```
content/capabilities.json:minimumRunSize.en
content/capabilities.json:minimumRunSize.fr
content/capabilities.json:maximumRunSize.en
content/capabilities.json:maximumRunSize.fr
content/capabilities.json:fillSizesOffered.en
content/capabilities.json:fillSizesOffered.fr
content/capabilities.json:viscosityRange.en
content/capabilities.json:viscosityRange.fr
content/capabilities.json:blendingBatchSizes.en
content/capabilities.json:blendingBatchSizes.fr
content/capabilities.json:leadTime.en
content/capabilities.json:leadTime.fr
content/capabilities.json:equipment.fillers.en
content/capabilities.json:equipment.fillers.fr
content/capabilities.json:equipment.cappers.en
content/capabilities.json:equipment.cappers.fr
content/capabilities.json:equipment.tijLidPrinters.en
content/capabilities.json:equipment.tijLidPrinters.fr
content/capabilities.json:equipment.scales.en
content/capabilities.json:equipment.scales.fr
content/capabilities.json:secondShift.crewSize.en
content/capabilities.json:secondShift.crewSize.fr
content/capabilities.json:secondShift.shiftsOffered.en
content/capabilities.json:secondShift.shiftsOffered.fr
content/capabilities.json:secondShift.minimumCommitment.en
content/capabilities.json:secondShift.minimumCommitment.fr
content/capabilities.json:secondShift.insurance.en
content/capabilities.json:secondShift.insurance.fr
```

## photos.json

Ten slots. Each already carries `id`, `page` and an `intent` line saying what
the photo should show. Fill `src` (a path under `/public/photos/…`) and `alt`
in both languages. No stock, no generated, no third-party images (CLAUDE.md §1).
A customer's plant or product needs their written OK before it goes up.

```
content/photos.json:[0].src
content/photos.json:[0].alt.en
content/photos.json:[0].alt.fr
content/photos.json:[1].src
content/photos.json:[1].alt.en
content/photos.json:[1].alt.fr
content/photos.json:[2].src
content/photos.json:[2].alt.en
content/photos.json:[2].alt.fr
content/photos.json:[3].src
content/photos.json:[3].alt.en
content/photos.json:[3].alt.fr
content/photos.json:[4].src
content/photos.json:[4].alt.en
content/photos.json:[4].alt.fr
content/photos.json:[5].src
content/photos.json:[5].alt.en
content/photos.json:[5].alt.fr
content/photos.json:[6].src
content/photos.json:[6].alt.en
content/photos.json:[6].alt.fr
content/photos.json:[7].src
content/photos.json:[7].alt.en
content/photos.json:[7].alt.fr
content/photos.json:[8].src
content/photos.json:[8].alt.en
content/photos.json:[8].alt.fr
content/photos.json:[9].src
content/photos.json:[9].alt.en
content/photos.json:[9].alt.fr
```

## clients.json

Ships as `[]`, which renders no section at all. Each entry is
`{"name": "…", "approved": true|false, "logo": "/photos/…" | null}`.
`approved: true` means they said yes, in writing, to being named on this site.
NC-1 proves an unapproved name never reaches the build.

## scenes.json (covers and galleries — the media manifest)

Thirteen slots (one per page) and two galleries, all empty. Each slot has an
`intent` line saying what it should show and an `aspect` ("21/9" on the home
cover, "16/9" elsewhere) that reserves the box before the file arrives.

```
content/scenes.json:slots[n].kind        "image" | "video"
content/scenes.json:slots[n].src         /media/… (.avif .webp .jpg .png | .mp4 .webm)
content/scenes.json:slots[n].poster      video only: a still of the same shot, /media/…
content/scenes.json:slots[n].alt.en      required once src is set
content/scenes.json:slots[n].alt.fr      required once src is set
content/scenes.json:slots[n].caption.*   optional, set in the mono field face under the frame
content/scenes.json:slots[n].portrait    optional { src, poster, aspect: "9/16" } for phones
content/scenes.json:galleries[n].items[] same shape as a slot; add items, never null ones
```

Rules the guard enforces (`npm run guard:media`, NC-10): the file exists under
`public/`, the path starts with `/media/`, the extension matches the kind, a
video has a poster, alt is written in both languages, and sizes stay under
budget (image 600 kB, poster 300 kB, video 12 MB). A page has one cover.

What the viewer gets: an image is served by `next/image` at the width the
viewport needs; a video is a muted loop that plays only while in view, never
under `prefers-reduced-motion` or reduced-data, with a Play / Pause label in
the corner. On Preview (`NEXT_PUBLIC_SHOW_PLACEHOLDERS=1`) an empty slot draws
a dashed box with its intent so you can see where each one lands.

**Before you fill this with generated media:** CLAUDE.md §1 currently bans
"stock, generated or third-party imagery". The seams are built; the rule
change is yours (`NEEDS-COLTON.md` item 8).

## media.json (the video run's file — do not fill by hand)

```
content/media.json:demo.fr.landscape
content/media.json:demo.fr.portrait
content/media.json:demo.fr.landscapePoster
content/media.json:demo.fr.portraitPoster
content/media.json:demo.en.landscape
content/media.json:demo.en.portrait
content/media.json:demo.en.landscapePoster
content/media.json:demo.en.portraitPoster
```
