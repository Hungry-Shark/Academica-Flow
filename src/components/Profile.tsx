import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, AppView } from '../types';
import { Sidebar } from './Sidebar';
import { Icon } from './Icons';
import { getFirebaseAuth, createUserProfile } from '../firebase';
import { uploadProfileImage, deleteProfileImage, validateImageFile } from '../utils/cloudinaryUpload';
import { checkRateLimit } from '../utils/rateLimiter';

interface ProfileProps {
  user: UserProfile;
  onLogout: () => void;
  onNavigate: (view: AppView) => void;
  onProfileUpdate?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onLogout, onNavigate, onProfileUpdate }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [college, setCollege] = useState(user.college || '');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(user.profileImageUrl || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing profile data
  useEffect(() => {
    if (user.preferences) {
      try {
        const prefs = JSON.parse(user.preferences);
        setPhone(prefs.phone || '');
        setDepartment(prefs.department || '');
        setYear(prefs.year || '');
      } catch (error) {
        console.warn('Error parsing user preferences:', error);
      }
    }
  }, [user.preferences]);

  // Update profile image when user changes
  useEffect(() => {
    setProfileImageUrl(user.profileImageUrl || '');
  }, [user.profileImageUrl]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check rate limit for file uploads
    const rateLimitResult = checkRateLimit('FILE_UPLOAD', user.uid);
    if (!rateLimitResult.allowed) {
      setImageError(`Too many upload attempts. Please try again in ${Math.ceil(rateLimitResult.resetTime / 60000)} minutes.`);
      return;
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setImageError(validation.message);
      return;
    }

    setImageError(null);
    setUploadingImage(true);

    try {
      const auth = getFirebaseAuth();
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Delete old image if exists
      if (profileImageUrl) {
        await deleteProfileImage(profileImageUrl);
      }

      // Upload new image
      const newImageUrl = await uploadProfileImage(file, auth.currentUser.uid);
      setProfileImageUrl(newImageUrl);

      // Save to user profile
      const updated: UserProfile = { 
        ...user, 
        profileImageUrl: newImageUrl 
      };
      await createUserProfile(auth.currentUser.uid, updated);
      
      // Notify parent component to refresh user data
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageError('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!profileImageUrl) return;

    setUploadingImage(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Delete image from storage
      await deleteProfileImage(profileImageUrl);
      setProfileImageUrl('');

      // Update user profile
      const updated: UserProfile = { 
        ...user, 
        profileImageUrl: '' 
      };
      await createUserProfile(auth.currentUser.uid, updated);
      
      // Notify parent component to refresh user data
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      
    } catch (error) {
      console.error('Error removing image:', error);
      setImageError('Failed to remove image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    const auth = getFirebaseAuth();
    if (!auth.currentUser) return;
    setSaving(true);
    
    // Prepare role-specific data
    const updated: UserProfile = { 
      ...user, 
      name, 
      college,
      // Add role-specific fields to preferences as JSON
      preferences: JSON.stringify({
        phone: phone,
        department: department,
        year: user.role === 'student' ? year : undefined
      })
    };
    
    await createUserProfile(auth.currentUser.uid, updated);
    setSaving(false);
    onNavigate('DASHBOARD');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        user={user}
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        setOpen={setSidebarOpen}
        onNavigate={onNavigate as any}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 lg:p-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Profile</h1>
            <div className="bg-white p-6 rounded-lg shadow space-y-5">
              {/* Profile Photo Section */}
              <div className="flex items-center space-x-4">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {profileImageUrl ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                      <img 
                        src={profileImageUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                      {/* Hover overlay - bottom half translucent with camera icon */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 ease-in-out">
                        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 ease-in-out flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-300">
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-3xl font-bold">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      {/* Hover overlay - bottom half translucent with camera icon */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 ease-in-out">
                        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 ease-in-out flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Remove button - only show when image exists */}
                  {profileImageUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      disabled={uploadingImage}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 disabled:opacity-50 transition-colors duration-200"
                      title="Remove photo"
                    >
                      ✕
                    </button>
                  )}
                  
                  {/* Loading overlay */}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{name}</h2>
                  <p className="text-gray-500">{user.email}</p>
                  {imageError && (
                    <p className="text-red-500 text-sm mt-1">{imageError}</p>
                  )}
                </div>
              </div>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-white border border-black rounded" />
              </div>
              <div>
                <label className="block text-sm mb-1">College/School</label>
                <input value={college} onChange={(e) => setCollege(e.target.value)} className="w-full p-3 bg-white border border-black rounded" />
              </div>
              <div>
                <label className="block text-sm mb-1">Phone Number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3 bg-white border border-black rounded" placeholder="Enter your phone number" />
              </div>
              
              {/* Role-specific fields */}
              {user.role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm mb-1">Department/Branch</label>
                    <input value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full p-3 bg-white border border-black rounded" placeholder="e.g., Computer Science, Mechanical Engineering" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Year/Semester</label>
                    <input value={year} onChange={(e) => setYear(e.target.value)} className="w-full p-3 bg-white border border-black rounded" placeholder="e.g., 2nd Year, 4th Semester" />
                  </div>
                </>
              )}
              
              {user.role === 'faculty' && (
                <div>
                  <label className="block text-sm mb-1">Department/Subject</label>
                  <input value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full p-3 bg-white border border-black rounded" placeholder="e.g., Computer Science, Mathematics" />
                </div>
              )}
              
              {user.role === 'admin' && (
                <div>
                  <label className="block text-sm mb-1">Organization Token</label>
                  <input value={user.organizationToken || ''} readOnly className="w-full p-3 bg-gray-100 border border-gray-300 rounded text-gray-600" placeholder="Organization token will be generated" />
                  <p className="text-xs text-gray-500 mt-1">Share this token with students and faculty to join your organization</p>
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-black text-white rounded disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};