import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aggregateRating, publishedTestimonials, type Testimonial } from "./testimonials.ts";

const base: Testimonial = {
  id: "a",
  published: true,
  quote: { en: "Great work.", fr: "Du bon travail." },
  author: "Jane Tremblay",
  company: "Acme",
  role: { en: "Owner", fr: "Propriétaire" },
  date: "2026-10-02",
  rating: null,
};

describe("publishedTestimonials", () => {
  it("returns published testimonials with a quote in both languages, resolved to the locale", () => {
    const out = publishedTestimonials([base], "fr");
    assert.equal(out.length, 1);
    assert.equal(out[0].quote, "Du bon travail.");
    assert.equal(out[0].role, "Propriétaire");
    assert.equal(out[0].company, "Acme");
  });

  it("drops an unpublished testimonial", () => {
    assert.equal(publishedTestimonials([{ ...base, published: false }], "en").length, 0);
  });

  it("drops a testimonial missing one language of the quote (§3)", () => {
    assert.equal(publishedTestimonials([{ ...base, quote: { en: "Only EN", fr: null } }], "en").length, 0);
  });

  it("drops a role written in only one language but keeps the testimonial", () => {
    const out = publishedTestimonials([{ ...base, role: { en: "Owner", fr: null } }], "en");
    assert.equal(out.length, 1);
    assert.equal(out[0].role, null);
  });

  it("drops an authorless testimonial", () => {
    assert.equal(publishedTestimonials([{ ...base, author: "  " }], "en").length, 0);
  });

  it("normalizes a non-positive or missing rating to null", () => {
    assert.equal(publishedTestimonials([{ ...base, rating: 0 }], "en")[0].rating, null);
    assert.equal(publishedTestimonials([{ ...base, rating: 5 }], "en")[0].rating, 5);
  });
});

describe("aggregateRating", () => {
  it("is null when no testimonial carries a rating (§1: no invented aggregate)", () => {
    const out = publishedTestimonials([base, { ...base, id: "b" }], "en");
    assert.equal(aggregateRating(out), null);
  });

  it("averages the real ratings and counts them", () => {
    const out = publishedTestimonials(
      [
        { ...base, id: "a", rating: 5 },
        { ...base, id: "b", rating: 4 },
        { ...base, id: "c", rating: null },
      ],
      "en",
    );
    const agg = aggregateRating(out);
    assert.deepEqual(agg, { ratingValue: 4.5, ratingCount: 2, reviewCount: 3 });
  });
});
