import { chromium } from "playwright";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const baseUrl = process.env.APP_URL ?? "http://127.0.0.1:3000";
const outDir = path.join(os.tmpdir(), "flappy-gestures-verification");
const routes = ["/", "/play", "/dashboard", "/settings", "/about"];

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const errors = [];
const results = [];

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  for (const route of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const title = await page.title();
    const textLength = await page.locator("body").evaluate((body) => body.innerText.trim().length);
    const overlayCount = await page
      .locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")
      .count();
    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );

    results.push({ route, title, textLength, overlayCount, horizontalOverflow });
  }

  const [health, dashboardApi] = await Promise.all([
    page.evaluate((url) => fetch(`${url}/api/health`).then((response) => response.json()), baseUrl),
    page.evaluate((url) => fetch(`${url}/api/dashboard`).then((response) => response.json()), baseUrl),
  ]);

  await page.goto(`${baseUrl}/play`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const canvasNonBlank = await page.locator("canvas").evaluate((canvas) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < data.length; i += 401) {
      if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) return true;
    }
    return false;
  });

  await page.getByRole("button", { name: "Flap" }).click();
  await page.waitForTimeout(250);
  const statusText = await page.locator(".score-strip").innerText();

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  const homePath = path.join(outDir, "home-desktop.png");
  await page.screenshot({ path: homePath, fullPage: false });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
  await mobile.waitForTimeout(500);
  const mobileOverflow = await mobile.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  const mobilePath = path.join(outDir, "dashboard-mobile.png");
  await mobile.screenshot({ path: mobilePath, fullPage: false });

  const failedRoute = results.find(
    (result) => result.textLength === 0 || result.overlayCount > 0 || result.horizontalOverflow,
  );

  const report = {
    baseUrl,
    results,
    health,
    dashboardApi: {
      schemaVersion: dashboardApi.schemaVersion,
      kpis: dashboardApi.kpis?.length,
      alerts: dashboardApi.alerts?.length,
    },
    canvasNonBlank,
    statusText,
    mobileOverflow,
    errors,
    screenshots: { homePath, mobilePath },
  };

  console.log(JSON.stringify(report, null, 2));

  if (
    failedRoute ||
    health.status !== "ok" ||
    dashboardApi.schemaVersion !== "2026-05-30" ||
    !canvasNonBlank ||
    mobileOverflow ||
    errors.length > 0
  ) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
