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
          {/* Hero Image with floating animation - positioned behind text */}
          <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 opacity-75 z-0">
            <img 
              src="/images/hero.png" 
              alt="Academic success" 
              className="w-full h-full object-contain animate-float-slow hero-image"
              style={{ 
                filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.15))',
                animationDelay: '0s'
              }}
            />
          </div>
          
          {/* Hero2 Image with floating animation - positioned behind text */}
          <div className="absolute top-0 right-0 w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-88 lg:h-88 opacity-70 z-0">
            <img 
              src="/images/hero2.png" 
              alt="Academic collaboration" 
              className="w-full h-full object-contain animate-float-medium hero-image"
              style={{ 
                filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.15))',
                animationDelay: '1.5s'
              }}
            />
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 relative z-10 px-4">Welcome to Academica Flow</h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 max-w-2xl relative z-10 px-4">
            Streamline your academic journey with intelligent timetable management. 
            Built for students, faculty, and administrators.
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-4xl w-full px-4">
            <div className="p-4 sm:p-6 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                <Icon name="calendar" className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">Smart Timetables</h3>
              <p className="text-sm sm:text-base text-gray-600 text-center">AI-powered timetable generation that considers preferences and constraints.</p>
            </div>
            <div className="p-4 sm:p-6 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                <Icon name="users" className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">Role-Based Access</h3>
              <p className="text-sm sm:text-base text-gray-600 text-center">Different interfaces for students, faculty, and administrators.</p>
            </div>
            <div className="p-4 sm:p-6 border border-gray-200 rounded-lg sm:col-span-2 lg:col-span-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                <Icon name="tools" className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">Easy Management</h3>
              <p className="text-sm sm:text-base text-gray-600 text-center">Intuitive tools for managing courses, rooms, and schedules.</p>
            </div>
          </div>
        </div>

        <section id="about" className="py-12 sm:py-16 lg:py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-8 sm:mb-12 text-center">About Academica Flow</h2>
            
            {/* Problem Section */}
            <div className="mb-12 sm:mb-16 relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                <div className="order-2 lg:order-1 relative z-10">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">The Timetable Creation Struggle</h3>
                  <div className="space-y-3 sm:space-y-4 text-sm sm:text-base lg:text-lg text-gray-600">
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
                  <div className="w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 relative z-0">
                    <img 
                      src="/images/about1.png" 
                      alt="Overwhelmed administrator" 
                      className="w-full h-full object-contain transform -rotate-6 animate-float-medium about-image"
                      style={{ 
                        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))',
                        animationDelay: '1s'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Solution Section */}
            <div className="relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                <div className="flex justify-center">
                  <div className="w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 relative z-0">
                    <img 
                      src="/images/about2.png" 
                      alt="AI-powered solution" 
                      className="w-full h-full object-contain transform rotate-6 animate-float-slow about-image"
                      style={{ 
                        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))',
                        animationDelay: '2s'
                      }}
                    />
                  </div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">Our AI-Powered Solution</h3>
                  <div className="space-y-3 sm:space-y-4 text-sm sm:text-base lg:text-lg text-gray-600">
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

        <section id="contact" className="py-12 sm:py-16 lg:py-20 px-4 bg-gray-50">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8">Get in Touch</h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
              Ready to transform your academic scheduling? Contact us to learn more about 
              implementing Academica Flow in your institution.
            </p>
            <button
              onClick={() => setShowQueryForm(true)}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-black text-white rounded-lg text-base sm:text-lg font-semibold hover:bg-gray-800 transition-colors duration-300"
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