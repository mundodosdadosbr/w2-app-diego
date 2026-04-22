import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /começar de graça/i })).toBeVisible();
  });

  test("redirects to /login when hitting protected route without auth", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=/);
  });
});
