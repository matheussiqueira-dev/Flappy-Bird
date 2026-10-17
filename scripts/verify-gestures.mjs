// Verificação ponta a ponta do controle por gestos com a câmera falsa do Chromium.
//
// Cobre o pipeline real: getUserMedia -> <video> -> MediaPipe (WASM + modelo)
// -> loop de detecção -> UI. A câmera falsa gera um padrão sintético, sem mão,
// então o reconhecimento da pose em si continua coberto pelos testes unitários
// de src/features/gesture/domain.
//
// Uso: APP_URL=http://127.0.0.1:3000 node scripts/verify-gestures.mjs
import { chromium } from "playwright";

const baseUrl = process.env.APP_URL ?? "http://127.0.0.1:3000";
const MODEL_TIMEOUT_MS = 90_000;
/** Telemetria de uso do MediaPipe (bloqueada de propósito pelo CSP) e logs INFO que ele escreve no stderr. */
const EXPECTED_CSP_NOISE = /odml\.pa\.googleapis\.com|^INFO: /;

const checks = [];
const record = (name, ok, detail = "") => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
};

function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !EXPECTED_CSP_NOISE.test(message.text())) {
      errors.push(message.text());
    }
  });
  return errors;
}

async function gestureFlow() {
  const browser = await chromium.launch({
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  });

  try {
    const context = await browser.newContext({ permissions: ["camera"] });
    const page = await context.newPage();
    const errors = watchErrors(page);

    await page.goto(`${baseUrl}/play`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Jogar com gestos" }).click();

    const status = page.locator(".gesture-status");
    await status.filter({ hasText: "Gestos ativos" }).waitFor({ timeout: MODEL_TIMEOUT_MS });
    record("câmera + modelo iniciam e a UI fica ativa", true);

    const video = await page.locator(".gesture-preview__video").evaluate((element) => ({
      readyState: element.readyState,
      width: element.videoWidth,
      height: element.videoHeight,
    }));
    record(
      "vídeo da câmera recebendo quadros",
      video.readyState >= 2 && video.width > 0,
      `${video.width}x${video.height}, readyState ${video.readyState}`,
    );

    await page.locator(".gesture-badge", { hasText: "fps" }).waitFor({ timeout: 15_000 });
    const badge = await page.locator(".gesture-badge").innerText();
    record("loop de detecção rodando", /\d+ fps/.test(badge), badge);

    const overlay = await page.locator(".gesture-preview__overlay").evaluate((canvas) => ({
      width: canvas.width,
      height: canvas.height,
    }));
    record(
      "overlay acompanha a resolução real do vídeo",
      overlay.width === video.width && overlay.height === video.height,
      `${overlay.width}x${overlay.height}`,
    );

    await page.getByRole("button", { name: "Altura da mão" }).click();
    await status.filter({ hasText: "Altura da mão" }).waitFor({ timeout: 5_000 });
    record("modo altura da mão selecionável", true);

    await page.getByRole("button", { name: "Desligar gestos" }).click();
    await page.getByRole("button", { name: "Jogar com gestos" }).waitFor({ timeout: 5_000 });
    const released = await page
      .locator(".gesture-preview__video")
      .evaluate((element) => element.srcObject === null);
    const modeSwitchGone = (await page.locator(".mode-switch").count()) === 0;
    record("desligar libera a câmera e esconde o seletor", released && modeSwitchGone);

    record("sem erros inesperados no console", errors.length === 0, errors.join(" | "));
  } finally {
    await browser.close();
  }
}

async function rejectCameraWith(page, errorName) {
  // Simula a resposta do navegador na fronteira da API. O headless shell não
  // tem prompt de permissão real e devolve NotSupportedError para tudo.
  await page.addInitScript((name) => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException("simulado", name));
  }, errorName);
}

async function cameraErrorFlow(errorName, expected, label) {
  const browser = await chromium.launch();

  try {
    const page = await (await browser.newContext()).newPage();
    await rejectCameraWith(page, errorName);

    await page.goto(`${baseUrl}/play`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Jogar com gestos" }).click();

    const alert = page.locator(".gesture-status--error");
    await alert.waitFor({ timeout: MODEL_TIMEOUT_MS });
    const text = await alert.innerText();
    record(label, expected.test(text), text);

    const buttonBack = await page.getByRole("button", { name: "Jogar com gestos" }).count();
    record(`${label}: botão volta ao estado inicial`, buttonBack === 1);
  } finally {
    await browser.close();
  }
}

const permissionDeniedFlow = () =>
  cameraErrorFlow("NotAllowedError", /permissão/i, "permissão negada mostra erro acionável");
const noCameraFlow = () =>
  cameraErrorFlow("NotFoundError", /nenhuma câmera/i, "sem câmera mostra erro específico");
const unsupportedFlow = () =>
  cameraErrorFlow("NotSupportedError", /HTTPS/, "contexto sem suporte orienta usar HTTPS");

async function preferencesFlow() {
  const browser = await chromium.launch();

  try {
    const page = await (await browser.newContext()).newPage();

    await page.goto(`${baseUrl}/settings`, { waitUntil: "networkidle" });
    await page.getByRole("checkbox", { name: "Controle por gestos" }).uncheck();

    await page.goto(`${baseUrl}/play`, { waitUntil: "networkidle" });
    const buttonHidden = (await page.getByRole("button", { name: "Jogar com gestos" }).count()) === 0;
    const noteShown = await page.locator(".gesture-status", { hasText: "desativado" }).count();
    record("preferência desliga o controle por gestos", buttonHidden && noteShown === 1);

    await page.goto(`${baseUrl}/settings`, { waitUntil: "networkidle" });
    await page.getByRole("checkbox", { name: "Eventos de produto" }).uncheck();
    const stored = await page.evaluate(() => localStorage.getItem("flappy-gestures:prefs:v1"));
    record(
      "opt-out de analytics persistido",
      stored !== null && JSON.parse(stored).analytics === false,
      stored ?? "",
    );
  } finally {
    await browser.close();
  }
}

for (const flow of [gestureFlow, permissionDeniedFlow, noCameraFlow, unsupportedFlow, preferencesFlow]) {
  try {
    await flow();
  } catch (error) {
    record(`${flow.name} terminou sem exceção`, false, error instanceof Error ? error.message : String(error));
  }
}

const failed = checks.filter((check) => !check.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} verificações passaram.`);
if (failed.length > 0) process.exitCode = 1;
