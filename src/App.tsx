// FIX: Create the main App component
import React, { useState, useEffect } from 'react';
import { getFirebaseAuth, createUserProfile, getUserProfile } from './firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { LandingPage } from './components/Landingpage';
import { Login } from './components/Login';
import { ProfileSetup } from './components/ProfileSetup';
import { Dashboard } from './components/Dashboard';
import { Admin } from './components/Admin';
import { About } from './components/About';
import { Contact } from './components/Contact';
import { UserProfile, AppView, AuthCredentials } from './types';
import { Profile } from './components/Profile';
import { GenerateTT } from './components/GenerateTT';
import { AdministrativeInfo } from './components/AdministrativeInfo';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [appView, setAppView] = useState<AppView>('LANDING');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  // New: only navigate away from LANDING after explicit user intent
  const [flowInitiated, setFlowInitiated] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userProfile = await getUserProfile(firebaseUser.uid);
        if (userProfile) {
          setUser(userProfile);
          // Check if user has a pending query from before login
          const pendingQuery = localStorage.getItem('pendingQuery');
          if (pendingQuery) {
            // User returned from login with a pending query, show landing page with form
            setAppView('LANDING');
          } else if (flowInitiated) {
            // Only auto-route if the user has initiated the auth flow from Landing
            if (!userProfile.profileComplete) {
              setAppView('PROFILE_SETUP');
            } else {
              setAppView(userProfile.role === 'admin' ? 'ADMIN' : 'DASHBOARD');
            }
          }
        } else {
          // New user, create default profile; route only if flow was initiated
          const newUser: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            role: 'student',
            preferences: '',
            profileComplete: false,
          };
          await createUserProfile(firebaseUser.uid, newUser);
          setUser(newUser);
          if (flowInitiated) setAppView('PROFILE_SETUP');
        }
      } else {
        setUser(null);
        // Always return to LANDING when signed out
        setAppView('LANDING');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [flowInitiated]);

  const handleNavigateToLogin = async () => {
    setFlowInitiated(true);
    const auth = getFirebaseAuth();
    // If already signed in, decide destination immediately
    if (auth.currentUser) {
      const existingProfile = auth.currentUser ? await getUserProfile(auth.currentUser.uid) : null;
      if (existingProfile && existingProfile.profileComplete) {
        setUser(existingProfile);
        setAppView(existingProfile.role === 'admin' ? 'ADMIN' : 'DASHBOARD');
      } else {
        // Either no profile or incomplete => setup
        setAppView('PROFILE_SETUP');
      }
    } else {
      setAppView('LOGIN');
    }
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
    const auth = getFirebaseAuth();
    signOut(auth).catch(() => {/* noop */});
    setUser(null);
    localStorage.removeItem('academica_user');
    setFlowInitiated(false);
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
        return <LandingPage onNavigateToLogin={handleNavigateToLogin} setAppView={setAppView} isAuthenticated={!!user} onProfileClick={() => setAppView('PROFILE')} />;
      case 'LOGIN':
        return (
          <Login 
            onEmailSignUp={handleEmailSignUp} 
            onEmailSignIn={handleEmailSignIn} 
            onGoogleSignIn={() => {}} // Handled by Firebase auth state change
            error={authError}
            onBack={() => setAppView('LANDING')}
          />
        );
      case 'PROFILE_SETUP':
        return <ProfileSetup user={user!} onSave={handleProfileSave} />;
      case 'ADMIN':
        return <Admin user={user!} onLogout={handleLogout} onNavigate={setAppView as any} />;
      case 'DASHBOARD':
        return <Dashboard user={user!} onLogout={handleLogout} isAdmin={user?.role === 'admin'} onNavigate={setAppView} />;
      
      case 'PROFILE':
        return <Profile user={user!} onLogout={handleLogout} onNavigate={setAppView} />;
      case 'PROFILE_EDIT':
        return <Profile user={user!} onLogout={handleLogout} onNavigate={setAppView} />;
      case 'GENERATE_TT':
        return <GenerateTT user={user!} onLogout={handleLogout} onNavigate={setAppView} />;
      case 'ADMIN_INFO':
        return <AdministrativeInfo user={user!} onLogout={handleLogout} onNavigate={setAppView} />;
      default:
        return <LandingPage onNavigateToLogin={handleNavigateToLogin} setAppView={setAppView} isAuthenticated={!!user} onProfileClick={() => setAppView('PROFILE')} />;
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {renderContent()}
    </div>
  );
};

export default App; 