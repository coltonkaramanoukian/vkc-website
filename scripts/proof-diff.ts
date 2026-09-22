// §6(b) deploy proof: /fr and /en fetched from production must match the same
// pages served by a local `next build && next start` of the same SHA.
//
// Two builds of one source do not produce the same asset FILE NAMES: Vercel's
// build emits fonts under media/ and CSS under chunks/, with different content
// hashes than a local Turbopack build. So the proof is done in two parts:
//   1. every /_next/static asset URL is replaced, in document order, by its
//      position (ASSET#n) — then the HTML must be byte-identical;
//   2. each of those assets is fetched from BOTH origins and compared by
//      sha256 — so the renamed files are proven identical, not waved through.
//   node scripts/proof-diff.ts --prod https://… [--port 3120]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { startServer, stopServer } from "./lib/server.ts";

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const site = JSON.parse(readFileSync("content/site.json", "utf8")) as { baseUrl: string };
const prod = flag("--prod", site.baseUrl).replace(/\/$/, "");
const port = Number(flag("--port", "3120"));

const ASSET = /\/_next\/static\/[^"'\\ ]+/g;

/** Asset URLs in document order (deduplicated, first occurrence wins). */
function assetUrls(html: string): string[] {
  const seen: string[] = [];
  for (const [url] of html.matchAll(ASSET)) if (!seen.includes(url)) seen.push(url);
  return seen;
}

/** Replace every asset URL by its position, plus the other per-build ids. */
function strip(html: string): string {
  const order = assetUrls(html);
  return html
    .replace(ASSET, (url) => `ASSET#${order.indexOf(url)}`)
    .replace(/"buildId":"[^"]+"/g, '"buildId":"BUILD"')
    .replace(/[?&]dpl=[^"'&]+/g, "")
    .replace(/\bdpl_[A-Za-z0-9]+/g, "DPL")
    .trim();
}

const sha256 = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return `HTTP_${res.status}`;
  const digest = await crypto.subtle.digest("SHA-256", await res.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

const { base, child } = await startServer(port);
mkdirSync("artifacts/proof", { recursive: true });
let differences = 0;

for (const path of ["/fr", "/en"]) {
  const [live, local] = await Promise.all([
    fetch(prod + path).then((r) => r.text()),
    fetch(base + path).then((r) => r.text()),
  ]);
  const a = strip(live);
  const b = strip(local);
  writeFileSync(`artifacts/proof/prod${path.replace("/", "-")}.html`, a);
  writeFileSync(`artifacts/proof/local${path.replace("/", "-")}.html`, b);

  // 2. the assets themselves, position by position
  const urls = { live: assetUrls(live), local: assetUrls(local) };
  let assetsMatch = urls.live.length === urls.local.length;
  const mismatched: string[] = [];
  for (let i = 0; i < Math.min(urls.live.length, urls.local.length); i += 1) {
    const [x, y] = await Promise.all([sha256(prod + urls.live[i]), sha256(base + urls.local[i])]);
    if (x !== y) {
      assetsMatch = false;
      mismatched.push(`ASSET#${i} ${urls.live[i]} (${x.slice(0, 8)}) vs ${urls.local[i]} (${y.slice(0, 8)})`);
    }
  }
  console.log(
    `${path}: ${urls.live.length} static assets, sha256 ${assetsMatch ? "identical" : "DIFFERENT"}` +
      (mismatched.length > 0 ? `\n  ${mismatched.join("\n  ")}` : ""),
  );
  if (!assetsMatch) differences += 1;

  // 1. the HTML around them
  const same = a === b;
  console.log(
    `${path}: production ${live.length} bytes, local ${local.length} bytes → stripped diff ${same ? "EMPTY" : "NOT EMPTY"}`,
  );
  if (!same) {
    differences += 1;
    const lines = { a: a.split(">"), b: b.split(">") };
    for (let i = 0; i < Math.max(lines.a.length, lines.b.length); i += 1) {
      if (lines.a[i] !== lines.b[i]) {
        console.log(`  first difference at chunk ${i}:`);
        console.log(`    production: ${String(lines.a[i]).slice(0, 200)}`);
        console.log(`    local     : ${String(lines.b[i]).slice(0, 200)}`);
        break;
      }
    }
  }
}

await stopServer(child);
if (differences > 0) {
  console.log(`RED — ${differences} check(s) failed`);
  process.exit(1);
}
console.log("GREEN — identical HTML and identical static assets on both origins");
