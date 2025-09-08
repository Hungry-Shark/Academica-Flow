import React, { useState } from 'react';
import { Icon } from './Icons';
import { AuthCredentials } from '../types';

interface LoginProps {
  onEmailSignUp: (credentials: AuthCredentials) => void;
  onEmailSignIn: (credentials: AuthCredentials) => void;
  onGoogleSignIn: () => void;
  error: string | null;
}

type AuthTab = 'signin' | 'signup';

export const Login: React.FC<LoginProps> = ({ onEmailSignUp, onEmailSignIn, onGoogleSignIn, error }) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'signin') {
        onEmailSignIn({ email, password });
    } else {
        onEmailSignUp({ email, password });
    }
  };

  const getTabClass = (tabName: AuthTab) => 
    `w-full py-3 text-sm font-medium leading-5 focus:outline-none transition-colors duration-300 ${
        activeTab === tabName ? 'border-b-2 border-black text-black' : 'text-black/60 hover:text-black'
    }`;


  return (
    <div className="flex items-center justify-center min-h-screen bg-white px-4">
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
                <label htmlFor="password"  className="sr-only">Password</label>
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
            
            {error && <p className="text-sm text-red-600">{error}</p>}

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
          onClick={onGoogleSignIn}
          className="w-full flex items-center justify-center py-3 px-4 border border-black rounded-lg text-sm font-medium text-black bg-white hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
        >
          <Icon name="google" className="w-5 h-5 mr-3" />
          Continue with Google
        </button>

      </div>
    </div>
  );
};