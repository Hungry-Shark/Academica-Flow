import React, { useEffect, useState } from 'react';
import { Icon } from './Icons';

interface HeaderProps {
  onLogoClick?: () => void;
  onLoginClick?: () => void;
  isAuthenticated?: boolean;
  onProfileClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick, onLoginClick, isAuthenticated = false, onProfileClick }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'}`}>
      <div className={`mx-auto max-w-7xl px-4`}> 
        <div className={`rounded-2xl border transition-all duration-300 ${scrolled 
          ? 'border-white/20 backdrop-blur-md bg-white/40 shadow-[0_8px_32px_rgba(31,38,135,0.15)] px-4 py-2' 
          : 'border-transparent bg-transparent px-6 py-3'}`}>
          <div className="flex items-center justify-between">
            <button onClick={onLogoClick} className="flex items-center space-x-3 text-black">
              <Icon name="logo" className={`transition-all ${scrolled ? 'w-8 h-8' : 'w-12 h-12'}`} />
              <span className={`font-bold font-wakanda ${scrolled ? 'text-lg' : 'text-2xl'}`}>Academica Flow</span>
            </button>
            <div className="hidden md:flex items-center space-x-6 text-sm">
              {isAuthenticated && (
                <button onClick={onProfileClick} className="text-black/80 hover:text-black transition-colors">Profile</button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {!isAuthenticated ? (
                <button onClick={onLoginClick} className="px-4 py-2 rounded-lg border border-black/20 bg-white/60 hover:bg-white/80 text-black transition-colors text-sm">Get Started</button>
              ) : (
                <button onClick={onProfileClick} className="px-4 py-2 rounded-lg border border-black/20 bg-white/60 hover:bg-white/80 text-black transition-colors text-sm">Profile</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 