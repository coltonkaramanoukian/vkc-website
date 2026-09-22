// NC-4 / D15: FR IS NOT A TRANSLATION OF EN.
//   1. A FR message value identical to EN (after resolving {ss}/{bn}) is a
//      defect unless its key is in i18n/identical-allowlist.json.
//   2. Per page, FR copy is within ±10% of EN in characters. The GATE is the
//      copy itself (the message strings the page renders); the rendered page
//      text is printed beside it as context, because it also carries content
//      data (container family names) that is not copy and is not translated.
// Key-set parity is printed as context only: it proves nothing.
import { readFileSync } from "node:fs";
import { loadCaptures } from "./lib/captures.ts";
import { copyRatios } from "./lib/copy-ratio.ts";
import { routes } from "./lib/routes.ts";

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

// The gate: the copy itself, per route.
const rendered = new Map<string, { en?: number; fr?: number }>();
for (const c of loadCaptures()) {
  const row = rendered.get(c.route) ?? {};
  row[c.locale] = c.ownText.length;
  rendered.set(c.route, row);
}

console.log("\nper-page FR/EN character ratio (gate: message copy; rendered text as context):");
console.log("  route".padEnd(38) + "EN".padStart(7) + "FR".padStart(8) + "FR/EN".padStart(8) + "  rendered FR/EN");
for (const { route, en: e, fr: f, ratio } of copyRatios(routes)) {
  const flag = ratio < 0.9 || ratio > 1.1 ? "  ✖ outside ±10%" : "";
  const r = rendered.get(route);
  const seen = r?.en && r?.fr ? (r.fr / r.en).toFixed(3) : "—";
  console.log(
    `  ${route.padEnd(36)}${String(e).padStart(7)}${String(f).padStart(8)}${ratio.toFixed(3).padStart(8)}  ${seen.padStart(14)}${flag}`,
  );
  if (flag) failures.push(`${route}: FR/EN copy = ${ratio.toFixed(3)} (EN ${e}, FR ${f})`);
}
const missingCapture = routes.filter((r) => !rendered.has(r));
if (missingCapture.length > 0) failures.push(`no render capture for: ${missingCapture.join(", ")}`);

if (failures.length > 0) {
  console.log(`\nRED — ${failures.length} failure(s):`);
  for (const f of failures) console.log(`  ✖ ${f}`);
  process.exit(1);
}
console.log("\nGREEN — no unallowlisted identical FR values; every page within ±10%");
