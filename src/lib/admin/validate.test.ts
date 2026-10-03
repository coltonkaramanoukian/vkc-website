import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSection } from "./sections.ts";
import { prepareSection } from "./validate.ts";

const contact = getSection("contact")!;
const capabilities = getSection("capabilities")!;
const clients = getSection("clients")!;

function fields(values: Record<string, unknown>) {
  return { fields: values };
}

describe("prepareSection — contact", () => {
  it("coerces blanks to null and keeps the typed shape", () => {
    const result = prepareSection(contact, fields({ phone: "  ", email: "" }));
    assert.equal(result.ok, true);
    const content = result.content as { phone: unknown; email: unknown; address: { street: unknown } };
    assert.equal(content.phone, null);
    assert.equal(content.email, null);
    assert.equal(content.address.street, null, "missing nested fields still render as null");
  });

  it("keeps valid values and trims them", () => {
    const result = prepareSection(contact, fields({ phone: " 514-555-0199 ", email: "hi@example.com", "address.city": "Montréal" }));
    assert.equal(result.ok, true);
    const content = result.content as { phone: string; email: string; address: { city: string } };
    assert.equal(content.phone, "514-555-0199");
    assert.equal(content.email, "hi@example.com");
    assert.equal(content.address.city, "Montréal");
  });

  it("flags a malformed email and a too-short phone", () => {
    const result = prepareSection(contact, fields({ email: "not-an-email", phone: "123" }));
    assert.equal(result.ok, false);
    const paths = result.errors.map((e) => e.path);
    assert.ok(paths.includes("email"));
    assert.ok(paths.includes("phone"));
  });

  it("rejects a negative service radius but accepts a positive one", () => {
    assert.equal(prepareSection(contact, fields({ serviceRadiusKm: -5 })).ok, false);
    const ok = prepareSection(contact, fields({ serviceRadiusKm: "80" }));
    assert.equal(ok.ok, true);
    assert.equal((ok.content as { serviceRadiusKm: number }).serviceRadiusKm, 80);
  });

  it("builds the localized privacy title as an {en,fr} object", () => {
    const result = prepareSection(contact, fields({ "privacyOfficer.title": { en: "Privacy contact", fr: "Responsable" } }));
    assert.equal(result.ok, true);
    assert.deepEqual((result.content as { privacyOfficer: { title: unknown } }).privacyOfficer.title, {
      en: "Privacy contact",
      fr: "Responsable",
    });
  });

  it("rejects a forbidden claim (§1)", () => {
    const result = prepareSection(contact, fields({ "privacyOfficer.title": { en: "Certified officer", fr: "" } }));
    assert.equal(result.ok, false);
    assert.match(result.errors[0].message, /claim the site never makes/);
  });
});

describe("prepareSection — capabilities", () => {
  it("rejects staffing language in either locale (§4)", () => {
    const en = prepareSection(capabilities, fields({ "secondShift.crewSize": { en: "temp workers", fr: "" } }));
    assert.equal(en.ok, false);
    assert.match(en.errors[0].message, /staffing/);

    const fr = prepareSection(capabilities, fields({ "secondShift.crewSize": { en: "", fr: "personnel temporaire" } }));
    assert.equal(fr.ok, false);
  });

  it("allows a negated claim the published guard also allows", () => {
    const result = prepareSection(capabilities, fields({ "equipment.fillers": { en: "no certifications claimed", fr: "aucune certification" } }));
    assert.equal(result.ok, true);
  });
});

describe("prepareSection — clients", () => {
  it("drops a nameless row without erroring", () => {
    const result = prepareSection(clients, { items: [{ name: "  " }, { name: "Acme" }] });
    assert.equal(result.ok, true);
    assert.equal((result.content as unknown[]).length, 1);
  });

  it("assembles a quote object and coerces approved to a boolean", () => {
    const result = prepareSection(clients, {
      items: [{ name: "Acme", approved: true, url: "https://example.com", "quote.text": { en: "Great", fr: "Super" }, "quote.name": "Jordan" }],
    });
    assert.equal(result.ok, true);
    const [client] = result.content as [{ name: string; approved: boolean; url: string; quote: { text: unknown; name: string; role: unknown } }];
    assert.equal(client.approved, true);
    assert.equal(client.url, "https://example.com");
    assert.deepEqual(client.quote.text, { en: "Great", fr: "Super" });
    assert.equal(client.quote.name, "Jordan");
    assert.equal(client.quote.role, null, "an empty role collapses to null");
  });

  it("requires a name to attribute a quote to", () => {
    const result = prepareSection(clients, { items: [{ name: "Acme", "quote.text": { en: "Great", fr: "" } }] });
    assert.equal(result.ok, false);
    assert.equal(result.errors[0].path, "quote.name");
    assert.equal(result.errors[0].index, 0);
  });

  it("passes a logo through untouched (imaging stays Vito's lane)", () => {
    const result = prepareSection(clients, { items: [{ name: "Acme", logo: "/media/acme.svg" }] });
    assert.equal(result.ok, true);
    assert.equal((result.content as [{ logo?: string }])[0].logo, "/media/acme.svg");
  });

  it("flags a malformed website", () => {
    const result = prepareSection(clients, { items: [{ name: "Acme", url: "not a url" }] });
    assert.equal(result.ok, false);
    assert.equal(result.errors[0].path, "url");
  });

  it("defaults approved to false and omits an absent quote", () => {
    const result = prepareSection(clients, { items: [{ name: "Acme" }] });
    const [client] = result.content as [{ approved: boolean; quote?: unknown }];
    assert.equal(client.approved, false);
    assert.equal(client.quote, undefined);
  });
});
