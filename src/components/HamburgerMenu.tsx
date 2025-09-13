import React, { useState } from 'react';
import { Icon } from './Icons';
import { AppView } from '../types';

interface HamburgerMenuProps {
  isAuthenticated: boolean;
  onNavigate: (view: AppView) => void;
  onLogout?: () => void;
  currentView?: AppView;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ 
  isAuthenticated, 
  onNavigate, 
  onLogout,
  currentView 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleNavigation = (view: AppView) => {
    onNavigate(view);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 p-2 bg-white border border-black rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center space-y-1">
          <div className={`w-full h-0.5 bg-black transition-transform duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
          <div className={`w-full h-0.5 bg-black transition-opacity duration-300 ${isOpen ? 'opacity-0' : ''}`}></div>
          <div className={`w-full h-0.5 bg-black transition-transform duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
        </div>
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Panel */}
      <div className={`fixed top-0 left-0 z-40 w-64 h-full bg-white shadow-lg transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 pt-16">
          <h2 className="text-xl font-semibold mb-6 text-black">Navigation</h2>
          
          <nav className="space-y-3">
            {/* Home */}
            <button
              onClick={() => handleNavigation('LANDING')}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                currentView === 'LANDING' 
                  ? 'bg-black text-white' 
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <Icon name="home" className="w-5 h-5 inline mr-3" />
              Home
            </button>

            {/* Authentication */}
            {!isAuthenticated ? (
              <button
                onClick={() => handleNavigation('LOGIN')}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentView === 'LOGIN' 
                    ? 'bg-black text-white' 
                    : 'text-black hover:bg-gray-100'
                }`}
              >
                <Icon name="user" className="w-5 h-5 inline mr-3" />
                Login
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleNavigation('DASHBOARD')}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentView === 'DASHBOARD' 
                      ? 'bg-black text-white' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  <Icon name="dashboard" className="w-5 h-5 inline mr-3" />
                  Dashboard
                </button>

                <button
                  onClick={() => handleNavigation('PROFILE')}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentView === 'PROFILE' 
                      ? 'bg-black text-white' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  <Icon name="user" className="w-5 h-5 inline mr-3" />
                  Profile
                </button>

                <button
                  onClick={() => handleNavigation('ABOUT')}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentView === 'ABOUT' 
                      ? 'bg-black text-white' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  <Icon name="info" className="w-5 h-5 inline mr-3" />
                  About
                </button>

                <button
                  onClick={() => handleNavigation('CONTACT')}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentView === 'CONTACT' 
                      ? 'bg-black text-white' 
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  <Icon name="mail" className="w-5 h-5 inline mr-3" />
                  Contact
                </button>

                <hr className="my-4 border-gray-200" />

                <button
                  onClick={() => {
                    if (onLogout) onLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Icon name="logout" className="w-5 h-5 inline mr-3" />
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
};
