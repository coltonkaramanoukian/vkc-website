import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { slugify, uniqueSlugs } from "./slug.ts";

describe("slugify", () => {
  it("lowercases, strips accents and punctuation, joins with hyphens", () => {
    assert.equal(slugify("Pourquoi « Goulot »"), "pourquoi-goulot");
    assert.equal(slugify("What the records are for"), "what-the-records-are-for");
    assert.equal(slugify("Concentré ou prêt à l’emploi"), "concentre-ou-pret-a-l-emploi");
  });

  it("never returns an empty id", () => {
    assert.equal(slugify("—"), "section");
  });
});

describe("uniqueSlugs", () => {
  it("suffixes a repeated heading so anchors stay distinct", () => {
    assert.deepEqual(uniqueSlugs(["Pails", "Pails", "Kits"]), ["pails", "pails-b", "kits"]);
  });
});
