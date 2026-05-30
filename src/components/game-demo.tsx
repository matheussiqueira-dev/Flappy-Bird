"use client";

import { Pause, Play, RotateCcw, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { trackProductEvent } from "@/lib/analytics";

const WIDTH = 960;
const HEIGHT = 540;
const BIRD_X = 210;
const BIRD_RADIUS = 20;
const PIPE_WIDTH = 72;
const PIPE_GAP = 165;
const GROUND_HEIGHT = 58;
const STORAGE_KEY = "flappy-gestures-high-score";

type GameStatus = "ready" | "playing" | "paused" | "game-over";

type Pipe = {
  x: number;
  gapY: number;
  passed: boolean;
};

type Runtime = {
  status: GameStatus;
  birdY: number;
  birdVelocity: number;
  pipes: Pipe[];
  score: number;
  highScore: number;
  frame: number;
  spawnTimer: number;
  totalFlaps: number;
};

type Snapshot = {
  status: GameStatus;
  score: number;
  highScore: number;
  totalFlaps: number;
};

function createRuntime(highScore = 0): Runtime {
  return {
    status: "ready",
    birdY: HEIGHT * 0.45,
    birdVelocity: 0,
    pipes: [],
    score: 0,
    highScore,
    frame: 0,
    spawnTimer: 0,
    totalFlaps: 0,
  };
}

function snapshot(runtime: Runtime): Snapshot {
  return {
    status: runtime.status,
    score: runtime.score,
    highScore: runtime.highScore,
    totalFlaps: runtime.totalFlaps,
  };
}

function restart(runtime: Runtime) {
  const highScore = runtime.highScore;
  Object.assign(runtime, createRuntime(highScore), { status: "playing" });
}

function flap(runtime: Runtime) {
  runtime.birdVelocity = -9.8;
  runtime.totalFlaps += 1;
}

function spawnPipe(runtime: Runtime) {
  const min = 110;
  const max = HEIGHT - GROUND_HEIGHT - 110;
  const wave = Math.sin(runtime.frame / 28) * 74;
  const gapY = Math.max(min, Math.min(max, HEIGHT * 0.48 + wave));

  runtime.pipes.push({
    x: WIDTH + PIPE_WIDTH,
    gapY,
    passed: false,
  });
}

function updateRuntime(runtime: Runtime, delta: number) {
  if (runtime.status !== "playing") {
    runtime.frame += 1;
    return;
  }

  runtime.frame += 1;
  runtime.spawnTimer += delta;
  runtime.birdVelocity += 0.48 * delta;
  runtime.birdVelocity = Math.min(runtime.birdVelocity, 10.5);
  runtime.birdY += runtime.birdVelocity * delta;

  if (runtime.pipes.length === 0 || runtime.spawnTimer > 96) {
    spawnPipe(runtime);
    runtime.spawnTimer = 0;
  }

  for (const pipe of runtime.pipes) {
    pipe.x -= 3.1 * delta;

    if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X - BIRD_RADIUS) {
      pipe.passed = true;
      runtime.score += 1;
    }
  }

  runtime.pipes = runtime.pipes.filter((pipe) => pipe.x > -PIPE_WIDTH - 20);

  const hitGround = runtime.birdY + BIRD_RADIUS >= HEIGHT - GROUND_HEIGHT;
  const hitCeiling = runtime.birdY - BIRD_RADIUS <= 0;
  const hitPipe = runtime.pipes.some((pipe) => {
    const insideX =
      BIRD_X + BIRD_RADIUS > pipe.x && BIRD_X - BIRD_RADIUS < pipe.x + PIPE_WIDTH;
    const insideGap =
      runtime.birdY - BIRD_RADIUS > pipe.gapY - PIPE_GAP / 2 &&
      runtime.birdY + BIRD_RADIUS < pipe.gapY + PIPE_GAP / 2;

    return insideX && !insideGap;
  });

  if (hitGround || hitCeiling || hitPipe) {
    runtime.status = "game-over";
    runtime.highScore = Math.max(runtime.highScore, runtime.score);
  }
}

