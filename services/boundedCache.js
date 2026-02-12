// Bounded cache with TTL and max-size eviction
// Prevents memory leaks in long-running serverless instances

class BoundedCache {
  constructor({ maxSize = 200, ttlMs = 60 * 60 * 1000 } = {}) {
    this.map = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.ts > this.ttlMs) {
      this.map.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value) {
    // Evict oldest entries if at capacity
    if (this.map.size >= this.maxSize) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
    this.map.set(key, { value, ts: Date.now() });
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  delete(key) {
    return this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }

  get size() {
    return this.map.size;
  }
}

module.exports = { BoundedCache };
