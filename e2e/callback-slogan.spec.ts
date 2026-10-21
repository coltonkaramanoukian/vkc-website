import { expect, test } from "@playwright/test";

// A prospect who got a call from VKC lands on the visit page (via /v); the
// page must speak to them. The slogan rides in the footer on every page. Both
// are fetched as rendered HTML (no browser), in both locales. FR keeps its
// no-break space before ":" (the repo's French typography).
const NB = " ";

const callback = {
  fr: { path: "/fr/visite", text: `Vous avez reçu un appel de VKC? Laissez votre nom et un numéro${NB}: on vous rappelle pour fixer une visite.` },
  en: { path: "/en/visit", text: "Got a call from VKC? Leave your name and a number, and we’ll call you back to set up a visit." },
} as const;

const slogan = {
  fr: { paths: ["/fr", "/fr/visite"], text: "L’usine d’à côté." },
  en: { paths: ["/en", "/en/visit"], text: "The plant next door." },
} as const;

for (const locale of ["fr", "en"] as const) {
  test.describe(`${locale}: the callback line and the slogan`, () => {
    test(`${callback[locale].path} carries the "got a call from VKC?" line`, async ({ request }) => {
      const res = await request.get(callback[locale].path);
      expect(res.status()).toBe(200);
      expect(await res.text()).toContain(callback[locale].text);
    });

    for (const path of slogan[locale].paths) {
      test(`${path} carries the slogan`, async ({ request }) => {
        const res = await request.get(path);
        expect(res.status()).toBe(200);
        expect(await res.text()).toContain(slogan[locale].text);
      });
    }
  });
}
