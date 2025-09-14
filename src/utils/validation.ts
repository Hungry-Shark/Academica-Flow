export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  // Initialize with weak strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  
  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for numbers
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for special characters
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Calculate password strength
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const totalCriteria = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  
  if (totalCriteria >= 4) {
    strength = 'strong';
  } else if (totalCriteria >= 3) {
    strength = 'medium';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

export function sanitizeInput(input: string): string {
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove any script tags and their contents
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Encode special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized.trim();
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}