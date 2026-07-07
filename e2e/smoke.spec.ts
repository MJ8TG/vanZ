import { test, expect } from "@playwright/test";

test.describe("VanZ web smoke tests", () => {
  test("French homepage loads with hero and VanZ branding", async ({ page }) => {
    await page.goto("/fr");
    await expect(page).toHaveTitle(/VanZ/i);
    await expect(page.locator("body")).toContainText(/VanZ/i);
    await expect(page.locator("#hero")).toBeVisible();
  });

  test("Arabic homepage uses RTL layout", async ({ page }) => {
    await page.goto("/ar");
    await expect(
      page.locator('div.min-h-screen[dir="rtl"]').first(),
    ).toBeVisible();
    await expect(page.locator("body")).toBeVisible();
  });

  test("Login page renders email form", async ({ page }) => {
    await page.goto("/fr/login");
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });

  test("Simulator page loads interactive demo", async ({ page }) => {
    await page.goto("/fr/simulator");
    await expect(page.locator("body")).toContainText(/Simulateur|simulation/i);
  });

  test("Driver dashboard page is reachable", async ({ page }) => {
    const response = await page.goto("/fr/chauffeur/dashboard");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });
});
