import { DEFAULT_GAME_CONFIG } from "./config";
import type { GameConfig, GameEvent, GameState, InputSource, Pipe } from "./types";

/**
 * Núcleo de simulação sem dependência de DOM, React ou canvas.
 *
 * As funções mutam o estado recebido em vez de copiá-lo: o loop roda a 60 Hz
 * e alocar um objeto novo por tick geraria pressão de GC sem ganho real. Cada
 * operação devolve os eventos de domínio produzidos, que a camada de UI usa
 * para persistência, analytics e telemetria.
 */

const TICK_EPSILON_MS = 1e-6;

export function createGame(
  highScore = 0,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): GameState {
  return {
    status: "ready",
    birdY: config.height * 0.45,
    birdVelocity: 0,
    pipes: [],
    score: 0,
    highScore: sanitizeScore(highScore),
    tick: 0,
    spawnTimer: 0,
    flaps: { pointer: 0, keyboard: 0, gesture: 0 },
    elapsedMs: 0,
    accumulatorMs: 0,
  };
}

export function startGame(
  state: GameState,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): GameEvent[] {
  Object.assign(state, createGame(state.highScore, config), {
    status: "playing",
    tick: state.tick,
  });

  return [{ type: "started" }];
}

/**
 * Flap é a ação primária: inicia a partida quando ela ainda não está em
 * andamento, para que qualquer input (toque, tecla ou gesto) baste para jogar.
 */
export function flap(
  state: GameState,
  source: InputSource,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): GameEvent[] {
  const events: GameEvent[] = [];

  if (state.status === "ready" || state.status === "game-over") {
    events.push(...startGame(state, config));
  }

  if (state.status !== "playing") {
    return events;
  }

  state.birdVelocity = config.flapVelocity;
  state.flaps[source] += 1;
  events.push({ type: "flapped", source });

  return events;
}

export function togglePause(state: GameState): void {
  if (state.status === "playing") {
    state.status = "paused";
    state.accumulatorMs = 0;
  } else if (state.status === "paused") {
    state.status = "playing";
  }
}

/**
 * Converte tempo real em ticks fixos. Um frame de 7 ms (144 Hz) e um de 33 ms
 * (30 FPS) produzem a mesma trajetória ao longo do tempo; só muda a
 * granularidade do desenho.
 */
export function advance(
  state: GameState,
  elapsedRealMs: number,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): GameEvent[] {
  if (!Number.isFinite(elapsedRealMs) || elapsedRealMs <= 0) {
    return [];
  }

  const maxBacklog = config.tickMs * config.maxTicksPerFrame;
  state.accumulatorMs = Math.min(state.accumulatorMs + elapsedRealMs, maxBacklog);

  const events: GameEvent[] = [];

  // A tolerância absorve o erro de ponto flutuante de 1000/60, que sem ela
  // descartaria um tick de vez em quando.
  while (state.accumulatorMs + TICK_EPSILON_MS >= config.tickMs) {
    state.accumulatorMs = Math.max(0, state.accumulatorMs - config.tickMs);
    events.push(...stepTick(state, config));
  }

  return events;
}

export function stepTick(
  state: GameState,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): GameEvent[] {
  state.tick += 1;

  if (state.status !== "playing") {
    return [];
  }

  const events: GameEvent[] = [];

  state.elapsedMs += config.tickMs;
  state.spawnTimer += 1;
  state.birdVelocity = Math.min(state.birdVelocity + config.gravity, config.maxFallSpeed);
  state.birdY += state.birdVelocity;

  if (state.pipes.length === 0 || state.spawnTimer > config.pipeSpawnInterval) {
    state.pipes.push(spawnPipe(state.tick, config));
    state.spawnTimer = 0;
  }

  for (const pipe of state.pipes) {
    pipe.x -= config.pipeSpeed;

    if (!pipe.passed && pipe.x + config.pipeWidth < config.birdX - config.birdRadius) {
      pipe.passed = true;
      state.score += 1;
      events.push({ type: "scored", score: state.score });
    }
  }

  state.pipes = state.pipes.filter((pipe) => pipe.x > -config.pipeWidth - 20);

  if (detectCollision(state, config)) {
    const isNewRecord = state.score > state.highScore;
    state.status = "game-over";
    state.highScore = Math.max(state.highScore, state.score);
    state.accumulatorMs = 0;
    events.push({
      type: "game-over",
      score: state.score,
      highScore: state.highScore,
      isNewRecord,
    });
  }

  return events;
}

export function detectCollision(
  state: Pick<GameState, "birdY" | "pipes">,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): boolean {
  const { birdX, birdRadius, pipeWidth, pipeGap, height, groundHeight } = config;

  if (state.birdY + birdRadius >= height - groundHeight) {
    return true;
  }

  if (state.birdY - birdRadius <= 0) {
    return true;
  }

  return state.pipes.some((pipe) => {
    const insideX = birdX + birdRadius > pipe.x && birdX - birdRadius < pipe.x + pipeWidth;
    const insideGap =
      state.birdY - birdRadius > pipe.gapY - pipeGap / 2 &&
      state.birdY + birdRadius < pipe.gapY + pipeGap / 2;

    return insideX && !insideGap;
  });
}

export function totalFlaps(state: Pick<GameState, "flaps">): number {
  return state.flaps.pointer + state.flaps.keyboard + state.flaps.gesture;
}

function spawnPipe(tick: number, config: GameConfig): Pipe {
  const min = config.pipeGapMargin;
  const max = config.height - config.groundHeight - config.pipeGapMargin;
  const wave = Math.sin(tick / 28) * 74;
  const gapY = Math.max(min, Math.min(max, config.height * 0.48 + wave));

  return { x: config.width + config.pipeWidth, gapY, passed: false };
}

function sanitizeScore(value: number): number {
  return Number.isSafeInteger(value) && value > 0 ? value : 0;
}
