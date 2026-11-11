import { useSyncExternalStore } from "react";

/** Client-side state of the demonstration (which demo institutions are "connected"). No bank data here. */
interface DemoState {
  disconnected: string[];
  refreshedAt: string;
}

const KEY = "financeai.demo.v1";
const listeners = new Set<() => void>();
let cache: DemoState | null = null;

const SERVER_STATE: DemoState = { disconnected: [], refreshedAt: "1970-01-01T00:00:00.000Z" };

function read(): DemoState {
  if (cache) return cache;
  if (typeof window === "undefined") return SERVER_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (Array.isArray(parsed.disconnected) && typeof parsed.refreshedAt === "string") {
        cache = parsed;
        return cache;
      }
    }
  } catch {
    // ignore malformed storage
  }
  cache = { disconnected: [], refreshedAt: new Date().toISOString() };
  window.localStorage.setItem(KEY, JSON.stringify(cache));
  return cache;
}

function write(next: DemoState) {
  cache = next;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function useDemoState(): DemoState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => SERVER_STATE,
  );
}

export const demoActions = {
  disconnect(id: string) {
    const s = read();
    if (!s.disconnected.includes(id)) write({ ...s, disconnected: [...s.disconnected, id] });
  },
  reconnect(id: string) {
    const s = read();
    write({ ...s, disconnected: s.disconnected.filter((x) => x !== id) });
  },
  restoreAll() {
    write({ disconnected: [], refreshedAt: new Date().toISOString() });
  },
  /** Regenerates the demo snapshot. Demo data is local, so this only refreshes the timestamp. */
  refresh() {
    write({ ...read(), refreshedAt: new Date().toISOString() });
  },
};
