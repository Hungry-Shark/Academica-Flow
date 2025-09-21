// Production-safe logging utility
// This ensures no sensitive data is logged in production

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(message, error);
    } else {
      // In production, only log generic error messages
      console.error(message);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

// Override console methods in production
if (!isDevelopment) {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  // Keep console.error for critical errors but sanitize them
  const originalError = console.error;
  console.error = (message: string, ...args: any[]) => {
    // Only log generic error messages in production
    if (typeof message === 'string' && !message.includes('token') && !message.includes('password') && !message.includes('email')) {
      originalError(message);
    }
  };
}
