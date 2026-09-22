// Draft-time check for a page group: word counts (cut rule), FR/EN ratio,
// staffing terms, Second Shift facts where the service is named, numbers.
//   node scripts/draft-check.ts <render-dir>
import { readdirSync, readFileSync } from "node:fs";
import {
  buildAllowedNumbers, checkRequiredFacts, findInventedNumbers, findStaffingTerms, mentionsService,
  type RequiredPhrases, type StaffingTerms,
} from "../guard/lib.ts";
import type { PageCapture } from "./render-all.ts";

const dir = process.argv[2] ?? ".render-draft";
const caps = readdirSync(dir).map((f) => JSON.parse(readFileSync(`${dir}/${f}`, "utf8")) as PageCapture);
const terms = JSON.parse(readFileSync("guard/staffing-terms.json", "utf8")) as StaffingTerms;
const req = JSON.parse(readFileSync("guard/second-shift-required.json", "utf8")) as RequiredPhrases;
const svc = JSON.parse(readFileSync("content/services.json", "utf8"));
const ss = [svc.secondShift.name.en, svc.secondShift.name.fr];
const allowed = buildAllowedNumbers(
  readdirSync("content").filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(`content/${f}`, "utf8"))),
  JSON.parse(readFileSync("guard/number-allowlist.json", "utf8")).values.map((v: { value: string }) => v.value),
);
const words = (s: string) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
for (const c of caps.sort((a, b) => a.route.localeCompare(b.route) || a.locale.localeCompare(b.locale))) {
  const other = caps.find((o) => o.route === c.route && o.locale !== c.locale);
  const ratio = c.locale === "fr" && other ? (c.ownText.length / other.ownText.length).toFixed(3) : "";
  const staff = findStaffingTerms(`${c.title} ${c.meta.description} ${c.bodyText} ${c.attrText}`, terms, c.locale).map((h) => h.term);
  const facts = mentionsService(c.mainText, ss) ? checkRequiredFacts(c.mainText, req, c.locale).filter((f) => !f.ok).map((f) => f.id) : [];
  const nums = findInventedNumbers(`${c.title} ${c.meta.description} ${c.bodyText}`, allowed).map((n) => n.raw);
  console.log(`${c.status} ${c.path.padEnd(42)} words ${String(words(c.ownText)).padStart(4)} ${ratio ? `FR/EN ${ratio}` : "".padEnd(12)} ${staff.length ? `STAFF ${staff}` : ""} ${facts.length ? `MISSING ${facts}` : ""} ${nums.length ? `NUMS ${nums}` : ""}`);
}
