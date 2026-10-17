import type { HandLandmarker } from "@mediapipe/tasks-vision";

import { classifyHand, type HandPose, type Landmark } from "../domain/hand-pose";
import { DetectionBudget } from "./detection-budget";
import { acquireAbortable } from "./abortable-resource";

/** Arquivos WASM copiados de `@mediapipe/tasks-vision` por `scripts/copy-mediapipe-wasm.mjs`. */
const WASM_BASE_PATH = "/mediapipe/wasm";

/** Modelo oficial do Google (float16, ~7,8 MB), servido com CORS liberado. */
export const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export type HandFrame = {
  pose: HandPose | null;
  extendedFingers: number;
  landmarks: Landmark[] | null;
  timestampMs: number;
  /** Taxa de inferência suavizada, em quadros por segundo. */
  detectionFps: number;
};

export type HandTrackerErrorCode =
  | "unsupported"
  | "permission-denied"
  | "no-camera"
  | "camera-busy"
  | "model-failed";

export class HandTrackerError extends Error {
  readonly code: HandTrackerErrorCode;

  constructor(code: HandTrackerErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "HandTrackerError";
    this.code = code;
  }
}

export type HandTrackerOptions = {
  video: HTMLVideoElement;
  onFrame: (frame: HandFrame) => void;
  /** Falha depois que o rastreamento já começou (câmera perdida, erro de inferência). */
  onError?: (error: HandTrackerError) => void;
  signal?: AbortSignal;
};

export type HandTrackerSession = {
  stop: () => void;
};

/**
 * Adaptador de infraestrutura: câmera (getUserMedia) + MediaPipe Hand
 * Landmarker rodando 100% no navegador. Nenhum frame sai do dispositivo.
 *
 * A biblioteca é importada sob demanda, então os ~12 MB de WASM e o modelo
 * só são baixados quando o usuário ativa o controle por gestos.
 */
export async function startHandTracker({
  video,
  onFrame,
  onError,
  signal,
}: HandTrackerOptions): Promise<HandTrackerSession> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new HandTrackerError(
      "unsupported",
      "Este navegador não oferece acesso à câmera.",
    );
  }

  // Permissão negada deve responder sem esperar pelo download do modelo.
  // Se o navegador entregar a câmera após cancelar o prompt, ela é liberada.
  let stream: MediaStream;
  try {
    stream = await acquireAbortable(openCamera, stopStream, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    throw toCameraError(error);
  }

  const cancelCamera = () => stopStream(stream);
  signal?.addEventListener("abort", cancelCamera, { once: true });
  let landmarker: HandLandmarker;
  try {
    landmarker = await acquireAbortable(createLandmarker, (model) => model.close(), signal);
  } catch (error) {
    signal?.removeEventListener("abort", cancelCamera);
    stopStream(stream);
    if (signal?.aborted) throw error;
    throw new HandTrackerError("model-failed", "Não foi possível carregar o modelo de mão.", { cause: error });
  }
  signal?.removeEventListener("abort", cancelCamera);
  let frameHandle: number | null = null;
  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    signal?.removeEventListener("abort", stop);
    if (frameHandle !== null) cancelAnimationFrame(frameHandle);
    stopStream(stream);
    video.srcObject = null;
    landmarker.close();
  };

  if (signal?.aborted) {
    stop();
    throw new DOMException("Rastreamento cancelado.", "AbortError");
  }
  signal?.addEventListener("abort", stop, { once: true });

  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;

  try {
    await video.play();
    if (signal?.aborted) throw new DOMException("Rastreamento cancelado.", "AbortError");
  } catch (error) {
    stop();
    if (signal?.aborted) throw error;
    throw toCameraError(error);
  }

  const fail = (error: HandTrackerError) => {
    if (stopped) return;
    stop();
    onError?.(error);
  };

  // Câmera desconectada, tomada por outro app ou permissão revogada.
  for (const track of stream.getVideoTracks()) {
    track.addEventListener(
      "ended",
      () => fail(new HandTrackerError("camera-busy", "A câmera foi desconectada ou parou de responder.")),
      { once: true },
    );
  }

  let lastVideoTime = -1;
  let lastDetectionAt = 0;
  let detectionFps = 0;
  const budget = new DetectionBudget();

  const loop = () => {
    if (stopped) return;

    const now = performance.now();
    const hasNewFrame =
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime !== lastVideoTime;

    if (hasNewFrame && budget.shouldRun(now)) {
      lastVideoTime = video.currentTime;

      if (lastDetectionAt > 0) {
        const instantFps = 1000 / Math.max(1, now - lastDetectionAt);
        detectionFps = detectionFps === 0 ? instantFps : detectionFps * 0.75 + instantFps * 0.25;
      }
      lastDetectionAt = now;

      let result: ReturnType<HandLandmarker["detectForVideo"]>;
      try {
        result = landmarker.detectForVideo(video, now);
        budget.record(now, performance.now() - now);
      } catch (error) {
        // Sem isso, uma exceção aqui mataria o loop em silêncio com a câmera ligada.
        fail(new HandTrackerError("model-failed", "O rastreamento da mão parou de funcionar.", { cause: error }));
        return;
      }
      const hand = result.landmarks[0] ?? null;
      const classification = hand ? classifyHand(hand) : null;

      onFrame({
        pose: classification?.pose ?? null,
        extendedFingers: classification?.extendedFingers ?? 0,
        landmarks: hand ? hand.map(({ x, y }) => ({ x, y })) : null,
        timestampMs: now,
        detectionFps,
      });
    }

    frameHandle = requestAnimationFrame(loop);
  };

  frameHandle = requestAnimationFrame(loop);

  return { stop };
}

async function createLandmarker(): Promise<HandLandmarker> {
  const vision = await import("@mediapipe/tasks-vision");
  const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE_PATH);

  const create = (delegate: "GPU" | "CPU") =>
    vision.HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });

  // GPU (WebGL) é bem mais rápido com aceleração de verdade. Com WebGL por
  // software (VMs, drivers bloqueados) o delegate GPU fica até 100x mais lento
  // que a CPU, então nesses casos a CPU (XNNPACK + SIMD) vai direto.
  if (hasSoftwareWebGl()) return create("CPU");

  try {
    return await create("GPU");
  } catch {
    return await create("CPU");
  }
}

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i;

function hasSoftwareWebGl(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return true;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return SOFTWARE_RENDERER.test(renderer);
  } catch {
    return true;
  }
}

function openCamera(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 30, max: 60 },
    },
  });
}

function stopStream(stream: MediaStream) {
  for (const track of stream.getTracks()) track.stop();
}

function toCameraError(error: unknown): HandTrackerError {
  const name = error instanceof DOMException ? error.name : "";

  if (name === "NotAllowedError" || name === "SecurityError") {
    return new HandTrackerError(
      "permission-denied",
      "Permissão de câmera negada. Libere o acesso nas configurações do navegador.",
      { cause: error },
    );
  }

  // Contexto inseguro (HTTP fora de localhost) ou navegador sem suporte.
  if (name === "NotSupportedError" || error instanceof TypeError) {
    return new HandTrackerError(
      "unsupported",
      "Este navegador ou página não permite usar a câmera. Use HTTPS e um navegador atualizado.",
      { cause: error },
    );
  }

  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return new HandTrackerError("no-camera", "Nenhuma câmera compatível foi encontrada.", {
      cause: error,
    });
  }

  return new HandTrackerError(
    "camera-busy",
    "A câmera está em uso por outro aplicativo ou não pôde ser iniciada.",
    { cause: error },
  );
}
