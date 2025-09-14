import React, { useState } from 'react';
import { UserProfile } from '../types';
import { createOrganization, getOrganizationByToken } from '../firebase';
import { Icon } from './Icons';
import { sanitizeInput, ValidationError } from '../utils/validation';

interface ProfileSetupProps {
  user: UserProfile;
  onSave: (updates: Partial<UserProfile>) => void;
  onNavigate?: (view: string) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ user, onSave, onNavigate }) => {
  const [name, setName] = useState(user.name || '');
  const [role, setRole] = useState<UserProfile['role']>(user.role || 'student');
  const [college, setCollege] = useState(user.college || '');
  const [organizationToken, setOrganizationToken] = useState(user.organizationToken || '');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  const handleSave = async () => {
    try {
      // Sanitize and validate inputs
      const sanitizedName = sanitizeInput(name);
      const sanitizedCollege = sanitizeInput(college);
      const sanitizedToken = sanitizeInput(organizationToken);

      if (!sanitizedName) {
        throw new ValidationError('Please enter your name.');
      }
      if (!role) {
        throw new ValidationError('Please select a role.');
      }
      if (!sanitizedCollege) {
        throw new ValidationError('Please enter your school/college name.');
      }

      // Validate name length and format
      if (sanitizedName.length < 2) {
        throw new ValidationError('Name must be at least 2 characters long.');
      }
      if (!/^[a-zA-Z\s-']+$/.test(sanitizedName)) {
        throw new ValidationError('Name can only contain letters, spaces, hyphens, and apostrophes.');
      }

      if (role === 'admin') {
        // Admin creates organization and gets token
        try {
          setIsCreatingOrg(true);
          const token = await createOrganization(user.uid, sanitizedCollege);
          setGeneratedToken(token);
          setError(null);
          onSave({ 
            name: sanitizedName, 
            preferences: '', 
            role, 
            college: sanitizedCollege,
            organizationToken: token
          });
        } finally {
          setIsCreatingOrg(false);
        }
      } else {
        // Student/Faculty joins with token
        if (!sanitizedToken) {
          throw new ValidationError('Please enter the organization token provided by your admin.');
        }

        // Validate token format (6 digits)
        if (!/^\d{6}$/.test(sanitizedToken)) {
          throw new ValidationError('Invalid token format. Token should be 6 digits.');
        }
        
        const organization = await getOrganizationByToken(sanitizedToken);
        if (!organization) {
          throw new ValidationError('Invalid organization token. Please check with your admin.');
        }
        
        setError(null);
        onSave({ 
          name: sanitizedName, 
          preferences: '', 
          role, 
          college: organization.name,
          organizationToken: sanitizedToken
        });
      }
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(err.message);
      } else {
        console.error('Error in profile setup:', err);
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col p-4 sm:p-8">
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center sm:text-left">Complete your profile</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
        {error && (
          <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-black">Email</label>
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
            <label className="block text-sm mb-1">School/College Name</label>
            <input 
              value={college} 
              onChange={(e) => setCollege(e.target.value)} 
              className="w-full p-3 bg-white border border-black rounded" 
              placeholder="Enter your institution name"
            />
          </div>
          {role !== 'admin' && (
            <div>
              <label className="block text-sm mb-1">Organization Token</label>
              <input 
                value={organizationToken} 
                onChange={(e) => setOrganizationToken(e.target.value)} 
                className="w-full p-3 bg-white border border-black rounded" 
                placeholder="Enter 6-digit token from your admin"
                maxLength={6}
              />
              <p className="text-xs text-gray-600 mt-1">Ask your admin for the organization token</p>
            </div>
          )}
          {role === 'admin' && generatedToken && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="font-semibold text-green-800 mb-2">Organization Created Successfully!</h3>
              <p className="text-sm text-green-700 mb-2">Your organization token is:</p>
              <div className="bg-white border border-green-300 rounded p-2 font-mono text-lg text-center">
                {generatedToken}
              </div>
              <p className="text-xs text-green-600 mt-2">Share this token with students and faculty to join your organization.</p>
            </div>
          )}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button 
            onClick={handleSave} 
            disabled={isCreatingOrg}
            className="w-full py-3 bg-black text-white rounded disabled:bg-gray-400"
          >
            {isCreatingOrg ? 'Creating Organization...' : 'Save'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}; 