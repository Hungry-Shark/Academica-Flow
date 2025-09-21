import React, { Fragment, useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Icon } from './Icons';
import { Transition, Dialog } from '@headlessui/react';

interface SidebarProps {
  user: UserProfile;
  onLogout: () => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  onNavigate: (view: 'DASHBOARD' | 'PROFILE_EDIT' | 'GENERATE_TT' | 'ADMIN_INFO') => void;
  width?: number;
  onWidthChange?: (width: number) => void;
}

const SidebarContent: React.FC<Pick<SidebarProps, 'user' | 'onLogout' | 'onNavigate'> & { isCollapsed: boolean }> = ({ user, onLogout, onNavigate, isCollapsed }) => (
    <div className="flex flex-col min-h-screen max-h-screen bg-black text-white p-4 overflow-y-auto">
        {/* Header Section - Fixed */}
        <div className="flex-shrink-0">
            <div className={`mb-8 flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
                <Icon name="logo" className="w-8 h-8 text-white" />
                {!isCollapsed && <h1 className="text-xl font-bold font-wakanda">Academica Flow</h1>}
            </div>
        </div>
        
        {/* Navigation Section - Scrollable */}
        <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-md`}>
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                        {user.profileImageUrl ? (
                            <img 
                                src={user.profileImageUrl} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-white flex items-center justify-center text-black font-bold text-lg">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    {!isCollapsed && (
                        <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-white/70 capitalize">{user.role}</p>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => onNavigate('DASHBOARD')}
                    className={`w-full text-left p-2 rounded-md hover:bg-white/10 transition-colors flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
                    title={isCollapsed ? 'Dashboard' : undefined}
                >
                    <Icon name="dashboard" className="w-5 h-5" />
                    {!isCollapsed && <span>Dashboard</span>}
                </button>
                {user.role === 'admin' && (
                    <button
                        onClick={() => onNavigate('GENERATE_TT')}
                        className={`w-full text-left p-2 rounded-md hover:bg-white/10 transition-colors flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
                        title={isCollapsed ? 'Generate TT' : undefined}
                    >
                        <Icon name="calendar" className="w-5 h-5" />
                        {!isCollapsed && <span>Generate TT</span>}
                    </button>
                )}
                {user.role === 'admin' && (
                    <button
                        onClick={() => onNavigate('ADMIN_INFO')}
                        className={`w-full text-left p-2 rounded-md hover:bg-white/10 transition-colors flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
                        title={isCollapsed ? 'Administrative Info' : undefined}
                    >
                        <Icon name="tools" className="w-5 h-5" />
                        {!isCollapsed && <span>Administrative Info</span>}
                    </button>
                )}
                <button
                    onClick={() => onNavigate('PROFILE_EDIT')}
                    className={`w-full text-left p-2 rounded-md hover:bg-white/10 transition-colors flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
                    title={isCollapsed ? 'Profile' : undefined}
                >
                    <Icon name="profile" className="w-5 h-5" />
                    {!isCollapsed && <span>Profile</span>}
                </button>
            </div>
        </div>
        
        {/* Footer Section - Fixed */}
        <div className="flex-shrink-0 mt-auto">
            <button
                onClick={onLogout}
                className={`w-full text-left p-3 rounded-md hover:bg-red-600/20 transition-colors flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} border-t border-white/10 pt-4`}
                title={isCollapsed ? 'Logout' : undefined}
            >
                <Icon name="logout" className="w-5 h-5" />
                {!isCollapsed && <span>Logout</span>}
            </button>
        </div>
    </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isOpen, setOpen, onNavigate, width = 256, onWidthChange }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(width);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const isCollapsed = sidebarWidth < 120;

  useEffect(() => {
    setSidebarWidth(width);
  }, [width]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = Math.max(80, Math.min(400, e.clientX));
      setSidebarWidth(newWidth);
      onWidthChange?.(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  return (
    <>
      {/* Resizable sidebar for large screens */}
      <div className="hidden lg:block relative" style={{ width: sidebarWidth }}>
        <SidebarContent user={user} onLogout={onLogout} onNavigate={onNavigate} isCollapsed={isCollapsed} />
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-white/20 transition-colors"
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Mobile sidebar */}
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={() => setOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <Icon name="close" className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
                <SidebarContent user={user} onLogout={onLogout} onNavigate={onNavigate} isCollapsed={false} />
              </Dialog.Panel>
            </Transition.Child>
            <div className="flex-shrink-0 w-14" aria-hidden="true">
              {/* Dummy element to force sidebar to shrink to fit close icon */}
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}; 