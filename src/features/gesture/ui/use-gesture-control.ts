"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { GestureMapper } from "../domain/gesture-mapper";
import type { HandPose, Landmark } from "../domain/hand-pose";
import {
  HandTrackerError,
  startHandTracker,
  type HandFrame,
  type HandTrackerSession,
} from "../infrastructure/hand-tracker";

export type GestureStatus = "off" | "loading" | "active" | "error";

export type GestureUiState = {
  status: GestureStatus;
  errorMessage: string | null;
  pose: HandPose | null;
  detectionFps: number;
};

const INITIAL_STATE: GestureUiState = {
  status: "off",
  errorMessage: null,
  pose: null,
  detectionFps: 0,
};

/** Atualização do FPS exibido; poses mudam o estado imediatamente. */
const FPS_REFRESH_MS = 750;

const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

type UseGestureControlOptions = {
  onFlap: () => void;
};

/**
 * Liga o adaptador de câmera/MediaPipe ao jogo. O loop de detecção roda fora
 * do React: só mudanças de pose e o FPS (throttled) disparam re-render, e o
 * esqueleto da mão é desenhado direto no canvas de overlay.
 */
export function useGestureControl({ onFlap }: UseGestureControlOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<HandTrackerSession | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mapperRef = useRef(new GestureMapper());
  const onFlapRef = useRef(onFlap);
  const [state, setState] = useState<GestureUiState>(INITIAL_STATE);

  useEffect(() => {
    onFlapRef.current = onFlap;
  }, [onFlap]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    sessionRef.current?.stop();
    sessionRef.current = null;
    mapperRef.current.reset();
    clearOverlay(overlayRef.current);
    setState(INITIAL_STATE);
  }, []);

  const start = useCallback(async () => {
    const video = videoRef.current;
    if (!video || abortRef.current) return;

    const controller = new AbortController();
    abortRef.current = controller;
    mapperRef.current.reset();
    setState({ ...INITIAL_STATE, status: "loading" });

    let lastPose: HandPose | null = null;
    let lastFpsUpdate = 0;

    const onFrame = (frame: HandFrame) => {
      const { shouldFlap } = mapperRef.current.update({
        pose: frame.pose,
        timestampMs: frame.timestampMs,
      });
      if (shouldFlap) onFlapRef.current();

      drawHand(overlayRef.current, video, frame.landmarks, frame.pose);

      const poseChanged = frame.pose !== lastPose;
      if (poseChanged || frame.timestampMs - lastFpsUpdate > FPS_REFRESH_MS) {
        lastPose = frame.pose;
        lastFpsUpdate = frame.timestampMs;
        setState((current) => ({
          ...current,
          pose: frame.pose,
          detectionFps: Math.round(frame.detectionFps),
        }));
      }
    };

    const onError = (error: HandTrackerError) => {
      abortRef.current = null;
      sessionRef.current = null;
      mapperRef.current.reset();
      clearOverlay(overlayRef.current);
      setState({ ...INITIAL_STATE, status: "error", errorMessage: error.message });
    };

    try {
      sessionRef.current = await startHandTracker({
        video,
        onFrame,
        onError,
        signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        setState((current) => ({ ...current, status: "active" }));
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      abortRef.current = null;
      setState({
        ...INITIAL_STATE,
        status: "error",
        errorMessage:
          error instanceof HandTrackerError
            ? error.message
            : "Não foi possível iniciar o controle por gestos.",
      });
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { state, start, stop, videoRef, overlayRef };
}

function clearOverlay(canvas: HTMLCanvasElement | null) {
  canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
}

function drawHand(
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement,
  landmarks: Landmark[] | null,
  pose: HandPose | null,
) {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;

  // O canvas precisa ter a proporção real do vídeo: com os dois em
  // object-fit: cover, o recorte fica idêntico e o esqueleto alinha com a mão
  // mesmo quando a câmera entrega 16:9 em vez dos 4:3 pedidos.
  if (video.videoWidth > 0 && canvas.width !== video.videoWidth) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!landmarks) return;

  const color = pose === "open" ? "#3ddc97" : pose === "closed" ? "#f1b943" : "#e6edf0";
  const point = (landmark: Landmark) => [landmark.x * canvas.width, landmark.y * canvas.height];

  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.beginPath();
  for (const [from, to] of HAND_CONNECTIONS) {
    const [x1, y1] = point(landmarks[from]);
    const [x2, y2] = point(landmarks[to]);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  for (const landmark of landmarks) {
    const [x, y] = point(landmark);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
