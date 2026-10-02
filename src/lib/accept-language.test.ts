import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { negotiateLocale } from "./accept-language.ts";

// negotiateLocale drives the /v QR door (D17) and anywhere the server picks a
// locale from the browser. Fallback is fr by design.
describe("negotiateLocale", () => {
  it("falls back to fr when there is no header", () => {
    assert.equal(negotiateLocale(null), "fr");
    assert.equal(negotiateLocale(undefined), "fr");
    assert.equal(negotiateLocale(""), "fr");
  });

  it("picks the plain base tag", () => {
    assert.equal(negotiateLocale("en"), "en");
    assert.equal(negotiateLocale("fr"), "fr");
  });

  it("reads the region off a regional tag", () => {
    assert.equal(negotiateLocale("en-US,en;q=0.9"), "en");
    assert.equal(negotiateLocale("fr-CA,fr;q=0.9,en;q=0.8"), "fr");
  });

  it("honours q-weight over list order", () => {
    assert.equal(negotiateLocale("en;q=0.8,fr;q=0.9"), "fr");
    assert.equal(negotiateLocale("fr;q=0.2,en;q=0.7"), "en");
  });

  it("skips languages the site does not serve and takes the first it does", () => {
    assert.equal(negotiateLocale("de,es;q=0.9,en;q=0.5"), "en");
    assert.equal(negotiateLocale("de-DE,it;q=0.8"), "fr");
  });

  it("is case-insensitive", () => {
    assert.equal(negotiateLocale("EN-GB"), "en");
    assert.equal(negotiateLocale("FR-ca"), "fr");
  });

  it("ignores a q=0 range (explicit refusal)", () => {
    // en is refused (q=0); fr is the next served language.
    assert.equal(negotiateLocale("en;q=0,fr;q=0.5"), "fr");
  });

  it("falls back to fr on a malformed header", () => {
    assert.equal(negotiateLocale(";;;"), "fr");
    assert.equal(negotiateLocale(",,"), "fr");
  });
});
