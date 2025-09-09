// FIX: Create the main App component
import React, { useState, useEffect } from 'react';
import { getFirebaseAuth, createUserProfile, getUserProfile } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { LandingPage } from './components/Landingpage';
import { Login } from './components/Login';
import { ProfileSetup } from './components/ProfileSetup';
import { Dashboard } from './components/Dashboard';
import { Admin } from './components/Admin';
import { UserProfile, AppView, AuthCredentials } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [appView, setAppView] = useState<AppView>('LANDING');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Get user profile from Firestore
        const userProfile = await getUserProfile(firebaseUser.uid);
        if (userProfile) {
          setUser(userProfile);
          setAppView(userProfile.role === 'admin' ? 'ADMIN' : 'DASHBOARD');
        } else {
          // New user, create profile
          const newUser: UserProfile = {
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            role: 'student',
            preferences: '',
            profileComplete: false,
          };
          await createUserProfile(firebaseUser.uid, newUser);
          setUser(newUser);
          setAppView('PROFILE_SETUP');
        }
      } else {
        setUser(null);
        setAppView('LANDING');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleNavigateToLogin = () => {
    setAppView('LOGIN');
  };

  const handleProfileSave = async (profileUpdates: Partial<UserProfile>) => {
    const auth = getFirebaseAuth();
    if (user && auth.currentUser) {
      const updatedUser = { ...user, ...profileUpdates, profileComplete: true };
      await createUserProfile(auth.currentUser.uid, updatedUser);
      setUser(updatedUser);
      setAppView(updatedUser.role === 'admin' ? 'ADMIN' : 'DASHBOARD');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('academica_user');
    setAppView('LANDING');
  };
  
  // Email handlers for actual Firebase authentication
  const handleEmailSignUp = async (credentials: AuthCredentials) => {
    setAuthError(null);
    // This will be handled by Firebase auth state change
  };

  const handleEmailSignIn = async (credentials: AuthCredentials) => {
    setAuthError(null);
    // This will be handled by Firebase auth state change
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-black">Loading...</p>
          </div>
        </div>
      );
    }

    switch(appView) {
      case 'LANDING':
        return <LandingPage onNavigateToLogin={handleNavigateToLogin} />;
      case 'LOGIN':
        return (
          <Login 
            onEmailSignUp={handleEmailSignUp} 
            onEmailSignIn={handleEmailSignIn} 
            onGoogleSignIn={() => {}} // Handled by Firebase auth state change
            error={authError} 
          />
        );
      case 'PROFILE_SETUP':
        return <ProfileSetup user={user!} onSave={handleProfileSave} />;
      case 'ADMIN':
        return <Admin user={user!} onLogout={handleLogout} />;
      case 'DASHBOARD':
        return <Dashboard user={user!} onLogout={handleLogout} isAdmin={user?.role === 'admin'} />;
      default:
        return <LandingPage onNavigateToLogin={handleNavigateToLogin} />;
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {renderContent()}
    </div>
  );
};

export default App;
