import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildBreadcrumbJsonLd, buildDefinedTermSetJsonLd, buildFaqJsonLd, buildServiceJsonLd, buildTestimonialsJsonLd, serializeJsonLd } from "./structured-data.ts";

describe("buildFaqJsonLd", () => {
  it("emits one Question per item with the answer text", () => {
    const json = buildFaqJsonLd([
      { q: "What is it?", a: "A shift." },
      { q: "How much?", a: "Per unit or per shift." },
    ]);
    assert.equal(json["@type"], "FAQPage");
    const entities = json.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    assert.equal(entities.length, 2);
    assert.equal(entities[1].name, "How much?");
    assert.equal(entities[1].acceptedAnswer.text, "Per unit or per shift.");
  });

  it("strips inline markdown links from answers", () => {
    const json = buildFaqJsonLd([{ q: "Q", a: "See [toll blending](/services/toll-blending) first." }]);
    const [entity] = json.mainEntity as { acceptedAnswer: { text: string } }[];
    assert.equal(entity.acceptedAnswer.text, "See toll blending first.");
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("numbers items from one and links every item but the last", () => {
    const json = buildBreadcrumbJsonLd([
      { name: "Home", url: "https://x.test/en" },
      { name: "Pails", url: "https://x.test/en/containers/pails" },
    ]);
    const items = json.itemListElement as { position: number; name: string; item?: string }[];
    assert.deepEqual(
      items.map((i) => [i.position, i.name, i.item]),
      [
        [1, "Home", "https://x.test/en"],
        [2, "Pails", undefined],
      ],
    );
  });
});

describe("buildServiceJsonLd", () => {
  it("carries the summary verbatim and points at the organization", () => {
    const json = buildServiceJsonLd({
      name: "Second Shift",
      description: "Our lead hand directs the shift.",
      url: "https://x.test/en/services/second-shift",
      providerId: "https://x.test/#organization",
    });
    assert.equal(json["@type"], "Service");
    assert.equal(json.description, "Our lead hand directs the shift.");
    assert.deepEqual(json.provider, { "@id": "https://x.test/#organization" });
  });
});

describe("serializeJsonLd", () => {
  it("escapes the one character that could close the script tag", () => {
    assert.equal(serializeJsonLd({ a: "</script>" }), '{"a":"\\u003c/script>"}');
  });
});

describe("buildDefinedTermSetJsonLd", () => {
  it("anchors every term to the page and strips inline links from definitions", () => {
    const data = buildDefinedTermSetJsonLd({
      name: "Glossary",
      url: "https://example.test/en/glossary",
      terms: [
        { term: "Weigh-fill", definition: "Filling to a target weight. See [pails](/containers/pails).", slug: "weigh-fill" },
        { term: "Lot", definition: "One batch.", slug: "lot" },
      ],
    });
    const terms = data.hasDefinedTerm as { name: string; description: string; url: string }[];
    assert.equal(data["@type"], "DefinedTermSet");
    assert.equal(terms.length, 2);
    assert.equal(terms[0].url, "https://example.test/en/glossary#weigh-fill");
    assert.equal(terms[0].description, "Filling to a target weight. See pails.");
    assert.equal(terms[1].name, "Lot");
  });
});

describe("buildTestimonialsJsonLd", () => {
  const ORG = "https://example.test/#organization";

  it("returns null when there are no reviews", () => {
    assert.equal(buildTestimonialsJsonLd([], ORG), null);
  });

  it("builds a Review node per testimonial, with worksFor only when a company is given", () => {
    const data = buildTestimonialsJsonLd(
      [
        { body: "Solid run.", author: "Jane", company: "Acme", datePublished: "2026-10-02" },
        { body: "On time.", author: "Sam", company: null },
      ],
      ORG,
    );
    const graph = data?.["@graph"] as Record<string, unknown>[];
    assert.equal(graph.length, 2);
    assert.equal(graph[0]["@type"], "Review");
    assert.equal(graph[0].reviewBody, "Solid run.");
    assert.deepEqual(graph[0].itemReviewed, { "@id": ORG });
    assert.equal((graph[0].author as Record<string, unknown>).name, "Jane");
    assert.deepEqual((graph[0].author as Record<string, unknown>).worksFor, { "@type": "Organization", name: "Acme" });
    assert.equal((graph[1].author as Record<string, unknown>).worksFor, undefined);
    assert.equal(graph[0].datePublished, "2026-10-02");
  });

  it("emits reviewRating ONLY when a rating is present (§1: no invented stars)", () => {
    const data = buildTestimonialsJsonLd(
      [
        { body: "Five.", author: "A", rating: 5 },
        { body: "None.", author: "B", rating: null },
      ],
      ORG,
    );
    const graph = data?.["@graph"] as Record<string, unknown>[];
    assert.deepEqual(graph[0].reviewRating, { "@type": "Rating", ratingValue: 5, bestRating: 5, worstRating: 1 });
    assert.equal(graph[1].reviewRating, undefined);
  });

  it("appends an AggregateRating on the Organization only when given", () => {
    const withAgg = buildTestimonialsJsonLd([{ body: "x", author: "A", rating: 4 }], ORG, {
      ratingValue: 4,
      ratingCount: 1,
      reviewCount: 1,
    });
    const graph = withAgg?.["@graph"] as Record<string, unknown>[];
    const org = graph.find((n) => n["@type"] === "Organization") as Record<string, unknown>;
    assert.equal(org["@id"], ORG);
    assert.equal((org.aggregateRating as Record<string, unknown>)["@type"], "AggregateRating");

    const without = buildTestimonialsJsonLd([{ body: "x", author: "A" }], ORG);
    const graph2 = without?.["@graph"] as Record<string, unknown>[];
    assert.equal(graph2.some((n) => n["@type"] === "Organization"), false);
  });
});
