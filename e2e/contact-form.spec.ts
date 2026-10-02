import { expect, test } from "@playwright/test";

// The contact form validates server-side (the route returns 400 with per-field
// errors); the client marks the fields and announces the problem. An empty
// submit must not leave the page or fail silently.
test.describe("contact form validation", () => {
  test("an empty submit surfaces field errors and stays put", async ({ page }) => {
    await page.goto("/en/contact");
    await page.locator('#contact-form button[type="submit"]').click();

    await expect(page.locator("#contact-form")).toHaveAttribute("data-form-status", "invalid");
    await expect(page.locator("#contact-company")).toHaveAttribute("aria-invalid", "true");
    // Scope to the form's own alert (Next's route announcer is also role=alert).
    await expect(page.locator("#contact-form [role=alert]")).toContainText(/check the fields/i);
    await expect(page).toHaveURL(/\/en\/contact$/);
  });

  test("a required field reports itself in words", async ({ page }) => {
    await page.goto("/en/contact");
    await page.locator('#contact-form button[type="submit"]').click();
    // The company field is required; its message renders beneath it.
    await expect(page.locator("#contact-company-error")).toHaveText(/required/i);
  });
});
