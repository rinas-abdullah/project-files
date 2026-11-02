import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("demo simulation panel drives a full journey for the unknown patient", async ({ browser }) => {
  const admin = await login(browser, "admin@vitalink.demo");
  await admin.goto(`/cases?q=UNKNOWN-MALE-00482`);
  const id = (await admin.locator("tbody a[href^='/cases/']").first().getAttribute("href"))!.split("/").pop()!;
  const run = async (action: string, extra: Record<string, unknown> = {}) => {
    const r = await admin.request.post("/api/demo", { data: { action, encounterId: id, ...extra } });
    expect(r.status(), `${action}: ${await r.text()}`).toBe(200);
    return r.json();
  };

  // Medical monitor stream adds readings automatically
  const before = await admin.request.get(`/cases/${id}?tab=vitals`).then((r) => r.text());
  await run("monitor_start");
  await admin.waitForTimeout(9000);
  await run("monitor_stop");
  await admin.goto(`/cases/${id}?tab=vitals`);
  await expect(admin.locator("tbody tr").first()).toContainText(/Monitor|Simulated/);
  expect(before.length).toBeGreaterThan(0);

  for (const a of ["vital", "upload_image", "triage", "destination", "ack", "move", "delay"]) await run(a);
  await run("condition", { trend: "CRITICAL" });
  await run("resource", { resourceType: "CT_STATUS" });
  await run("resource", { resourceType: "CT_STATUS" }); // toggle back
  const idr = await run("identify");
  expect(idr.status).toBe("VERIFIED");
  await run("geofence");
  await run("arrive");
  await run("handover");
  await run("release");

  await admin.goto(`/cases/${id}`);
  await expect(admin.getByTestId("case-patient")).not.toHaveText("UNKNOWN-MALE-00482");
  await admin.getByTestId("tab-timeline").click();
  await admin.waitForURL(/tab=timeline/);
  const tl = admin.getByTestId("timeline");
  for (const ev of ["Temporary identity matched|Identity detected", "Hospital acknowledged", "Entered hospital geofence", "Handover completed", "Ambulance released", "Media uploaded"]) {
    await expect(tl).toContainText(new RegExp(ev));
  }
});
