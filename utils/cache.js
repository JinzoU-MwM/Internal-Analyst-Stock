/**
 * In-memory cache with per-key TTL.
 *
 * Usage:
 *   import { cache, cacheMiddleware } from "./utils/cache.js";
 *
 *   // As Express middleware (auto-caches GET responses):
 *   router.get("/heavy", cacheMiddleware(300), handler);
 *
 *   // Programmatic usage:
 *   cache.set("key", data, 300);    // TTL in seconds
 *   cache.get("key");               // data or undefined
 *   cache.del("key");               // manual invalidation
 *   cache.flush();                  // clear everything
 */

class MemoryCache {
    constructor() {
        /** @type {Map<string, { data: any, expiresAt: number }>} */
        this._store = new Map();

        // Sweep expired entries every 60 s
        this._sweepInterval = setInterval(() => this._sweep(), 60_000);
        this._sweepInterval.unref(); // don't keep process alive
    }

    /**
     * Get a cached value.
     * @param {string} key
     * @returns {any|undefined}
     */
    get(key) {
        const entry = this._store.get(key);
        if (!entry) return undefined;
        if (Date.now() > entry.expiresAt) {
            this._store.delete(key);
            return undefined;
        }
        return entry.data;
    }

    /**
     * Store a value with a TTL.
     * @param {string} key
     * @param {any}    data
     * @param {number} ttlSeconds – time-to-live in seconds
     */
    set(key, data, ttlSeconds) {
        this._store.set(key, {
            data,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }

    /** Delete a single key. */
    del(key) {
        this._store.delete(key);
    }

    /** Flush the entire cache. */
    flush() {
        this._store.clear();
    }

    /** Return current cache stats. */
    stats() {
        let active = 0;
        const now = Date.now();
        for (const entry of this._store.values()) {
            if (entry.expiresAt > now) active++;
        }
        return { total: this._store.size, active };
    }

    /** Remove all expired entries. */
    _sweep() {
        const now = Date.now();
        for (const [key, entry] of this._store) {
            if (now > entry.expiresAt) this._store.delete(key);
        }
    }
}

/** Singleton cache instance */
export const cache = new MemoryCache();

/**
 * Express middleware that caches JSON responses for GET requests.
 *
 * @param {number} ttlSeconds – how long to cache (default: 300 = 5 min)
 * @returns {import("express").RequestHandler}
 */
export function cacheMiddleware(ttlSeconds = 300) {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== "GET") return next();

        const key = `__route__${req.originalUrl}`;
        const cached = cache.get(key);

        if (cached) {
            res.set("X-Cache", "HIT");
            return res.json(cached);
        }

        // Monkey-patch res.json to intercept the response
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            // Only cache successful (2xx) responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cache.set(key, body, ttlSeconds);
            }
            res.set("X-Cache", "MISS");
            return originalJson(body);
        };

        next();
    };
}
