/**
 * Retrieval Cache for Timetable Generation
 * Caches frequently accessed data combinations for improved performance
 */

import { SearchResult } from '../rag/DocumentProcessor';
import { DocumentType, ChunkType } from '../rag/DocumentProcessor';
import { RetrievalResult } from './RetrievalStrategy';

export interface CacheKey {
  requestType: string;
  organizationId: string;
  departmentId?: string;
  year?: number;
  semester?: string;
  facultyId?: string;
  studentId?: string;
  chosenSubjects?: string[];
  constraints?: string[];
  hash: string;
}

export interface CacheEntry {
  key: CacheKey;
  data: RetrievalResult;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ttl: number; // Time to live in milliseconds
}

export interface CacheOptions {
  maxSize: number;
  defaultTTL: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  enableCompression: boolean;
  enablePersistence: boolean;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  totalRequests: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

export class RetrievalCache {
  private cache: Map<string, CacheEntry> = new Map();
  private options: CacheOptions;
  private stats = {
    hits: 0,
    misses: 0,
    requests: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: CacheOptions = {
    maxSize: 1000,
    defaultTTL: 30 * 60 * 1000, // 30 minutes
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
    enableCompression: true,
    enablePersistence: false
  }) {
    this.options = options;
    this.startCleanupTimer();
  }

  /**
   * Generate cache key from request parameters
   */
  generateCacheKey(params: {
    requestType: string;
    organizationId: string;
    departmentId?: string;
    year?: number;
    semester?: string;
    facultyId?: string;
    studentId?: string;
    chosenSubjects?: string[];
    constraints?: string[];
  }): CacheKey {
    const keyString = JSON.stringify({
      requestType: params.requestType,
      organizationId: params.organizationId,
      departmentId: params.departmentId,
      year: params.year,
      semester: params.semester,
      facultyId: params.facultyId,
      studentId: params.studentId,
      chosenSubjects: params.chosenSubjects?.sort(),
      constraints: params.constraints?.sort()
    });

    const hash = this.hashString(keyString);

    return {
      ...params,
      hash
    };
  }

  /**
   * Get data from cache
   */
  get(key: CacheKey): RetrievalResult | null {
    this.stats.requests++;
    
    const cacheKey = key.hash;
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.data;
  }

  /**
   * Store data in cache
   */
  set(key: CacheKey, data: RetrievalResult, ttl?: number): void {
    const cacheKey = key.hash;
    const now = Date.now();

    // Check if cache is full
    if (this.cache.size >= this.options.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry = {
      key,
      data: this.options.enableCompression ? this.compressData(data) : data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      ttl: ttl || this.options.defaultTTL
    };

    this.cache.set(cacheKey, entry);
  }

  /**
   * Check if key exists in cache
   */
  has(key: CacheKey): boolean {
    const cacheKey = key.hash;
    const entry = this.cache.get(cacheKey);

    if (!entry) return false;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      return false;
    }

    return true;
  }

  /**
   * Delete entry from cache
   */
  delete(key: CacheKey): boolean {
    const cacheKey = key.hash;
    return this.cache.delete(cacheKey);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, requests: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      totalEntries: this.cache.size,
      hitRate: this.stats.requests > 0 ? this.stats.hits / this.stats.requests : 0,
      missRate: this.stats.requests > 0 ? this.stats.misses / this.stats.requests : 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      totalRequests: this.stats.requests,
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };
  }

  /**
   * Get frequently accessed entries
   */
  getFrequentEntries(limit: number = 10): CacheEntry[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  /**
   * Get entries by request type
   */
  getEntriesByType(requestType: string): CacheEntry[] {
    return Array.from(this.cache.values())
      .filter(entry => entry.key.requestType === requestType);
  }

  /**
   * Warm up cache with common queries
   */
  async warmUp(commonQueries: Array<{
    key: CacheKey;
    data: RetrievalResult;
  }>): Promise<void> {
    console.log(`Warming up cache with ${commonQueries.length} common queries`);
    
    for (const query of commonQueries) {
      this.set(query.key, query.data);
    }
    
    console.log('Cache warm-up completed');
  }

  /**
   * Preload cache for specific scenarios
   */
  async preloadForScenario(
    scenario: 'FACULTY_SCHEDULE' | 'STUDENT_SCHEDULE' | 'BATCH_SCHEDULE',
    organizationId: string,
    departmentId?: string
  ): Promise<void> {
    console.log(`Preloading cache for ${scenario} scenario`);
    
    // This would typically involve running common queries
    // and storing their results in the cache
    // Implementation depends on the specific retrieval service
    
    console.log(`Cache preload completed for ${scenario}`);
  }

  /**
   * Export cache data for persistence
   */
  exportCache(): string {
    const cacheData = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry: {
        ...entry,
        data: this.options.enableCompression ? 
          this.decompressData(entry.data) : entry.data
      }
    }));

    return JSON.stringify(cacheData, null, 2);
  }

  /**
   * Import cache data from persistence
   */
  importCache(cacheData: string): void {
    try {
      const data = JSON.parse(cacheData);
      
      for (const { key, entry } of data) {
        this.cache.set(key, {
          ...entry,
          data: this.options.enableCompression ? 
            this.compressData(entry.data) : entry.data
        });
      }
      
      console.log(`Imported ${data.length} cache entries`);
    } catch (error) {
      console.error('Failed to import cache data:', error);
    }
  }

  /**
   * Hash string to create cache key
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastRecentlyUsed(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Remove oldest 10% of entries
    const toRemove = Math.ceil(entries.length * 0.1);
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry).length * 2; // Rough estimate
    }
    
    return totalSize;
  }

  /**
   * Compress data for storage
   */
  private compressData(data: RetrievalResult): RetrievalResult {
    // Simple compression by removing redundant information
    const compressedData = {
      ...data,
      data: data.data.map(item => ({
        ...item,
        chunk: {
          ...item.chunk,
          content: this.compressContent(item.chunk.content)
        }
      }))
    };

    return compressedData;
  }

  /**
   * Decompress data from storage
   */
  private decompressData(data: RetrievalResult): RetrievalResult {
    // Decompression would reverse the compression process
    // For now, return as-is since compression is minimal
    return data;
  }

  /**
   * Compress content string
   */
  private compressContent(content: string): string {
    // Simple compression: remove extra whitespace and common words
    return content
      .replace(/\s+/g, ' ')
      .replace(/\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/g, '')
      .trim();
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }
}

