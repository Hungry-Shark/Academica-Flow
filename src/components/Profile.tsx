import React, { useState } from 'react';
import { UserProfile, AppView } from '../types';
import { Sidebar } from './Sidebar';
import { Icon } from './Icons';
import { getFirebaseAuth, createUserProfile } from '../firebase';

interface ProfileProps {
  user: UserProfile;
  onLogout: () => void;
  onNavigate: (view: AppView) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onLogout, onNavigate }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [college, setCollege] = useState(user.college || '');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const auth = getFirebaseAuth();
    if (!auth.currentUser) return;
    setSaving(true);
    const updated: UserProfile = { ...user, name, college };
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
        {/* Landing page style hamburger menu */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-6 right-6 z-[1001] cursor-pointer w-8 h-6 flex flex-col justify-between lg:hidden"
        >
          <span className={`block w-full h-0.5 transition-all duration-300 ease-in-out origin-center ${
            isSidebarOpen ? 'translate-y-2.5 rotate-45 bg-white' : 'bg-black'
          }`}></span>
          <span className={`block w-full h-0.5 bg-black transition-all duration-300 ease-in-out origin-center ${
            isSidebarOpen ? 'opacity-0' : ''
          }`}></span>
          <span className={`block w-full h-0.5 transition-all duration-300 ease-in-out origin-center ${
            isSidebarOpen ? '-translate-y-2.5 -rotate-45 bg-white' : 'bg-black'
          }`}></span>
        </button>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 lg:p-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Profile</h1>
            <div className="bg-white p-6 rounded-lg shadow space-y-5">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-3xl font-bold">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{name}</h2>
                  <p className="text-gray-500">{user.email}</p>
                </div>
              </div>
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
              <div>
                <label className="block text-sm mb-1">Department/Branch</label>
                <input value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full p-3 bg-white border border-black rounded" placeholder="e.g., Computer Science, Mechanical Engineering" />
              </div>
              <div>
                <label className="block text-sm mb-1">Year/Semester</label>
                <input value={year} onChange={(e) => setYear(e.target.value)} className="w-full p-3 bg-white border border-black rounded" placeholder="e.g., 2nd Year, 4th Semester" />
              </div>
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