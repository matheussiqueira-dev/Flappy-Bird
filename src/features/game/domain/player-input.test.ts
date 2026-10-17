import { describe, expect, it } from "vitest";

import { advance, createGame, togglePause } from "./engine";
import { applyPlayerFlap, pauseWhenHandLost } from "./player-input";
import { HandPresence } from "../../gesture/domain/hand-presence";

describe("sessão exclusivamente gestual", () => {
  it("bloqueia teclado e ponteiro inclusive antes da primeira jogada", () => {
    const state = createGame();
    expect(applyPlayerFlap(state, "pointer", true, true)).toEqual([]);
    expect(applyPlayerFlap(state, "keyboard", true, true)).toEqual([]);
    expect(state.status).toBe("ready");
    expect(applyPlayerFlap(state, "gesture", true, true)).toHaveLength(2);
    expect(state.flaps).toEqual({ pointer: 0, keyboard: 0, gesture: 1 });
  });

  it("retoma uma pausa somente após um gesto com rastreamento válido", () => {
    const state = createGame();
    applyPlayerFlap(state, "gesture", true, true);
    togglePause(state);
    applyPlayerFlap(state, "gesture", true, false);
    expect(state.status).toBe("paused");
    applyPlayerFlap(state, "gesture", true, true);
    expect(state.status).toBe("playing");
    expect(state.flaps.gesture).toBe(2);
  });

  it("preserva o modo manual sem gestos e não retoma por acidente", () => {
    const state = createGame();
    applyPlayerFlap(state, "pointer", false, false);
    togglePause(state);
    expect(applyPlayerFlap(state, "keyboard", false, true)).toEqual([]);
    expect(state.status).toBe("paused");
  });

  it("congela posição e tempo ao perder a mão, sem pausa no modo manual", () => {
    const state = createGame();
    applyPlayerFlap(state, "gesture", true, true);
    expect(pauseWhenHandLost(state, false, false)).toBe(false);
    expect(pauseWhenHandLost(state, true, true)).toBe(false);
    const before = { y: state.birdY, elapsed: state.elapsedMs };
    expect(pauseWhenHandLost(state, true, false)).toBe(true);
    advance(state, 1000);
    expect(state.status).toBe("paused");
    expect(state.birdY).toBe(before.y);
    expect(state.elapsedMs).toBe(before.elapsed);
    expect(pauseWhenHandLost(state, true, false)).toBe(false);
  });
});

describe("HandPresence", () => {
  it("tolera falhas curtas, expira sem novos quadros e exige nova observação", () => {
    const presence = new HandPresence();
    expect(presence.isAvailable(0)).toBe(false);
    presence.observe(100);
    expect(presence.isAvailable(1099)).toBe(true);
    expect(presence.isAvailable(1100)).toBe(false);
    presence.observe(1200);
    expect(presence.isAvailable(1210)).toBe(true);
    presence.reset();
    expect(presence.isAvailable(1220)).toBe(false);
  });
});
