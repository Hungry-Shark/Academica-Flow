// FIX: Create the Admin component
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { UserProfile } from '../types';
import { Icon } from './Icons';
import { AdminData } from './AdminData';

interface AdminProps {
  user: UserProfile;
  onLogout: () => void;
}

export const Admin: React.FC<AdminProps> = ({ user, onLogout }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-white">
            <Sidebar user={user} onLogout={onLogout} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
            <main className="flex-1 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 overflow-y-auto">
                <div className="lg:hidden">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md text-black bg-white border border-black">
                        <Icon name="menu" className="w-6 h-6" />
                    </button>
                </div>
                <h1 className="text-2xl font-bold text-black">Administrative Data</h1>
                <AdminData />
            </main>
        </div>
    );
};