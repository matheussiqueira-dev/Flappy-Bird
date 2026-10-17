import type { GameSessionRecord } from "../domain/session";
import { INPUT_SOURCES } from "../domain/session";

export const SESSIONS_STORAGE_KEY = "flappy-gestures:sessions:v1";
export const MAX_STORED_SESSIONS = 50;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type SessionRepository = {
  /** Snapshot estável: a mesma referência até a próxima escrita. */
  list: () => readonly GameSessionRecord[];
  append: (record: GameSessionRecord) => void;
  clear: () => void;
  subscribe: (listener: () => void) => () => void;
};

const EMPTY: readonly GameSessionRecord[] = Object.freeze([]);

/**
 * Repositório de sessões em localStorage. Tudo que é lido é validado, porque o
 * conteúdo pode ter sido editado pelo usuário, gravado por uma versão antiga
 * ou corrompido. Quando o storage não está disponível (modo privado, cota
 * cheia, SSR), o repositório segue funcionando em memória.
 */
export function createSessionRepository(storage: StorageLike | null): SessionRepository {
  const listeners = new Set<() => void>();
  let cache: readonly GameSessionRecord[] | null = null;
  let memory: readonly GameSessionRecord[] = EMPTY;

  const notify = () => {
    for (const listener of listeners) listener();
  };

  const load = (): readonly GameSessionRecord[] => {
    if (!storage) return memory;

    try {
      const raw = storage.getItem(SESSIONS_STORAGE_KEY);
      return raw ? parseSessions(JSON.parse(raw)) : EMPTY;
    } catch {
      return memory;
    }
  };

  const persist = (records: readonly GameSessionRecord[]) => {
    memory = records;
    cache = records;

    if (storage) {
      try {
        storage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(records));
      } catch {
        // Cota excedida ou storage bloqueado: os dados ficam só em memória.
      }
    }

    notify();
  };

  const list = () => {
    cache ??= load();
    return cache;
  };

  return {
    list,
    append(record) {
      persist([...list(), record].slice(-MAX_STORED_SESSIONS));
    },
    clear() {
      memory = EMPTY;
      cache = EMPTY;
      try {
        storage?.removeItem(SESSIONS_STORAGE_KEY);
      } catch {
        // Ignorado: o estado em memória já foi limpo.
      }
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);

      // Mantém abas diferentes sincronizadas.
      const onStorage = (event: StorageEvent) => {
        if (event.key === SESSIONS_STORAGE_KEY) {
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

export function parseSessions(value: unknown): readonly GameSessionRecord[] {
  if (!Array.isArray(value)) return EMPTY;

  const records = value.filter(isSessionRecord).slice(-MAX_STORED_SESSIONS);
  return records.length ? records : EMPTY;
}

function isSessionRecord(value: unknown): value is GameSessionRecord {
  if (typeof value !== "object" || value === null) return false;

  const record = value as Record<string, unknown>;
  const flaps = record.flaps as Record<string, unknown> | null | undefined;

  return (
    typeof record.id === "string" &&
    record.id.length > 0 &&
    record.id.length <= 64 &&
    typeof record.endedAt === "string" &&
    !Number.isNaN(Date.parse(record.endedAt)) &&
    isNonNegativeInteger(record.durationMs) &&
    isNonNegativeInteger(record.score) &&
    typeof flaps === "object" &&
    flaps !== null &&
    INPUT_SOURCES.every((source) => isNonNegativeInteger(flaps[source]))
  );
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

let browserRepository: SessionRepository | null = null;

/** Instância compartilhada no navegador; no servidor, um repositório vazio em memória. */
export function getSessionRepository(): SessionRepository {
  if (typeof window === "undefined") {
    return createSessionRepository(null);
  }

  browserRepository ??= createSessionRepository(safeLocalStorage());
  return browserRepository;
}

function safeLocalStorage(): Storage | null {
  try {
    const storage = window.localStorage;
    const probe = "__flappy_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}
