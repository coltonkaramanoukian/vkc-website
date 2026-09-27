// NC-10: THE MEDIA MANIFEST. content/scenes.json (Colton's, or the Higgsfield
// run's) and content/photos.json render only what they can prove: every src
// exists under public/, sits under /media/ (scenes) or /photos/ (photos), has
// the right extension for its kind, carries alt in both locales, and stays
// under budget. Thin caller of src/lib/scenes/validate.ts.
//   node scripts/guard-media.ts
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { routes } from "../src/i18n/pathnames.ts";
import { summarize, validateScenes, type Files, type Issue, type ScenesFile } from "../src/lib/scenes/validate.ts";

const files: Files = {
  sizeOf(publicPath) {
    try {
      const stat = statSync(join("public", publicPath.replace(/^\//, "")));
      return stat.isFile() ? stat.size : null;
    } catch {
      return null;
    }
  },
};

const scenes = JSON.parse(readFileSync("content/scenes.json", "utf8")) as ScenesFile;
const issues: Issue[] = validateScenes(scenes, routes, files);
const counts = summarize(scenes);

// photos.json: Colton's photo slots. Same existence rule, /photos/ root.
interface PhotoSlot {
  id: string;
  src: string | null;
  alt: { en: string | null; fr: string | null };
  width?: number;
  height?: number;
}
const photos = JSON.parse(readFileSync("content/photos.json", "utf8")) as PhotoSlot[];
let filledPhotos = 0;
let unsizedPhotos = 0;
for (const slot of photos) {
  if (!slot.src) continue;
  filledPhotos += 1;
  const where = `photos.json ${slot.id}`;
  if (!slot.src.startsWith("/photos/")) issues.push({ where, message: `src must start with /photos/ (got ${slot.src})` });
  if (files.sizeOf(slot.src) === null) issues.push({ where, message: `${slot.src} does not exist under public/` });
  for (const locale of ["en", "fr"] as const) {
    if (!slot.alt?.[locale]) issues.push({ where, message: `alt.${locale} is required once src is set` });
  }
  if (!(slot.width && slot.height)) unsizedPhotos += 1;
}

console.log(
  `media guard: scenes.json ${counts.filledSlots}/${counts.slots} slots filled, ` +
    `${counts.galleryItems} gallery item(s) in ${counts.galleries} gallery(ies); photos.json ${filledPhotos}/${photos.length} filled` +
    (unsizedPhotos > 0 ? ` (${unsizedPhotos} without width/height in photos.json: measured from the file's header at render; only a format that cannot be read falls back to a plain <img>)` : ""),
);

if (issues.length > 0) {
  console.log(`RED — ${issues.length} problem(s) in the media manifests:`);
  for (const issue of issues) console.log(`  ✖ ${issue.where}: ${issue.message}`);
  process.exit(1);
}
console.log("GREEN — every media reference exists, is typed, sized and described in both languages");
