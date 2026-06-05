import { test, expect } from "@playwright/test";

test.use({
  channel: "chrome",
  headless: false,
});

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (err) => {
    console.error("[Uncaught Page Error]:", err.message);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.error("[Console Error]:", msg.text());
    }
  });
});

test.describe("Google Chrome E2E Verification Suite", () => {
  
  test("Scroll Physics Focus Test", async ({ page }) => {
    // Navigate to homepage
    await page.goto("http://localhost:5173/");
    await page.waitForTimeout(1000);

    // Open AI widget
    const fab = page.locator(".ai_assistant_fab");
    await expect(fab).toBeVisible();
    await fab.click();

    const chatPanel = page.locator(".ai_assistant_panel");
    await expect(chatPanel).toBeVisible();

    const chatBody = page.locator(".ai_assistant_body");
    await expect(chatBody).toBeVisible();

    // Verify data-lenis-prevent attribute exists on the scrollable container
    const hasLenisPrevent = await chatBody.getAttribute("data-lenis-prevent");
    expect(hasLenisPrevent).not.toBeNull();
  });

  test("Route Navigation & Indecision Ingestion Test", async ({ page }) => {
    // Navigate to homepage
    await page.goto("http://localhost:5173/");
    await page.waitForTimeout(1000);

    // Open AI widget
    const fab = page.locator(".ai_assistant_fab");
    await fab.click();

    // Verify chat body is visible
    const input = page.locator(".ai_assistant_input");
    await expect(input).toBeVisible();

    // Ask with extreme indecision settling on wish analytics
    await input.fill("take me to the planner, wait no, calculator, actually nevermind, show my wish analytics");
    await page.click(".ai_assistant_send");

    // Wait for the route transition to complete (navigating to /wish-analytics)
    await page.waitForURL("**/wish-analytics", { timeout: 15000 });

    // Assert that the URL is indeed /wish-analytics
    expect(page.url()).toContain("/wish-analytics");
  });

  test("Protected Route Authentication Guard Test", async ({ page }) => {
    // Navigate to homepage as a guest (logged out)
    await page.goto("http://localhost:5173/");
    await page.waitForTimeout(1000);

    // Open AI widget
    const fab = page.locator(".ai_assistant_fab");
    await fab.click();

    const input = page.locator(".ai_assistant_input");
    await expect(input).toBeVisible();

    // Ask to navigate to a protected route (planner)
    await input.fill("take me to the planner");
    await page.click(".ai_assistant_send");

    // AI widget should explain why redirection was prevented
    const lastMessage = page.locator(".ai_assistant_bubble--assistant").last();
    await expect(lastMessage).toContainText("Paimon tried to open your Planner page, but it looks like you aren't signed in yet!");

    // Guest should NOT be redirected and URL should remain the starting URL
    expect(page.url()).toBe("http://localhost:5173/");
  });
});
