// FIX: Create the main App component
import React, { useState } from 'react';
import { Login } from './components/Login';
import { ProfileSetup } from './components/ProfileSetup';
import { Dashboard } from './components/Dashboard';
import { Admin } from './components/Admin';
import { UserProfile, AppView, AuthCredentials } from './types';

// --- MOCK DATABASE ---
// In a real app, this would be a backend service like Firebase.
const MOCK_USERS: { [email: string]: UserProfile } = {
  "admin@test.com": { email: "admin@test.com", name: "Admin User", role: 'admin', preferences: '', profileComplete: true },
  "student@test.com": { email: "student@test.com", name: "Student User", role: 'student', preferences: 'Prefers morning classes', profileComplete: true },
};
// --- END MOCK DATABASE ---

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [appView, setAppView] = useState<AppView>('LOGIN');
  const [authError, setAuthError] = useState<string | null>(null);

  const handleEmailSignUp = (credentials: AuthCredentials) => {
    setAuthError(null);
    // Simulate checking if user exists
    if (MOCK_USERS[credentials.email]) {
      setAuthError("An account with this email already exists.");
      return;
    }
    // Simulate creating a new user
    const newUser: UserProfile = {
      email: credentials.email,
      name: '',
      role: 'student',
      preferences: '',
      profileComplete: false,
    };
    setUser(newUser);
    setAppView('PROFILE_SETUP');
  };

  const handleEmailSignIn = (credentials: AuthCredentials) => {
     setAuthError(null);
     // Simulate checking credentials
     const existingUser = MOCK_USERS[credentials.email];
     if (existingUser) { // In a real app, you'd also check the password
        setUser(existingUser);
        if (existingUser.profileComplete) {
            setAppView(existingUser.role === 'admin' ? 'ADMIN' : 'DASHBOARD');
        } else {
            setAppView('PROFILE_SETUP');
        }
     } else {
        setAuthError("Invalid credentials. Please try again.");
     }
  };

  const handleGoogleSignIn = () => {
     setAuthError(null);
     // Simulate a new user signing in with Google
     const newUser: UserProfile = {
        email: 'new.user@google.com',
        name: '',
        role: 'student',
        preferences: '',
        profileComplete: false,
      };
      setUser(newUser);
      setAppView('PROFILE_SETUP');
  };

  const handleProfileSave = (profileUpdates: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = { ...user, ...profileUpdates, profileComplete: true };
      setUser(updatedUser);
      // Also update our mock DB
      MOCK_USERS[updatedUser.email] = updatedUser;
      setAppView(updatedUser.role === 'admin' ? 'ADMIN' : 'DASHBOARD');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAppView('LOGIN');
  };
  
  const renderContent = () => {
    switch(appView) {
      case 'LOGIN':
        return <Login 
                  onEmailSignUp={handleEmailSignUp} 
                  onEmailSignIn={handleEmailSignIn} 
                  onGoogleSignIn={handleGoogleSignIn}
                  error={authError} 
                />;
      case 'PROFILE_SETUP':
        return <ProfileSetup user={user!} onSave={handleProfileSave} />;
      case 'ADMIN':
        return <Admin user={user!} onLogout={handleLogout} />;
      case 'DASHBOARD':
        return <Dashboard user={user!} onLogout={handleLogout} />;
      default:
        return <Login 
                  onEmailSignUp={handleEmailSignUp} 
                  onEmailSignIn={handleEmailSignIn} 
                  onGoogleSignIn={handleGoogleSignIn}
                  error={authError} 
                />;
    }
  }

  return (
    <div className="bg-white min-h-screen">
      {renderContent()}
    </div>
  );
};

export default App;