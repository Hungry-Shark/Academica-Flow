import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileSetupProps {
  user: UserProfile;
  onSave: (updates: Partial<UserProfile>) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ user, onSave }) => {
  const [name, setName] = useState(user.name || '');
  const [preferences, setPreferences] = useState(user.preferences || '');
  const [role, setRole] = useState<UserProfile['role']>(user.role || 'student');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!role) {
      setError('Please select a role.');
      return;
    }
    setError(null);
    onSave({ name: name.trim(), preferences, role });
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-md w-full mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center sm:text-left">Complete your profile</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input value={user.email} readOnly className="w-full p-3 bg-gray-100 border border-black rounded text-black" />
          </div>
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-white border border-black rounded" />
          </div>
          <div className="relative">
            <label className="block text-sm mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full p-3 bg-white border border-black rounded appearance-none relative z-10">
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 mt-6">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Preferences</label>
            <textarea value={preferences} onChange={(e) => setPreferences(e.target.value)} className="w-full p-3 bg-white border border-black rounded" rows={4} />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button onClick={handleSave} className="w-full py-3 bg-black text-white rounded">Save</button>
        </div>
      </div>
    </div>
  );
}; 