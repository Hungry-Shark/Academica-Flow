// FIX: Create the main App component
import React, { useState, useEffect } from 'react';
import { getFirebaseAuth, createUserProfile, getUserProfile } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Login } from './components/Login';
import { ProfileSetup } from './components/ProfileSetup';
import { Dashboard } from './components/Dashboard';
import { Admin } from './components/Admin';
import { UserProfile, AppView, AuthCredentials } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [appView, setAppView] = useState<AppView>('LOGIN');
  const [loading, setLoading] = useState(true);
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
  //     if (firebaseUser) {
  //       // You may want to fetch user profile/role from Firestore here
  //       // For now, treat all as students except a hardcoded admin
  //       const isAdmin = firebaseUser.email === 'admin@test.com';
  //       const userProfile: UserProfile = {
  //         email: firebaseUser.email || '',
  //         name: firebaseUser.displayName || firebaseUser.email || '',
  //         role: isAdmin ? 'admin' : 'student',
  //         preferences: '',
  //         profileComplete: true,
  //       };
  //       setUser(userProfile);
  //       setAppView(isAdmin ? 'ADMIN' : 'DASHBOARD');
  //     } else {
  //       setUser(null);
  //       setAppView('LOGIN');
  //     }
  //   });
  //   return () => unsubscribe();
  // }, []);
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
        setAppView('LOGIN');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = () => {
    setAuthError(null);
    const newUser: UserProfile = {
      email: 'new.user@google.com',
      name: '',
      role: 'student',
      preferences: '',
      profileComplete: false,
    };
    setUser(newUser);
    localStorage.setItem('academica_user', JSON.stringify(newUser));
    setAppView('PROFILE_SETUP');
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
    setAppView('LOGIN');
  };
  
  // Added no-op email handlers to satisfy props and avoid reference errors.
  const handleEmailSignUp = (_credentials: AuthCredentials) => {
    setAuthError(null);
  };

  const handleEmailSignIn = (_credentials: AuthCredentials) => {
    setAuthError(null);
  };
  
  const renderContent = () => {
    switch(appView) {
      case 'LOGIN':
        return (
          <Login 
            onEmailSignUp={handleEmailSignUp} 
            onEmailSignIn={handleEmailSignIn} 
            onGoogleSignIn={handleGoogleSignIn}
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
        return null;
    }
  };
// ...existing code...
  return (
    <div className="bg-white min-h-screen">
      {renderContent()}
    </div>
  );
};

export default App;