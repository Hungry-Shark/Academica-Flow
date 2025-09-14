import React, { useState } from 'react';
import { AppView } from '../types';

interface GlobalMenuProps {
  isAuthenticated: boolean;
  onNavigate: (view: AppView) => void;
  onLogout?: () => void;
  currentView?: AppView;
}

export const GlobalMenu: React.FC<GlobalMenuProps> = ({ 
  isAuthenticated, 
  onNavigate, 
  onLogout,
  currentView 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleNavigation = (view: AppView) => {
    closeMenu();
    onNavigate(view);
  };

  return (
    <>
      {/* Menu Toggle Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-6 right-6 z-[1001] cursor-pointer w-8 h-6 flex flex-col justify-between"
        aria-label="Toggle menu"
      >
        <span className={`block w-full h-0.5 transition-all duration-300 ease-in-out origin-center ${
          isMenuOpen ? 'translate-y-2.5 rotate-45 bg-white' : 'bg-black'
        }`}></span>
        <span className={`block w-full h-0.5 bg-black transition-all duration-300 ease-in-out origin-center ${
          isMenuOpen ? 'opacity-0' : ''
        }`}></span>
        <span className={`block w-full h-0.5 transition-all duration-300 ease-in-out origin-center ${
          isMenuOpen ? '-translate-y-2.5 -rotate-45 bg-white' : 'bg-black'
        }`}></span>
      </button>

      {/* Overlay Menu */}
      <div className={`fixed top-0 left-0 w-full h-full bg-black flex justify-center items-center transform transition-transform duration-500 ease-in-out z-[1000] ${
        isMenuOpen ? 'translate-x-0' : 'translate-x-full' 
      }`}>
        {/* Close button for mobile accessibility */}
        <button
          onClick={closeMenu}
          className="absolute top-4 right-4 md:hidden text-white text-2xl w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded"
          aria-label="Close menu"
        >
          ×
        </button>
        <nav className="text-center px-4">
          <ul className="list-none p-0 m-0">
            <li className={`my-3 md:my-5 transition-all duration-400 ease-in-out ${
              isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0' 
            }`} style={{ transitionDelay: isMenuOpen ? '0.3s' : '0s' }}>
              <button onClick={() => handleNavigation('LANDING')} className="cursor-pointer w-full">
                <span className="text-2xl md:text-4xl text-white no-underline font-semibold transition-colors duration-300 hover:text-gray-400 font-wakanda block py-2">
                  Home
                </span>
              </button>
            </li>
            {isAuthenticated ? (
              <>
                <li className={`my-3 md:my-5 transition-all duration-400 ease-in-out ${
                  isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0' 
                }`} style={{ transitionDelay: isMenuOpen ? '0.4s' : '0s' }}>
                  <button onClick={() => handleNavigation('DASHBOARD')} className="cursor-pointer w-full">
                    <span className="text-2xl md:text-4xl text-white no-underline font-semibold transition-colors duration-300 hover:text-gray-400 font-wakanda block py-2">
                      Dashboard
                    </span>
                  </button>
                </li>
                <li className={`my-3 md:my-5 transition-all duration-400 ease-in-out ${
                  isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0' 
                }`} style={{ transitionDelay: isMenuOpen ? '0.5s' : '0s' }}>
                  <button onClick={() => handleNavigation('PROFILE')} className="cursor-pointer w-full">
                    <span className="text-2xl md:text-4xl text-white no-underline font-semibold transition-colors duration-300 hover:text-gray-400 font-wakanda block py-2">
                      Profile
                    </span>
                  </button>
                </li>
                <li className={`my-3 md:my-5 transition-all duration-400 ease-in-out ${
                  isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0' 
                }`} style={{ transitionDelay: isMenuOpen ? '0.6s' : '0s' }}>
                  <button 
                    onClick={() => {
                      closeMenu();
                      handleNavigation('LANDING');
                      setTimeout(() => {
                        const contactSection = document.getElementById('contact');
                        if (contactSection) {
                          contactSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }, 100);
                    }} 
                    className="cursor-pointer w-full"
                  >
                    <span className="text-2xl md:text-4xl text-white no-underline font-semibold transition-colors duration-300 hover:text-gray-400 font-wakanda block py-2">
                      Contact
                    </span>
                  </button>
                </li>
                <li className={`my-3 md:my-5 transition-all duration-400 ease-in-out ${
                  isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0' 
                }`} style={{ transitionDelay: isMenuOpen ? '0.8s' : '0s' }}>
                  <button onClick={() => { closeMenu(); onLogout && onLogout(); }} className="cursor-pointer w-full">
                    <span className="text-2xl md:text-4xl text-white no-underline font-semibold transition-colors duration-300 hover:text-red-400 font-wakanda block py-2">
                      Logout
                    </span>
                  </button>
                </li>
              </>
            ) : (
              <li className={`my-3 md:my-5 transition-all duration-400 ease-in-out ${
                isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0' 
              }`} style={{ transitionDelay: isMenuOpen ? '0.4s' : '0s' }}>
                <button onClick={() => handleNavigation('LOGIN')} className="cursor-pointer w-full">
                  <span className="text-2xl md:text-4xl text-white no-underline font-semibold transition-colors duration-300 hover:text-gray-400 font-wakanda block py-2">
                    Login
                  </span>
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </>
  );
};
