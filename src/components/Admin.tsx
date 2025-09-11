// FIX: Create the Admin component
import React, { useEffect } from 'react';
import { UserProfile } from '../types';

interface AdminProps {
  user: UserProfile;
  onLogout: () => void;
  onNavigate?: (view: 'DASHBOARD' | 'PROFILE_EDIT' | 'PROFILE' | 'ADMIN_INFO' | 'GENERATE_TT') => void;
}

export const Admin: React.FC<AdminProps> = ({ user, onLogout, onNavigate }) => {
    // Redirect admin users to Dashboard instead of showing a separate admin page
    useEffect(() => {
        if (onNavigate) {
            onNavigate('DASHBOARD');
        }
    }, [onNavigate]);

    return (
        <div className="flex items-center justify-center h-screen bg-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-black">Redirecting to Dashboard...</p>
            </div>
        </div>
    );
}; 