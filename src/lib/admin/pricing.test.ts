import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { preparePricing } from "./pricing.ts";

const validService = {
  id: "bottleneck",
  quoteService: "bottleneck",
  name: { en: "Bottleneck", fr: "Goulot" },
  unitLabel: { en: "units", fr: "unités" },
  quantityLabel: { en: "How many?", fr: "Combien?" },
  ratePerUnit: "1.25",
  setupFee: "500",
  minimum: "1000",
};

describe("preparePricing", () => {
  it("accepts a well-formed rate card and coerces string numbers", () => {
    const result = preparePricing({
      placeholder: true,
      currency: "CAD",
      rangeSpreadPct: "20",
      roundTo: "50",
      services: [validService],
      options: [{ id: "labeling", name: { en: "Labels", fr: "Étiquettes" }, kind: "perUnit", value: "0.25", appliesTo: ["bottleneck"] }],
    });
    assert.equal(result.ok, true);
    assert.equal(result.pricing?.services[0].ratePerUnit, 1.25);
    assert.equal(result.pricing?.roundTo, 50);
    assert.equal(result.pricing?.options[0].kind, "perUnit");
    assert.equal(result.pricing?.placeholder, true);
  });

  it("requires at least one service", () => {
    const result = preparePricing({ services: [], options: [], rangeSpreadPct: "20", roundTo: "50" });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.path === "services"));
  });

  it("rejects a service missing a French label", () => {
    const result = preparePricing({
      services: [{ ...validService, name: { en: "Bottleneck", fr: "" } }],
      options: [],
      rangeSpreadPct: "20",
      roundTo: "50",
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.path === "services.0.name"));
  });

  it("rejects a staffing term in a label (§4)", () => {
    const result = preparePricing({
      services: [{ ...validService, name: { en: "Temp workers on call", fr: "Goulot" } }],
      options: [],
      rangeSpreadPct: "20",
      roundTo: "50",
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.path === "services.0.name"));
  });

  it("rejects a negative rate", () => {
    const result = preparePricing({
      services: [{ ...validService, ratePerUnit: "-5" }],
      options: [],
      rangeSpreadPct: "20",
      roundTo: "50",
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.path === "services.0.ratePerUnit"));
  });

  it("rejects an option that applies to no known service", () => {
    const result = preparePricing({
      services: [validService],
      options: [{ id: "rush", name: { en: "Rush", fr: "Accéléré" }, kind: "multiplier", value: "1.25", appliesTo: ["ghost"] }],
      rangeSpreadPct: "20",
      roundTo: "50",
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.path === "options.0.appliesTo"));
  });

  it("floors roundTo at one", () => {
    const result = preparePricing({ services: [validService], options: [], rangeSpreadPct: "20", roundTo: "0" });
    assert.equal(result.ok, true);
    assert.equal(result.pricing?.roundTo, 1);
  });

  it("flags two services sharing an id", () => {
    const result = preparePricing({
      services: [validService, { ...validService }],
      options: [],
      rangeSpreadPct: "20",
      roundTo: "50",
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.path === "services"));
  });
});
