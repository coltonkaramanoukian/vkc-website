import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyClientEntry, listFormValues, objectFormValues, sectionHasContent } from "./prefill.ts";
import { getSection, type ListSection, type ObjectSection } from "./sections.ts";

const contact = getSection("contact") as ObjectSection;
const capabilities = getSection("capabilities") as ObjectSection;
const clients = getSection("clients") as ListSection;

describe("objectFormValues", () => {
  it("turns nulls into empty strings and {en,fr} pairs for inputs", () => {
    const values = objectFormValues(contact, {
      phone: null,
      address: { city: "Montréal" },
      privacyOfficer: { title: { en: null, fr: "Responsable" } },
    });
    assert.equal(values.phone, "");
    assert.equal(values["address.city"], "Montréal");
    assert.deepEqual(values["privacyOfficer.title"], { en: "", fr: "Responsable" });
  });

  it("covers every declared field even when the source is empty", () => {
    const values = objectFormValues(capabilities, {});
    assert.deepEqual(values["minimumRunSize"], { en: "", fr: "" });
    assert.deepEqual(values["equipment.fillers"], { en: "", fr: "" });
  });
});

describe("listFormValues", () => {
  it("flattens entries and carries the logo passthrough", () => {
    const entries = listFormValues(clients, [
      { name: "Acme", approved: true, logo: "/media/acme.svg", quote: { text: { en: "Hi", fr: "Salut" }, name: "Jo" } },
    ]);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].values.name, "Acme");
    assert.equal(entries[0].values.approved, true);
    assert.deepEqual(entries[0].values["quote.text"], { en: "Hi", fr: "Salut" });
    assert.equal(entries[0].logo, "/media/acme.svg");
  });

  it("returns an empty list for the seeded empty file", () => {
    assert.deepEqual(listFormValues(clients, []), []);
  });
});

describe("emptyClientEntry", () => {
  it("has blank values for every field and no logo", () => {
    const entry = emptyClientEntry(clients);
    assert.equal(entry.logo, null);
    assert.equal(entry.values.name, "");
    assert.equal(entry.values.approved, false);
    assert.deepEqual(entry.values["quote.text"], { en: "", fr: "" });
  });
});

describe("sectionHasContent", () => {
  it("is false for all-null content and true once a field is set", () => {
    assert.equal(sectionHasContent(contact, { phone: null, address: {}, hours: {}, privacyOfficer: { title: {} } }), false);
    assert.equal(sectionHasContent(contact, { phone: "514-555-0199" }), true);
  });

  it("counts a list by its length", () => {
    assert.equal(sectionHasContent(clients, []), false);
    assert.equal(sectionHasContent(clients, [{ name: "Acme", approved: false }]), true);
  });
});
