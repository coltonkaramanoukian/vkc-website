import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateEstimate, quoteServiceFor, type EstimateInput } from "./calculate.ts";
import { coercePricing, type Pricing } from "./pricing.ts";

const config: Pricing = coercePricing({
  placeholder: true,
  currency: "CAD",
  rangeSpreadPct: 20,
  roundTo: 50,
  services: [
    {
      id: "bottleneck",
      quoteService: "bottleneck",
      name: { en: "Bottleneck", fr: "Goulot" },
      unitLabel: { en: "units", fr: "unités" },
      quantityLabel: { en: "How many?", fr: "Combien?" },
      ratePerUnit: 2,
      setupFee: 500,
      minimum: 1000,
    },
    {
      id: "second-shift",
      quoteService: "second-shift",
      name: { en: "Second Shift", fr: "Deuxième quart" },
      unitLabel: { en: "shifts", fr: "quarts" },
      quantityLabel: { en: "How many shifts?", fr: "Combien de quarts?" },
      ratePerUnit: 3000,
      setupFee: 0,
      minimum: 3000,
    },
  ],
  options: [
    { id: "labeling", name: { en: "Labels", fr: "Étiquettes" }, kind: "perUnit", value: 1, appliesTo: ["bottleneck"] },
    { id: "qc-docs", name: { en: "QC docs", fr: "Doc CQ" }, kind: "flat", value: 300, appliesTo: ["bottleneck", "second-shift"] },
    { id: "rush", name: { en: "Rush", fr: "Accéléré" }, kind: "multiplier", value: 1.5, appliesTo: ["bottleneck", "second-shift"] },
  ],
});

const run = (input: EstimateInput) => calculateEstimate(config, input);

describe("calculateEstimate", () => {
  it("computes base rate × quantity plus the setup fee, with the ±spread range", () => {
    // 2×5000 + 500 = 10500 → ±20% → 8400..12600, rounded to 50
    const result = run({ serviceId: "bottleneck", quantity: 5000, optionIds: [] });
    assert.equal(result.ok, true);
    assert.equal(result.point, 10500);
    assert.equal(result.low, 8400);
    assert.equal(result.high, 12600);
    assert.equal(result.currency, "CAD");
    assert.equal(result.placeholder, true);
  });

  it("adds per-unit options to the rate before multiplying by quantity", () => {
    // (2+1)×5000 + 500 = 15500
    const result = run({ serviceId: "bottleneck", quantity: 5000, optionIds: ["labeling"] });
    assert.equal(result.point, 15500);
  });

  it("adds flat options and the setup fee once, regardless of quantity", () => {
    // 2×1000 + (500+300) = 2800
    const result = run({ serviceId: "bottleneck", quantity: 1000, optionIds: ["qc-docs"] });
    assert.equal(result.point, 2800);
  });

  it("applies multiplier options to the whole subtotal", () => {
    // (2×1000 + 500) × 1.5 = 3750
    const result = run({ serviceId: "bottleneck", quantity: 1000, optionIds: ["rush"] });
    assert.equal(result.point, 3750);
  });

  it("floors the point estimate and the low end at the service minimum", () => {
    // 2×100 + 500 = 700 < 1000 minimum → point 1000; low never dips below the minimum
    const result = run({ serviceId: "bottleneck", quantity: 100, optionIds: [] });
    assert.equal(result.point, 1000);
    assert.equal(result.low, 1000);
    assert.equal(result.high, 1200);
  });

  it("ignores options that are not offered for the chosen service", () => {
    // labeling is bottleneck-only; on second-shift it is dropped → 3000×2 = 6000
    const result = run({ serviceId: "second-shift", quantity: 2, optionIds: ["labeling"] });
    assert.equal(result.point, 6000);
  });

  it("rejects an unknown service", () => {
    assert.equal(run({ serviceId: "nope", quantity: 10, optionIds: [] }).ok, false);
  });

  it("rejects a zero, negative, or non-finite quantity", () => {
    assert.equal(run({ serviceId: "bottleneck", quantity: 0, optionIds: [] }).ok, false);
    assert.equal(run({ serviceId: "bottleneck", quantity: -5, optionIds: [] }).ok, false);
    assert.equal(run({ serviceId: "bottleneck", quantity: Number.NaN, optionIds: [] }).ok, false);
  });

  it("maps each service to its public quote-handler enum", () => {
    assert.equal(quoteServiceFor(config, "bottleneck"), "bottleneck");
    assert.equal(quoteServiceFor(config, "second-shift"), "second-shift");
    assert.equal(quoteServiceFor(config, "missing"), "unsure");
  });
});

describe("coercePricing", () => {
  it("drops malformed services and options and defaults scalars", () => {
    const coerced = coercePricing({
      services: [{ id: "ok", ratePerUnit: "3" }, { noId: true }, "garbage"],
      options: [{ id: "o", kind: "weird", value: -1 }, {}],
    });
    assert.equal(coerced.services.length, 1);
    assert.equal(coerced.services[0].ratePerUnit, 3);
    assert.equal(coerced.services[0].quoteService, "unsure");
    assert.equal(coerced.currency, "CAD");
    assert.equal(coerced.roundTo, 1);
    assert.equal(coerced.options.length, 1);
    assert.equal(coerced.options[0].kind, "flat"); // invalid kind → flat
    assert.equal(coerced.options[0].value, 0); // negative → default 0
  });
});
