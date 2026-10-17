import { describe, expect, it } from "vitest";

import { DEFAULT_GAME_CONFIG, GESTURE_GAME_CONFIG } from "./config";
import { createGame, detectCollision, flap, stepTick } from "./engine";
import type { GameConfig, GameState } from "./types";

type GesturePlayer = {
  /** Intervalo mínimo entre flaps: o ciclo de fechar e abrir a mão. */
  minFlapIntervalTicks: number;
  /** Atraso entre decidir o flap e ele acontecer (câmera + detecção + movimento). */
  latencyTicks: number;
};

/** ~0,8 s por ciclo e 250 ms de atraso: um jogador de gestos realista. */
const REALISTIC_GESTURE_PLAYER: GesturePlayer = { minFlapIntervalTicks: 48, latencyTicks: 15 };
/** ~1,5 s por ciclo e 400 ms de atraso: iniciante, movimentos lentos. */
const SLOW_GESTURE_PLAYER: GesturePlayer = { minFlapIntervalTicks: 90, latencyTicks: 24 };

/**
 * Joga uma partida com uma política simples (flap quando o pássaro está
 * abaixo do centro do próximo vão) sujeita às limitações de um gesto.
 * Devolve a pontuação ao bater ou ao atingir o limite de ticks.
 */
function playWithGestures(config: GameConfig, player: GesturePlayer, maxTicks = 60 * 120): number {
  const state: GameState = createGame(0, config);
  flap(state, "gesture", config);

  let lastDecisionTick = 0;
  const pendingFlaps: number[] = [];

  for (let i = 0; i < maxTicks && state.status === "playing"; i += 1) {
    const nextPipe = state.pipes.find((pipe) => pipe.x + config.pipeWidth > config.birdX - config.birdRadius);
    const targetY = nextPipe ? nextPipe.gapY + config.pipeGap * 0.1 : config.height * 0.45;
    // Antecipa a queda durante a latência, como um jogador que pega o ritmo.
    const predictedY = state.birdY + state.birdVelocity * player.latencyTicks;

    if (predictedY > targetY && state.tick - lastDecisionTick >= player.minFlapIntervalTicks) {
      lastDecisionTick = state.tick;
      pendingFlaps.push(state.tick + player.latencyTicks);
    }

    if (pendingFlaps.length > 0 && pendingFlaps[0] <= state.tick) {
      pendingFlaps.shift();
      flap(state, "gesture", config);
    }

    stepTick(state, config);
  }

  return state.score;
}

describe("física assistida para gestos", () => {
  it("um jogador com ritmo e atraso de gesto passa de 20 canos", () => {
    expect(playWithGestures(GESTURE_GAME_CONFIG, REALISTIC_GESTURE_PLAYER)).toBeGreaterThanOrEqual(20);
  });

  it("um iniciante com ciclos de 1,5 s e 400 ms de atraso também passa de 20 canos", () => {
    expect(playWithGestures(GESTURE_GAME_CONFIG, SLOW_GESTURE_PLAYER)).toBeGreaterThanOrEqual(20);
  });

  it("jogar mais rápido não é punido (o teto só bloqueia)", () => {
    const fast: GesturePlayer = { minFlapIntervalTicks: 24, latencyTicks: 6 };
    expect(playWithGestures(GESTURE_GAME_CONFIG, fast)).toBeGreaterThanOrEqual(20);
  });

  it("o mesmo jogador mal sai do lugar com a física do clique", () => {
    const assisted = playWithGestures(GESTURE_GAME_CONFIG, REALISTIC_GESTURE_PLAYER);
    const classic = playWithGestures(DEFAULT_GAME_CONFIG, REALISTIC_GESTURE_PLAYER);

    expect(classic).toBeLessThan(assisted);
    expect(classic).toBeLessThan(5);
  });

  it("o teto bloqueia em vez de encerrar a partida", () => {
    const state = createGame(0, GESTURE_GAME_CONFIG);
    flap(state, "gesture", GESTURE_GAME_CONFIG);
    state.pipes = [{ x: 1_000_000, gapY: 270, passed: false }];
    state.birdY = GESTURE_GAME_CONFIG.birdRadius + 2;
    state.birdVelocity = -6;

    stepTick(state, GESTURE_GAME_CONFIG);

    expect(state.status).toBe("playing");
    expect(state.birdY).toBe(GESTURE_GAME_CONFIG.birdRadius);
    expect(state.birdVelocity).toBeGreaterThanOrEqual(0);
    expect(detectCollision({ birdY: 0, pipes: [] }, GESTURE_GAME_CONFIG)).toBe(false);
    expect(detectCollision({ birdY: 0, pipes: [] }, DEFAULT_GAME_CONFIG)).toBe(true);
  });

  it("os vãos ficam dentro da área jogável e variam menos", () => {
    const gaps = (config: GameConfig) => {
      const state = createGame(0, config);
      flap(state, "gesture", config);
      const seen = new Set<number>();
      for (let i = 0; i < 3_000; i += 1) {
        state.birdY = config.height / 3;
        state.birdVelocity = 0;
        stepTick(state, config);
        for (const pipe of state.pipes) seen.add(Math.round(pipe.gapY));
        state.pipes = state.pipes.filter((pipe) => pipe.x > config.birdX + 200);
      }
      return [...seen];
    };

    const assisted = gaps(GESTURE_GAME_CONFIG);
    const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
    const playableBottom = GESTURE_GAME_CONFIG.height - GESTURE_GAME_CONFIG.groundHeight;

    for (const gapY of assisted) {
      expect(gapY - GESTURE_GAME_CONFIG.pipeGap / 2).toBeGreaterThanOrEqual(0);
      expect(gapY + GESTURE_GAME_CONFIG.pipeGap / 2).toBeLessThanOrEqual(playableBottom);
    }
    expect(spread(assisted)).toBeLessThan(spread(gaps(DEFAULT_GAME_CONFIG)));
  });
});
