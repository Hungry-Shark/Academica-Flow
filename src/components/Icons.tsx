import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: 'logo' | 'menu' | 'close' | 'dashboard' | 'profile' | 'download' | 'image' | 'spinner' | 'google' | 'back' | 'sliders' | 'calendar' | 'users' | 'tools' | 'mail' | 'github' | 'twitter' | 'linkedin' | 'edit' | 'save' | 'refresh' | 'clock' | 'info' | 'home' | 'user' | 'logout';
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'logo':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M10 50 C 10 20, 40 20, 50 50 S 90 80, 90 50 S 60 20, 50 50" />
          <circle cx="50" cy="50" r="40" />
        </svg>
      );
    case 'menu':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <path d="M3 6h18M3 12h18M3 18h18" strokeWidth="2" />
        </svg>
      );
    case 'close':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <path d="M6 6l12 12M6 18L18 6" strokeWidth="2" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z" strokeWidth="1.5" />
        </svg>
      );
    case 'profile':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" strokeWidth="2" />
          <path d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8" strokeWidth="2" />
        </svg>
      );
    case 'download':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeWidth="2" />
          <path d="M5 21h14" strokeWidth="2" />
        </svg>
      );
    case 'image':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
          <path d="M3 16l5-5 4 4 5-6 4 5" strokeWidth="2" />
        </svg>
      );
    case 'spinner':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" strokeWidth="4" />
          <path d="M22 12a10 10 0 0 1-10 10" strokeWidth="4" />
        </svg>
      );
    case 'google':
      return (
        <svg viewBox="0 0 533.5 544.3" fill="currentColor" {...props}>
          <path d="M533.5 278.4c0-17.4-1.6-34-4.6-50.2H272.1v95.0h147.0c-6.3 33.9-25.4 62.6-54.1 82.0v68.0h87.6c51.3-47.2 80.9-116.7 80.9-194.8z"/>
          <path d="M272.1 544.3c73.1 0 134.5-24.1 179.3-65.2l-87.6-68.0c-24.3 16.3-55.1 26.0-91.7 26.0-70.5 0-130.2-47.6-151.6-111.5H31.4v69.9c44.6 88.8 136.3 148.8 240.7 148.8z"/>
          <path d="M120.6 325.1c-10.2-30.6-10.2-63.5 0-94.1V161.1H31.4c-44.6 88.8-44.6 192.6 0 281.4l89.2-69.5z"/>
          <path d="M272.1 107.7c39.7-.6 77.8 14.9 106.7 43.1l79.6-79.6C412.6 24.8 344.4-2.6 272.1 0 167.7 0 76 59.9 31.4 148.7l89.2 69.5c21.5-64 81.1-110.5 151.5-110.5z"/>
        </svg>
      );
    case 'back':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <path d="M15 18l-6-6 6-6" strokeWidth="2" />
        </svg>
      );
    case 'sliders':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <path d="M4 21v-14" strokeWidth="2" />
          <path d="M4 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" strokeWidth="2" />
          <path d="M12 21v-8" strokeWidth="2" />
          <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" strokeWidth="2" />
          <path d="M20 21v-12" strokeWidth="2" />
          <path d="M20 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" strokeWidth="2" />
        </svg>
      );
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
          <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" />
        </svg>
      );
    case 'users':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" strokeWidth="2" />
          <circle cx="9" cy="7" r="4" strokeWidth="2" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeWidth="2" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2" />
        </svg>
      );
    case 'tools':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <path d="M14.7 6.3a4 4 0 1 0 2.9 2.9l3.4-3.4-2.1-2.1-3.4 3.4z" strokeWidth="2" />
          <path d="M11 11l-8 8 2 2 8-8" strokeWidth="2" />
        </svg>
      );
    case 'mail':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" ry="2" strokeWidth="2" />
          <path d="M3 7l9 6 9-6" strokeWidth="2" />
        </svg>
      );
    case 'github':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12 .5C5.7.5.9 5.3.9 11.6c0 4.9 3.2 9 7.6 10.5.6.1.8-.2.8-.5v-2c-3.1.7-3.8-1.3-3.8-1.3-.6-1.6-1.5-2-1.5-2-1.3-.9.1-.9.1-.9 1.4.1 2.1 1.4 2.1 1.4 1.3 2.1 3.4 1.5 4.3 1.1.1-1 .5-1.5.9-1.9-2.5-.3-5.2-1.3-5.2-5.9 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.4 1.2a11.8 11.8 0 0 1 6.2 0c2.4-1.5 3.4-1.2 3.4-1.2.6 1.7.2 3 .1 3.3.8.9 1.2 2 1.2 3.3 0 4.6-2.7 5.6-5.2 5.9.5.4 1 1.2 1 2.5v3.7c0 .3.2.6.8.5 4.4-1.5 7.6-5.6 7.6-10.5C23.1 5.3 18.3.5 12 .5z"/>
        </svg>
      );
    case 'twitter':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 12 8v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5A2.5 2.5 0 0 1 2.5 1 2.5 2.5 0 0 1 4.98 3.5zM0 8h5v16H0zM8.5 8H13v2.2h.1C13.7 9.1 15.4 8 17.7 8 22.3 8 24 10.8 24 15.2V24h-5v-7.6c0-1.8 0-4.2-2.6-4.2-2.6 0-3 2-3 4.1V24H8.5z"/>
        </svg>
      );
    case 'edit':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" />
        </svg>
      );
    case 'save':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeWidth="2" />
          <path d="M17 21v-8H7v8" strokeWidth="2" />
          <path d="M7 3v5h8" strokeWidth="2" />
        </svg>
      );
    case 'refresh':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" strokeWidth="2" />
          <path d="M21 3v5h-5" strokeWidth="2" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" strokeWidth="2" />
          <path d="M3 21v-5h5" strokeWidth="2" />
        </svg>
      );
    case 'clock':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <path d="M12 6v6l4 2" strokeWidth="2" />
        </svg>
      );
    case 'info':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <path d="M12 16v-4" strokeWidth="2" />
          <path d="M12 8h.01" strokeWidth="2" />
        </svg>
      );
    case 'home':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2" />
          <path d="M9 22V12h6v10" strokeWidth="2" />
        </svg>
      );
    case 'user':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" />
          <circle cx="12" cy="7" r="4" strokeWidth="2" />
        </svg>
      );
    case 'logout':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="2" />
          <path d="M16 17l5-5-5-5" strokeWidth="2" />
          <path d="M21 12H9" strokeWidth="2" />
        </svg>
      );
    default:
      return null;
  }
}; 