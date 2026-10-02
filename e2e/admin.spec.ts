import { expect, test } from "@playwright/test";

// The owner-only content editor (/admin). These cover the auth GATE, the login
// flow and the constitution's save-time feedback — none of which write content,
// so the spec never dirties content/*.json. The full save→publish→render loop is
// verified separately against a dev instance (git-commit-back can't run here,
// where the server is a production build). When ADMIN_PASSWORD/ADMIN_SESSION_SECRET
// aren't set (e.g. a bare CI), the password-dependent tests skip themselves.
const PASSWORD = process.env.ADMIN_PASSWORD ?? "";

async function adminConfigured(
  request: import("@playwright/test").APIRequestContext,
  baseURL: string | undefined,
): Promise<boolean> {
  // Send a same-origin probe so the server's CSRF check passes and we see the
  // real outcome: "not_configured" means no password/secret is set on the server.
  const response = await request.post("/api/admin/login", {
    data: { password: "__probe__" },
    headers: baseURL ? { Origin: new URL(baseURL).origin } : {},
    failOnStatusCode: false,
  });
  const body = (await response.json().catch(() => ({}))) as { code?: string };
  return body.code !== "not_configured";
}

test.describe("admin content editor", () => {
  test("an unauthenticated visit to /admin is sent to the login page", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole("heading", { name: "Content editor" })).toBeVisible();
  });

  test("the login page offers a password field, disabled until typed", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeDisabled();
  });

  test("a wrong password is rejected", async ({ page, request, baseURL }) => {
    test.skip(!(await adminConfigured(request, baseURL)), "admin not configured on this server");
    await page.goto("/admin/login");
    await page.getByLabel("Password").fill("definitely-not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    // Scope past Next's empty route-announcer (also role=alert) to the form message.
    await expect(page.getByText(/didn[’']t match/)).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("the right password reaches the dashboard, and the save guard blocks a forbidden claim", async ({ page, request, baseURL }) => {
    test.skip(!(await adminConfigured(request, baseURL)) || PASSWORD === "", "admin password not available to the test");

    await page.goto("/admin/login");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin$/);

    // Capabilities is text-only and never written here: a staffing term must be
    // refused inline (§4) rather than committed.
    await page.goto("/admin/capabilities");
    const crew = page.getByLabel("Crew size (EN)");
    await crew.fill("temporary workers you supervise");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.locator("[role=alert]").filter({ hasText: /staffing/ }).first()).toBeVisible();
  });
});
