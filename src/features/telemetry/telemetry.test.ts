import { describe, expect, it, vi } from "vitest";

import { summarizeSessions, type GameSessionRecord } from "./domain/session";
import {
  MAX_STORED_SESSIONS,
  SESSIONS_STORAGE_KEY,
  createSessionRepository,
  parseSessions,
} from "./infrastructure/session-repository";

function record(score: number, minute: number, gesture = 0): GameSessionRecord {
  return {
    id: `s-${minute}`,
    endedAt: new Date(Date.UTC(2026, 9, 1, 12, minute)).toISOString(),
    durationMs: 10_000,
    score,
    flaps: { pointer: 2, keyboard: 0, gesture },
  };
}

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => void data.set(key, value)),
    removeItem: vi.fn((key: string) => void data.delete(key)),
    data,
  };
}

describe("summarizeSessions", () => {
  it("retorna zeros sem partidas", () => {
    const summary = summarizeSessions([]);
    expect(summary.totalGames).toBe(0);
    expect(summary.averageScore).toBe(0);
    expect(summary.gestureShare).toBe(0);
    expect(summary.scoreTrend).toBeNull();
  });

  it("agrega pontuação, tempo e participação dos gestos", () => {
    const summary = summarizeSessions([record(4, 1, 2), record(10, 2, 6)]);

    expect(summary.totalGames).toBe(2);
    expect(summary.bestScore).toBe(10);
    expect(summary.averageScore).toBe(7);
    expect(summary.totalPlayMs).toBe(20_000);
    expect(summary.totalFlaps).toBe(12);
    expect(summary.gestureShare).toBeCloseTo(8 / 12);
  });

  it("ordena cronologicamente e calcula a tendência com 10+ partidas", () => {
    const records = Array.from({ length: 10 }, (_, index) => record(index < 5 ? 2 : 6, index));
    const summary = summarizeSessions([...records].reverse());

    expect(summary.recentScores).toEqual([2, 2, 2, 2, 2, 6, 6, 6, 6, 6]);
    expect(summary.scoreTrend).toBe(4);
  });
});

describe("parseSessions", () => {
  it("descarta registros malformados ou adulterados", () => {
    const valid = record(3, 1);
    const parsed = parseSessions([
      valid,
      { ...valid, score: -1 },
      { ...valid, score: 1.5 },
      { ...valid, endedAt: "ontem" },
      { ...valid, flaps: { pointer: 1 } },
      { ...valid, id: "" },
      "lixo",
      null,
    ]);

    expect(parsed).toEqual([valid]);
  });

  it("aceita somente arrays", () => {
    expect(parseSessions({ id: "x" })).toEqual([]);
  });
});

describe("createSessionRepository", () => {
  it("persiste, mantém snapshot estável e notifica assinantes", () => {
    const storage = memoryStorage();
    const repository = createSessionRepository(storage);
    const listener = vi.fn();
    repository.subscribe(listener);

    const before = repository.list();
    expect(repository.list()).toBe(before);

    repository.append(record(5, 1));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(repository.list()).toHaveLength(1);
    expect(JSON.parse(storage.data.get(SESSIONS_STORAGE_KEY) ?? "[]")).toHaveLength(1);
  });

  it(`mantém apenas as ${MAX_STORED_SESSIONS} partidas mais recentes`, () => {
    const repository = createSessionRepository(memoryStorage());
    for (let i = 0; i < MAX_STORED_SESSIONS + 5; i += 1) repository.append(record(i, i));

    const list = repository.list();
    expect(list).toHaveLength(MAX_STORED_SESSIONS);
    expect(list[0].score).toBe(5);
  });

  it("métodos funcionam desestruturados (sem depender de this)", () => {
    const { append, list } = createSessionRepository(memoryStorage());
    append(record(2, 1));
    expect(list()).toHaveLength(1);
  });

  it("sobrevive a JSON corrompido no storage", () => {
    const repository = createSessionRepository(memoryStorage({ [SESSIONS_STORAGE_KEY]: "{oops" }));
    expect(repository.list()).toEqual([]);
  });

  it("continua em memória quando o storage recusa escrita", () => {
    const storage = memoryStorage();
    storage.setItem.mockImplementation(() => {
      throw new DOMException("cheio", "QuotaExceededError");
    });
    const repository = createSessionRepository(storage);

    repository.append(record(8, 1));

    expect(repository.list()).toHaveLength(1);
  });

  it("clear remove os dados", () => {
    const storage = memoryStorage();
    const repository = createSessionRepository(storage);
    repository.append(record(1, 1));

    repository.clear();

    expect(repository.list()).toEqual([]);
    expect(storage.data.has(SESSIONS_STORAGE_KEY)).toBe(false);
  });
});
