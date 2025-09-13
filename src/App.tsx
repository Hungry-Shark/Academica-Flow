// FIX: Create the main App component
import React, { useState, useEffect } from 'react';
import { getFirebaseAuth, createUserProfile, getUserProfile, checkUserProfileExists } from './firebase';
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

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Check if user has completed profile setup
        const hasCompletedProfile = await checkUserProfileExists(firebaseUser.uid);
        
        if (hasCompletedProfile) {
          // User has completed profile, load their data
          const userProfile = await getUserProfile(firebaseUser.uid);
          if (userProfile) {
            setUser(userProfile);
            // Check if user has a pending query from before login
            const pendingQuery = localStorage.getItem('pendingQuery');
            if (pendingQuery) {
              setAppView('LANDING');
            } else {
              // Route to appropriate dashboard based on role
              setAppView(userProfile.role === 'admin' ? 'ADMIN' : 'DASHBOARD');
            }
          }
        } else {
          // User needs to complete profile setup
          const newUser: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            role: 'student',
            preferences: '',
            profileComplete: false,
            profileCompleted: false,
          };
          setUser(newUser);
          setAppView('PROFILE_SETUP');
        }
      } else {
        setUser(null);
        const savedView = localStorage.getItem('lastAppView');
        if (savedView && savedView !== 'LANDING') {
          setAppView('LOGIN');
        } else {
          setAppView('LANDING');
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleNavigateToLogin = async () => {
    const auth = getFirebaseAuth();
    // If already signed in, decide destination immediately
    if (auth.currentUser) {
      const hasCompletedProfile = await checkUserProfileExists(auth.currentUser.uid);
      if (hasCompletedProfile) {
        const existingProfile = await getUserProfile(auth.currentUser.uid);
        if (existingProfile) {
          setUser(existingProfile);
          setAppView(existingProfile.role === 'admin' ? 'ADMIN' : 'DASHBOARD');
        }
      } else {
        setAppView('PROFILE_SETUP');
      }
    } else {
      setAppView('LOGIN');
    }
  };

  const handleProfileSave = async (profileUpdates: Partial<UserProfile>) => {
    const auth = getFirebaseAuth();
    if (user && auth.currentUser) {
      const updatedUser = { ...user, ...profileUpdates, profileComplete: true, profileCompleted: true };
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
    localStorage.removeItem('lastAppView');
    setAppView('LANDING');
  };

  // Save current view to localStorage
  const saveCurrentView = (view: AppView) => {
    localStorage.setItem('lastAppView', view);
    setAppView(view);
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
        return <LandingPage onNavigateToLogin={handleNavigateToLogin} setAppView={saveCurrentView} isAuthenticated={!!user} onProfileClick={() => saveCurrentView('PROFILE')} onLogout={handleLogout} />;
      case 'LOGIN':
        return (
          <Login 
            onEmailSignUp={handleEmailSignUp} 
            onEmailSignIn={handleEmailSignIn} 
            onGoogleSignIn={() => {}} // Handled by Firebase auth state change
            error={authError}
            onBack={() => saveCurrentView('LANDING')}
          />
        );
      case 'PROFILE_SETUP':
        return <ProfileSetup user={user!} onSave={handleProfileSave} />;
      case 'ADMIN':
        return <Admin user={user!} onLogout={handleLogout} onNavigate={saveCurrentView as any} />;
      case 'DASHBOARD':
        return <Dashboard user={user!} onLogout={handleLogout} isAdmin={user?.role === 'admin'} onNavigate={saveCurrentView} />;
      
      case 'PROFILE':
        return <Profile user={user!} onLogout={handleLogout} onNavigate={saveCurrentView} />;
      case 'PROFILE_EDIT':
        return <Profile user={user!} onLogout={handleLogout} onNavigate={saveCurrentView} />;
      case 'GENERATE_TT':
        return <GenerateTT user={user!} onLogout={handleLogout} onNavigate={saveCurrentView} />;
      case 'ADMIN_INFO':
        return <AdministrativeInfo user={user!} onLogout={handleLogout} onNavigate={saveCurrentView} />;
      default:
        return <LandingPage onNavigateToLogin={handleNavigateToLogin} setAppView={saveCurrentView} isAuthenticated={!!user} onProfileClick={() => saveCurrentView('PROFILE')} />;
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {renderContent()}
    </div>
  );
};

export default App; 