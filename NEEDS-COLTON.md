# Needs Colton

Everything the site is waiting on that an agent must not do. Run 2
(2026-09-27) kept building past each of these; nothing below blocks the code.
Each item says what is missing, where it goes, and what appears once it is done.

## 1. Ship runs 2 and 3 to production

`main` is past the production build by every run 2 and run 3 pull request
(fourteen in all: design system through `/glossary`). Production only
deploys through `vercel --prod` (`vercel.json` disables auto-deploy of `main`),
and pushing a public site is your call, not an agent's.

```bash
cd "$HOME/Desktop/vkc-website" && git checkout main && git pull
npm run build && vercel --prod
```

Then the §6 proof: `vercel inspect <url>` SHA equals `git rev-parse HEAD`;
`npm run proof:parity -- --prod https://vkc-website-zeta.vercel.app`;
`npm run census -- --base https://vkc-website-zeta.vercel.app`;
`npm run lighthouse` (it measures production by default).

## 2. The quote form cannot send yet

The form works end to end (NC-5 proves it against a mock) but production has
no email provider. Until the three variables are set on Vercel the form shows
"Email is not set up on this site yet" and nothing is lost silently, but
nothing is delivered either.

| Variable | What it is |
|---|---|
| `RESEND_API_KEY` | A Resend API key (resend.com, free tier is enough for a quote form) |
| `QUOTE_TO_EMAIL` | The inbox that receives requests |
| `QUOTE_FROM_EMAIL` | A sender on a domain verified in Resend |

Set them with `vercel env add <NAME> production`, then redeploy. Signing up for
Resend is a signup an agent must not do (CLAUDE.md §6).

## 3. Content that renders nothing until you fill it

`docs/CONTENT-INTAKE.md` lists every field as `file:field`. The short version:

- **`content/contact.json`**: phone, email, address, hours, privacy officer.
  Phone is the one that changes the site most: "Call …" appears beside every
  quote button, in the footer, in the phone action bar, on the quote, visit
  and contact pages, and in the form's fallback message. The `/contact` page
  is form-only until this file has at least one of phone, email, address or
  hours; then its details placard appears and its lead changes.
- **`content/capabilities.json`**: run sizes, fill sizes, viscosity range,
  batch sizes, lead time, equipment, and the Second Shift crew / shifts /
  commitment / insurance lines. These are the ONLY numbers the site may print.
- **`content/photos.json`**: ten slots, each with an `intent` line. No stock,
  no generated, no third-party images.
- **`content/clients.json`**: names and logos, `approved: true` only with a
  written yes from the client.

After editing: `npm run build`, `npm run render`, `npm run guard:numbers`,
`npm run guard:claims`, then `vercel --prod`.

## 4. The lawyer's answer on Second Shift wording (CLAUDE.md §4)

Every Second Shift surface carries the four facts and none of the staffing
terms, and `npm run guard:staffing` proves the wording. Whether the wording is
enough is the lawyer's call. Until that answer arrives, no run may loosen §4.
If the answer changes the required phrasing, the phrase-sets live in
`guard/second-shift-required.json` and `guard/staffing-terms.json`.

## 5. Domain

`docs/DOMAIN.md` has the steps. Buying, DNS and attaching the custom domain are
yours. After the base URL changes, the QR must be regenerated and re-proven
(`npm run qr`, NC-8) before anything is printed.

## 6. Vercel plan

The project is on Hobby (run 1's log, 2026-09-22). Vercel's own FAQ says Hobby
is for personal, non-commercial use. A plan change is a paid action an agent
must not take.

## 7. Video (the video run's file)

`content/media.json` is reserved for the video run; the demo video slot on
`/visit` renders nothing until that run fills it.

## 8. Higgsfield: where generated media plugs in

Built in run 3 (2026-09-27), nothing filled. The seam is one file and one
folder:

- **`content/scenes.json`** — thirteen covers (one per page, each with an
  `intent` line and an `aspect`) and two galleries (home, about). Set `kind`
  (`image` or `video`), `src`, `alt.en`, `alt.fr`; a video also needs `poster`.
  Optional `caption` and a `portrait` variant for phones.
- **`public/media/`** — where the files go. Paths in the manifest start with
  `/media/`. Budgets: image 600 kB, poster 300 kB, video 12 MB. Prefer `.webp`
  or `.avif` for stills and `.mp4` (H.264, silent) for loops; keep loops short.
- **`npm run guard:media`** before every build: it fails on a missing file, a
  wrong extension, a video without a poster, or alt missing in either
  language. NC-10 (`scripts/nc/nc10-media.sh`) shows it failing and passing.
- Preview the slots before filling them: `dev-placeholders` in
  `.claude/launch.json` (or `NEXT_PUBLIC_SHOW_PLACEHOLDERS=1 npm run dev`)
  draws every empty slot as a dashed box with its intent.

Two things only you can do first:

1. **Amend CLAUDE.md §1.** It reads "No stock, generated or third-party
   imagery". Generated covers need that line changed (for example: "generated
   media renders only from `content/scenes.json`, marked as such where it
   appears"). A run will not loosen §1 on its own.
2. **Decide what a generated scene may depict.** The `intent` lines describe
   a floor, containers and equipment with nobody identifiable and no customer
   branding. Anything showing a real customer's plant or product needs their
   written OK (`photos.json` has the same rule).

Not built, on purpose: no Higgsfield API call, no upload endpoint, no CMS.
Generated files are committed like any other asset and go live with the next
`vercel --prod`.

## Things that look like problems and are not

- **Lighthouse best-practices 96 on a local build.** The only failing audit is
  a 404 for `/_vercel/insights/script.js`, which exists on Vercel and not on
  `next start`. Re-measure on production after item 1 (`npm run lighthouse`).
- **`npm run overlap:rendered` is red.** Rendered text carries content data
  (container family names) that repeats on every page that lists them. The
  gate is the copy-mode measurement, `npm run overlap`, which is green. See
  `docs/DESIGN-DECISIONS.md` §10.
- **`npm run check:hreflang` against production is red until item 1 ships.**
  It fetches the alternates from production, which does not yet have the
  hub pages, `/contact` or `/glossary`. Against a local build
  (`--base http://localhost:3100`) it is 40/40.
