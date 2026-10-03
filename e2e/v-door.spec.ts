import { expect, test } from "@playwright/test";

// /v is the QR door: a 307 to the visit page in the browser's language, falling
// back to French (D17). Asserted at the redirect itself, not after following it.
test.describe("the /v QR door", () => {
  test("an English browser is sent to /en/visit", async ({ request }) => {
    const res = await request.get("/v", {
      maxRedirects: 0,
      headers: { "Accept-Language": "en-CA,en;q=0.9" },
    });
    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toMatch(/\/en\/visit$/);
  });

  test("a French browser is sent to /fr/visite", async ({ request }) => {
    const res = await request.get("/v", {
      maxRedirects: 0,
      headers: { "Accept-Language": "fr-CA,fr;q=0.9" },
    });
    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toMatch(/\/fr\/visite$/);
  });

  test("an unsupported language falls back to French", async ({ request }) => {
    const res = await request.get("/v", {
      maxRedirects: 0,
      headers: { "Accept-Language": "de-DE,de;q=0.9" },
    });
    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toMatch(/\/fr\/visite$/);
  });
});
