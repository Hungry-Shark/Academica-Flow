import React from 'react';
import { Icon } from './Icons';

export const Footer: React.FC = () => {
  return (
    <footer className="relative border-t border-white/20 bg-black text-white shadow-[0_-8px_32px_rgba(31,38,135,0.08)]">
      {/* Extended gradient background with glassmorphism */}
      <div className="pointer-events-none absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-sm"></div>
      
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Icon name="logo" className="w-6 h-6 text-white" />
            <span className="font-bold">Academica Flow</span>
          </div>
          <p className="text-sm text-white/70">AI-powered academic scheduling for students, faculty, and administrators.</p>
        </div>
        <div>
          <div className="font-semibold mb-3">Product</div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2 hover:text-white transition-colors"><Icon name="calendar" className="w-4 h-4 text-white" /><span>Smart Timetables</span></li>
            <li className="flex items-center space-x-2 hover:text-white transition-colors"><Icon name="users" className="w-4 h-4 text-white" /><span>Role-based Access</span></li>
            <li className="flex items-center space-x-2 hover:text-white transition-colors"><Icon name="tools" className="w-4 h-4 text-white" /><span>Easy Management</span></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Company</div>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-white transition-colors">About</li>
            <li className="hover:text-white transition-colors">Contact</li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Connect</div>
          <div className="flex space-x-4">
            <a href="#" aria-label="Twitter" className="hover:opacity-80 transition-opacity"><Icon name="twitter" className="w-5 h-5 text-white" /></a>
            <a href="#" aria-label="GitHub" className="hover:opacity-80 transition-opacity"><Icon name="github" className="w-5 h-5 text-white" /></a>
            <a href="#" aria-label="LinkedIn" className="hover:opacity-80 transition-opacity"><Icon name="linkedin" className="w-5 h-5 text-white" /></a>
          </div>
          <div className="mt-4 text-sm flex items-center space-x-2">
            <Icon name="mail" className="w-4 h-4 text-white" />
            <a href="mailto:support@academicaflow.app" className="hover:underline">support@academicaflow.app</a>
          </div>
        </div>
      </div>
      <div className="text-center text-xs text-white/60 py-4">© {new Date().getFullYear()} Academica Flow. All rights reserved.</div>
    </footer>
  );
}; 