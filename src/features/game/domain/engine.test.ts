import { describe, expect, it } from "vitest";

import { DEFAULT_GAME_CONFIG as config } from "./config";
import { advance, createGame, detectCollision, flap, startGame, stepTick, togglePause } from "./engine";

describe("engine", () => {
  it("cria o jogo parado, com recorde saneado", () => {
    expect(createGame(12).highScore).toBe(12);
    expect(createGame(-4).highScore).toBe(0);
    expect(createGame(Number.NaN).highScore).toBe(0);
    expect(createGame().status).toBe("ready");
  });

  it("o primeiro flap inicia a partida e já impulsiona o pássaro", () => {
    const state = createGame();
    const events = flap(state, "pointer");

    expect(events.map((event) => event.type)).toEqual(["started", "flapped"]);
    expect(state.status).toBe("playing");
    expect(state.birdVelocity).toBe(config.flapVelocity);
    expect(state.flaps).toEqual({ pointer: 1, keyboard: 0, gesture: 0 });
  });

  it("não aceita flap com a partida pausada", () => {
    const state = createGame();
    flap(state, "keyboard");
    togglePause(state);

    expect(flap(state, "keyboard")).toEqual([]);
    expect(state.flaps.keyboard).toBe(1);
  });

  it("simula a mesma trajetória a 60 Hz e a 144 Hz", () => {
    const at60 = createGame();
    const at144 = createGame();
    flap(at60, "pointer");
    flap(at144, "pointer");

    for (let i = 0; i < 30; i += 1) advance(at60, 1000 / 60);
    for (let i = 0; i < 72; i += 1) advance(at144, 1000 / 144);

    expect(at144.elapsedMs).toBeCloseTo(at60.elapsedMs, 0);
    expect(Math.abs(at144.birdY - at60.birdY)).toBeLessThan(Math.abs(config.maxFallSpeed));
  });

  it("limita os ticks recuperados após um travamento longo", () => {
    const state = createGame();
    flap(state, "pointer");
    const tickBefore = state.tick;

    advance(state, 5_000);

    expect(state.tick - tickBefore).toBe(config.maxTicksPerFrame);
  });

  it("ignora deltas inválidos", () => {
    const state = createGame();
    expect(advance(state, -16)).toEqual([]);
    expect(advance(state, Number.NaN)).toEqual([]);
    expect(state.tick).toBe(0);
  });

  it("pausa congela a física mas mantém o cenário animado", () => {
    const state = createGame();
    flap(state, "pointer");
    togglePause(state);
    const birdY = state.birdY;

    stepTick(state);

    expect(state.birdY).toBe(birdY);
    expect(state.tick).toBe(1);
  });

  it("encerra a partida ao tocar o chão e sinaliza novo recorde", () => {
    const state = createGame(0);
    startGame(state);
    state.score = 3;
    state.birdY = config.height - config.groundHeight - config.birdRadius + 1;

    const events = stepTick(state);

    expect(state.status).toBe("game-over");
    expect(state.highScore).toBe(3);
    expect(events).toContainEqual({ type: "game-over", score: 3, highScore: 3, isNewRecord: true });
  });

  it("não marca recorde quando a pontuação não supera o anterior", () => {
    const state = createGame(10);
    startGame(state);
    state.score = 4;
    state.birdY = config.height;

    const events = stepTick(state);

    expect(state.highScore).toBe(10);
    expect(events).toContainEqual({ type: "game-over", score: 4, highScore: 10, isNewRecord: false });
  });

  it("pontua ao ultrapassar um cano e emite o evento", () => {
    const state = createGame();
    startGame(state);
    state.birdY = config.height / 2;
    state.birdVelocity = config.gravity * -1;
    state.pipes = [{ x: config.birdX - config.birdRadius - config.pipeWidth + 1, gapY: config.height / 2, passed: false }];
    state.spawnTimer = 0;

    const events = stepTick(state);

    expect(state.score).toBe(1);
    expect(events).toContainEqual({ type: "scored", score: 1 });
  });

  it("detecta colisão com o cano fora do vão e libera dentro dele", () => {
    const pipe = { x: config.birdX - 10, gapY: 270, passed: false };

    expect(detectCollision({ birdY: 270, pipes: [pipe] })).toBe(false);
    expect(detectCollision({ birdY: 120, pipes: [pipe] })).toBe(true);
    expect(detectCollision({ birdY: 5, pipes: [] })).toBe(true);
  });

  it("reiniciar preserva o recorde e zera a partida", () => {
    const state = createGame(7);
    flap(state, "gesture");
    state.score = 5;

    startGame(state);

    expect(state.highScore).toBe(7);
    expect(state.score).toBe(0);
    expect(state.flaps.gesture).toBe(0);
  });
});
