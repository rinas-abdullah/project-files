import { test, expect } from "@playwright/test";
import { login, waitOutboxDelivered, NURSE_FOR } from "./helpers";
import { sceneImage } from "../src/lib/png";

/**
 * The main VitaLink scenario, end to end, with the ambulance and the ED in
 * two simultaneous browser sessions. Requires a freshly seeded database
 * (`npm run db:seed`) so that JED-A01 is available.
 */
test("ambulance → ED → geofence → handover → return to service", async ({ browser }) => {
  const typedName = `E2E Patient ${Date.now().toString().slice(-5)}`;
  let patientName = typedName;

  // ───────── Paramedic: login → new mission → create patient
  const medic = await login(browser, "paramedic@vitalink.demo");
  await medic.goto("/paramedic");
  await expect(medic.getByTestId("new-mission-form")).toBeVisible();
  await medic.getByTestId("incident-type").selectOption("CARDIAC");
  await medic.getByTestId("start-mission").click();
  await medic.getByTestId("action-create-patient").click();
  await medic.getByTestId("patient-name").fill(typedName);
  await medic.getByTestId("patient-age").fill("61");
  await medic.getByTestId("chief-complaint").fill("Chest pain radiating to left arm, diaphoresis");
  await medic.getByTestId("patient-priority").selectOption("P2");
  await medic.getByTestId("create-encounter").click();
  await medic.waitForURL(/\/paramedic\/[a-z0-9]+$/);
  await expect(medic.getByTestId("patient-label")).toHaveText(typedName);
  const missionId = await medic.getByTestId("mission-code").getAttribute("data-mission-id");
  expect(missionId).toBeTruthy();

  // ───────── Identify patient (simulated Nafath) → health record
  await medic.getByTestId("action-identify").click();
  await medic.getByTestId("identify-nid").fill("1098765432");
  await medic.getByTestId("identify-submit").click();
  await expect(medic.getByTestId("identify-result")).toContainText("Identity verified");
  await medic.keyboard.press("Escape");
  await expect(medic.getByTestId("health-profile")).toBeVisible();
  // The verified identity (synthetic, simulated Nafath) becomes the patient's name
  await expect(medic.getByTestId("patient-label")).not.toHaveText(typedName);
  patientName = (await medic.getByTestId("patient-label").innerText()).trim();

  // ───────── Vitals, intervention, medication (via offline-capable outbox)
  await medic.getByTestId("action-vitals").click();
  const vf = medic.getByTestId("vitals-form");
  await vf.locator("input[name=hr]").fill("118");
  await vf.locator("input[name=sys]").fill("96");
  await vf.locator("input[name=dia]").fill("60");
  await vf.locator("input[name=spo2]").fill("89");
  await vf.locator("input[name=rr]").fill("24");
  await vf.locator("input[name=gcs]").fill("14");
  await medic.getByTestId("vitals-submit").click();
  await waitOutboxDelivered(medic);
  await expect(medic.getByTestId("vital-SPO2")).toContainText("89");

  await medic.getByTestId("action-intervention").click();
  await medic.getByTestId("intervention-ECG").click();
  await medic.getByTestId("intervention-submit").click();
  await medic.getByTestId("action-medication").click();
  await medic.getByTestId("med-name").fill("Aspirin");
  await medic.getByTestId("med-dose").fill("300 mg");
  await medic.getByTestId("medication-submit").click();
  await waitOutboxDelivered(medic);

  // ───────── Offline: queued locally, synced when back online (never shown as delivered while offline)
  await medic.getByTestId("simulate-offline").check();
  await expect(medic.getByTestId("connection-status")).toContainText("Offline");
  await medic.getByTestId("action-note").click();
  await medic.getByTestId("note-text").fill("Patient anxious, pain 8/10");
  await medic.getByTestId("note-submit").click();
  await expect(medic.locator('[data-testid=outbox-item][data-status="PENDING"]')).toHaveCount(1);
  await medic.getByTestId("simulate-offline").uncheck();
  await waitOutboxDelivered(medic);

  // ───────── Upload image
  await medic.getByTestId("action-media").click();
  await medic.getByTestId("media-file").setInputFiles({ name: "scene.png", mimeType: "image/png", buffer: sceneImage(1) });
  await medic.getByTestId("media-submit").click();
  await expect(medic.getByTestId("media-form")).toBeHidden();

  // ───────── AI-assisted triage → confirm
  await medic.getByTestId("triage-run").click();
  await expect(medic.getByTestId("triage-confirm")).toBeVisible();
  await medic.getByTestId("triage-confirm").click();
  await expect(medic.getByTestId("triage-confirm")).toBeHidden();

  // ───────── Smart destination → select recommended hospital
  await medic.getByTestId("destination-run").click();
  await expect(medic.getByTestId("recommended-hospital")).toBeVisible();
  await medic.getByTestId("select-recommended").click();
  await expect(medic.getByTestId("paramedic-destination")).not.toContainText("No destination");
  const destination = (await medic.getByTestId("paramedic-destination").innerText()).trim();
  const nurseEmail = NURSE_FOR[destination];
  expect(nurseEmail, `nurse for ${destination}`).toBeTruthy();

  // ───────── ED opens dashboard BEFORE the pre-alert: case must appear live, without reload
  const nurse = await login(browser, nurseEmail);
  await nurse.goto("/ed");
  await expect(nurse.getByTestId("live-indicator")).toContainText("Live");
  await expect(nurse.locator(`[data-testid=incoming-card]:has-text("${patientName}")`)).toHaveCount(0);

  await medic.getByTestId("action-prealert").click();
  await waitOutboxDelivered(medic);
  const card = nurse.locator(`[data-testid=incoming-card]:has-text("${patientName}")`);
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card.getByTestId("card-SPO2")).toContainText("89");

  // ───────── ED: open case → review → acknowledge → prepare
  await card.getByTestId("open-case").click();
  await expect(nurse.getByTestId("case-patient")).toHaveText(patientName);
  await nurse.getByTestId("tab-interventions").click();
  await nurse.waitForURL(/tab=interventions/);
  await expect(nurse.locator("table").getByText("12-lead ECG")).toBeVisible();
  await nurse.getByTestId("tab-history").click();
  await nurse.waitForURL(/tab=history/);
  await expect(nurse.getByTestId("health-profile")).toBeVisible();
  await nurse.getByTestId("acknowledge").click();
  await expect(nurse.getByTestId("ack-status")).toContainText("ED Nurse", { timeout: 15_000 });
  await nurse.getByTestId("tab-preparation").click();
  await nurse.waitForURL(/tab=preparation/);
  await nurse.getByTestId("prep-TEAM_NOTIFIED").click();
  await nurse.getByTestId("prep-CATH_LAB_ALERTED").click();
  await nurse.getByTestId("readiness-READY").click();

  // ───────── Ambulance receives acknowledgment + readiness live
  await expect(medic.getByTestId("paramedic-ack")).toContainText("Hospital acknowledged");
  await expect(medic.getByTestId("paramedic-readiness")).toContainText("Ready");

  // ───────── Live location / ETA updates → geofence → arrival
  const etaBefore = await medic.getByTestId("eta").innerText();
  const step = await medic.request.post(`/api/missions/${missionId}/drive`, { data: { action: "step", steps: 6 } });
  expect(step.ok()).toBeTruthy();
  await expect(medic.getByTestId("eta")).not.toHaveText(etaBefore);
  const geo = await medic.request.post(`/api/missions/${missionId}/drive`, { data: { action: "geofence" } });
  expect(geo.ok()).toBeTruthy();
  await expect(medic.getByTestId("phase")).toContainText(/Arriving|Arrived/);
  await nurse.goto("/alerts");
  await expect(nurse.locator('[data-alert-type="GEOFENCE_ENTERED"]').first()).toBeVisible();
  const arrive = await medic.request.post(`/api/missions/${missionId}/drive`, { data: { action: "arrive" } });
  expect(arrive.ok()).toBeTruthy();

  // ───────── Handover
  await expect(medic.getByTestId("handover-start")).toBeVisible();
  await medic.getByTestId("handover-start").click();
  await nurse.goBack();
  await nurse.getByTestId("tab-handover").click();
  await nurse.waitForURL(/tab=handover/);
  await nurse.getByTestId("handover-accept").click();
  await nurse.getByTestId("handover-complete").click();
  await expect(nurse.getByTestId("handover-panel")).toContainText("Completed");
  await nurse.getByTestId("tab-overview").click();
  await nurse.waitForURL(/tab=overview/);
  await expect(nurse.getByTestId("registration-status")).toContainText("Registration confirmed");

  // ───────── Ambulance returns to service
  await expect(medic.getByTestId("release-ambulance")).toBeVisible();
  await medic.getByTestId("release-ambulance").click();
  await medic.waitForURL(/\/paramedic$/);
  await expect(medic.getByTestId("new-mission-form")).toBeVisible();
  await expect(medic.getByText("Available")).toBeVisible();
});
