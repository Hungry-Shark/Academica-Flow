import React, { useState } from 'react';
import { Icon } from './Icons';
import { AuthCredentials } from '../types';
import { getFirebaseAuth, getGoogleProvider, createUserProfile } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect } from 'firebase/auth';

interface LoginProps {
  onEmailSignUp: (credentials: AuthCredentials) => void;
  onEmailSignIn: (credentials: AuthCredentials) => void;
  onGoogleSignIn: () => void;
  error: string | null;
  onBack: () => void;
}

type AuthTab = 'signin' | 'signup';

export const Login: React.FC<LoginProps> = ({ onEmailSignUp, onEmailSignIn, onGoogleSignIn, error, onBack }) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = getFirebaseAuth();
    try {
      if (activeTab === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Create the Firebase auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create the user profile in Firestore
        const newUserProfile = {
          email: email,
          name: '',  // Will be set in profile setup
          role: 'student',
          preferences: '',
          profileComplete: false,
        };
        
        await createUserProfile(userCredential.user.uid, newUserProfile);
      }
    } catch (err: any) {
      alert(err.message);
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 bg-white text-black placeholder:text-black/50 rounded-lg border border-black focus:ring-2 focus:ring-black outline-none transition"
              placeholder="Email address"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full p-3 bg-white text-black placeholder:text-black/50 rounded-lg border border-black focus:ring-2 focus:ring-black outline-none transition"
              placeholder="Password"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-black hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
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
              // Create user profile if it's a new Google sign-in
              const newUserProfile = {
                email: result.user.email || '',
                name: result.user.displayName || '',
                role: 'student' as const,
                preferences: '',
                profileComplete: false,
              };
              await createUserProfile(result.user.uid, newUserProfile);
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