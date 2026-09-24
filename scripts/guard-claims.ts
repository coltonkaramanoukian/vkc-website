// CLAUDE.md §1/§4, the brief's §6 DON'T: claims this site never makes.
// The staffing guard covers the Second Shift wording and NC-3 covers invented
// numbers; nothing covered certifications, years in business, square footage,
// headcount, client counts, superlatives, or "licensed / compliant / approved".
// This is that guard. It reads the same captures as every other guard, over
// title, description, body text and image/aria attributes.
//   node scripts/guard-claims.ts
import { readFileSync } from "node:fs";
import { findStaffingTerms, type StaffingTerms } from "../guard/lib.ts";
import { loadCaptures } from "./lib/captures.ts";
import { expectedPageCount } from "./lib/routes.ts";

interface Claim {
  term: string;
  why: string;
}
const file = JSON.parse(readFileSync("guard/forbidden-claims.json", "utf8")) as {
  en: Claim[];
  fr: Claim[];
};
// Reuse the term matcher: same normalization, same word boundaries, same
// accent folding as D16's list, so a term behaves identically in both guards.
const terms: StaffingTerms = { en: file.en.map((c) => c.term), fr: file.fr.map((c) => c.term) };
const why = new Map([...file.en, ...file.fr].map((c) => [c.term, c.why]));

// "No certifications, no production figures" is the OPPOSITE of a claim, and
// the /about page says exactly that in both locales. A word-boundary list
// cannot tell an assertion from a denial, so the denial is detected here and
// reported by count — never silently dropped.
const NEGATION: Record<"en" | "fr", RegExp> = {
  en: /\b(no|not|never|without|zero|nor)\s+(\w+\s+){0,2}$/i,
  fr: /\b(aucun|aucune|aucuns|aucunes|sans|jamais|ni|pas\s+de|pas\s+d)\s*(\w+\s+){0,2}$/i,
};

/** True when the text right before the hit negates it. */
function isDenial(excerpt: string, term: string, locale: "en" | "fr"): boolean {
  const at = excerpt.toLowerCase().indexOf(term.toLowerCase());
  if (at < 0) return false;
  return NEGATION[locale].test(excerpt.slice(Math.max(0, at - 40), at));
}

const captures = loadCaptures();
let denials = 0;
const failures: string[] = [];
if (captures.length < expectedPageCount()) {
  failures.push(`scanned ${captures.length} pages, expected at least ${expectedPageCount()}`);
}

console.log(
  `claims guard: scanned ${captures.length} pages against ${terms.en.length} EN + ${terms.fr.length} FR forbidden claims`,
);

for (const capture of captures.sort((a, b) => a.path.localeCompare(b.path))) {
  const text = `${capture.title} ${capture.meta.description} ${capture.meta.ogTitle} ${capture.meta.ogDescription} ${capture.bodyText} ${capture.attrText} ${capture.jsonLd.join(" ")}`;
  for (const hit of findStaffingTerms(text, terms, capture.locale)) {
    if (isDenial(hit.excerpt, hit.term, capture.locale)) {
      denials += 1;
      console.log(`  · denial, not a claim: ${capture.path} "${hit.term}" …${hit.excerpt}…`);
      continue;
    }
    failures.push(
      `${capture.locale} ${capture.path}: forbidden claim "${hit.term}" (${why.get(hit.term)}) …${hit.excerpt}…`,
    );
  }
}

if (failures.length > 0) {
  console.log(`\nRED — ${failures.length} failure(s):`);
  for (const f of failures) console.log(`  ✖ ${f}`);
  process.exit(1);
}
console.log(
  `GREEN — no certification, tenure, size, headcount, client-count or superlative claim on any page` +
    (denials > 0 ? ` (${denials} negated mention${denials === 1 ? "" : "s"} allowed, listed above)` : ""),
);
