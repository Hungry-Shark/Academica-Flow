/**
 * MCP Utility Functions
 * Common utilities for data validation, error handling, and retry mechanisms
 */

import { 
  MCPError, 
  DataValidationResult, 
  ValidationError, 
  ValidationWarning,
  RetryConfig,
  CacheEntry,
  RateLimitInfo
} from '../types';

export class MCPUtils {
  /**
   * Create a standardized error response
   */
  static createError(
    code: string, 
    message: string, 
    details?: any, 
    retryable: boolean = false,
    statusCode?: number
  ): MCPError {
    return {
      code,
      message,
      details,
      retryable,
      statusCode,
      timestamp: new Date()
    };
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Validate date format and range
   */
  static validateDate(date: any, minDate?: Date, maxDate?: Date): boolean {
    if (!date) return false;
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return false;
    
    if (minDate && parsedDate < minDate) return false;
    if (maxDate && parsedDate > maxDate) return false;
    
    return true;
  }

  /**
   * Validate required fields in an object
   */
  static validateRequiredFields(
    data: any, 
    requiredFields: string[]
  ): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        missingFields.push(field);
      }
    }
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Validate data type
   */
  static validateDataType(value: any, expectedType: string): boolean {
    switch (expectedType.toLowerCase()) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'date':
        return value instanceof Date && !isNaN(value.getTime());
      default:
        return false;
    }
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .substring(0, 1000); // Limit length
  }

  /**
   * Generate a unique ID
   */
  static generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a request ID
   */
  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  static calculateRetryDelay(
    attempt: number, 
    config: RetryConfig
  ): number {
    const delay = Math.min(
      config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
      config.maxDelay
    );

    if (config.jitter) {
      return delay + Math.random() * 1000; // Add jitter
    }

    return delay;
  }

  /**
   * Check if an error is retryable
   */
  static isRetryableError(error: Error, retryableErrors: string[]): boolean {
    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  /**
   * Execute function with retry logic
   */
  static async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig,
    context?: string
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < config.maxAttempts && 
            this.isRetryableError(lastError, config.retryableErrors)) {
          
          const delay = this.calculateRetryDelay(attempt, config);
          console.log(`${context ? `[${context}] ` : ''}Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
          
          await this.sleep(delay);
        } else {
          break;
        }
      }
    }
    
    throw lastError || new Error('Retry attempts exhausted');
  }

  /**
   * Sleep for specified milliseconds
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Deep clone an object
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as any;
    }
    
    if (typeof obj === 'object') {
      const cloned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    
    return obj;
  }

  /**
   * Merge objects deeply
   */
  static deepMerge<T>(target: T, source: Partial<T>): T {
    const result = this.deepClone(target);
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && 
            source[key] !== null && 
            !Array.isArray(source[key]) &&
            typeof result[key] === 'object' && 
            result[key] !== null && 
            !Array.isArray(result[key])) {
          result[key] = this.deepMerge(result[key], source[key] as any);
        } else {
          result[key] = source[key] as any;
        }
      }
    }
    
    return result;
  }

  /**
   * Validate cache entry
   */
  static validateCacheEntry<T>(entry: CacheEntry<T>): boolean {
    if (!entry || typeof entry !== 'object') {
      return false;
    }
    
    if (!entry.key || typeof entry.key !== 'string') {
      return false;
    }
    
    if (!entry.timestamp || !(entry.timestamp instanceof Date)) {
      return false;
    }
    
    if (!entry.expiry || !(entry.expiry instanceof Date)) {
      return false;
    }
    
    if (entry.expiry <= new Date()) {
      return false; // Expired
    }
    
    return true;
  }

  /**
   * Clean expired cache entries
   */
  static cleanExpiredCacheEntries<T>(cache: Map<string, CacheEntry<T>>): number {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [key, entry] of cache) {
      if (!this.validateCacheEntry(entry) || entry.expiry <= now) {
        cache.delete(key);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }

  /**
   * Validate rate limit info
   */
  static validateRateLimitInfo(rateLimit: RateLimitInfo): boolean {
    if (!rateLimit || typeof rateLimit !== 'object') {
      return false;
    }
    
    if (!rateLimit.key || typeof rateLimit.key !== 'string') {
      return false;
    }
    
    if (typeof rateLimit.requests !== 'number' || rateLimit.requests < 0) {
      return false;
    }
    
    if (!rateLimit.windowStart || !(rateLimit.windowStart instanceof Date)) {
      return false;
    }
    
    if (!rateLimit.windowEnd || !(rateLimit.windowEnd instanceof Date)) {
      return false;
    }
    
    if (rateLimit.windowEnd <= rateLimit.windowStart) {
      return false;
    }
    
    return true;
  }

  /**
   * Format bytes to human readable string
   */
  static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Format duration in milliseconds to human readable string
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ${seconds % 60}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }

  /**
   * Validate URL format
   */
  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract domain from URL
   */
  static extractDomain(url: string): string | null {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  /**
   * Create a data validation result
   */
  static createValidationResult(
    isValid: boolean,
    errors: ValidationError[] = [],
    warnings: ValidationWarning[] = [],
    score: number = 100,
    recommendations: string[] = []
  ): DataValidationResult {
    return {
      isValid,
      errors,
      warnings,
      score: Math.max(0, Math.min(100, score)),
      recommendations
    };
  }

  /**
   * Create validation error
   */
  static createValidationError(
    field: string,
    code: string,
    message: string,
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR' = 'MINOR',
    value?: any,
    expectedValue?: any
  ): ValidationError {
    return {
      field,
      code,
      message,
      severity,
      value,
      expectedValue
    };
  }

  /**
   * Create validation warning
   */
  static createValidationWarning(
    field: string,
    code: string,
    message: string,
    suggestion: string,
    value?: any
  ): ValidationWarning {
    return {
      field,
      code,
      message,
      suggestion,
      value
    };
  }

  /**
   * Validate JSON string
   */
  static validateJson(jsonString: string): { isValid: boolean; data?: any; error?: string } {
    try {
      const data = JSON.parse(jsonString);
      return { isValid: true, data };
    } catch (error) {
      return { 
        isValid: false, 
        error: (error as Error).message 
      };
    }
  }

  /**
   * Safe JSON stringify
   */
  static safeStringify(obj: any, space?: number): string {
    try {
      return JSON.stringify(obj, null, space);
    } catch (error) {
      return `[Error stringifying object: ${(error as Error).message}]`;
    }
  }

  /**
   * Create a hash from string
   */
  static createHash(input: string): string {
    let hash = 0;
    if (input.length === 0) return hash.toString();
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Debounce function
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Throttle function
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Check if object is empty
   */
  static isEmpty(obj: any): boolean {
    if (obj == null) return true;
    if (typeof obj !== 'object') return false;
    if (Array.isArray(obj)) return obj.length === 0;
    return Object.keys(obj).length === 0;
  }

  /**
   * Get nested property value safely
   */
  static getNestedProperty(obj: any, path: string, defaultValue?: any): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  }

  /**
   * Set nested property value safely
   */
  static setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Remove undefined values from object
   */
  static removeUndefinedValues<T>(obj: T): T {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.filter(item => item !== undefined).map(item => this.removeUndefinedValues(item)) as any;
    }
    
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
        cleaned[key] = this.removeUndefinedValues(obj[key]);
      }
    }
    
    return cleaned;
  }

  /**
   * Generate a random string
   */
  static randomString(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate a random number between min and max
   */
  static randomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Check if value is a valid UUID
   */
  static isValidUuid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * Generate a UUID v4
   */
  static generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
