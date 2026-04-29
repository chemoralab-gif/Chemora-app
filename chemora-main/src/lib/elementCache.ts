/**
 * Element Cache
 * Caches frequently accessed element data to avoid recomputation
 * Improves performance for rule-based engine
 */

import { ElementData, getElementData as fetchElementData } from "./elementData";

export interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
}

class ElementCache {
  private cache: Map<string, ElementData | null> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    hitRate: 0,
  };

  /**
   * Get element data with caching
   */
  getElementData(symbol: string): ElementData | null {
    this.stats.totalRequests++;

    // Check cache first
    if (this.cache.has(symbol)) {
      this.stats.hits++;
      this.updateHitRate();
      return this.cache.get(symbol) || null;
    }

    // Fetch and cache
    this.stats.misses++;
    const data = fetchElementData(symbol);
    this.cache.set(symbol, data);
    this.updateHitRate();

    return data;
  }

  /**
   * Pre-cache elements for better performance
   */
  precacheElements(symbols: string[]): void {
    for (const symbol of symbols) {
      if (!this.cache.has(symbol)) {
        const data = fetchElementData(symbol);
        this.cache.set(symbol, data);
      }
    }
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, totalRequests: 0, hitRate: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    if (this.stats.totalRequests > 0) {
      this.stats.hitRate = this.stats.hits / this.stats.totalRequests;
    }
  }

  /**
   * Cache size
   */
  getSize(): number {
    return this.cache.size;
  }
}

// Global cache instance
let globalCache: ElementCache | null = null;

/**
 * Get or create global cache
 */
export function getGlobalCache(): ElementCache {
  if (!globalCache) {
    globalCache = new ElementCache();
  }
  return globalCache;
}

/**
 * Reset global cache
 */
export function resetGlobalCache(): void {
  if (globalCache) {
    globalCache.clear();
  }
}

/**
 * Pre-cache common elements for performance
 */
export function precacheCommonElements(): void {
  const commonSymbols = [
    "H",
    "C",
    "N",
    "O",
    "F",
    "S",
    "Cl",
    "Na",
    "Mg",
    "Al",
    "Si",
    "P",
    "Ca",
    "Fe",
    "Cu",
    "Zn",
    "Br",
  ];

  getGlobalCache().precacheElements(commonSymbols);
}

/**
 * Fast element lookup using cache
 */
export function getCachedElementData(symbol: string): ElementData | null {
  return getGlobalCache().getElementData(symbol);
}

/**
 * Get cache performance statistics
 */
export function getCacheStats(): CacheStats {
  return getGlobalCache().getStats();
}

/**
 * Print cache statistics for debugging
 */
export function printCacheStats(): void {
  const stats = getCacheStats();
  console.log("=== Element Cache Statistics ===");
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Cache Hits: ${stats.hits}`);
  console.log(`Cache Misses: ${stats.misses}`);
  console.log(`Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`);
  console.log(`Cache Size: ${getGlobalCache().getSize()} elements`);
}
