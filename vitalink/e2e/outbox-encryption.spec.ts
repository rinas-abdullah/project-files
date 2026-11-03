import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("offline outbox is encrypted on the device", async ({ browser }) => {
  const medic = await login(browser, "paramedic@vitalink.demo");
  await medic.goto("/paramedic");
  await medic.getByTestId("incident-type").selectOption("MEDICAL_EMERGENCY");
  await medic.getByTestId("start-mission").click();
  await medic.getByTestId("action-create-patient").click();
  await medic.getByTestId("unknown-toggle").check();
  await medic.getByTestId("chief-complaint").fill("Collapsed in the sun, confused");
  await medic.getByTestId("patient-priority").selectOption("P1");
  await medic.getByTestId("create-encounter").click();
  await medic.waitForURL(/\/paramedic\/[a-z0-9]+$/);
  await expect(medic.getByTestId("outbox")).toBeVisible();

  await medic.getByTestId("simulate-offline").check();
  await medic.getByTestId("action-note").click();
  await medic.getByTestId("note-text").fill("Collapsed near Jamarat, core temp 41.2");
  await medic.getByTestId("note-submit").click();
  await expect(medic.locator("[data-testid=outbox-item][data-status=PENDING]").first()).toBeVisible();

  const stored = await medic.evaluate(() => Object.entries(localStorage).filter(([k]) => k.startsWith("vl-outbox:") && !k.endsWith(":offline")));
  expect(stored.length).toBe(1);
  await expect.poll(async () => (await medic.evaluate((k) => localStorage.getItem(k), stored[0][0])) ?? "").toMatch(/^enc1:/);
  const value = (await medic.evaluate((k) => localStorage.getItem(k), stored[0][0])) ?? "";
  expect(value).not.toContain("Jamarat");

  await medic.getByTestId("simulate-offline").uncheck();
  await expect(medic.locator("[data-testid=outbox-item][data-status=PENDING]")).toHaveCount(0, { timeout: 30_000 });
  await medic.context().close();
});
