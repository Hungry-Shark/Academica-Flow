import React, { Fragment } from 'react';
import { UserProfile } from '../types';
import { Icon } from './Icons';
import { Transition, Dialog } from '@headlessui/react';

interface SidebarProps {
  user: UserProfile;
  onLogout: () => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

const SidebarContent: React.FC<Pick<SidebarProps, 'user' | 'onLogout'>> = ({ user, onLogout }) => (
    <div className="flex flex-col h-full bg-black text-white p-4">
        <div className="flex-1">
            <div className="mb-8 flex items-center space-x-3">
                <Icon name="logo" className="w-8 h-8 text-white" />
                <h1 className="text-xl font-bold font-wakanda">Academica Flow</h1>
            </div>
            <div className="space-y-4">
                <div className="flex items-center space-x-3 p-2 rounded-md">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-white/70 capitalize">{user.role}</p>
                    </div>
                </div>
            </div>
        </div>
        <div>
            <button
                onClick={onLogout}
                className="w-full text-left p-2 rounded-md hover:bg-white/10 transition-colors"
            >
                Logout
            </button>
        </div>
    </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isOpen, setOpen }) => {
  return (
    <>
      {/* Static sidebar for large screens */}
      <div className="hidden lg:block lg:w-64">
        <SidebarContent user={user} onLogout={onLogout} />
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
                <SidebarContent user={user} onLogout={onLogout} />
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