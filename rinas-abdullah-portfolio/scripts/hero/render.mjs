/**
 * Renders the procedural hero artwork (scene.html) with headless Chromium.
 *
 *   node scripts/hero/render.mjs [outDir] [--preview]
 *
 * Writes PNG masters to outDir (default: scripts/hero/out). Convert them to
 * WebP with scripts/hero/to-webp.py — see README "Hero image".
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { mkdirSync } from "node:fs";

// Playwright is a dev tool, not a site dependency: resolve it from the project or a global install.
const { chromium } = createRequire(import.meta.url)("playwright");

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : join(here, "out"));
const preview = process.argv.includes("--preview");
mkdirSync(out, { recursive: true });

const jobs = preview
  ? [
      { name: "hero-desktop", w: 1280, h: 720, variant: "desktop" },
      { name: "hero-mobile", w: 540, h: 960, variant: "mobile" },
    ]
  : [
      { name: "hero-desktop", w: 2560, h: 1440, variant: "desktop" },
      { name: "hero-mobile", w: 1080, h: 1920, variant: "mobile" },
    ];

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const j of jobs) {
  const page = await browser.newPage({ viewport: { width: j.w, height: j.h }, deviceScaleFactor: 1 });
  const t0 = Date.now();
  await page.goto(`file://${join(here, "scene.html")}?w=${j.w}&h=${j.h}&variant=${j.variant}`);
  await page.waitForFunction(() => document.title === "done" || document.title.startsWith("error"), null, { timeout: 30 * 60 * 1000 });
  const title = await page.title();
  if (title !== "done") throw new Error(title);
  await page.screenshot({ path: join(out, `${j.name}.png`) });
  console.log(`${j.name} ${j.w}×${j.h} in ${Math.round((Date.now() - t0) / 1000)}s`);
  await page.close();
}
await browser.close();
