const PREFIX = 'moshan_cache_';

// Drop expired entries so shows no longer listed don't pile up
try {
  for (const key of Object.keys(localStorage).filter(k => k.startsWith(PREFIX))) {
    if (JSON.parse(localStorage.getItem(key)).expires < Date.now()) {
      localStorage.removeItem(key);
    }
  }
} catch {
  // storage unavailable or corrupt entry: caching just doesn't happen
}

// Returns fn()'s JSON-able result, kept in localStorage for ttlMs.
// For third-party data only; the user's own data is always fetched fresh.
export async function cached(key, ttlMs, fn) {
  try {
    const entry = JSON.parse(localStorage.getItem(PREFIX + key));
    if (entry && entry.expires > Date.now()) {
      return entry.value;
    }
  } catch {
    // fall through to a fresh fetch
  }
  const value = await fn();
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({expires: Date.now() + ttlMs, value}));
  } catch {
    // quota exceeded: still works, just uncached
  }
  return value;
}
