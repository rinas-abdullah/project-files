import { test, expect } from "@playwright/test";
import { login, waitOutboxDelivered } from "./helpers";

test("voice documentation: dictation fills vitals for review, nothing sent before confirm", async ({ browser }) => {
  const medic = await login(browser, "paramedic@vitalink.demo");
  await medic.goto("/paramedic");
  // The ambulance may still be on the mission left by the previous spec: reuse its open case if so.
  if (await medic.getByTestId("new-mission-form").isVisible()) {
    await medic.getByTestId("incident-type").selectOption("MEDICAL_EMERGENCY");
    await medic.getByTestId("start-mission").click();
    await expect(medic.getByTestId("action-create-patient")).toBeVisible();
  }
  const create = medic.getByTestId("action-create-patient");
  if (!(await create.isVisible())) {
    await medic.locator('a[href^="/paramedic/"]').first().click();
  } else {
    await create.click();
    await medic.getByTestId("unknown-toggle").check();
    await medic.getByTestId("chief-complaint").fill("Collapsed in the sun at Arafat, confused");
    await medic.getByTestId("patient-priority").selectOption("P2");
    await medic.getByTestId("create-encounter").click();
  }
  await medic.waitForURL(/\/paramedic\/[a-z0-9]+$/);

  await medic.getByTestId("action-voice").click();
  // Headless Chromium has no microphone: the typed fallback goes through the same parser.
  await medic.getByTestId("voice-transcript").fill("سقط تحت الشمس مشوش الوعي حرارته 41.2 النبض 128 الأكسجين 93 الضغط 96 على 58 التنفس 26 جلاسكو 12");
  await expect(medic.getByTestId("voice-field-temp")).toHaveValue("41.2");
  await expect(medic.getByTestId("voice-field-hr")).toHaveValue("128");
  await expect(medic.getByTestId("voice-field-sys")).toHaveValue("96");
  await expect(medic.getByTestId("voice-field-dia")).toHaveValue("58");
  await expect(medic.getByTestId("voice-field-gcs")).toHaveValue("12");
  await expect(medic.locator("[data-testid=outbox-item]")).toHaveCount(0); // review first, nothing queued

  await medic.getByTestId("voice-field-hr").fill("126"); // paramedic corrects a value
  await medic.getByTestId("voice-submit").click();
  await waitOutboxDelivered(medic);
  await expect(medic.getByTestId("vital-TEMPERATURE")).toContainText("41.2");
  await expect(medic.getByTestId("vital-HEART_RATE")).toContainText("126");
  await medic.context().close();
});
