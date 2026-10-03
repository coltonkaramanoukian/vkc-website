import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateEstimate } from "./calculate.ts";
import { coercePricing } from "./pricing.ts";
import { buildLeadSummary, formatMoney, formatRange } from "./summary.ts";

const config = coercePricing({
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
  ],
  options: [{ id: "labeling", name: { en: "Apply labels", fr: "Étiquetage" }, kind: "perUnit", value: 1, appliesTo: ["bottleneck"] }],
});

const labels = { heading: "Estimator", service: "Service", amount: "Amount", addons: "Add-ons", range: "Range", placeholder: "placeholder rates" };

describe("formatMoney", () => {
  it("formats whole-dollar currency for en-CA", () => {
    assert.equal(formatMoney(1234, "CAD", "en"), "$1,234");
  });

  // fr-CA puts the symbol last and groups with a (non-breaking) space, not a
  // comma. The exact space codepoint shifts between ICU versions, so normalise
  // whitespace and assert the convention rather than the raw bytes.
  it("formats whole-dollar currency for fr-CA (symbol last, space grouping)", () => {
    const fr = formatMoney(1234, "CAD", "fr");
    assert.equal(fr.replace(/\s/gu, ""), "1234$");
    assert.ok(!fr.includes(","), `fr-CA money should not use a comma separator: ${JSON.stringify(fr)}`);
    assert.notEqual(fr, formatMoney(1234, "CAD", "en"));
  });
});

describe("formatRange", () => {
  it("joins the low and high with an en dash", () => {
    const result = calculateEstimate(config, { serviceId: "bottleneck", quantity: 5000, optionIds: [] });
    assert.equal(formatRange(result, "en"), "$8,400 – $12,600");
  });

  it("formats the fr-CA range with the symbol last (whitespace-normalised)", () => {
    const result = calculateEstimate(config, { serviceId: "bottleneck", quantity: 5000, optionIds: [] });
    assert.equal(formatRange(result, "fr").replace(/\s/gu, ""), "8400$–12600$");
  });
});

describe("buildLeadSummary", () => {
  it("summarizes the service, amount, add-ons and range with the placeholder tag", () => {
    const result = calculateEstimate(config, { serviceId: "bottleneck", quantity: 5000, optionIds: ["labeling"] });
    const summary = buildLeadSummary({
      config,
      serviceId: "bottleneck",
      quantity: 5000,
      optionIds: ["labeling"],
      result,
      locale: "en",
      labels,
      notes: "Call after noon",
    });
    assert.match(summary, /^Estimator/);
    assert.match(summary, /Service: Bottleneck/);
    assert.match(summary, /Amount: 5000 units/);
    assert.match(summary, /Add-ons: Apply labels/);
    assert.match(summary, /placeholder rates/);
    assert.match(summary, /Call after noon/);
  });

  it("shows a dash for add-ons when none are chosen", () => {
    const result = calculateEstimate(config, { serviceId: "bottleneck", quantity: 1000, optionIds: [] });
    const summary = buildLeadSummary({ config, serviceId: "bottleneck", quantity: 1000, optionIds: [], result, locale: "en", labels });
    assert.match(summary, /Add-ons: —/);
  });
});
