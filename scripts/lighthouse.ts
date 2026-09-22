// D12: Lighthouse MOBILE on home, services/second-shift and visit, both
// locales, three runs each, median reported. Measured on PRODUCTION: previews
// carry x-robots-tag noindex, which Lighthouse scores as an SEO failure.
//   node scripts/lighthouse.ts [--base https://…] [--runs 3]
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { localizedPath, locales, type AppPathname } from "./lib/routes.ts";

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const site = JSON.parse(readFileSync("content/site.json", "utf8")) as { baseUrl: string };
const base = flag("--base", site.baseUrl).replace(/\/$/, "");
const runs = Number(flag("--runs", "3"));
const out = flag("--out", "artifacts/lighthouse");
mkdirSync(out, { recursive: true });

const ROUTES: AppPathname[] = ["/", "/services/second-shift", "/visit"];
const THRESHOLD: Record<string, number> = {
  performance: 90,
  seo: 95,
  accessibility: 95,
  "best-practices": 90,
};
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const rows: { url: string; scores: Record<string, number>; noindex: boolean }[] = [];
for (const route of ROUTES) {
  for (const locale of locales) {
    const path = localizedPath(locale, route);
    const url = base + path;
    const perRun: Record<string, number>[] = [];
    for (let i = 0; i < runs; i += 1) {
      const json = execFileSync(
        "npx",
        ["lighthouse", url, "--quiet", "--output=json", "--output-path=stdout",
         "--chrome-flags=--headless=new --no-sandbox", "--only-categories=performance,accessibility,best-practices,seo"],
        { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
      );
      const report = JSON.parse(json) as { categories: Record<string, { score: number }> };
      perRun.push(Object.fromEntries(Object.entries(report.categories).map(([k, v]) => [k, Math.round(v.score * 100)])));
      writeFileSync(`${out}/${path.replace(/\//g, "_")}-run${i + 1}.json`, json);
    }
    const scores = Object.fromEntries(
      Object.keys(perRun[0]).map((k) => [k, median(perRun.map((r) => r[k]))]),
    );
    rows.push({ url: path, scores, noindex: route === "/visit" });
    console.log(
      `${path.padEnd(28)} ` +
        Object.entries(scores).map(([k, v]) => `${k} ${String(v).padStart(3)}`).join("  ") +
        `   (runs: ${perRun.map((r) => r.performance).join("/")} perf)`,
    );
  }
}

console.log(`\nthresholds: performance ≥90, seo ≥95 (not scored for /visit: noindex by design), accessibility ≥95, best-practices ≥90`);
const misses = rows.flatMap(({ url, scores, noindex }) =>
  Object.entries(scores)
    .filter(([k, v]) => v < THRESHOLD[k] && !(noindex && k === "seo"))
    .map(([k, v]) => `${url}: ${k} ${v} < ${THRESHOLD[k]}`),
);
if (misses.length > 0) {
  console.log(`BELOW THRESHOLD — ${misses.length}:`);
  for (const m of misses) console.log(`  ✖ ${m}`);
  process.exit(1);
}
console.log("GREEN — every median meets D12");
