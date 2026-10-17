import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  createPreferencesStore,
  parsePreferences,
} from "./preferences-store";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => void data.set(key, value)),
    data,
  };
}

describe("parsePreferences", () => {
  it("usa o padrão campo a campo quando o valor é inválido", () => {
    expect(parsePreferences({ analytics: false, gestures: "sim" })).toEqual({
      analytics: false,
      gestures: true,
    });
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences("lixo")).toEqual(DEFAULT_PREFERENCES);
  });
});

describe("createPreferencesStore", () => {
  it("começa com o padrão e persiste mudanças", () => {
    const storage = memoryStorage();
    const store = createPreferencesStore(storage);
    const listener = vi.fn();
    store.subscribe(listener);

    expect(store.get()).toEqual(DEFAULT_PREFERENCES);

    store.set("analytics", false);

    expect(store.get().analytics).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.data.get(PREFERENCES_STORAGE_KEY) ?? "{}")).toEqual({
      analytics: false,
      gestures: true,
    });
  });

  it("mantém snapshot estável entre leituras", () => {
    const store = createPreferencesStore(memoryStorage());
    expect(store.get()).toBe(store.get());
  });

  it("lê preferências salvas e sobrevive a JSON corrompido", () => {
    const saved = createPreferencesStore(
      memoryStorage({ [PREFERENCES_STORAGE_KEY]: JSON.stringify({ gestures: false }) }),
    );
    expect(saved.get()).toEqual({ analytics: true, gestures: false });

    const broken = createPreferencesStore(memoryStorage({ [PREFERENCES_STORAGE_KEY]: "{oops" }));
    expect(broken.get()).toEqual(DEFAULT_PREFERENCES);
  });

  it("continua funcionando quando o storage recusa escrita", () => {
    const storage = memoryStorage();
    storage.setItem.mockImplementation(() => {
      throw new DOMException("bloqueado", "SecurityError");
    });
    const store = createPreferencesStore(storage);

    store.set("gestures", false);

    expect(store.get().gestures).toBe(false);
  });
});
