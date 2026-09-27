import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { GLOSSARY_TERMS, glossaryAnchor, glossaryHref, isGlossaryKey } from "./glossary-links.ts";
import { resolveInlineHref } from "./inline-links.ts";

type Messages = { pages: { glossary: { terms: { term: string }[] } } };
const termsIn = (locale: "en" | "fr") =>
  (JSON.parse(readFileSync(`i18n/messages/${locale}.json`, "utf8")) as Messages).pages.glossary.terms.map((t) => t.term);

describe("GLOSSARY_TERMS", () => {
  it("names a term that exists in both message files, and every entry has a key", () => {
    for (const locale of ["en", "fr"] as const) {
      const printed = new Set(termsIn(locale));
      for (const [key, names] of Object.entries(GLOSSARY_TERMS)) {
        assert.ok(printed.has(names[locale]), `${locale}: "${names[locale]}" (key ${key}) is not a glossary term`);
      }
      assert.equal(printed.size, Object.keys(GLOSSARY_TERMS).length, `${locale}: every glossary entry should have a key`);
    }
  });

  it("gives unique anchors per locale", () => {
    for (const locale of ["en", "fr"] as const) {
      const anchors = Object.keys(GLOSSARY_TERMS).map((key) => glossaryAnchor(locale, key as keyof typeof GLOSSARY_TERMS));
      assert.equal(new Set(anchors).size, anchors.length);
    }
  });
});

describe("resolveInlineHref", () => {
  it("localizes routes and glossary keys, and refuses anything else", () => {
    assert.equal(resolveInlineHref("fr", "/services/second-shift"), "/fr/services/deuxieme-quart");
    assert.equal(resolveInlineHref("en", "/glossary#qc-sheet"), "/en/glossary#qc-sheet");
    assert.equal(resolveInlineHref("fr", "/glossary#qc-sheet"), "/fr/lexique#feuille-cq");
    assert.equal(glossaryHref("fr", "lead-hand"), "/fr/lexique#chef-d-equipe");
    assert.equal(resolveInlineHref("en", "/glossary#not-a-term"), null);
    assert.equal(resolveInlineHref("en", "/services/second-shift#anything"), null);
    assert.equal(resolveInlineHref("en", "/nowhere"), null);
    assert.equal(isGlossaryKey("viscosity"), true);
    assert.equal(isGlossaryKey("constructor"), false);
  });
});
