// NC-2 / D16: SERVICE, NOT STAFFING. Thin caller of guard/lib.ts.
//   (b) absence: no staffing term anywhere on any page (text, metadata, JSON-LD, attrs)
//   (a) presence: every Second Shift surface carries all four facts
import { readFileSync } from "node:fs";
import {
  checkRequiredFacts,
  findStaffingTerms,
  mentionsService,
  type RequiredPhrases,
  type StaffingTerms,
} from "../guard/lib.ts";
import { loadCaptures, readableText } from "./lib/captures.ts";

const terms = JSON.parse(readFileSync("guard/staffing-terms.json", "utf8")) as StaffingTerms;
const required = JSON.parse(readFileSync("guard/second-shift-required.json", "utf8")) as RequiredPhrases;
const services = JSON.parse(readFileSync("content/services.json", "utf8"));
const ssNames: string[] = [services.secondShift.name.en, services.secondShift.name.fr];

// Pages that must carry at least one marked Second Shift surface.
const MUST_HAVE_SURFACE = ["/", "/visit", "/quote", "/services/second-shift"];

const captures = loadCaptures();
const failures: string[] = [];
let surfacesChecked = 0;

const factFailures = (text: string, locale: "fr" | "en", where: string) =>
  checkRequiredFacts(text, required, locale)
    .filter((f) => !f.ok)
    .map((f) => `${where}: missing fact "${f.id}" (${f.fact})`);

for (const c of captures) {
  const where = `${c.locale} ${c.path}`;

  for (const hit of findStaffingTerms(readableText(c), terms, c.locale)) {
    failures.push(`${where}: staffing term "${hit.term}" ${hit.excerpt}`);
  }

  c.guardSurfaces.forEach((surface, i) => {
    surfacesChecked += 1;
    failures.push(...factFailures(surface, c.locale, `${where} surface#${i + 1}`));
  });
  if (MUST_HAVE_SURFACE.includes(c.route) && c.guardSurfaces.length === 0) {
    failures.push(`${where}: expected a marked Second Shift surface, found none`);
  }

  if (mentionsService(c.mainText, ssNames)) {
    surfacesChecked += 1;
    failures.push(...factFailures(c.mainText, c.locale, `${where} main`));
  }

  const metaText = `${c.title} ${c.meta.description}`;
  if (mentionsService(metaText, ssNames)) {
    surfacesChecked += 1;
    failures.push(...factFailures(c.meta.description, c.locale, `${where} metadata`));
  }

  if (mentionsService(c.jsonLd.join(" "), ssNames)) {
    surfacesChecked += 1;
    failures.push(...factFailures(c.jsonLd.join(" "), c.locale, `${where} JSON-LD`));
  }
}

console.log(`staffing guard: scanned ${captures.length} pages, ${surfacesChecked} Second Shift surfaces`);
if (failures.length > 0) {
  console.log(`RED — ${failures.length} failure(s):`);
  for (const f of failures) console.log(`  ✖ ${f}`);
  process.exit(1);
}
console.log("GREEN — no staffing terms; every Second Shift surface carries all four facts");
