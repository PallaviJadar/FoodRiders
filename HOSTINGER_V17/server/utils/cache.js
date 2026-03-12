// 🚀 Ultra-Fast RAM Cache Utility
const cache = new Map();

/**
 * Get or Set cache with TTL (Time To Live)
 */
const getOrSet = (key, durationMs, fetcher) => {
    const now = Date.now();
    const hit = cache.get(key);

    if (hit && (now - hit.time < durationMs)) {
        return hit.data;
    }

    // Fetcher can be async
    return Promise.resolve(fetcher()).then(data => {
        cache.set(key, { data, time: Date.now() });
        return data;
    });
};

const purge = (pattern) => {
    for (const key of cache.keys()) {
        if (key.includes(pattern)) {
            cache.delete(key);
        }
    }
};

const purgeAll = () => {
    cache.clear();

    // 🔥 INSTANT SYNC FIX: Purge the global fast-cache used in restaurant.js
    Object.keys(global).forEach(key => {
        if (key.startsWith('rest_slug_') || key.startsWith('rest_cache_')) {
            delete global[key];
        }
    });
};

module.exports = { getOrSet, purge, purgeAll };
