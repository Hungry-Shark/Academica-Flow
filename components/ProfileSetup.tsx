import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileSetupProps {
  user: UserProfile;
  onSave: (profile: Partial<UserProfile>) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ user, onSave }) => {
  const [name, setName] = useState(user.name || '');
  const [role, setRole] = useState<'student' | 'faculty' | 'admin'>(user.role || 'student');
  const [preferences, setPreferences] = useState(user.preferences || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({ name, role, preferences });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white px-4">
      <div className="p-8 bg-white w-full max-w-md">
        <h2 className="text-xl font-bold text-center mb-2 text-black">Complete Your Profile</h2>
        <p className="text-black/80 mb-8 text-center">We just need a little more information to get you started.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-1">Email</label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              className="w-full p-3 border border-dashed border-black rounded-lg bg-white text-black/50"
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-black mb-1">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition bg-white text-black placeholder:text-black/50"
              required
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-black mb-1">Your Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'student' | 'faculty' | 'admin')}
              className="w-full p-3 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition appearance-none bg-white text-black bg-no-repeat bg-right pr-8"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div>
            <label htmlFor="preferences" className="block text-sm font-medium text-black mb-1">Timetable Preferences (Optional)</label>
            <textarea
              id="preferences"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g., 'I prefer morning classes', 'Avoid back-to-back labs'"
              className="w-full p-3 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition placeholder:text-black/50 bg-white text-black"
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-black hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
            disabled={!name.trim()}
          >
            Save and Continue
          </button>
        </form>
      </div>
    </div>
  );
};
