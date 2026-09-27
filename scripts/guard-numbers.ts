// NC-3: INVENTED NUMBERS. Every number a reader can see must come from
// content/*.json or guard/number-allowlist.json. Thin caller of guard/lib.ts.
import { readdirSync, readFileSync } from "node:fs";
import { buildAllowedNumbers, findInventedNumbers } from "../guard/lib.ts";
import { loadCaptures, readableText } from "./lib/captures.ts";

// content/scenes.json is a media manifest: its aspect ratios ("16/9"), ids and
// intent notes never reach a reader, so they must not widen the allowed set.
// Only the text a reader can meet — alt and caption — counts as content.
const readerVisible = (file: string, value: unknown): unknown => {
  if (file !== "scenes.json") return value;
  const texts: unknown[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === "object") {
      for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
        if (key === "alt" || key === "caption") texts.push(child);
        else walk(child);
      }
    }
  };
  walk(value);
  return texts;
};

const contentValues = readdirSync("content")
  .filter((f) => f.endsWith(".json"))
  .map((f) => readerVisible(f, JSON.parse(readFileSync(`content/${f}`, "utf8")) as unknown));
const allowlist = (
  JSON.parse(readFileSync("guard/number-allowlist.json", "utf8")) as { values: { value: string }[] }
).values.map((v) => v.value);
const allowed = buildAllowedNumbers(contentValues, allowlist);

const captures = loadCaptures();
const failures: string[] = [];
let numbersSeen = 0;

for (const c of captures) {
  const text = readableText(c);
  numbersSeen += (text.match(/\d+/g) ?? []).length;
  for (const hit of findInventedNumbers(text, allowed)) {
    failures.push(`${c.locale} ${c.path}: "${hit.raw}" ${hit.excerpt}`);
  }
}

console.log(
  `number guard: scanned ${captures.length} pages, ${numbersSeen} digit-runs, allowed set {${[...allowed].sort().join(", ")}}`,
);
if (failures.length > 0) {
  console.log(`RED — ${failures.length} number(s) not found in content/ or the allowlist:`);
  for (const f of failures) console.log(`  ✖ ${f}`);
  process.exit(1);
}
console.log("GREEN — every number on every page traces to content/*.json or the allowlist");
