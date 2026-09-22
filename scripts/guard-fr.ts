// NC-4 / D15: FR IS NOT A TRANSLATION OF EN.
//   1. A FR message value identical to EN (after resolving {ss}/{bn}) is a
//      defect unless its key is in i18n/identical-allowlist.json.
//   2. Per page, rendered FR main text is within ±10% of EN, in characters.
// Key-set parity is printed as context only: it proves nothing.
import { readFileSync } from "node:fs";
import { loadCaptures } from "./lib/captures.ts";

type Tree = Record<string, unknown>;
const en = JSON.parse(readFileSync("i18n/messages/en.json", "utf8")) as Tree;
const fr = JSON.parse(readFileSync("i18n/messages/fr.json", "utf8")) as Tree;
const services = JSON.parse(readFileSync("content/services.json", "utf8"));
const allow = JSON.parse(readFileSync("i18n/identical-allowlist.json", "utf8")) as {
  keys: { key: string; why: string }[];
};
const allowed = new Set(allow.keys.map((k) => k.key));

function flatten(tree: unknown, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (v: unknown, p: string) => {
    if (typeof v === "string") out.set(p, v);
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${p}[${i}]`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, p ? `${p}.${k}` : k);
  };
  walk(tree, prefix);
  return out;
}

const resolve = (s: string, locale: "en" | "fr") =>
  s.replace(/\{ss\}/g, services.secondShift.name[locale]).replace(/\{bn\}/g, services.bottleneck.name[locale]);

const enFlat = flatten(en);
const frFlat = flatten(fr);
const failures: string[] = [];

for (const [key, frValue] of frFlat) {
  const enValue = enFlat.get(key);
  if (enValue === undefined) continue;
  if (resolve(frValue, "fr") === resolve(enValue, "en") && !allowed.has(key)) {
    failures.push(`identical FR/EN value at "${key}": ${JSON.stringify(frValue)}`);
  }
}
const missingInFr = [...enFlat.keys()].filter((k) => !frFlat.has(k));
const missingInEn = [...frFlat.keys()].filter((k) => !enFlat.has(k));
for (const k of missingInFr) failures.push(`key missing in fr.json: ${k}`);
for (const k of missingInEn) failures.push(`key missing in en.json: ${k}`);

console.log(
  `key parity (context only, proves nothing): en ${enFlat.size} keys, fr ${frFlat.size} keys, ${allowed.size} allowlisted identical keys`,
);

// Per-page length ratio from what the reader sees.
const captures = loadCaptures();
const byRoute = new Map<string, { en?: number; fr?: number }>();
for (const c of captures) {
  const row = byRoute.get(c.route) ?? {};
  row[c.locale] = c.ownText.length;
  byRoute.set(c.route, row);
}
console.log("\nper-page FR/EN character ratio (main text, shared CTA band excluded):");
console.log("  route".padEnd(38) + "EN chars".padStart(9) + "FR chars".padStart(10) + "FR/EN".padStart(8));
for (const [route, { en: e = 0, fr: f = 0 }] of [...byRoute].sort()) {
  const ratio = e > 0 ? f / e : 0;
  const flag = ratio < 0.9 || ratio > 1.1 ? "  ✖ outside ±10%" : "";
  console.log(`  ${route.padEnd(36)}${String(e).padStart(9)}${String(f).padStart(10)}${ratio.toFixed(3).padStart(8)}${flag}`);
  if (flag) failures.push(`${route}: FR/EN = ${ratio.toFixed(3)} (EN ${e}, FR ${f})`);
}

if (failures.length > 0) {
  console.log(`\nRED — ${failures.length} failure(s):`);
  for (const f of failures) console.log(`  ✖ ${f}`);
  process.exit(1);
}
console.log("\nGREEN — no unallowlisted identical FR values; every page within ±10%");
