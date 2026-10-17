import { describe, expect, it } from "vitest";

import { DEFAULT_GAME_CONFIG as config } from "./config";
import {
  advance,
  createGame,
  detectCollision,
  flap,
  setControlMode,
  setSteerTarget,
  startGame,
  stepTick,
  togglePause,
} from "./engine";

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

describe("engine: modo steer (altura da mão)", () => {
  const playingSteer = () => {
    const state = createGame();
    setControlMode(state, "steer");
    startGame(state);
    // Um cano muito distante impede o spawn (que ocorre com a lista vazia) e
    // isola a física vertical do teste.
    state.pipes = [{ x: 1_000_000, gapY: config.height / 2, passed: false }];
    state.spawnTimer = -10_000;
    return state;
  };

  it("troca de modo reinicia a partida e preserva o recorde", () => {
    const state = createGame(9);
    flap(state, "pointer");

    setControlMode(state, "steer");

    expect(state.controlMode).toBe("steer");
    expect(state.status).toBe("ready");
    expect(state.highScore).toBe(9);
  });

  it("o pássaro converge para o alvo sem gravidade", () => {
    const state = playingSteer();
    setSteerTarget(state, 0);

    for (let i = 0; i < 120; i += 1) stepTick(state);

    expect(state.status).toBe("playing");
    expect(state.birdY).toBeCloseTo(config.birdRadius + config.steerMarginPx, 0);
  });

  it("nunca encosta no chão mesmo com o alvo no limite inferior", () => {
    const state = playingSteer();
    setSteerTarget(state, 1);

    for (let i = 0; i < 300; i += 1) stepTick(state);

    expect(state.status).toBe("playing");
    expect(state.birdY + config.birdRadius).toBeLessThan(config.height - config.groundHeight);
  });

  it("flap só inicia a partida, sem impulso", () => {
    const state = createGame();
    setControlMode(state, "steer");

    const events = flap(state, "gesture");

    expect(events.map((event) => event.type)).toEqual(["started"]);
    expect(state.birdVelocity).toBe(0);
  });

  it("satura e ignora alvos inválidos", () => {
    const state = createGame();
    setSteerTarget(state, 3);
    expect(state.steerTarget).toBe(1);
    setSteerTarget(state, Number.NaN);
    expect(state.steerTarget).toBe(1);
  });

  it("reiniciar mantém o modo e o alvo", () => {
    const state = playingSteer();
    setSteerTarget(state, 0.2);

    startGame(state);

    expect(state.controlMode).toBe("steer");
    expect(state.steerTarget).toBe(0.2);
  });
});
