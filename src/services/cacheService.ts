type CacheEntry<T> = {
  value: T;
  updatedAt: number;
  expiresAt: number;
  refreshAt: number;
};

type CacheLoader<T> = () => Promise<T>;

type CacheOptions = {
  ttlMs?: number;
  refreshAheadMs?: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();
const refreshTimers = new Map<string, ReturnType<typeof setTimeout>>();

const DEFAULT_TTL_MS = 30 * 60 * 1000;
const DEFAULT_REFRESH_AHEAD_MS = 5 * 60 * 1000;

function now(): number {
  return Date.now();
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function storageKey(key: string): string {
  return `cache:${key}`;
}

function readPersistedEntry<T>(key: string): CacheEntry<T> | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.expiresAt !== 'number' || typeof parsed.refreshAt !== 'number') return null;

    return parsed;
  } catch {
    return null;
  }
}

function writePersistedEntry<T>(key: string, entry: CacheEntry<T>): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch {
    // Ignore storage quota and private-mode errors.
  }
}

function buildEntry<T>(value: T, ttlMs: number, refreshAheadMs: number): CacheEntry<T> {
  const updatedAt = now();
  const expiresAt = updatedAt + ttlMs;
  const refreshAt = Math.max(updatedAt, expiresAt - refreshAheadMs);

  return { value, updatedAt, expiresAt, refreshAt };
}

function scheduleRefresh<T>(key: string, loader: CacheLoader<T>, ttlMs: number, refreshAheadMs: number): void {
  if (refreshTimers.has(key)) {
    clearTimeout(refreshTimers.get(key));
  }

  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return;

  const delay = Math.max(0, entry.refreshAt - now());
  const timer = setTimeout(() => {
    refreshTimers.delete(key);
    void refreshCache(key, loader, ttlMs, refreshAheadMs);
  }, delay);

  refreshTimers.set(key, timer);
}

async function refreshCache<T>(key: string, loader: CacheLoader<T>, ttlMs: number, refreshAheadMs: number): Promise<T> {
  const current = inFlightRequests.get(key) as Promise<T> | undefined;
  if (current) return current;

  const promise = (async () => {
    const value = await loader();
    const entry = buildEntry(value, ttlMs, refreshAheadMs);
    memoryCache.set(key, entry);
    writePersistedEntry(key, entry);
    scheduleRefresh(key, loader, ttlMs, refreshAheadMs);
    return value;
  })().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
}

export async function getCachedValue<T>(
  key: string,
  loader: CacheLoader<T>,
  options: CacheOptions = {}
): Promise<T> {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const refreshAheadMs = options.refreshAheadMs ?? DEFAULT_REFRESH_AHEAD_MS;

  const inMemory = memoryCache.get(key) as CacheEntry<T> | undefined;
  const cached = inMemory || readPersistedEntry<T>(key);

  if (cached) {
    memoryCache.set(key, cached);

    if (!inFlightRequests.has(key)) {
      scheduleRefresh(key, loader, ttlMs, refreshAheadMs);
      if (now() >= cached.refreshAt) {
        void refreshCache(key, loader, ttlMs, refreshAheadMs);
      }
    }

    return cached.value;
  }

  return refreshCache(key, loader, ttlMs, refreshAheadMs);
}
