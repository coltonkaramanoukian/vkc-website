import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAppPathname, resolveInlineHref } from "./inline-links.ts";

// resolveInlineHref is the dead-link guard for copy links: a target the site
// does not know renders as plain text, so a typo in a message file can never
// ship a live-looking dead link.
describe("isAppPathname", () => {
  it("accepts real routes and rejects anything else", () => {
    assert.equal(isAppPathname("/services"), true);
    assert.equal(isAppPathname("/services/toll-blending"), true);
    assert.equal(isAppPathname("/not-a-page"), false);
    assert.equal(isAppPathname("https://example.com"), false);
  });
});

describe("resolveInlineHref", () => {
  it("localizes a known internal route", () => {
    const en = resolveInlineHref("en", "/services/toll-blending");
    assert.ok(en && en.startsWith("/en/"), `expected an /en path, got ${en}`);
    const fr = resolveInlineHref("fr", "/services/toll-blending");
    assert.ok(fr && fr.startsWith("/fr/"), `expected an /fr path, got ${fr}`);
    // FR uses a translated slug, so the two must differ.
    assert.notEqual(en, fr);
  });

  it("resolves a known glossary entry to its anchor", () => {
    const href = resolveInlineHref("en", "/glossary#weigh-fill");
    assert.ok(href && href.includes("#weigh-fill"), `expected a #weigh-fill anchor, got ${href}`);
  });

  it("returns null for an unknown glossary key (no dead anchor)", () => {
    assert.equal(resolveInlineHref("en", "/glossary#not-a-real-term"), null);
  });

  it("returns null for an unknown route", () => {
    assert.equal(resolveInlineHref("en", "/made-up"), null);
  });

  it("returns null for a fragment on a non-glossary route", () => {
    assert.equal(resolveInlineHref("en", "/about#team"), null);
  });
});
