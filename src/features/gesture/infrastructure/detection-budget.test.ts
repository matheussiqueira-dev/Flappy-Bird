import { describe, expect, it } from "vitest";

import { DetectionBudget } from "./detection-budget";

describe("DetectionBudget", () => {
  it("roda logo na primeira chamada", () => {
    expect(new DetectionBudget().shouldRun(0)).toBe(true);
  });

  it("ignora o aquecimento na média de custo", () => {
    const budget = new DetectionBudget({ maxRateHz: 30, maxMainThreadShare: 0.3, warmupRuns: 2 });
    budget.record(0, 900);
    budget.record(100, 600);
    budget.record(200, 3);

    expect(budget.minIntervalMs).toBeCloseTo(1000 / 30);
  });

  it("com inferência barata, o limite é a taxa máxima", () => {
    const budget = new DetectionBudget({ maxRateHz: 30, maxMainThreadShare: 0.3, warmupRuns: 0 });
    budget.record(0, 2);

    expect(budget.minIntervalMs).toBeCloseTo(1000 / 30);
    expect(budget.shouldRun(20)).toBe(false);
    expect(budget.shouldRun(34)).toBe(true);
  });

  it("com inferência cara, espaça para respeitar a fatia da thread principal", () => {
    const budget = new DetectionBudget({ maxRateHz: 30, maxMainThreadShare: 0.3, warmupRuns: 0 });
    budget.record(0, 300);

    expect(budget.minIntervalMs).toBeCloseTo(1000);
    expect(budget.shouldRun(900)).toBe(false);
    expect(budget.shouldRun(1000)).toBe(true);
  });

  it("suaviza picos isolados de custo", () => {
    const budget = new DetectionBudget({ maxRateHz: 30, maxMainThreadShare: 0.5, warmupRuns: 0 });
    budget.record(0, 10);
    budget.record(100, 210);

    // Média móvel: 10 * 0,7 + 210 * 0,3 = 70 ms -> intervalo de 140 ms.
    expect(budget.minIntervalMs).toBeCloseTo(140);
  });

  it("ignora medições inválidas sem travar o agendamento", () => {
    const budget = new DetectionBudget({ warmupRuns: 0 });
    budget.record(0, Number.NaN);
    budget.record(0, -5);

    expect(budget.minIntervalMs).toBeCloseTo(1000 / 30);
  });
});
