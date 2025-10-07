/**
 * Firebase Configuration Checker
 * Validates Firebase configuration and provides debugging information
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: Partial<FirebaseConfig>;
}

export function validateFirebaseConfig(config: Partial<FirebaseConfig>): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!config.apiKey) {
    errors.push('Firebase API Key is missing');
  } else if (config.apiKey.length < 20) {
    errors.push('Firebase API Key appears to be invalid (too short)');
  }
  
  if (!config.authDomain) {
    errors.push('Firebase Auth Domain is missing');
  } else if (!config.authDomain.includes('firebaseapp.com') && !config.authDomain.includes('web.app')) {
    warnings.push('Firebase Auth Domain should end with .firebaseapp.com or .web.app');
  }
  
  if (!config.projectId) {
    errors.push('Firebase Project ID is missing');
  } else if (config.projectId.length < 6) {
    errors.push('Firebase Project ID appears to be invalid (too short)');
  }
  
  if (!config.storageBucket) {
    errors.push('Firebase Storage Bucket is missing');
  } else if (!config.storageBucket.includes(config.projectId || '')) {
    warnings.push('Storage Bucket should match Project ID');
  }
  
  if (!config.messagingSenderId) {
    errors.push('Firebase Messaging Sender ID is missing');
  } else if (!/^\d+$/.test(config.messagingSenderId)) {
    errors.push('Firebase Messaging Sender ID should be numeric');
  }
  
  if (!config.appId) {
    errors.push('Firebase App ID is missing');
  } else if (!config.appId.startsWith('1:')) {
    warnings.push('Firebase App ID should start with "1:"');
  }
  
  // Check for common configuration issues
  if (config.authDomain && config.projectId && !config.authDomain.includes(config.projectId)) {
    warnings.push('Auth Domain should include Project ID');
  }
  
  if (config.storageBucket && config.projectId && !config.storageBucket.startsWith(config.projectId)) {
    warnings.push('Storage Bucket should start with Project ID');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config
  };
}

export function logFirebaseConfig(config: Partial<FirebaseConfig>): void {
  console.group('🔧 Firebase Configuration Check');
  
  const validation = validateFirebaseConfig(config);
  
  if (validation.isValid) {
    console.log('✅ Firebase configuration is valid');
  } else {
    console.error('❌ Firebase configuration has errors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Firebase configuration warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  console.log('📋 Configuration details:');
  console.log('  API Key:', config.apiKey ? `${config.apiKey.substring(0, 10)}...` : 'Missing');
  console.log('  Auth Domain:', config.authDomain || 'Missing');
  console.log('  Project ID:', config.projectId || 'Missing');
  console.log('  Storage Bucket:', config.storageBucket || 'Missing');
  console.log('  Messaging Sender ID:', config.messagingSenderId || 'Missing');
  console.log('  App ID:', config.appId ? `${config.appId.substring(0, 10)}...` : 'Missing');
  
  console.groupEnd();
}

export function checkEnvironmentVariables(): void {
  console.group('🌍 Environment Variables Check');
  
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  const missingVars: string[] = [];
  const presentVars: string[] = [];
  
  requiredVars.forEach(varName => {
    const value = import.meta.env[varName];
    if (!value) {
      missingVars.push(varName);
    } else {
      presentVars.push(varName);
    }
  });
  
  if (missingVars.length === 0) {
    console.log('✅ All required environment variables are present');
  } else {
    console.error('❌ Missing environment variables:');
    missingVars.forEach(varName => console.error(`  - ${varName}`));
  }
  
  console.log('📋 Present variables:', presentVars);
  console.log('📋 Missing variables:', missingVars);
  
  console.groupEnd();
}

export function diagnoseFirebaseAuthIssues(): void {
  console.group('🔍 Firebase Auth Diagnosis');
  
  // Check if we're in a secure context
  if (!window.isSecureContext) {
    console.error('❌ Not in a secure context. Firebase Auth requires HTTPS in production.');
  } else {
    console.log('✅ Running in secure context');
  }
  
  // Check if we're in an iframe
  if (window !== window.top) {
    console.warn('⚠️ Running in iframe. This may cause issues with Firebase Auth.');
  } else {
    console.log('✅ Not running in iframe');
  }
  
  // Check user agent
  const userAgent = navigator.userAgent;
  console.log('🌐 User Agent:', userAgent);
  
  // Check for popup blockers
  if (window.screen && window.screen.width < 1000) {
    console.warn('⚠️ Small screen detected. Popup-based auth may not work well.');
  }
  
  console.groupEnd();
}

