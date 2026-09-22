import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  buildAllowedNumbers,
  checkRequiredFacts,
  extractNumbers,
  findInventedNumbers,
  findStaffingTerms,
  mentionsService,
  normalizeText,
  type RequiredPhrases,
  type StaffingTerms,
} from "./lib.ts";

const terms = JSON.parse(
  readFileSync(new URL("./staffing-terms.json", import.meta.url), "utf8"),
) as StaffingTerms;
const required = JSON.parse(
  readFileSync(new URL("./second-shift-required.json", import.meta.url), "utf8"),
) as RequiredPhrases;

describe("normalizeText", () => {
  it("strips accents, folds œ, unifies apostrophes and hyphens", () => {
    assert.equal(normalizeText("Main-d’Œuvre  FACTURÉ"), "main d'oeuvre facture");
  });
});

describe("findStaffingTerms", () => {
  it("flags EN terms case-insensitively on word boundaries", () => {
    const hits = findStaffingTerms("Extra Hands billed HOURLY.", terms, "en");
    assert.deepEqual(hits.map((h) => h.term).sort(), ["billed hourly", "extra hands", "hands", "hourly"]);
  });

  it("does not flag substrings inside other words", () => {
    assert.deepEqual(findStaffingTerms("Temperature and lead hand directs.", terms, "en"), []);
  });

  it("flags FR terms regardless of accents and apostrophe style", () => {
    const hits = findStaffingTerms("De la main d’oeuvre, facture a l'heure.", terms, "fr");
    assert.ok(hits.some((h) => h.term === "main-d'œuvre"));
    assert.ok(hits.some((h) => h.term === "facturé à l'heure"));
  });

  it("does not flag French 'temps' (time) on FR pages", () => {
    assert.deepEqual(findStaffingTerms("En même temps, notre équipe fait le travail.", terms, "fr"), []);
  });
});

describe("checkRequiredFacts", () => {
  const en =
    "Our lead hand directs the shift, our crew does the work, and our QC sheets and production log document it. Priced per unit or per shift.";
  const fr =
    "Notre chef d'équipe dirige le quart, notre équipe fait le travail, et nos feuilles de contrôle qualité et notre registre de production le documentent. Facturé à l'unité ou au quart.";

  it("passes when all four facts are present (EN, FR)", () => {
    assert.ok(checkRequiredFacts(en, required, "en").every((f) => f.ok));
    assert.ok(checkRequiredFacts(fr, required, "fr").every((f) => f.ok));
  });

  it("fails the lead-hand fact when that sentence is removed", () => {
    const results = checkRequiredFacts(fr.replace("Notre chef d'équipe dirige le quart, ", ""), required, "fr");
    assert.deepEqual(results.filter((f) => !f.ok).map((f) => f.id), ["lead-hand-directs"]);
  });

  it("does not accept the customer's lead hand", () => {
    const results = checkRequiredFacts(en.replace("Our lead hand", "Your lead hand"), required, "en");
    assert.equal(results.find((f) => f.id === "lead-hand-directs")?.ok, false);
  });
});

describe("mentionsService", () => {
  it("matches service names accent-insensitively", () => {
    assert.ok(mentionsService("Le deuxieme quart", ["Deuxième quart"]));
    assert.ok(!mentionsService("Deuxièmement", ["Deuxième quart"]));
  });
});

describe("numbers", () => {
  it("folds separators into one token", () => {
    assert.deepEqual(extractNumbers("5,000 units, 3.5G and 3,5G, 5 000 pails").map((n) => n.normalized), [
      "5000", "35", "35", "5000",
    ]);
  });

  it("allows numbers from content and the allowlist only", () => {
    const allowed = buildAllowedNumbers([{ name: "3.5G plastic pail" }, ["20 L Ropak"]], ["2026"]);
    assert.deepEqual(findInventedNumbers("Pail 3,5G, Ropak 20 L, © 2026", allowed), []);
    const hits = findInventedNumbers("We fill 5,000 units per day.", allowed);
    assert.deepEqual(hits.map((h) => h.raw), ["5,000"]);
  });
});
