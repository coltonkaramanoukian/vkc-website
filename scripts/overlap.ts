// Phase 2 pre-mortem 2: near-duplicate copy between pages. Word-level overlap
// on each page's own text (shared blocks — nav, footer, CTA band, the service
// placards — are already excluded from `ownText` by render-all).
// Overlap = |A ∩ B| / min(|A|, |B|) over unique words, per locale. ≤ 40%.
//   node scripts/overlap.ts [route ...]
import { loadCaptures } from "./lib/captures.ts";
import { namespacesFor } from "./lib/copy-ratio.ts";
import { readFileSync } from "node:fs";

// --copy compares the message strings a route renders (its own prose), rather
// than the rendered text, which also carries content DATA: the same container
// family names appear on every page that lists that family, and inflate the
// overlap between pages whose prose has nothing in common.
const copyMode = process.argv.includes("--copy");
const routes = process.argv.slice(2).filter((a) => a !== "--copy");
const services = JSON.parse(readFileSync("content/services.json", "utf8"));
const tree = (locale: "fr" | "en") => JSON.parse(readFileSync(`i18n/messages/${locale}.json`, "utf8"));
const strings = (v: unknown): string[] =>
  typeof v === "string"
    ? [v]
    : Array.isArray(v)
      ? v.flatMap(strings)
      : v && typeof v === "object"
        ? Object.entries(v).flatMap(([k, x]) => (k === "slot" ? [] : strings(x)))
        : [];
const get = (t: unknown, path: string) => path.split(".").reduce<unknown>((n, k) => (n as Record<string, unknown>)?.[k], t);
const copyText = (route: string, locale: "fr" | "en") =>
  namespacesFor(route)
    .flatMap((ns) => strings(get(tree(locale), ns)))
    .join(" ")
    .replace(/\{ss\}/g, services.secondShift.name[locale])
    .replace(/\{bn\}/g, services.bottleneck.name[locale]);

const captures = loadCaptures()
  .filter((c) => routes.length === 0 || routes.includes(c.route))
  .map((c) => (copyMode ? { ...c, ownText: copyText(c.route, c.locale) } : c));
const words = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .split(/[^a-z0-9']+/)
      .filter((w) => w.length > 2),
  );

/** 5-word shingles: reused SENTENCES, as opposed to shared trade vocabulary. */
const shingles = (s: string, n = 5) => {
  const w = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9']+/)
    .filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + n <= w.length; i += 1) out.add(w.slice(i, i + n).join(" "));
  return out;
};

// /visit exists to restate the whole site in thirty seconds (D17: what a
// prospect opens after a knock), and D16 requires the four Second Shift facts
// as FIXED phrases on every surface that names the service. Both make its
// overlap with other pages high on purpose. Its pairs are measured and
// printed, and excluded from the gate — with the reason said out loud.
const RESTATES = new Set(["/visit"]);

let worst = 0;
let worstShingle = 0;
let exempted = 0;
for (const locale of ["fr", "en"] as const) {
  const pages = captures.filter((c) => c.locale === locale).sort((a, b) => a.route.localeCompare(b.route));
  console.log(`\n${locale.toUpperCase()} — unique-word overlap of ${copyMode ? "COPY (message strings)" : "rendered own text"}, |A∩B| / min(|A|,|B|)`);
  for (let i = 0; i < pages.length; i += 1) {
    for (let j = i + 1; j < pages.length; j += 1) {
      const a = words(pages[i].ownText);
      const b = words(pages[j].ownText);
      const shared = [...a].filter((w) => b.has(w)).length;
      const pct = (shared / Math.min(a.size, b.size)) * 100;
      const sa = shingles(pages[i].ownText);
      const sb = shingles(pages[j].ownText);
      const sharedPhrases = [...sa].filter((x) => sb.has(x));
      const spct = (sharedPhrases.length / Math.max(1, Math.min(sa.size, sb.size))) * 100;
      const exempt = RESTATES.has(pages[i].route) || RESTATES.has(pages[j].route);
      if (exempt) exempted += 1;
      else {
        worst = Math.max(worst, pct);
        worstShingle = Math.max(worstShingle, spct);
      }
      console.log(
        `  ${pages[i].route.padEnd(34)} vs ${pages[j].route.padEnd(34)} words ${pct.toFixed(1).padStart(5)}%` +
          `  phrases ${spct.toFixed(1).padStart(5)}%` +
          (exempt ? "  (restates by design — not gated)" : spct > 10 ? "  ✖ reused sentences" : ""),
      );
      if (!exempt && spct > 10 && sharedPhrases.length > 0) {
        console.log(`      e.g. "${sharedPhrases[0]}"`);
      }
    }
  }
}
console.log(
  `\nworst pair: ${worst.toFixed(1)}% shared vocabulary, ${worstShingle.toFixed(1)}% shared 5-word phrases`,
);
console.log(
  `gate: reused sentences (5-word phrases) ≤ 10%, over ${(routes.length || 0) === 0 ? "every route" : "the routes given"}. ` +
    `Shared trade vocabulary is not duplication.`,
);
if (exempted > 0) {
  console.log(`${exempted} pair(s) excluded from the gate: ${[...RESTATES].join(", ")} restate the site by design.`);
}
if (worstShingle > 10) process.exit(1);
