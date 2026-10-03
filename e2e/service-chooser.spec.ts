import { expect, test } from "@playwright/test";

// "Which one fits your plant?" — two radio questions that point at one service.
// Tested on /services, which carries no scroll motion, so the interaction is
// clean. The result is a live region keyed by data-chooser-result.
test.describe("service chooser", () => {
  test("two answers point at Second Shift", async ({ page }) => {
    await page.goto("/en/services");
    const chooser = page.locator("[data-chooser]");
    await chooser.locator('input[name="pressure"][value="shifts"]').check();
    await chooser.locator('input[name="want"][value="ownLine"]').check();
    await expect(chooser.locator('[data-chooser-result="secondShift"]')).toBeVisible();
    await expect(chooser.getByRole("link", { name: /second shift/i })).toBeVisible();
  });

  test("a product not made yet points at toll blending", async ({ page }) => {
    await page.goto("/en/services");
    const chooser = page.locator("[data-chooser]");
    await chooser.locator('input[name="pressure"][value="blend"]').check();
    await chooser.locator('input[name="want"][value="unsure"]').check();
    await expect(chooser.locator('[data-chooser-result="tollBlending"]')).toBeVisible();
  });

  test("a full line plus output off that same line asks for a walkthrough", async ({ page }) => {
    await page.goto("/en/services");
    const chooser = page.locator("[data-chooser]");
    await chooser.locator('input[name="pressure"][value="line"]').check();
    await chooser.locator('input[name="want"][value="ownLine"]').check();
    await expect(chooser.locator('[data-chooser-result="walkthrough"]')).toBeVisible();
  });

  test("reset clears the answer back to the empty state", async ({ page }) => {
    await page.goto("/en/services");
    const chooser = page.locator("[data-chooser]");
    await chooser.locator('input[name="pressure"][value="shifts"]').check();
    await chooser.locator('input[name="want"][value="ownLine"]').check();
    await expect(chooser.locator("[data-chooser-result]")).toBeVisible();
    await chooser.getByRole("button", { name: /start over/i }).click();
    await expect(chooser.locator("[data-chooser-result]")).toHaveCount(0);
  });
});
