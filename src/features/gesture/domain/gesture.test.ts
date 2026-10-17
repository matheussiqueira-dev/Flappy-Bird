import { describe, expect, it } from "vitest";

import { GestureMapper } from "./gesture-mapper";
import { classifyHand, type Landmark } from "./hand-pose";
import { HandSteering, handCenterY } from "./hand-steering";

/**
 * Mão sintética vertical: pulso em (0.5, 0.9); para cada dedo, a articulação
 * PIP fica a 0.2 do pulso e a ponta a 0.35 (estendido) ou 0.12 (dobrado).
 */
function syntheticHand(extended: [boolean, boolean, boolean, boolean]): Landmark[] {
  const landmarks: Landmark[] = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.9 }));
  const fingers: Array<[tip: number, pip: number, x: number]> = [
    [8, 6, 0.42],
    [12, 10, 0.48],
    [16, 14, 0.54],
    [20, 18, 0.6],
  ];

  fingers.forEach(([tip, pip, x], index) => {
    landmarks[pip] = { x, y: 0.9 - 0.2 };
    landmarks[tip] = { x, y: 0.9 - (extended[index] ? 0.35 : 0.12) };
  });

  return landmarks;
}

describe("classifyHand", () => {
  it("reconhece mão aberta e punho fechado", () => {
    expect(classifyHand(syntheticHand([true, true, true, true]))).toEqual({
      pose: "open",
      extendedFingers: 4,
    });
    expect(classifyHand(syntheticHand([false, false, false, false])).pose).toBe("closed");
  });

  it("trata mão meio aberta como incerta (histerese)", () => {
    expect(classifyHand(syntheticHand([true, true, false, false])).pose).toBe("uncertain");
  });

  it("é invariante a rotação: mão deitada continua aberta", () => {
    const rotated = syntheticHand([true, true, true, true]).map(({ x, y }) => ({ x: y, y: x }));
    expect(classifyHand(rotated).pose).toBe("open");
  });

  it("rejeita listas incompletas de landmarks", () => {
    expect(classifyHand([{ x: 0, y: 0 }]).pose).toBe("uncertain");
  });
});

describe("GestureMapper", () => {
  const feed = (mapper: GestureMapper, poses: Array<"open" | "closed" | "uncertain" | null>, start = 0) =>
    poses.map((pose, index) => mapper.update({ pose, timestampMs: start + index * 33 }).shouldFlap);

  it("gera flap ao abrir a mão depois de fechá-la", () => {
    const mapper = new GestureMapper();
    expect(feed(mapper, ["closed", "closed", "open", "open"])).toEqual([false, false, false, true]);
  });

  it("não gera flap na primeira pose detectada", () => {
    const mapper = new GestureMapper();
    expect(feed(mapper, ["open", "open", "open"])).toEqual([false, false, false]);
  });

  it("ignora um frame isolado de ruído", () => {
    const mapper = new GestureMapper();
    expect(feed(mapper, ["closed", "closed", "open", "closed", "closed"])).not.toContain(true);
  });

  it("frames incertos ou sem mão não alteram a pose estável", () => {
    const mapper = new GestureMapper();
    feed(mapper, ["closed", "closed"]);
    expect(feed(mapper, [null, "uncertain", "open", "open"], 100)).toEqual([false, false, false, true]);
  });

  it("respeita o cooldown entre flaps", () => {
    const mapper = new GestureMapper({ stableFrames: 1, cooldownMs: 500 });
    const flaps = [
      mapper.update({ pose: "closed", timestampMs: 0 }),
      mapper.update({ pose: "open", timestampMs: 10 }),
      mapper.update({ pose: "closed", timestampMs: 20 }),
      mapper.update({ pose: "open", timestampMs: 30 }),
      mapper.update({ pose: "closed", timestampMs: 600 }),
      mapper.update({ pose: "open", timestampMs: 610 }),
    ].map((output) => output.shouldFlap);

    expect(flaps).toEqual([false, true, false, false, false, true]);
  });

  it("reset descarta o histórico", () => {
    const mapper = new GestureMapper({ stableFrames: 1 });
    mapper.update({ pose: "closed", timestampMs: 0 });
    mapper.reset();
    expect(mapper.update({ pose: "open", timestampMs: 1000 }).shouldFlap).toBe(false);
  });

  it("não pula quando uma mão reaparece aberta após perder o rastreamento", () => {
    const mapper = new GestureMapper();
    feed(mapper, ["closed", "closed"]);
    expect(feed(mapper, [null, null, "open", "open"], 1000)).not.toContain(true);
    expect(feed(mapper, ["closed", "closed", "open", "open"], 1200)).toContain(true);
  });
});

describe("HandSteering", () => {
  it("mapeia a faixa útil 0,2–0,8 para 0–1 e satura fora dela", () => {
    expect(new HandSteering().update(0.2)).toBe(0);
    expect(new HandSteering().update(0.5)).toBeCloseTo(0.5);
    expect(new HandSteering().update(0.8)).toBe(1);
    expect(new HandSteering().update(0.05)).toBe(0);
    expect(new HandSteering().update(0.95)).toBe(1);
  });

  it("zona morta segura o alvo contra tremor", () => {
    const steering = new HandSteering();
    steering.update(0.5);
    expect(steering.update(0.505)).toBeCloseTo(0.5);
    expect(steering.update(0.56)).toBeCloseTo(0.6);
  });

  it("mão fora de cena mantém o último alvo", () => {
    const steering = new HandSteering();
    expect(steering.update(null)).toBeNull();
    steering.update(0.35);
    expect(steering.update(null)).toBeCloseTo(0.25);
  });

  it("calcula o centro pela base da mão", () => {
    const hand = syntheticHand([true, true, true, true]);
    // Pulso em 0,9 e bases (MCP) também em 0,9 na mão sintética.
    expect(handCenterY(hand)).toBeCloseTo(0.9);
    expect(handCenterY([{ x: 0, y: 0 }])).toBeNull();
  });
});