function drawRuntime(ctx: CanvasRenderingContext2D, runtime: Runtime) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#a9dcf2");
  sky.addColorStop(0.62, "#e7f6f6");
  sky.addColorStop(1, "#f7f8f4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawCloud(ctx, 130 + ((runtime.frame * 0.18) % 860), 82, 1);
  drawCloud(ctx, 620 - ((runtime.frame * 0.12) % 760), 146, 0.78);
  drawCloud(ctx, 780 - ((runtime.frame * 0.08) % 900), 62, 0.56);

  for (const pipe of runtime.pipes) {
    drawPipe(ctx, pipe);
  }

  ctx.fillStyle = "#2c8c63";
  ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, 12);
  ctx.fillStyle = "#50483f";
  ctx.fillRect(0, HEIGHT - GROUND_HEIGHT + 12, WIDTH, GROUND_HEIGHT - 12);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  for (let x = -80 + (runtime.frame % 80); x < WIDTH; x += 80) {
    ctx.fillRect(x, HEIGHT - 30, 42, 4);
  }

  drawBird(ctx, runtime);
  drawHud(ctx, runtime);

  if (runtime.status !== "playing") {
    drawOverlay(ctx, runtime);
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  ctx.beginPath();
  ctx.ellipse(0, 18, 45, 22, 0, 0, Math.PI * 2);
  ctx.ellipse(38, 14, 52, 25, 0, 0, Math.PI * 2);
  ctx.ellipse(76, 19, 38, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPipe(ctx: CanvasRenderingContext2D, pipe: Pipe) {
  const topHeight = pipe.gapY - PIPE_GAP / 2;
  const bottomY = pipe.gapY + PIPE_GAP / 2;
  const bottomHeight = HEIGHT - GROUND_HEIGHT - bottomY;

  ctx.fillStyle = "#2faa72";
  ctx.strokeStyle = "#16724a";
  ctx.lineWidth = 4;

  ctx.fillRect(pipe.x, 0, PIPE_WIDTH, topHeight);
  ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, topHeight);
  ctx.fillRect(pipe.x - 7, topHeight - 28, PIPE_WIDTH + 14, 28);
  ctx.strokeRect(pipe.x - 7, topHeight - 28, PIPE_WIDTH + 14, 28);

  ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, bottomHeight);
  ctx.strokeRect(pipe.x, bottomY, PIPE_WIDTH, bottomHeight);
  ctx.fillRect(pipe.x - 7, bottomY, PIPE_WIDTH + 14, 28);
  ctx.strokeRect(pipe.x - 7, bottomY, PIPE_WIDTH + 14, 28);
}

