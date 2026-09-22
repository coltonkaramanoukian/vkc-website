# Handoff to the video run

Everything the video run reads from this repo, with the rule attached to each.
The site is deployed and does not need the video: while `media.json` is null,
no `<video>` element is rendered anywhere (NC-6b proves it).

## What the video run owns, and only it

`content/media.json` — RESERVED (CLAUDE.md §2). No other run writes a value
into it. Exact schema, shipped all-null:

```json
{
  "demo": {
    "fr": { "landscape": null, "portrait": null, "landscapePoster": null, "portraitPoster": null },
    "en": { "landscape": null, "portrait": null, "landscapePoster": null, "portraitPoster": null }
  }
}
```

- Values are absolute paths under `/public/video/…` (e.g. `/video/demo-fr-16x9.mp4`).
  Posters are images under the same root.
- Per locale, the component uses `portrait` (9:16) on narrow viewports and
  `landscape` (16:9) on wide ones. Fill both per locale, or fill neither.
- The player renders `preload="none"`, `muted`, `playsinline`, `controls`, and
  a poster. It never autoplays with sound. See `src/components/demo-video.tsx`.
- Where it renders: the home page and `/visit`, above the fold on `/visit`.
- NC-6 (`scripts/nc/nc6-placeholders-media.sh`) is the test: it sets
  `demo.en.landscape`, proves a `<video preload="none">` appears on `/en/visit`
  only, and reverts. Run it after filling the file for real.
- `grep` rule the same NC enforces: no `<img src>` or `<video src>` in the build
  may point outside `/photos/`, `/video/`, `/qr/` or `/brand/`. Self-hosted
  only: no YouTube, no Vimeo (D11).

## Brand and type

| Path | What it is |
|---|---|
| `brand/BRAND.md` | The tokens, the type roles, the rules. Read this first. |
| `brand/tokens.css` | The six colours + dark set, border/radius/measure, the Archivo width axis. Framework-agnostic CSS custom properties. |
| `brand/wordmark.svg` | The wordmark, outlined. `viewBox="-1 -75 783 95"`, `fill="currentColor"`. |
| `brand/fonts/ttf/Archivo[wdth,wght].ttf` | Archivo variable — **use this for video**, not the woff2. |
| `brand/fonts/ttf/static/*.ttf` | Archivo static instances, for tools that can't do variable axes. |
| `brand/fonts/ttf/IBMPlexMono-{Regular,Medium}.ttf` | Plex Mono, for field-name captions. |
| `brand/fonts/web/*.woff2` | What the site serves. Not for video. |
| `brand/fonts/OFL-Archivo.txt`, `brand/fonts/OFL-IBMPlexMono.txt` | SIL OFL 1.1 — permits embedding rendered glyphs in a video. Ship the licence with any redistribution. |

`npm run brand:sync` regenerates `src/components/wordmark-data.ts` from the SVG.
Edit the SVG, never the generated file.

## Content files (classes, CLAUDE.md §2)

| File | Class | Rule |
|---|---|---|
| `content/site.json` | seeded | `baseUrl`, `brandName`, `legalName`. Changing `baseUrl` means rerunning `npm run qr` (docs/DOMAIN.md). |
| `content/services.json` | seeded | The two service names, where each happens, and the summary. Rename here and every string follows: copy says `{ss}` / `{bn}`. |
| `content/containers.json` | seeded | Container family names and the two fill methods. Names only, no quantities. |
| `content/taglines.json` | seeded | Three FR/EN pairs + `default`. Each carries its `reading`. |
| `content/contact.json` | NULL AT BIRTH | Colton only. |
| `content/capabilities.json` | NULL AT BIRTH | Colton only. The only numbers allowed on the site. |
| `content/clients.json` | NULL AT BIRTH | Colton only. `approved: true` or it never renders. |
| `content/photos.json` | NULL AT BIRTH | Colton only. Ten slots, each with an `intent` line. |
| `content/media.json` | RESERVED | The video run only. |

Copy lives in `i18n/messages/{fr,en}.json` and deliberately NOT under
`content/`: the number guard allows any number found in `content/`, so prose
must not live there.

## Guards the video run can reuse

`guard/lib.ts` — plain functions over plain text, no HTML, no DOM:

```
normalizeText, phrasePattern, containsPhrase,
findStaffingTerms(text, terms, locale)      → TermHit[]
checkRequiredFacts(text, required, locale)  → FactResult[]
mentionsService(text, names)                → boolean
normalizeNumber, extractNumbers, collectStrings,
buildAllowedNumbers(contentObjects, allowlist) → Set<string>
findInventedNumbers(text, allowed)          → NumberHit[]
```

Data files: `guard/staffing-terms.json` (the D16 term list, per locale) and
`guard/second-shift-required.json` (the four facts as phrase-sets: allOf of
anyOf, matched accent- and case-insensitively on word boundaries).

**A script narrating Second Shift is a D16 surface.** Run the narration text
through `findStaffingTerms` and `checkRequiredFacts` before recording: the same
four facts must be present, and none of the staffing terms may appear. A video
that says "extra hands" undoes what the whole site is written to avoid
(CLAUDE.md §4).

## The door route and the QR

`/v` → 307 to `/fr/visite` or `/en/visit` by `Accept-Language`, FR by default.
`public/qr/v.svg` encodes `<baseUrl>/v` at error-correction level Q.

```bash
npm run qr                          # regenerate after any baseUrl change
./scripts/nc/nc8-door-qr.sh <base>  # decodes it with zbarimg and proves the string
```

## Commands

```bash
npm run dev            npm run build          npm run test
npm run render         # capture every route (JS disabled) into .render/
npm run guard:staffing npm run guard:numbers  npm run guard:fr
npm run census         npm run check:hreflang npm run check:locale-switch
npm run shots          npm run lighthouse     npm run first-load-js
npm run proof:parity   # production vs a local build of the same SHA
```
