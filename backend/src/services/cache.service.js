const DEFAULT_TTL_MS = 60 * 1000;

const cacheStore = new Map();

function nowIso(value = Date.now()) {
  return new Date(value).toISOString();
}

function buildMeta(entry, { hit, stale = false, bypassed = false } = {}) {
  const now = Date.now();
  const ageMs = Math.max(0, now - entry.createdAt);

  return {
    hit: Boolean(hit),
    stale: Boolean(stale),
    bypassed: Boolean(bypassed),
    ttlMs: entry.ttlMs,
    ageMs,
    refreshedAt: nowIso(entry.createdAt),
    expiresAt: nowIso(entry.createdAt + entry.ttlMs),
  };
}

function getEntry(key) {
  const entry = cacheStore.get(key);
  if (!entry) return null;

  return {
    ...entry,
    fresh: Date.now() - entry.createdAt < entry.ttlMs,
  };
}

function setEntry(key, value, ttlMs = DEFAULT_TTL_MS) {
  const entry = {
    value,
    ttlMs,
    createdAt: Date.now(),
  };
  cacheStore.set(key, entry);
  return entry;
}

function shouldRefresh(value) {
  return value === "1" || value === "true";
}

async function readThroughCache({ key, ttlMs = DEFAULT_TTL_MS, refresh, loader }) {
  const cached = getEntry(key);

  if (!shouldRefresh(refresh) && cached?.fresh) {
    return {
      value: cached.value,
      cache: buildMeta(cached, { hit: true }),
    };
  }

  try {
    const value = await loader();
    const entry = setEntry(key, value, ttlMs);

    return {
      value,
      cache: buildMeta(entry, {
        hit: false,
        bypassed: shouldRefresh(refresh),
      }),
    };
  } catch (error) {
    if (cached) {
      return {
        value: cached.value,
        cache: buildMeta(cached, { hit: true, stale: true }),
      };
    }
    throw error;
  }
}

function invalidateCacheByPrefix(prefix) {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
}

function invalidateCacheKeys(keys) {
  keys.forEach((key) => cacheStore.delete(key));
}

function invalidateTraceabilityReadCaches() {
  invalidateCacheByPrefix("batches:");
  invalidateCacheKeys(["dashboard:summary", "compliance:evidence"]);
}

module.exports = {
  DEFAULT_TTL_MS,
  invalidateCacheByPrefix,
  invalidateCacheKeys,
  invalidateTraceabilityReadCaches,
  readThroughCache,
};
