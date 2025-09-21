import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { AuthCredentials, UserProfile } from '../types';
import { getFirebaseAuth, getGoogleProvider, createUserProfile, getUserProfile } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { validatePassword, sanitizeInput, ValidationError, AuthError } from '../utils/validation';
import { validateEmail } from '../utils/emailValidation';
import { checkRateLimit, RATE_LIMITS } from '../utils/rateLimiter';

interface LoginProps {
  onEmailSignUp: (credentials: AuthCredentials) => void;
  onEmailSignIn: (credentials: AuthCredentials) => void;
  onGoogleSignIn: (isNewUser: boolean) => void;
  error: string | null;
  onBack: () => void;
}

type AuthTab = 'signin' | 'signup';

export const Login: React.FC<LoginProps> = ({ onEmailSignUp, onEmailSignIn, onGoogleSignIn, error, onBack }) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordValidation, setPasswordValidation] = useState<{ isValid: boolean; errors: string[]; strength: 'weak' | 'medium' | 'strong' }>({
    isValid: false,
    errors: [],
    strength: 'weak'
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; message: string; isChecking: boolean }>({
    isValid: false,
    message: '',
    isChecking: false
  });

  useEffect(() => {
    if (activeTab === 'signup' && password) {
      const validation = validatePassword(password);
      setPasswordValidation(validation);
    }
  }, [password, activeTab]);

  // Real-time email validation for signup
  useEffect(() => {
    if (activeTab === 'signup' && email) {
      const validateEmailAsync = async () => {
        setEmailValidation(prev => ({ ...prev, isChecking: true }));
        try {
          const result = await validateEmail(email);
          setEmailValidation({
            isValid: result.isValid,
            message: result.message,
            isChecking: false
          });
        } catch (error) {
          setEmailValidation({
            isValid: false,
            message: 'Unable to validate email',
            isChecking: false
          });
        }
      };

      // Debounce the validation
      const timeoutId = setTimeout(validateEmailAsync, 1000);
      return () => clearTimeout(timeoutId);
    } else {
      setEmailValidation({ isValid: false, message: '', isChecking: false });
    }
  }, [email, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    try {
      // Check rate limit for login attempts
      const rateLimitResult = checkRateLimit('LOGIN', sanitizeInput(email));
      if (!rateLimitResult.allowed) {
        throw new ValidationError(
          `Too many login attempts. Please try again in ${Math.ceil(rateLimitResult.resetTime / 60000)} minutes.`
        );
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      
      // Validate email format and existence
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(sanitizedEmail)) {
        throw new ValidationError('Please enter a valid email address');
      }

      // For signup, validate email format and basic checks
      if (activeTab === 'signup') {
        const emailValidationResult = await validateEmail(sanitizedEmail);
        if (!emailValidationResult.isValid) {
          throw new ValidationError(emailValidationResult.message);
        }
      }

      // Additional password validation for signup
      if (activeTab === 'signup') {
        const validation = validatePassword(password);
        if (!validation.isValid) {
          throw new ValidationError(validation.errors[0]);
        }
      }

      const auth = getFirebaseAuth();
      
      if (activeTab === 'signin') {
        await signInWithEmailAndPassword(auth, sanitizedEmail, password);
        onEmailSignIn({ email: sanitizedEmail, password });
      } else {
        // Create the Firebase auth user
        const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
        
        // Create the user profile in Firestore
        const newUserProfile: UserProfile = {
          uid: userCredential.user.uid,
          email: sanitizedEmail,
          name: '',  // Will be set in profile setup
          role: 'student',
          preferences: '',
          profileComplete: false,
          profileCompleted: false,
        };
        
        await createUserProfile(userCredential.user.uid, newUserProfile);
        onEmailSignUp({ email: sanitizedEmail, password });
      }
    } catch (err: any) {
      if (err instanceof ValidationError) {
        setValidationError(err.message);
      } else if (err instanceof AuthError) {
        setValidationError(err.message);
      } else {
        setValidationError(err.message || 'An unexpected error occurred');
      }
    }
  };

  const getTabClass = (tabName: AuthTab) => 
    `w-full py-3 text-sm font-medium leading-5 focus:outline-none transition-colors duration-300 ${
        activeTab === tabName ? 'border-b-2 border-black text-black' : 'text-black/60 hover:text-black'
    }`;


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="absolute top-6 left-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-black hover:text-gray-600 transition-colors duration-300"
        >
          <Icon name="back" className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>
      <div className="p-8 bg-white w-full max-w-sm">
        <h2 className="text-xl font-medium mb-6 text-center text-black">Welcome back</h2>
        <div className="flex space-x-4 mb-6">
          <button onClick={() => setActiveTab('signin')} className={getTabClass('signin')}>Sign In</button>
          <button onClick={() => setActiveTab('signup')} className={getTabClass('signup')}>Sign Up</button>
        </div>
        {validationError && (
          <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{validationError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full p-3 bg-white text-black placeholder:text-black/50 rounded-lg border ${
                  activeTab === 'signup' && email && !emailValidation.isValid && !emailValidation.isChecking
                    ? 'border-red-500'
                    : activeTab === 'signup' && email && emailValidation.isValid
                    ? 'border-green-500'
                    : 'border-black'
                } focus:ring-2 focus:ring-black outline-none transition`}
                placeholder="Email address"
              />
              {activeTab === 'signup' && email && emailValidation.isChecking && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                </div>
              )}
              {activeTab === 'signup' && email && !emailValidation.isChecking && emailValidation.isValid && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Icon name="check" className="w-4 h-4 text-green-500" />
                </div>
              )}
              {activeTab === 'signup' && email && !emailValidation.isChecking && !emailValidation.isValid && emailValidation.message && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Icon name="close" className="w-4 h-4 text-red-500" />
                </div>
              )}
            </div>
            {activeTab === 'signup' && email && !emailValidation.isChecking && emailValidation.message && (
              <div className={`text-sm mt-1 ${
                emailValidation.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {emailValidation.message}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={`w-full p-3 bg-white text-black placeholder:text-black/50 rounded-lg border ${
                password && !passwordValidation.isValid ? 'border-red-500' : 'border-black'
              } focus:ring-2 focus:ring-black outline-none transition`}
              placeholder="Password"
            />
            {activeTab === 'signup' && password && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="text-sm">Password Strength:</div>
                  <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordValidation.strength === 'strong'
                          ? 'w-full bg-black'
                          : passwordValidation.strength === 'medium'
                          ? 'w-2/3 bg-gray-600'
                          : 'w-1/3 bg-gray-400'
                      }`}
                    />
                  </div>
                  <div className="text-sm capitalize">{passwordValidation.strength}</div>
                </div>
                {passwordValidation.errors.length > 0 && (
                  <ul className="text-sm text-red-500 list-disc list-inside">
                    {passwordValidation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div>
            <button
              type="submit"
              disabled={
                activeTab === 'signup' && (
                  emailValidation.isChecking || 
                  (email && !emailValidation.isValid) ||
                  !passwordValidation.isValid
                )
              }
              className={`w-full py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
                activeTab === 'signup' && (
                  emailValidation.isChecking || 
                  (email && !emailValidation.isValid) ||
                  !passwordValidation.isValid
                )
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-black hover:bg-black/80'
              }`}
            >
              {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
              {activeTab === 'signup' && emailValidation.isChecking && (
                <span className="ml-2">Validating...</span>
              )}
            </button>
          </div>
        </form>
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-black"></div>
          <span className="flex-shrink mx-4 text-black/80 text-sm">OR</span>
          <div className="flex-grow border-t border-black"></div>
        </div>
        <button
          onClick={async () => {
            const auth = getFirebaseAuth();
            const googleProvider = getGoogleProvider();
            try {
              const result = await signInWithPopup(auth, googleProvider);
              
              // Check if user already exists
              const existingProfile = await getUserProfile(result.user.uid);
              
              if (!existingProfile) {
                // New Google user - create profile
                const newUserProfile: UserProfile = {
                  uid: result.user.uid,
                  email: result.user.email || '',
                  name: result.user.displayName || '',
                  role: 'student',
                  preferences: '',
                  profileComplete: false,
                  profileCompleted: false,
                };
                await createUserProfile(result.user.uid, newUserProfile);
                onGoogleSignIn(true); // Mark as new user
              } else {
                onGoogleSignIn(false); // Mark as existing user
              }
            } catch (err: any) {
              // Fallback to redirect for environments where popups are blocked or third-party cookies are disabled
              if (err?.code && typeof err.code === 'string' && (err.code.includes('popup') || err.code.includes('network'))) {
                await signInWithRedirect(auth, googleProvider);
                return;
              }
              alert(err.message || 'Google sign-in failed');
            }
          }}
          className="w-full flex items-center justify-center py-3 px-4 border border-black rounded-lg text-sm font-medium text-black bg-white hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
        >
          <Icon name="google" className="w-5 h-5 mr-3" />
          Continue with Google
        </button>
      </div>
    </div>
  );
}; 