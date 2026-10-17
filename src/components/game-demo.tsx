"use client";

import { Hand, Pause, Play, RotateCcw, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { DEFAULT_GAME_CONFIG } from "@/features/game/domain/config";
import {
  advance,
  createGame,
  flap,
  startGame,
  togglePause,
  totalFlaps,
} from "@/features/game/domain/engine";
import type {
  GameEvent,
  GameState,
  GameStatus,
  InputSource,
} from "@/features/game/domain/types";
import { renderGame } from "@/features/game/render/canvas-renderer";
import { useGestureControl, type GestureUiState } from "@/features/gesture/ui/use-gesture-control";
import { getSessionRepository } from "@/features/telemetry/infrastructure/session-repository";
import { trackProductEvent } from "@/lib/analytics";

const { width: WIDTH, height: HEIGHT } = DEFAULT_GAME_CONFIG;
const HIGH_SCORE_KEY = "flappy-gestures-high-score";
/** Intervalo de sincronização do placar com o React; o canvas roda a cada frame. */
const UI_SYNC_TICKS = 8;

type Snapshot = {
  status: GameStatus;
  score: number;
  highScore: number;
};

const STATUS_LABEL: Record<GameStatus, string> = {
  ready: "Pronto",
  playing: "Jogando",
  paused: "Pausado",
  "game-over": "Fim de jogo",
};

const INITIAL_SNAPSHOT: Snapshot = { status: "ready", score: 0, highScore: 0 };

function toSnapshot(state: GameState): Snapshot {
  return { status: state.status, score: state.score, highScore: state.highScore };
}

function readHighScore(): number {
  try {
    const stored = Number(window.localStorage.getItem(HIGH_SCORE_KEY) ?? 0);
    return Number.isSafeInteger(stored) && stored > 0 ? stored : 0;
  } catch {
    return 0;
  }
}

function writeHighScore(value: number) {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(value));
  } catch {
    // Storage indisponível: o recorde vale só para esta sessão.
  }
}

function createSessionId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["BUTTON", "INPUT", "TEXTAREA", "SELECT", "A"].includes(target.tagName))
  );
}

