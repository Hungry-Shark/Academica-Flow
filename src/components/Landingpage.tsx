import React, { useState } from 'react';
import { Icon } from './Icons';
import { QueryForm } from './QueryForm';
import { submitUserQuery } from '../firebase';

import { AppView } from '../types';
import { Footer } from './Footer';
import { Header } from './Header';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  setAppView: (view: AppView) => void;
  isAuthenticated?: boolean;
  onProfileClick?: () => void;
  onLogout?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, setAppView, isAuthenticated = false, onProfileClick, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showQueryForm, setShowQueryForm] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleQuerySubmit = async (queryData: { name: string; email: string; subject: string; message: string }) => {
    await submitUserQuery(queryData);
  };

  return (
    <div className="font-['Poppins'] bg-white text-black min-h-screen flex flex-col">
      <Header onLogoClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} onLoginClick={onNavigateToLogin} isAuthenticated={isAuthenticated} onProfileClick={onProfileClick} />

      {/* Menu Toggle */}
      <button
        onClick={toggleMenu}
        className="fixed top-6 right-6 z-[1001] cursor-pointer w-8 h-6 flex flex-col justify-between"
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
        <nav className="text-center">
          <ul className="list-none p-0 m-0">
            <li className={`my-5 transition-all duration-400 ease-in-out ${
              isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0' 
            }`} style={{ transitionDelay: isMenuOpen ? '0.3s' : '0s' }}>
              <button onClick={() => { closeMenu(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="cursor-pointer">
                <a href="#" className="text-4xl text-white no-underline font-semibold transition-colors duration-300 hover:text-gray-400 font-wakanda">
                  Home
                </a>
              </button>
            </li>
            {isAuthenticated ? (
              <>
                <li className={`my-5 transition-all duration-400 ease-in-out ${
                  isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0' 
                }`} style={{ transitionDelay: isMenuOpen ? '0.4s' : '0s' }}>
                  <button onClick={() => { closeMenu(); onProfileClick && onProfileClick(); }} className="cursor-pointer">
                    <a href="#" className="text-4xl text-white no-underline font-semibold transition-colors duration-300 hover:text-gray-400 font-wakanda">
                      Profile
                    </a>
                  </button>
                </li>
                <li className={`my-5 transition-all duration-400 ease-in-out ${
                  isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0' 
                }`} style={{ transitionDelay: isMenuOpen ? '0.5s' : '0s' }}>
                  <button onClick={() => { closeMenu(); onLogout && onLogout(); }} className="cursor-pointer">
                    <a href="#" className="text-4xl text-white no-underline font-semibold transition-colors duration-300 hover:text-red-400 font-wakanda">
                      Logout
                    </a>
                  </button>
                </li>
              </>
            ) : (
              <li className={`my-5 transition-all duration-400 ease-in-out ${
                isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0' 
              }`} style={{ transitionDelay: isMenuOpen ? '0.4s' : '0s' }}>
                <button onClick={() => { closeMenu(); onNavigateToLogin(); }} className="cursor-pointer">
                  <a href="#" className="text-4xl text-white no-underline font-semibold transition-colors duration-300 hover:text-gray-400 font-wakanda">
                    Login
                  </a>
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <main className="p-5 w-full box-border flex-1 pt-28">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 relative">
          {/* Hero Image with slant and floating animation */}
          <div className="absolute top-0 right-0 w-64 h-64 md:w-80 md:h-80 opacity-90">
            <img 
              src="/images/hero.png" 
              alt="Academic success" 
              className="w-full h-full object-contain transform rotate-12 animate-float-slow hero-image"
              style={{ 
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))',
                animationDelay: '0s'
              }}
            />
          </div>
          
          <h1 className="text-6xl font-bold mb-4 relative z-10">Welcome to Academica Flow</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl relative z-10">
            Streamline your academic journey with intelligent timetable management. 
            Built for students, faculty, and administrators.
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Icon name="calendar" className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Timetables</h3>
              <p className="text-gray-600">AI-powered timetable generation that considers preferences and constraints.</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Icon name="users" className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Role-Based Access</h3>
              <p className="text-gray-600">Different interfaces for students, faculty, and administrators.</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Icon name="tools" className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Management</h3>
              <p className="text-gray-600">Intuitive tools for managing courses, rooms, and schedules.</p>
            </div>
          </div>
        </div>

        <section id="about" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">About Academica Flow</h2>
            
            {/* Problem Section */}
            <div className="mb-16 relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1">
                  <h3 className="text-3xl font-bold mb-6 text-gray-800">The Timetable Creation Struggle</h3>
                  <div className="space-y-4 text-lg text-gray-600">
                    <p>
                      Creating academic timetables is a nightmare that every educational institution faces. 
                      Administrators spend countless hours juggling:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Faculty availability and preferences</li>
                      <li>Room capacity and equipment requirements</li>
                      <li>Student batch sizes and course conflicts</li>
                      <li>Resource allocation and scheduling constraints</li>
                      <li>Last-minute changes and emergency adjustments</li>
                    </ul>
                    <p>
                      This manual process is error-prone, time-consuming, and often results in conflicts 
                      that frustrate both students and faculty.
                    </p>
                  </div>
                </div>
                <div className="order-1 lg:order-2 flex justify-center">
                  <div className="w-80 h-80 relative">
                    <img 
                      src="/images/about1.png" 
                      alt="Overwhelmed administrator" 
                      className="w-full h-full object-contain transform -rotate-6 animate-float-medium about-image"
                      style={{ 
                        filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.15))',
                        animationDelay: '1s'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Solution Section */}
            <div className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="flex justify-center">
                  <div className="w-80 h-80 relative">
                    <img 
                      src="/images/about2.png" 
                      alt="AI-powered solution" 
                      className="w-full h-full object-contain transform rotate-6 animate-float-slow about-image"
                      style={{ 
                        filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.15))',
                        animationDelay: '2s'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-6 text-gray-800">Our AI-Powered Solution</h3>
                  <div className="space-y-4 text-lg text-gray-600">
                    <p>
                      Academica Flow revolutionizes timetable creation with intelligent automation that:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Instantly generates conflict-free schedules</li>
                      <li>Considers all constraints and preferences automatically</li>
                      <li>Adapts to real-time changes and updates</li>
                      <li>Provides role-based interfaces for different users</li>
                      <li>Offers comprehensive reporting and analytics</li>
                    </ul>
                    <p>
                      Our intelligent system ensures optimal resource utilization while maintaining 
                      flexibility for all stakeholders, transforming a week-long nightmare into 
                      a matter of minutes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-20 px-4 bg-gray-50">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">Get in Touch</h2>
            <p className="text-lg text-gray-600 mb-8">
              Ready to transform your academic scheduling? Contact us to learn more about 
              implementing Academica Flow in your institution.
            </p>
            <button
              onClick={() => setShowQueryForm(true)}
              className="px-8 py-4 bg-black text-white rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors duration-300"
            >
              Any Questions?
            </button>
          </div>
        </section>

      </main>

      <Footer />

      {/* Query Form Modal */}
      {showQueryForm && (
        <QueryForm
          isAuthenticated={isAuthenticated}
          onClose={() => setShowQueryForm(false)}
          onNavigateToLogin={onNavigateToLogin}
          onSubmitQuery={handleQuerySubmit}
        />
      )}
    </div>
  );
}; 