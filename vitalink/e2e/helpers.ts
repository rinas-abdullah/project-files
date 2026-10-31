import { expect, type Browser, type Page } from "@playwright/test";

export const PASSWORD = process.env.DEMO_PASSWORD ?? "VitaLink@2026";

export async function login(browser: Browser, email: string): Promise<Page> {
  const ctx = await browser.newContext();
  // Force English UI for stable selectors
  await ctx.addCookies([{ name: "vl-locale", value: "en", url: "http://localhost:3000" }]);
  const page = await ctx.newPage();
  await page.goto("/login");
  await page.fill("input[name=email]", email);
  await page.fill("input[name=password]", PASSWORD);
  await page.click("[data-testid=login-submit]");
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  return page;
}

export async function waitOutboxDelivered(page: Page) {
  await expect(page.locator('[data-testid=outbox-item][data-status="PENDING"], [data-testid=outbox-item][data-status="RETRYING"]')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.locator('[data-testid=outbox-item][data-status="FAILED"]')).toHaveCount(0);
}

export const NURSE_FOR: Record<string, string> = {
  "King Medical Center": "nurse@vitalink.demo",
  "North General Hospital": "nurse.ngh@vitalink.demo",
  "Coastal Emergency Hospital": "nurse.ceh@vitalink.demo",
  "University Medical Center": "nurse.umc@vitalink.demo",
};
