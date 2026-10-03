import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prepareTestimonials } from "./testimonials.ts";

const valid = {
  id: "jane",
  published: true,
  quote: { en: "They ran our line without a hitch.", fr: "Ils ont fait rouler notre ligne sans accroc." },
  author: "Jane Tremblay",
  company: "Acme",
  role: { en: "Operations lead", fr: "Responsable des opérations" },
  date: "2026-10-02",
  rating: "5",
};

describe("prepareTestimonials", () => {
  it("accepts a well-formed testimonial and coerces the rating to a number", () => {
    const result = prepareTestimonials({ testimonials: [valid] });
    assert.equal(result.ok, true);
    assert.equal(result.testimonials?.length, 1);
    assert.equal(result.testimonials?.[0].rating, 5);
    assert.equal(result.testimonials?.[0].published, true);
  });

  it("drops a fully empty row without erroring", () => {
    const result = prepareTestimonials({ testimonials: [{ author: "", quote: { en: "", fr: "" } }] });
    assert.equal(result.ok, true);
    assert.equal(result.testimonials?.length, 0);
  });

  it("refuses to publish a testimonial missing the French quote (§3)", () => {
    const result = prepareTestimonials({ testimonials: [{ ...valid, quote: { en: "EN only", fr: "" } }] });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.path === "published" && e.index === 0));
  });

  it("allows an unpublished testimonial to be incomplete", () => {
    const result = prepareTestimonials({ testimonials: [{ ...valid, published: false, quote: { en: "draft", fr: "" } }] });
    assert.equal(result.ok, true);
    assert.equal(result.testimonials?.[0].published, false);
  });

  it("refuses a forbidden claim in the quote, even in a customer's words (§1)", () => {
    const result = prepareTestimonials({ testimonials: [{ ...valid, quote: { en: "The fastest in the industry.", fr: "Les meilleurs." } }] });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.path === "quote" && e.index === 0));
  });

  it("refuses a staffing term in the quote (§4)", () => {
    const result = prepareTestimonials({ testimonials: [{ ...valid, quote: { en: "Great temp workers on call.", fr: "Super équipe." } }] });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.path === "quote" && e.index === 0));
  });

  it("rejects a rating outside 1–5", () => {
    const result = prepareTestimonials({ testimonials: [{ ...valid, rating: "7" }] });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.path === "rating"));
  });

  it("rejects an invalid date", () => {
    const result = prepareTestimonials({ testimonials: [{ ...valid, date: "2026-13-40" }] });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.path === "date"));
  });

  it("auto-assigns an id when blank and flags a duplicate id", () => {
    const blank = prepareTestimonials({ testimonials: [{ ...valid, id: "" }] });
    assert.equal(blank.testimonials?.[0].id, "testimonial-1");

    const dupe = prepareTestimonials({ testimonials: [valid, { ...valid, author: "Other" }] });
    assert.equal(dupe.ok, false);
    assert.ok(dupe.errors.some((e) => e.path === "id"));
  });
});
