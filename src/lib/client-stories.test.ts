import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { clientStories } from "./client-stories.ts";

const quote = {
  text: { en: "They ran it.", fr: "Ils l’ont fait tourner." },
  name: "A. Person",
  role: { en: "Plant manager", fr: "Directrice d’usine" },
};
const caseStudy = { en: "What we ran.", fr: "Ce que nous avons fait." };

describe("clientStories", () => {
  it("renders nothing from an empty file", () => {
    assert.deepEqual(clientStories([], "en"), []);
  });

  it("never renders an unapproved client, even with a quote", () => {
    assert.deepEqual(clientStories([{ name: "X", approved: false, quote, caseStudy }], "en"), []);
  });

  it("requires approved to be strictly true", () => {
    const loose = { name: "X", approved: "yes" as unknown as boolean, quote };
    assert.deepEqual(clientStories([loose], "en"), []);
  });

  it("skips an approved client that has neither a quote nor a case study", () => {
    assert.deepEqual(clientStories([{ name: "X", approved: true }], "en"), []);
  });

  it("returns the quote in the page's language with its attribution", () => {
    const [story] = clientStories([{ name: "X", approved: true, quote }], "fr");
    assert.equal(story.quote?.text, "Ils l’ont fait tourner.");
    assert.equal(story.quote?.name, "A. Person");
    assert.equal(story.quote?.role, "Directrice d’usine");
    assert.equal(story.caseStudy, null);
  });

  it("drops a quote missing either language rather than showing half of it", () => {
    const half = { ...quote, text: { en: "They ran it.", fr: null } };
    assert.deepEqual(clientStories([{ name: "X", approved: true, quote: half }], "en"), []);
  });

  it("drops a quote with no named person", () => {
    const anon = { ...quote, name: "  " };
    assert.deepEqual(clientStories([{ name: "X", approved: true, quote: anon }], "en"), []);
  });

  it("keeps a quote whose role is missing, without a role", () => {
    const [story] = clientStories([{ name: "X", approved: true, quote: { ...quote, role: null } }], "en");
    assert.equal(story.quote?.role, null);
  });

  it("returns a case study only when both languages are written", () => {
    const [story] = clientStories([{ name: "X", approved: true, caseStudy }], "en");
    assert.equal(story.caseStudy, "What we ran.");
    const halfCase = { en: "What we ran.", fr: "" };
    assert.deepEqual(clientStories([{ name: "X", approved: true, caseStudy: halfCase }], "en"), []);
  });
});

describe("the 'no client logos' promise", () => {
  // home.plain.body and the about page say the site shows no client logos.
  // The day content/clients.json approves a client, both sentences become
  // false; this fails the suite until they are rewritten.
  const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
  const approved = (JSON.parse(read("content/clients.json")) as { approved?: unknown }[]).filter(
    (client) => client.approved === true,
  );
  const denial = /no (client|customer) logos|aucun logo de client/i;

  for (const locale of ["en", "fr"]) {
    it(`holds in ${locale} only while no client is approved`, () => {
      if (approved.length === 0) return;
      assert.doesNotMatch(read(`i18n/messages/${locale}.json`), denial);
    });
  }

  it("the tripwire still matches the sentences it guards", () => {
    // If the copy is reworded, the regex above must follow it or it guards nothing.
    if (approved.length > 0) return;
    assert.match(read("i18n/messages/en.json"), denial);
    assert.match(read("i18n/messages/fr.json"), denial);
  });
});
