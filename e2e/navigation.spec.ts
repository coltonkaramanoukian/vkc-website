import { expect, test } from "@playwright/test";

test.describe("navigation", () => {
  test("a desktop primary-nav link opens its page", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/en");
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Industries", exact: true })
      .click();
    await expect(page).toHaveURL(/\/en\/industries$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("the menu opens on a phone and navigates", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en");
    // The menu is a <details>; its <summary> carries the label.
    await page.locator("summary.menu-summary").click();
    await page
      .locator(".menu-panel")
      .getByRole("link", { name: "Glossary", exact: true })
      .click();
    await expect(page).toHaveURL(/\/en\/glossary$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
