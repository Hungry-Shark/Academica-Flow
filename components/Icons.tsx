
import React from 'react';

interface IconProps {
  name: 'menu' | 'download' | 'image' | 'spinner' | 'close' | 'google' | 'logo';
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, className }) => {
  switch (name) {
    case 'menu':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      );
    case 'download':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );
    case 'image':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      );
    case 'spinner':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      );
    case 'close':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case 'google':
      // Official Google "G" logo composed of four colored paths
      return (
        <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <path fill="#EA4335" d="M12 10.2v3.6h5.1c-.2 1.3-1.9 3.8-5.1 3.8-3.1 0-5.7-2.6-5.7-5.7s2.6-5.7 5.7-5.7c1.7 0 2.9.7 3.6 1.3l2.5-2.5C16.6 3.1 14.6 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5S6.9 20.7 12 20.7c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.6H12z"/>
          <path fill="#34A853" d="M12 20.7c3.4 0 6.3-1.1 8.4-3l-4-3.1c-1.1.7-2.5 1.1-4.3 1.1-3.3 0-6-2.2-7-5.1l-4.1 3.2c1.9 3.8 5.9 6.9 11 6.9z"/>
          <path fill="#4A90E2" d="M5 10.6c-.2-.6-.3-1.3-.3-2 0-.7.1-1.4.3-2L.9 3.4C0 5.1-.5 7 .5 8.8L5 10.6z" opacity="0"/>
          <path fill="#4285F4" d="M21 12.1c0-.6-.1-1.1-.2-1.6H12v3.6h5.1c-.3 1.7-1.6 3-3.5 3.5v2.9h2.8c3-.2 5.6-2.9 5.6-8.4z"/>
          <path fill="#FBBC05" d="M7.1 13.7c-.3-.8-.5-1.6-.5-2.5s.2-1.7.5-2.5V5.8H4.2C3.5 7.2 3.1 8.8 3.1 11.2s.4 4 1.1 5.4l2.9-2.9z"/>
        </svg>
      );
    case 'logo':
      return (
        <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 50 C 10 20, 40 20, 50 50 S 90 80, 90 50 S 60 20, 50 50" />
          <circle cx="50" cy="50" r="40" />
        </svg>
      );
    default:
      return null;
  }
};