export function GameDemo() {
  const consoleRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createGame());
  const lastInputRef = useRef<InputSource>("pointer");
  const isVisibleRef = useRef(false);
  const [snapshot, setSnapshot] = useState<Snapshot>(INITIAL_SNAPSHOT);

  const publish = useCallback(() => setSnapshot(toSnapshot(stateRef.current)), []);

  /** Ponto único de reação aos eventos de domínio produzidos pelo engine. */
  const handleEvents = useCallback(
    (events: GameEvent[]) => {
      const state = stateRef.current;

      for (const event of events) {
        if (event.type === "started") {
          trackProductEvent("game_start", { source: "web_demo", input: lastInputRef.current });
        }

        if (event.type === "game-over") {
          if (event.isNewRecord) writeHighScore(event.highScore);

          getSessionRepository().append({
            id: createSessionId(),
            endedAt: new Date().toISOString(),
            durationMs: Math.round(state.elapsedMs),
            score: event.score,
            flaps: { ...state.flaps },
          });

          trackProductEvent("game_over", {
            score: event.score,
            highScore: event.highScore,
            flaps: totalFlaps(state),
            gestureFlaps: state.flaps.gesture,
            durationMs: Math.round(state.elapsedMs),
          });
        }
      }

      if (events.length > 0) publish();
    },
    [publish],
  );

  const handleFlap = useCallback(
    (source: InputSource) => {
      lastInputRef.current = source;
      handleEvents(flap(stateRef.current, source));
    },
    [handleEvents],
  );

  const restart = useCallback(() => {
    lastInputRef.current = "pointer";
    handleEvents(startGame(stateRef.current));
  }, [handleEvents]);

  const pauseOrResume = useCallback(() => {
    togglePause(stateRef.current);
    publish();
  }, [publish]);

  const onGestureFlap = useCallback(() => handleFlap("gesture"), [handleFlap]);
  const {
    state: gestureState,
    start: startGestures,
    stop: stopGestures,
    videoRef: gestureVideoRef,
    overlayRef: gestureOverlayRef,
  } = useGestureControl({ onFlap: onGestureFlap });

  // O texto do overlay muda com o input ativo sem reiniciar o loop.
  const gestureStatusRef = useRef<GestureUiState["status"]>("off");
  useEffect(() => {
    gestureStatusRef.current = gestureState.status;
  }, [gestureState.status]);

  // Recorde salvo é lido só no cliente para não divergir da renderização do servidor.
  useEffect(() => {
    stateRef.current.highScore = readHighScore();
    publish();
  }, [publish]);

  // Loop de render com timestep fixo no engine.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;

    let frameHandle = 0;
    let last = performance.now();
    let lastSyncedTick = 0;

    const loop = (now: number) => {
      const state = stateRef.current;
      const events = advance(state, now - last);
      last = now;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderGame(ctx, state, { startHint: startHintFor(gestureStatusRef.current) });

      if (events.length > 0) {
        handleEvents(events);
      } else if (state.status === "playing" && state.tick - lastSyncedTick >= UI_SYNC_TICKS) {
        lastSyncedTick = state.tick;
        publish();
      }

      frameHandle = requestAnimationFrame(loop);
    };

    frameHandle = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameHandle);
  }, [handleEvents, publish]);

  // Espaço só controla o jogo quando ele está na tela, para não sequestrar o
  // scroll da landing page.
  useEffect(() => {
    const element = consoleRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      isVisibleRef.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting && entry.intersectionRatio >= 0.5;
      },
      { threshold: [0, 0.5, 1] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isVisibleRef.current || event.repeat || isInteractiveTarget(event.target)) return;

      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        handleFlap("keyboard");
      } else if (event.key.toLowerCase() === "p") {
        pauseOrResume();
      }
    };

    // Pausa automática ao trocar de aba evita game over "invisível".
    const onVisibilityChange = () => {
      if (document.hidden && stateRef.current.status === "playing") pauseOrResume();
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [handleFlap, pauseOrResume]);

  const gestureActive = gestureState.status === "active" || gestureState.status === "loading";

  return (
    <section ref={consoleRef} className="game-console" aria-label="Demo jogável">
      <div className="game-console__viewport">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          width={WIDTH}
          height={HEIGHT}
          role="img"
          aria-label="Jogo Flappy Bird em canvas"
          onPointerDown={() => handleFlap("pointer")}
        />

        <div
          className={gestureActive ? "gesture-preview gesture-preview--visible" : "gesture-preview"}
          aria-hidden={!gestureActive}
        >
          <video ref={gestureVideoRef} className="gesture-preview__video" muted playsInline />
          <canvas
            ref={gestureOverlayRef}
            className="gesture-preview__overlay"
            width={320}
            height={240}
          />
          <GestureBadge state={gestureState} />
        </div>
      </div>

      <div className="game-console__controls">
        <div className="score-strip" aria-live="polite">
          <span>
            Score <strong>{snapshot.score}</strong>
          </span>
          <span>
            Recorde <strong>{snapshot.highScore}</strong>
          </span>
          <span>
            Status <strong>{STATUS_LABEL[snapshot.status]}</strong>
          </span>
        </div>

        <div className="button-row">
          <button className="button button--primary" type="button" onClick={() => handleFlap("pointer")}>
            <Zap size={16} aria-hidden />
            Flap
          </button>
          <button
            className={gestureActive ? "button button--active" : "button"}
            type="button"
            aria-pressed={gestureActive}
            onClick={gestureActive ? stopGestures : startGestures}
          >
            <Hand size={16} aria-hidden />
            {gestureActive ? "Desligar gestos" : "Jogar com gestos"}
          </button>
          <button className="button" type="button" onClick={restart}>
            <RotateCcw size={16} aria-hidden />
            Reiniciar
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={pauseOrResume}
            aria-label={snapshot.status === "paused" ? "Retomar partida" : "Pausar partida"}
          >
            {snapshot.status === "paused" ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
          </button>
        </div>
      </div>

      <GestureStatusLine state={gestureState} />
    </section>
  );
}

function startHintFor(status: GestureUiState["status"]): string {
  return status === "active" ? "Feche e abra a mão para voar" : "Toque, clique ou use espaço";
}

const POSE_LABEL = {
  open: "Mão aberta",
  closed: "Mão fechada",
  uncertain: "Ajustando…",
} as const;

function GestureBadge({ state }: { state: GestureUiState }) {
  const label =
    state.status === "loading"
      ? "Iniciando câmera…"
      : state.pose
        ? POSE_LABEL[state.pose]
        : "Mostre a mão";

  return (
    <span className={`gesture-badge gesture-badge--${state.pose ?? "none"}`}>
      {label}
      {state.status === "active" && state.detectionFps > 0 ? ` · ${state.detectionFps} fps` : ""}
    </span>
  );
}

function GestureStatusLine({ state }: { state: GestureUiState }) {
  if (state.status === "error") {
    return (
      <p className="gesture-status gesture-status--error" role="alert">
        {state.errorMessage}
      </p>
    );
  }

  if (state.status === "off") {
    return (
      <p className="gesture-status">
        Controle por gestos roda 100% no seu navegador: nenhuma imagem da câmera sai do
        dispositivo.
      </p>
    );
  }

  return (
    <p className="gesture-status" aria-live="polite">
      {state.status === "loading"
        ? "Baixando o modelo de mão e pedindo acesso à câmera…"
        : "Gestos ativos: feche a mão e abra de novo para cada flap."}
    </p>
  );
}
