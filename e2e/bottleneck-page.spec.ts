import { expect, test } from "@playwright/test";

// SITE-GAPS C8: the service the cold-call pitch names has a page in both
// locales, and each is a full member of the site: in the menu, the sitemap and
// the hreflang set, with the switch following the translated slug.
const PAGES = [
  {
    locale: "en",
    path: "/en/services/bottleneck",
    lang: "en-CA",
    h1: "Bottleneck: your overflow, packaged and blended at VKC.",
    scope: "New projects: non-epoxy products only.",
  },
  {
    locale: "fr",
    path: "/fr/services/goulot",
    lang: "fr-CA",
    h1: "Goulot : votre surplus, emballé et mélangé chez VKC.",
    scope: "Nouveaux projets : produits sans époxy seulement.",
  },
] as const;

const ALTERNATES = {
  "fr-CA": "/fr/services/goulot",
  "en-CA": "/en/services/bottleneck",
  "x-default": "/fr/services/goulot",
};

test.describe("Bottleneck / Goulot page", () => {
  for (const p of PAGES) {
    test(`${p.path} renders in ${p.locale}`, async ({ page }) => {
      const response = await page.goto(p.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", p.lang);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(p.h1);
      await expect(page.getByText(p.scope, { exact: true })).toBeVisible();
    });

    test(`${p.path} carries the full hreflang set and its own canonical`, async ({ page }) => {
      await page.goto(p.path);
      const alternates = await page
        .locator('link[rel="alternate"][hreflang]')
        .evaluateAll((links) =>
          Object.fromEntries(
            links.map((l) => [l.getAttribute("hreflang"), new URL(l.getAttribute("href") ?? "").pathname]),
          ),
        );
      expect(alternates).toEqual(ALTERNATES);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(new URL(canonical ?? "").pathname).toBe(p.path);
    });

    test(`${p.path} is in the sitemap`, async ({ request }) => {
      const response = await request.get("/sitemap.xml");
      expect(response.status()).toBe(200);
      const locs = [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
      expect(locs).toContain(p.path);
    });
  }

  test("the menu lists the page under Services", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en");
    await page.locator("summary.menu-summary").click();
    await page.locator(".menu-panel").getByRole("link", { name: "Bottleneck", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/services\/bottleneck$/);
  });

  test("the locale switch follows the translated slug", async ({ page }) => {
    await page.goto("/en/services/bottleneck");
    await page.locator('[data-locale-switch="fr"]').click();
    await expect(page).toHaveURL(/\/fr\/services\/goulot$/);
  });
});
