// FIX: Create the main App component
import React, { useState, useEffect } from 'react';
import { logger } from './utils/logger';
import { getFirebaseAuth, createUserProfile, getUserProfile, checkUserProfileExists, getFirestoreDb } from './firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
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
import { GlobalMenu } from './components/GlobalMenu';
import { sessionManager } from './utils/sessionManager';
import { initializeSecurity } from './utils/security';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [appView, setAppView] = useState<AppView>('LANDING');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isNewSignup, setIsNewSignup] = useState(false);

  useEffect(() => {
    // Initialize security measures
    initializeSecurity();
    
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Initialize session management when user logs in
      if (firebaseUser) {
        sessionManager.extendSession();
      } else {
        sessionManager.cleanup();
      }
      if (firebaseUser) {
        // Get user profile from Firestore
        const userProfile = await getUserProfile(firebaseUser.uid);
        
        if (userProfile) {
          setUser(userProfile);
          
          // Check if this is a new signup (profile exists but not completed)
          if (!userProfile.profileCompleted && isNewSignup) {
            setAppView('PROFILE_SETUP');
            setIsNewSignup(false); // Reset flag
          } else if (userProfile.profileCompleted) {
            // Existing user with completed profile
            // Check if user has a pending query from before login
            const pendingQuery = localStorage.getItem('pendingQuery');
            if (pendingQuery) {
              setAppView('LANDING');
            } else {
              // Route to appropriate dashboard based on role
              setAppView(userProfile.role === 'admin' ? 'ADMIN' : 'DASHBOARD');
            }
          } else {
            // Existing user who hasn't completed profile (edge case)
            setAppView('PROFILE_SETUP');
          }
        } else {
          // No profile found - this shouldn't happen with proper signup flow
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
        setIsNewSignup(false);
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
  }, [isNewSignup]);

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

  const refreshUserProfile = async () => {
    const auth = getFirebaseAuth();
    if (auth.currentUser && user) {
      const updatedProfile = await getUserProfile(auth.currentUser.uid);
      if (updatedProfile) {
        setUser(updatedProfile);
      }
    }
  };

  const handleProfileSave = async (profileUpdates: Partial<UserProfile>) => {
    const auth = getFirebaseAuth();
    if (user && auth.currentUser) {
      const updatedUser = { ...user, ...profileUpdates, profileComplete: true, profileCompleted: true };
      const db = getFirestoreDb();
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, updatedUser, { merge: true });
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
    setIsNewSignup(true); // Mark this as a new signup
    // This will be handled by Firebase auth state change
  };

  const handleEmailSignIn = async (credentials: AuthCredentials) => {
    setAuthError(null);
    setIsNewSignup(false); // Mark this as existing user login
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
            onGoogleSignIn={(isNewUser: boolean) => setIsNewSignup(isNewUser)} // Set signup flag for Google auth
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
        return <Profile user={user!} onLogout={handleLogout} onNavigate={saveCurrentView} onProfileUpdate={refreshUserProfile} />;
      case 'PROFILE_EDIT':
        return <Profile user={user!} onLogout={handleLogout} onNavigate={saveCurrentView} onProfileUpdate={refreshUserProfile} />;
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
      {/* Global Menu - Show on all pages except loading and landing (landing has its own) */}
      {!loading && appView !== 'LANDING' && (
        <GlobalMenu
          isAuthenticated={!!user}
          onNavigate={saveCurrentView}
          onLogout={handleLogout}
          currentView={appView}
        />
      )}
      {renderContent()}
    </div>
  );
};

export default App; 