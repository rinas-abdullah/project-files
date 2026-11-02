import { test, expect } from "@playwright/test";
import { login } from "./helpers";

async function caseIdByName(page: import("@playwright/test").Page, name: string) {
  await page.goto(`/cases?q=${encodeURIComponent(name)}`);
  const href = await page.locator("tbody a[href^='/cases/']").first().getAttribute("href");
  expect(href).toBeTruthy();
  return href!.split("/").pop()!;
}

test("unauthenticated access is blocked", async ({ request, page }) => {
  expect((await request.get("/api/stream")).status()).toBe(401);
  expect((await request.post("/api/encounters", { data: {} })).status()).toBe(401);
  await page.goto("/ed");
  await expect(page).toHaveURL(/\/login/);
});

test("tenant isolation and RBAC", async ({ browser }) => {
  const dispatch = await login(browser, "dispatch@vitalink.demo");
  const umcCase = await caseIdByName(dispatch, "Faisal Al-Qahtani"); // destined to University Medical Center

  // KMC nurse cannot see a UMC case, nor call dispatch-only APIs
  const nurse = await login(browser, "nurse@vitalink.demo");
  const resp = await nurse.goto(`/cases/${umcCase}`);
  expect(resp?.status()).toBe(404);
  expect((await nurse.request.post(`/api/encounters/${umcCase}/divert`, { data: { hospitalId: "x", reason: "testing" } })).status()).toBe(403);
  expect((await nurse.request.post(`/api/encounters/${umcCase}/acknowledge`, { data: {} })).status()).toBe(404);

  // Paramedic of JED-A01 cannot write into another ambulance's case or open the command center
  const medic = await login(browser, "paramedic@vitalink.demo");
  expect((await medic.request.post(`/api/encounters/${umcCase}/vitals`, { data: { vitals: [{ type: "HEART_RATE", value: 80 }] } })).status()).toBe(404);
  expect((await medic.goto("/command"))?.status()).toBe(404);

  // Validation errors are rejected (zod)
  expect((await dispatch.request.post(`/api/missions`, { data: { incidentType: "NOPE" } })).status()).toBe(422);

  // Auditor reads the audit log but cannot run the demo
  const auditor = await login(browser, "auditor@vitalink.demo");
  await auditor.goto("/admin/audit");
  await expect(auditor.getByTestId("audit-table")).toContainText("auth.login");
  expect((await auditor.request.post(`/api/demo`, { data: { action: "vital", encounterId: umcCase } })).status()).toBe(403);
});

test("dispatch diverts a case: old ED sees CASE DIVERTED, new ED receives it", async ({ browser }) => {
  const dispatch = await login(browser, "dispatch@vitalink.demo");
  const id = await caseIdByName(dispatch, "Khalid Al-Ghamdi"); // pre-alerted to King Medical Center

  const kmcNurse = await login(browser, "nurse@vitalink.demo");
  await kmcNurse.goto("/ed");
  await expect(kmcNurse.locator('[data-testid=incoming-card]:has-text("Khalid Al-Ghamdi")')).toBeVisible();

  await dispatch.goto(`/cases/${id}`);
  await dispatch.getByTestId("divert-open").click();
  await dispatch.getByTestId("divert-hospital").selectOption({ label: "University Medical Center" });
  await dispatch.getByTestId("divert-reason").fill("King Medical Center cath lab team busy — diversion approved");
  await dispatch.getByTestId("divert-submit").click();

  // Old hospital: live "CASE DIVERTED"
  await expect(kmcNurse.locator('[data-testid=incoming-card]:has-text("Khalid Al-Ghamdi") [data-testid=case-diverted]')).toBeVisible({ timeout: 20_000 });

  // New hospital receives it and can acknowledge
  const umcNurse = await login(browser, "nurse.umc@vitalink.demo");
  await umcNurse.goto(`/cases/${id}`);
  await expect(umcNurse.getByTestId("acknowledge")).toBeVisible();
  await umcNurse.getByTestId("tab-destination").click();
  await expect(umcNurse.getByTestId("destination-panel")).toContainText("cath lab team busy");
});

test("Arabic RTL, analytics from database, honest integration status", async ({ browser }) => {
  const analyst = await login(browser, "analyst@vitalink.demo");
  await analyst.goto("/analytics/overview?days=60");
  const cases = Number(await analyst.getByTestId("analytics-cases").locator("div").nth(1).innerText());
  expect(cases).toBeGreaterThan(50);

  await analyst.getByTestId("lang-switch").click();
  await expect(analyst.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(analyst.locator("body")).toContainText("التحليلات");
  await analyst.getByTestId("lang-switch").click();
  await expect(analyst.locator("html")).toHaveAttribute("dir", "ltr");

  const admin = await login(browser, "admin@vitalink.demo");
  // A live mode cannot be claimed without credentials
  expect((await admin.request.post("/api/integrations/NAFATH", { data: { status: "CONNECTED" } })).status()).toBe(409);
  await admin.goto("/admin/integrations");
  await expect(admin.locator('[data-integration="NAFATH"]')).toContainText("Simulated");
  await expect(admin.locator('[data-integration="EPCR"]')).toContainText("Not configured");
});
