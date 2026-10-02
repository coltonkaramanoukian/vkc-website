import { expect, test } from "@playwright/test";

// The header toggle is the only element carrying data-locale-switch, so it is an
// unambiguous target (the footer locale link is a plain <a>).
test.describe("locale switch", () => {
  test("EN → FR lands on the same page in French", async ({ page }) => {
    await page.goto("/en/services");
    await page.locator('[data-locale-switch="fr"]').click();
    await expect(page).toHaveURL(/\/fr\/services$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr-CA");
  });

  test("FR → EN lands on the same page in English", async ({ page }) => {
    await page.goto("/fr/services");
    await page.locator('[data-locale-switch="en"]').click();
    await expect(page).toHaveURL(/\/en\/services$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en-CA");
  });

  test("the switch follows a translated slug, not just the prefix", async ({ page }) => {
    await page.goto("/en/quote");
    await page.locator('[data-locale-switch="fr"]').click();
    // The FR quote slug is /fr/soumission, not /fr/quote.
    await expect(page).toHaveURL(/\/fr\/soumission$/);
  });
});
