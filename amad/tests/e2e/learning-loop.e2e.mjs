/**
 * End-to-end test of the AMAD learning loop in a real browser against a running
 * server and real PostgreSQL:
 *   Register/Login → Command Center → Start Simulation → Defensive Actions →
 *   Containment → Forensics → Readiness Score → Next Training Recommendation.
 *
 * Usage: BASE_URL=http://localhost:3100 node tests/e2e/learning-loop.e2e.mjs
 * Screenshots are written to E2E_SCREENSHOTS (default: ./e2e-artifacts).
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const OUT = process.env.E2E_SCREENSHOTS ?? "e2e-artifacts";
mkdirSync(OUT, { recursive: true });

const email = `e2e-${Date.now()}@test.local`;
const password = "E2eStr0ngPass!";
const steps = [];
const step = (name) => {
  steps.push(name);
  console.log(`✓ ${name}`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));
const failedResponses = [];
page.on("response", (r) => r.status() >= 400 && failedResponses.push(`${r.status()} ${new URL(r.url()).pathname}`));
const shot = (n) => page.screenshot({ path: path.join(OUT, `${n}.png`), fullPage: true });

async function command(cmd) {
  const before = await page.locator('[aria-live="polite"] > div.mb-2').count();
  await page.fill("#cmd", cmd);
  await page.click('form:has(#cmd) button[type="submit"]');
  // Wait for the console to grow (server persisted + page refreshed) or the phase to change.
  await page.waitForFunction(
    (n) => document.querySelectorAll('[aria-live="polite"] > div.mb-2').length > n || !document.querySelector("#cmd"),
    before,
    { timeout: 15000 },
  );
  await page.waitForLoadState("networkidle");
}

const inForensics = async () => (await page.getByText("مستكشف الأدلة").count()) > 0;

try {
  // Unauthenticated access is redirected to login.
  await page.goto(`${BASE}/app`);
  await page.waitForURL(/\/login/);
  step("unauthenticated /app redirects to /login");

  // Register (creates a new organization; user is its admin).
  await page.goto(`${BASE}/register`);
  await page.fill("#f-name", "متدرب الاختبار");
  await page.fill("#f-email", email);
  await page.fill("#f-password", password);
  await page.fill("#f-orgName", "منظمة اختبار E2E");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/app`);
  await page.getByText("لا توجد قياسات بعد").waitFor();
  step("register → Command Center shows honest empty state");

  // Logout, then login again.
  await page.getByRole("button", { name: "تسجيل الخروج" }).click();
  await page.waitForURL(/\/login/);
  await page.fill("#f-email", "wrong@test.local");
  await page.fill("#f-password", "nope-nope-1");
  await page.click('button[type="submit"]');
  await page.getByRole("alert").waitFor();
  // React resets the form after a server action; wait for that, then fill.
  await page.waitForFunction(() => document.querySelector("#f-email")?.value === "wrong@test.local" && document.querySelector("#f-password")?.value === "");
  await page.waitForLoadState("networkidle");
  await page.fill("#f-email", email);
  await page.fill("#f-password", password);
  assert.equal(await page.inputValue("#f-password"), password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/app`);
  step("logout, failed login shows error, valid login reaches dashboard");
  await shot("01-command-center-empty");

  // Start the computed starter scenario.
  await page.getByRole("button", { name: "ابدأ أول تدريب" }).click();
  await page.waitForURL(/\/app\/sessions\/[a-z0-9]+$/);
  const sessionUrl = page.url();
  await page.getByText("وحدة التحكم الدفاعية").waitFor();
  step("start simulation → Defensive Arena");

  // Unsafe input is rejected by the server.
  await page.fill("#cmd", "rm -rf /");
  await page.click('form:has(#cmd) button[type="submit"]');
  await page.getByText("رموز غير مسموحة").waitFor();
  step("unsafe console input rejected");

  // Investigate, then contain based on what the console reveals.
  await command("logs web-01");
  const consoleText = await page.locator('[aria-live="polite"]').innerText();
  const ip = consoleText.match(/(\d+\.\d+\.\d+\.\d+) "POST \/upload\.php/)?.[1];
  assert.ok(ip, "attacker IP should be visible in web.log output");
  step(`investigation surfaced attacker IP ${ip}`);
  await shot("02-arena-investigation");

  const plan = [`block ${ip}`, "disable svc-web", "image web-01", "isolate web-01", "contain"];
  const fallback = ["netstat db-01", "logs db-01", "image db-01", "isolate db-01", "contain"];
  for (const c of [...plan, ...fallback]) {
    if (await inForensics()) break;
    await command(c);
  }
  // Reload: state must come from the server, not the browser.
  await page.goto(sessionUrl);
  await page.getByText("مستكشف الأدلة").waitFor({ timeout: 10000 });
  step("live phase ended (containment or adversary objective) → Forensics workspace, persisted across reload");
  await shot("03-forensics");

  // Investigation.
  await page.locator("select").filter({ hasText: "web-01 ·" }).first().selectOption("web-01");
  await page.locator("select").filter({ hasText: "T1190" }).first().selectOption("T1190");
  await page.locator("label").filter({ hasText: /^web-01$/ }).locator("input").check();
  await page.locator("label").filter({ hasText: /^svc-web$/ }).locator("input").check().catch(() => {});
  for (const t of ["T1190", "T1505.003"]) {
    await page.locator("#seq-pick").selectOption(t);
    await page.getByRole("button", { name: "إضافة" }).click();
  }
  const firstUpload = page.locator("li", { hasText: "POST /upload.php" }).locator('input[type="checkbox"]').first();
  if (await firstUpload.count()) await firstUpload.check();
  await page.fill("textarea", "استغل المهاجم ثغرة رفع الملفات في بوابة الطلاب وزرع ملف ويب خبيث، فحُظر عنوانه وعُزل الخادم.");
  await page.getByRole("button", { name: "تسليم التحقيق واحتساب الجاهزية" }).click();
  await page.getByText("مؤشر الجاهزية لهذه الجلسة").waitFor({ timeout: 15000 });
  step("investigation submitted → readiness report rendered");

  const overall = Number((await page.locator("p.text-5xl").first().innerText()).trim());
  assert.ok(overall > 0 && overall <= 100, `overall readiness should be in (0,100], got ${overall}`);
  await page.getByText("سجل قرارات الخصم المتكيّف").waitFor();
  await page.getByText("المرحلة 5 — التدريب التالي").waitFor();
  const nextBtn = page.getByRole("button", { name: "ابدأ التدريب التالي" });
  assert.equal(await nextBtn.count(), 1, "next-training button present");
  step(`readiness ${overall} with adversary decision log and next recommendation`);
  await shot("04-report");

  // Command Center now reflects persisted results.
  await page.goto(`${BASE}/app`);
  await page.getByText("مُولَّد من نتائج جلستك الأخيرة").waitFor();
  const dash = Number((await page.locator("span.text-5xl").first().innerText()).trim());
  assert.equal(dash, overall, "dashboard shows the same persisted readiness");
  const unread = await page.locator('nav a[href="/app/notifications"] span.text-ink').innerText();
  assert.equal(unread.trim(), "2");
  step("Command Center shows persisted readiness, recommendation and 2 notifications");
  await shot("05-command-center-after");

  // Notifications: mark all read.
  await page.goto(`${BASE}/app/notifications`);
  await page.getByRole("button", { name: /تعليم الكل كمقروء/ }).click();
  await page.waitForFunction(() => !document.querySelector('nav a[href="/app/notifications"] span.text-ink'));
  step("notifications marked read");

  // Loop closes: start the recommended next training from the dashboard.
  await page.goto(`${BASE}/app`);
  await page.getByRole("button", { name: "ابدأ هذا التدريب" }).click();
  await page.waitForURL((u) => /\/app\/sessions\//.test(u.toString()) && u.toString() !== sessionUrl);
  await page.getByText("وحدة التحكم الدفاعية").waitFor();
  step("recommended next training started → new live simulation");

  // Phone width: no horizontal page scroll on the dashboard.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/app`);
  assert.equal(await page.getByText("لا يوجد لديك سجل بعد").count(), 0, "a learner with history must not be told they have none");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 1, `no horizontal overflow at phone width (got ${overflow}px)`);
  step("phone-width dashboard has no horizontal overflow");
  await shot("06-mobile-dashboard");

  // The only failed HTTP response allowed is the deliberate rejection of unsafe console input.
  assert.equal(failedResponses.length, 1, `unexpected failed responses: ${failedResponses.join(", ")}`);
  assert.match(failedResponses[0], /^400 \/api\/sessions\/[a-z0-9]+\/commands$/);
  const relevant = consoleErrors.filter((e) => !/Failed to load resource: the server responded with a status of 400/.test(e));
  assert.deepEqual(relevant, [], `browser console errors: ${relevant.join(" | ")}`);
  step("no unexpected HTTP failures or browser console errors");

  console.log(`\nE2E PASSED (${steps.length} checks)`);
} catch (e) {
  await shot("failure").catch(() => {});
  console.error("\nE2E FAILED:", e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
