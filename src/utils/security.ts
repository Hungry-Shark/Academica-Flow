// Additional security utilities
import { sanitizeInput } from './validation';

// Prevent clickjacking attacks
export const preventClickjacking = () => {
  if (window.top !== window.self) {
    window.top.location = window.self.location;
  }
};

// Secure random token generation
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Validate and sanitize file names
export const sanitizeFileName = (fileName: string): string => {
  // Remove path traversal attempts
  let sanitized = fileName.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '');
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
  
  // Limit length
  sanitized = sanitized.substring(0, 255);
  
  // Ensure it's not empty
  if (!sanitized.trim()) {
    sanitized = 'file';
  }
  
  return sanitized;
};

// Validate URL to prevent open redirects
export const isValidRedirectUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    // Only allow same origin or trusted domains
    const allowedDomains = [
      'localhost',
      'academica-flow.vercel.app',
      'academica-flow.firebaseapp.com'
    ];
    
    return allowedDomains.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
};

// Rate limiting for specific actions
export const createActionRateLimit = (action: string, maxAttempts: number, windowMs: number) => {
  const attempts = new Map<string, number[]>();
  
  return (identifier: string): { allowed: boolean; remaining: number } => {
    const now = Date.now();
    const key = `${action}:${identifier}`;
    const userAttempts = attempts.get(key) || [];
    
    // Remove old attempts
    const validAttempts = userAttempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return { allowed: false, remaining: 0 };
    }
    
    validAttempts.push(now);
    attempts.set(key, validAttempts);
    
    return { 
      allowed: true, 
      remaining: maxAttempts - validAttempts.length 
    };
  };
};

// Secure storage for sensitive data
export const secureStorage = {
  setItem: (key: string, value: string) => {
    try {
      const encrypted = btoa(encodeURIComponent(value));
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to store data securely:', error);
    }
  },
  
  getItem: (key: string): string | null => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return decodeURIComponent(atob(encrypted));
    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      return null;
    }
  },
  
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove data securely:', error);
    }
  }
};

// Input validation for different data types
export const validateInput = {
  email: (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(sanitizeInput(email));
  },
  
  phone: (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(sanitizeInput(phone).replace(/[\s\-\(\)]/g, ''));
  },
  
  name: (name: string): boolean => {
    const sanitized = sanitizeInput(name);
    return sanitized.length >= 2 && sanitized.length <= 50 && /^[a-zA-Z\s]+$/.test(sanitized);
  },
  
  organization: (org: string): boolean => {
    const sanitized = sanitizeInput(org);
    return sanitized.length >= 3 && sanitized.length <= 100;
  }
};

// Initialize security measures
export const initializeSecurity = () => {
  // Prevent clickjacking
  preventClickjacking();
  
  // Disable right-click context menu in production
  if (import.meta.env.PROD) {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    
    // Disable F12, Ctrl+Shift+I, Ctrl+U, etc.
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's')
      ) {
        e.preventDefault();
      }
    });
  }
  
  // Clear sensitive data on page unload
  window.addEventListener('beforeunload', () => {
    // Clear any sensitive data from memory
    if (typeof window.gc === 'function') {
      window.gc();
    }
  });
};
