import React from "react";

interface IconProps {
  name: "menu" | "download" | "image" | "spinner" | "close" | "google" | "logo";
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, className }) => {
  switch (name) {
    case "menu":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      );
    case "download":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );
    case "image":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      );
    case "spinner":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      );
    case "close":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case "google":
      return (
        <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#4285F4"/>
          <text x="12" y="16" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">G</text>
        </svg>
      );
    case "logo":
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