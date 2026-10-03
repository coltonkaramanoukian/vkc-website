import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prepareArticle, removeArticle, setArticleStatus, upsertArticle } from "./articles.ts";

const base = {
  slug: "overflow-season",
  status: "published",
  date: "2026-10-02",
  category: "guide",
  tags: "filling, overflow, Filling",
  title: { en: "Our overflow season", fr: "Notre saison de surplus" },
  excerpt: { en: "What we ran.", fr: "Ce que nous avons produit." },
  body: { en: "It went well.", fr: "Ça s’est bien passé." },
  seo: { title: { en: "", fr: "" }, description: { en: "", fr: "" } },
  coverImage: "/media/cover.webp",
};

describe("prepareArticle", () => {
  it("shapes a valid article, parses+dedupes tags, passes the cover through", () => {
    const result = prepareArticle(base);
    assert.equal(result.ok, true);
    const a = result.article!;
    assert.equal(a.slug, "overflow-season");
    assert.equal(a.status, "published");
    assert.deepEqual(a.tags, ["filling", "overflow"]);
    assert.equal(a.coverImage, "/media/cover.webp");
    assert.deepEqual(a.title, { en: "Our overflow season", fr: "Notre saison de surplus" });
    assert.deepEqual(a.seo.title, { en: null, fr: null });
  });

  it("rejects a bad slug and a bad date", () => {
    assert.equal(prepareArticle({ ...base, slug: "Not A Slug" }).ok, false);
    assert.equal(prepareArticle({ ...base, date: "2026-13-40" }).ok, false);
    assert.equal(prepareArticle({ ...base, date: "oct 2" }).ok, false);
  });

  it("requires a title in at least one language", () => {
    const result = prepareArticle({ ...base, title: { en: "", fr: "" } });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.path === "title"));
  });

  it("will not publish without a body in a titled locale", () => {
    const result = prepareArticle({ ...base, body: { en: "", fr: "" } });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.path === "status"));
  });

  it("defaults to draft, and a draft may be incomplete", () => {
    const result = prepareArticle({ ...base, status: "whatever", body: { en: "", fr: "" } });
    assert.equal(result.ok, true);
    assert.equal(result.article!.status, "draft");
  });

  it("refuses staffing wording (§4) and a forbidden claim (§1)", () => {
    const staffing = prepareArticle({ ...base, body: { en: "we send temp workers you supervise", fr: "" }, title: { en: "x", fr: "" } });
    assert.equal(staffing.ok, false);
    assert.ok(staffing.errors.some((e) => e.path === "body"));

    const claim = prepareArticle({ ...base, title: { en: "We are ISO certified", fr: "" }, body: { en: "x", fr: "" } });
    assert.equal(claim.ok, false);
    assert.ok(claim.errors.some((e) => e.path === "title"));
  });
});

describe("collection operations", () => {
  const a = prepareArticle(base).article!;
  const b = prepareArticle({ ...base, slug: "second", title: { en: "Second", fr: "Deuxième" } }).article!;

  it("appends a new article and replaces by slug", () => {
    const added = upsertArticle([a], b);
    assert.equal(added.ok, true);
    assert.equal(added.list!.length, 2);

    // Editing keeps the slug, so the form sends originalSlug — not a clash.
    const edited = prepareArticle({ ...base, title: { en: "Edited", fr: "Édité" } }).article!;
    const replaced = upsertArticle([a, b], edited, "overflow-season");
    assert.equal(replaced.ok, true);
    assert.equal(replaced.list!.length, 2);
    assert.equal(replaced.list!.find((x) => x.slug === "overflow-season")!.title.en, "Edited");
  });

  it("renames via originalSlug and rejects a slug clash", () => {
    const renamed = upsertArticle([a, b], prepareArticle({ ...base, slug: "renamed" }).article!, "overflow-season");
    assert.equal(renamed.ok, true);
    assert.deepEqual(renamed.list!.map((x) => x.slug).sort(), ["renamed", "second"]);

    const clash = upsertArticle([a, b], prepareArticle({ ...base, slug: "second" }).article!, "overflow-season");
    assert.equal(clash.ok, false);
  });

  it("removes and toggles status", () => {
    assert.deepEqual(removeArticle([a, b], "second").map((x) => x.slug), ["overflow-season"]);
    assert.equal(setArticleStatus([a], "overflow-season", "draft")[0].status, "draft");
  });
});
