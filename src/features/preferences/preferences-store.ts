export const PREFERENCES_STORAGE_KEY = "flappy-gestures:prefs:v1";

export type Preferences = {
  /** Envio de page views e eventos para Vercel Analytics e GA4. */
  analytics: boolean;
  /** Permite ativar o controle por gestos (câmera) na demo. */
  gestures: boolean;
};

export const DEFAULT_PREFERENCES: Readonly<Preferences> = Object.freeze({
  analytics: true,
  gestures: true,
});

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type PreferencesStore = {
  get: () => Readonly<Preferences>;
  set: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  subscribe: (listener: () => void) => () => void;
};

/**
 * Preferências do visitante, salvas só neste navegador. A leitura é validada
 * campo a campo: valor ausente ou inválido cai no padrão, sem descartar os
 * demais. O snapshot é estável para uso com `useSyncExternalStore`.
 */
export function createPreferencesStore(storage: StorageLike | null): PreferencesStore {
  const listeners = new Set<() => void>();
  let cache: Readonly<Preferences> | null = null;

  const load = (): Readonly<Preferences> => {
    try {
      const raw = storage?.getItem(PREFERENCES_STORAGE_KEY);
      return raw ? parsePreferences(JSON.parse(raw)) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  };

  const get = () => {
    cache ??= load();
    return cache;
  };

  return {
    get,
    set(key, value) {
      const next = Object.freeze({ ...get(), [key]: value });
      cache = next;
      try {
        storage?.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage bloqueado: a preferência vale até recarregar a página.
      }
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);

      const onStorage = (event: StorageEvent) => {
        if (event.key === PREFERENCES_STORAGE_KEY) {
          cache = null;
          listener();
        }
      };
      if (typeof window !== "undefined") window.addEventListener("storage", onStorage);

      return () => {
        listeners.delete(listener);
        if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
      };
    },
  };
}

export function parsePreferences(value: unknown): Readonly<Preferences> {
  if (typeof value !== "object" || value === null) return DEFAULT_PREFERENCES;

  const record = value as Record<string, unknown>;
  return Object.freeze({
    analytics:
      typeof record.analytics === "boolean" ? record.analytics : DEFAULT_PREFERENCES.analytics,
    gestures: typeof record.gestures === "boolean" ? record.gestures : DEFAULT_PREFERENCES.gestures,
  });
}

let browserStore: PreferencesStore | null = null;

export function getPreferencesStore(): PreferencesStore {
  if (typeof window === "undefined") return createPreferencesStore(null);

  if (!browserStore) {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    browserStore = createPreferencesStore(storage);
  }

  return browserStore;
}
