// D10 / DONE #8: every page's hreflang alternates are FETCHED, not assumed.
// A link you never fetched is a claim, not a check.
//   node scripts/hreflang.ts [--base http://localhost:3109] [--header "k: v"]
// The rendered hrefs are absolute (content/site.json baseUrl); --base swaps
// that origin so the same links can be checked locally or on a preview.
import { readFileSync } from "node:fs";
import { loadCaptures } from "./lib/captures.ts";
import { localizedPath, locales, routes, type AppPathname } from "./lib/routes.ts";

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const site = JSON.parse(readFileSync("content/site.json", "utf8")) as { baseUrl: string };
const base = flag("--base", site.baseUrl).replace(/\/$/, "");
const headerArg = args.includes("--header") ? flag("--header", "") : "";
const headers: Record<string, string> = headerArg
  ? { [headerArg.split(":")[0].trim()]: headerArg.slice(headerArg.indexOf(":") + 1).trim() }
  : {};

const captures = loadCaptures();
const failures: string[] = [];
const expected = routes.length * locales.length;
if (captures.length < expected) failures.push(`scanned ${captures.length} pages, expected ${expected}`);

const local = (href: string) => base + new URL(href).pathname;
const seen = new Map<string, number>();
let fetched = 0;

console.log(`hreflang: ${captures.length} pages, alternates fetched from ${base}`);
for (const capture of captures.sort((a, b) => a.path.localeCompare(b.path))) {
  const tags = capture.alternates.map((a) => a.hreflang).sort();
  const want = ["en-CA", "fr-CA", "x-default"];
  if (JSON.stringify(tags) !== JSON.stringify(want)) {
    failures.push(`${capture.path}: hreflang set is [${tags}], expected [${want}]`);
  }
  for (const { hreflang, href } of capture.alternates) {
    const locale = hreflang === "en-CA" ? "en" : "fr";
    const wantPath = localizedPath(locale, capture.route as AppPathname);
    if (new URL(href).pathname !== wantPath) {
      failures.push(`${capture.path}: ${hreflang} points at ${new URL(href).pathname}, expected ${wantPath}`);
    }
    const url = local(href);
    const cached = seen.get(url);
    const status = cached ?? (await fetch(url, { headers, redirect: "manual" })).status;
    if (cached === undefined) {
      seen.set(url, status);
      fetched += 1;
    }
    if (status !== 200) failures.push(`${capture.path}: ${hreflang} → ${url} returned ${status}`);
  }
  // The canonical is the page's own URL.
  if (capture.canonical && new URL(capture.canonical).pathname !== capture.path) {
    failures.push(`${capture.path}: canonical is ${capture.canonical}`);
  }
  console.log(`  ${capture.path.padEnd(40)} ${capture.alternates.length} alternates  canonical ok`);
}

console.log(`\n${captures.length * 3} alternate links, ${fetched} distinct URLs fetched, all 200 expected`);
if (failures.length > 0) {
  console.log(`RED — ${failures.length} failure(s):`);
  for (const f of failures) console.log(`  ✖ ${f}`);
  process.exit(1);
}
console.log("GREEN — every hreflang alternate resolves 200 and points at the mapped slug");
