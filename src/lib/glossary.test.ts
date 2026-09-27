import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { letterAnchor, letterOf, lettersOf, orderTerms } from "./glossary.ts";

const terms = [
  { term: "Viscosité", def: "a" },
  { term: "Étiquette", def: "b" },
  { term: "changement de format", def: "c" },
  { term: "Chef d’équipe", def: "d" },
  { term: "Lot", def: "e" },
];

describe("letterOf", () => {
  it("folds accents and upper-cases", () => {
    assert.equal(letterOf("Étiquette"), "E");
    assert.equal(letterOf("œuvre"), "Œ");
    assert.equal(letterOf("  seau"), "S");
  });
});

describe("orderTerms", () => {
  it("sorts by the locale collator, ignoring case and accents, without mutating the input", () => {
    const before = terms.map((entry) => entry.term);
    const ordered = orderTerms(terms, "fr").map((entry) => entry.term);
    assert.deepEqual(ordered, ["changement de format", "Chef d’équipe", "Étiquette", "Lot", "Viscosité"]);
    assert.deepEqual(terms.map((entry) => entry.term), before);
  });

  it("gives every entry a unique anchor and its letter", () => {
    const ordered = orderTerms([{ term: "Lot", def: "a" }, { term: "Lot", def: "b" }, { term: "Étiquette", def: "c" }], "en");
    assert.deepEqual(ordered.map((entry) => entry.slug), ["etiquette", "lot", "lot-b"]);
    assert.deepEqual(ordered.map((entry) => entry.letter), ["E", "L", "L"]);
  });
});

describe("lettersOf / letterAnchor", () => {
  it("lists letters once, in order, and anchors them in lower case", () => {
    const ordered = orderTerms(terms, "fr");
    assert.deepEqual(lettersOf(ordered), ["C", "E", "L", "V"]);
    assert.equal(letterAnchor("C"), "letter-c");
  });
});
