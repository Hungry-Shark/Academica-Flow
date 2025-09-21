// Client-side rate limiting utility
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  key: string;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private blockedKeys: Set<string> = new Set();

  isAllowed(config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
    const { maxRequests, windowMs, key } = config;
    const now = Date.now();
    
    // Check if key is temporarily blocked
    if (this.blockedKeys.has(key)) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + windowMs
      };
    }

    // Get existing requests for this key
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    // Check if limit exceeded
    if (validRequests.length >= maxRequests) {
      // Temporarily block the key
      this.blockedKeys.add(key);
      setTimeout(() => {
        this.blockedKeys.delete(key);
      }, windowMs);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + windowMs
      };
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return {
      allowed: true,
      remaining: maxRequests - validRequests.length,
      resetTime: now + windowMs
    };
  }

  // Clear all rate limit data
  clear() {
    this.requests.clear();
    this.blockedKeys.clear();
  }

  // Get current status for a key
  getStatus(key: string, maxRequests: number, windowMs: number) {
    const requests = this.requests.get(key) || [];
    const now = Date.now();
    const validRequests = requests.filter(time => now - time < windowMs);
    
    return {
      count: validRequests.length,
      remaining: Math.max(0, maxRequests - validRequests.length),
      isBlocked: this.blockedKeys.has(key)
    };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Predefined rate limits for different actions
export const RATE_LIMITS = {
  LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  SIGNUP: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  API_CALL: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 calls per minute
  FILE_UPLOAD: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 uploads per minute
  PROFILE_UPDATE: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 updates per minute
  TIMETABLE_GENERATE: { maxRequests: 5, windowMs: 60 * 1000 } // 5 generations per minute
} as const;

// Helper function to check rate limit
export const checkRateLimit = (action: keyof typeof RATE_LIMITS, identifier: string) => {
  const config = RATE_LIMITS[action];
  const key = `${action}:${identifier}`;
  
  return rateLimiter.isAllowed({
    ...config,
    key
  });
};

// Hook for React components
export const useRateLimit = (action: keyof typeof RATE_LIMITS, identifier: string) => {
  const checkLimit = () => checkRateLimit(action, identifier);
  
  return {
    checkLimit,
    isAllowed: checkLimit().allowed,
    getStatus: () => {
      const config = RATE_LIMITS[action];
      const key = `${action}:${identifier}`;
      return rateLimiter.getStatus(key, config.maxRequests, config.windowMs);
    }
  };
};