function drawBird(ctx: CanvasRenderingContext2D, runtime: Runtime) {
  const wing = Math.sin(runtime.frame / 4) * 5;

  ctx.save();
  ctx.translate(BIRD_X, runtime.birdY);
  ctx.rotate(Math.max(-0.42, Math.min(0.65, runtime.birdVelocity / 18)));

  ctx.fillStyle = "#f6bd3c";
  ctx.strokeStyle = "#4d3613";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD_RADIUS + 8, BIRD_RADIUS, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f1873b";
  ctx.beginPath();
  ctx.moveTo(BIRD_RADIUS + 6, -2);
  ctx.lineTo(BIRD_RADIUS + 28, 5);
  ctx.lineTo(BIRD_RADIUS + 5, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(10, -8, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111417";
  ctx.beginPath();
  ctx.arc(13, -7, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#dd8e2f";
  ctx.beginPath();
  ctx.ellipse(-9, 8 + wing, 16, 8, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawHud(ctx: CanvasRenderingContext2D, runtime: Runtime) {
  ctx.fillStyle = "rgba(17, 20, 23, 0.76)";
  ctx.fillRect(24, 24, 160, 74);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 34px Arial";
  ctx.fillText(String(runtime.score), 42, 66);
  ctx.font = "500 14px Arial";
  ctx.fillText(`recorde ${runtime.highScore}`, 42, 86);
}

function drawOverlay(ctx: CanvasRenderingContext2D, runtime: Runtime) {
  ctx.fillStyle = "rgba(14, 18, 22, 0.58)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT - GROUND_HEIGHT);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "700 42px Arial";
  const title = runtime.status === "game-over" ? "Game over" : "Flappy Gestures";
  ctx.fillText(title, WIDTH / 2, HEIGHT / 2 - 24);
  ctx.font = "500 18px Arial";
  const subtitle =
    runtime.status === "paused"
      ? "Partida pausada"
      : runtime.status === "game-over"
        ? `Pontuação ${runtime.score}`
        : "Toque, clique ou use espaço";
  ctx.fillText(subtitle, WIDTH / 2, HEIGHT / 2 + 12);
  ctx.textAlign = "left";
}

export function GameDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const runtimeRef = useRef<Runtime>(createRuntime());
  const [state, setState] = useState<Snapshot>({
    status: "ready",
    score: 0,
    highScore: 0,
    totalFlaps: 0,
  });

  const publish = useCallback(() => {
    setState(snapshot(runtimeRef.current));
  }, []);

  const start = useCallback(() => {
    restart(runtimeRef.current);
    trackProductEvent("game_start", { source: "web_demo" });
    publish();
  }, [publish]);

  const handleFlap = useCallback(() => {
    const runtime = runtimeRef.current;

    if (runtime.status === "ready" || runtime.status === "game-over") {
      restart(runtime);
      trackProductEvent("game_start", { source: "web_demo" });
    }

    if (runtime.status === "playing") {
      flap(runtime);
      trackProductEvent("game_flap", { score: runtime.score });
    }

    publish();
  }, [publish]);

  const togglePause = useCallback(() => {
    const runtime = runtimeRef.current;
    if (runtime.status === "playing") {
      runtime.status = "paused";
    } else if (runtime.status === "paused") {
      runtime.status = "playing";
    }
    publish();
  }, [publish]);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored)) {
      runtimeRef.current.highScore = stored;
      publish();
    }
  }, [publish]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    let last = performance.now();

    const loop = (time: number) => {
      const runtime = runtimeRef.current;
      const previousStatus = runtime.status;
      const delta = Math.min(2, Math.max(0.6, (time - last) / 16.67));
      last = time;

      updateRuntime(runtime, delta);
      drawRuntime(context, runtime);

      if (previousStatus === "playing" && runtime.status === "game-over") {
        window.localStorage.setItem(STORAGE_KEY, String(runtime.highScore));
        trackProductEvent("game_over", {
          score: runtime.score,
          highScore: runtime.highScore,
          flaps: runtime.totalFlaps,
        });
        publish();
      } else if (runtime.frame % 8 === 0) {
        publish();
      }

      animationRef.current = window.requestAnimationFrame(loop);
    };

    animationRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [publish]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        handleFlap();
      }

      if (event.key.toLowerCase() === "p") {
        togglePause();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleFlap, togglePause]);

  return (
    <section className="game-console" aria-label="Demo jogável">
      <div className="game-console__viewport">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          width={WIDTH}
          height={HEIGHT}
          role="img"
          aria-label="Jogo Flappy Bird em canvas"
          onPointerDown={handleFlap}
        />
      </div>

      <div className="game-console__controls">
        <div className="score-strip" aria-live="polite">
          <span>
            Score <strong>{state.score}</strong>
          </span>
          <span>
            Recorde <strong>{state.highScore}</strong>
          </span>
          <span>
            Status <strong>{state.status}</strong>
          </span>
        </div>

        <div className="button-row">
          <button className="button button--primary" type="button" onClick={handleFlap}>
            <Zap size={16} aria-hidden />
            Flap
          </button>
          <button className="button" type="button" onClick={start}>
            <RotateCcw size={16} aria-hidden />
            Reiniciar
          </button>
          <button className="icon-button" type="button" onClick={togglePause} aria-label="Pausar ou retomar">
            {state.status === "paused" ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
          </button>
        </div>
      </div>
    </section>
  );
}
