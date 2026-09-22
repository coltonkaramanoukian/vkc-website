// §6(b), the achievable form. Two builds of one SHA do NOT produce byte-equal
// HTML: Vercel's build chunks the RSC stream differently, emits assets under
// different names and hashes, and places one <meta> in a different order. What
// CAN be proven, and is stronger than diffing two pages, is that production
// serves the same PAGE — every page, both locales.
//
// Renders every route from both origins with JS disabled and compares the
// capture fields that carry content. Paths are identical by construction.
//   node scripts/proof-parity.ts --prod https://… --local http://localhost:3121
import { readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import type { PageCapture } from "./render-all.ts";

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const site = JSON.parse(readFileSync("content/site.json", "utf8")) as { baseUrl: string };
const prod = flag("--prod", site.baseUrl).replace(/\/$/, "");
const local = flag("--local", "http://localhost:3121").replace(/\/$/, "");

const render = (base: string, out: string) => {
  execFileSync("node", ["scripts/render-all.ts", "--base", base, "--out", out], { stdio: "inherit" });
  return readdirSync(out).map((f) => JSON.parse(readFileSync(`${out}/${f}`, "utf8")) as PageCapture);
};

const COMPARED: (keyof PageCapture)[] = [
  "status", "title", "meta", "canonical", "jsonLd", "bodyText", "mainText", "ownText",
  "attrText", "guardSurfaces", "localeSwitch", "imgSrcs", "videoSrcs", "placeholderCount",
  "emptyPhotoWrappers",
];

const liveCaps = render(prod, ".render-prod");
const localCaps = render(local, ".render-local");
const failures: string[] = [];
if (liveCaps.length !== localCaps.length) failures.push(`page counts differ: ${liveCaps.length} vs ${localCaps.length}`);

for (const live of liveCaps.sort((a, b) => a.path.localeCompare(b.path))) {
  const mine = localCaps.find((c) => c.path === live.path);
  if (!mine) {
    failures.push(`${live.path}: missing from the local render`);
    continue;
  }
  const differing = COMPARED.filter((k) => JSON.stringify(live[k]) !== JSON.stringify(mine[k]));
  // Alternates are absolute: compare the paths, since the origins differ.
  const paths = (c: PageCapture) => c.alternates.map((a) => `${a.hreflang}=${new URL(a.href).pathname}`);
  if (JSON.stringify(paths(live)) !== JSON.stringify(paths(mine))) differing.push("alternates");
  console.log(`  ${live.path.padEnd(40)} ${differing.length === 0 ? "identical" : `DIFFERS: ${differing.join(", ")}`}`);
  for (const key of differing) failures.push(`${live.path}: ${key} differs`);
}

console.log(`\n${liveCaps.length} pages compared, ${COMPARED.length + 1} fields each`);
if (failures.length > 0) {
  console.log(`RED — ${failures.length} difference(s):`);
  for (const f of failures) console.log(`  ✖ ${f}`);
  process.exit(1);
}
console.log(`GREEN — production (${prod}) serves the same content as a local build of this SHA`);
