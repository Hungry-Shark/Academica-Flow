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
                  <button onClick={() => { closeMenu(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }} className="cursor-pointer">
                    <a href="#" className="text-4xl text-white no-underline font-semibold transition-colors duration-300 hover:text-gray-400 font-wakanda">
                      Contact
                    </a>
                  </button>
                </li>
                <li className={`my-5 transition-all duration-400 ease-in-out ${
                  isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0' 
                }`} style={{ transitionDelay: isMenuOpen ? '0.6s' : '0s' }}>
                  <button onClick={() => { closeMenu(); onLogout && onLogout(); }} className="cursor-pointer">
                    <a href="#" className="text-4xl text-white no-underline font-semibold transition-colors duration-300 hover:text-red-400 font-wakanda">
                      Logout
                    </a>
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className={`my-5 transition-all duration-400 ease-in-out ${
                  isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0' 
                }`} style={{ transitionDelay: isMenuOpen ? '0.4s' : '0s' }}>
                  <button onClick={() => { closeMenu(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }} className="cursor-pointer">
                    <a href="#" className="text-4xl text-white no-underline font-semibold transition-colors duration-300 hover:text-gray-400 font-wakanda">
                      Contact
                    </a>
                  </button>
                </li>
                <li className={`my-5 transition-all duration-400 ease-in-out ${
                  isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0' 
                }`} style={{ transitionDelay: isMenuOpen ? '0.5s' : '0s' }}>
                  <button onClick={() => { closeMenu(); onNavigateToLogin(); }} className="cursor-pointer">
                    <a href="#" className="text-4xl text-white no-underline font-semibold transition-colors duration-300 hover:text-gray-400 font-wakanda">
                      Login
                    </a>
                  </button>
                </li>
              </>
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

            {/* NEP 2020 Integration Section */}
            <div className="mt-16 relative py-12 bg-white">
              <div className="max-w-6xl mx-auto px-4">
                <h3 className="text-4xl lg:text-5xl font-bold mb-12 text-center text-black">
                  NEP 2020 Policy Implementation
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
                  <div className="bg-white p-8 border border-black transition-all duration-300">
                    <h4 className="text-2xl font-semibold mb-2 text-black text-center">Policy Highlights</h4>
                    <hr className="border-t border-gray-300 mb-8" />
                    <div className="space-y-6">
                      <div className="group cursor-pointer">
                        <div className="flex items-center text-lg text-black group-hover:text-black transition-all duration-300 pb-2">
                          <span>5+3+3+4 academic structure support</span>
                          <svg className="w-5 h-5 ml-2 transform group-hover:rotate-180 transition-transform duration-500 ease-in-out" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="overflow-hidden transition-all duration-500 ease-in-out max-h-0 group-hover:max-h-32">
                          <p className="text-gray-800 mt-3 pl-4 text-base opacity-0 group-hover:opacity-100 transition-opacity duration-500 pb-2">
                            Supports the new pedagogical and curricular restructuring from Foundational to Secondary stages, ensuring holistic development at each level.
                          </p>
                        </div>
                      </div>
                      
                      <div className="group cursor-pointer">
                        <div className="flex items-center text-lg text-gray-800 hover:text-blue-500 transition-colors duration-200">
                          <span>Choice-based credit system (CBCS)</span>
                          <svg className="w-5 h-5 ml-2 transform group-hover:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="overflow-hidden transition-all duration-200 max-h-0 group-hover:max-h-96">
                          <p className="text-gray-600 mt-2 pl-4">
                            Enables students to choose their learning paths, combining core and elective courses across disciplines for a personalized education journey.
                          </p>
                        </div>
                      </div>

                      <div className="group cursor-pointer">
                        <div className="flex items-center text-lg text-gray-800 hover:text-blue-500 transition-colors duration-200">
                          <span>Flexible multidisciplinary course enrollment</span>
                          <svg className="w-5 h-5 ml-2 transform group-hover:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="overflow-hidden transition-all duration-200 max-h-0 group-hover:max-h-96">
                          <p className="text-gray-600 mt-2 pl-4">
                            Students can enroll in courses across different disciplines, promoting a multidisciplinary approach to education and skill development.
                          </p>
                        </div>
                      </div>

                      <div className="group cursor-pointer">
                        <div className="flex items-center text-lg text-gray-800 hover:text-blue-500 transition-colors duration-200">
                          <span>Mother tongue/local language integration</span>
                          <svg className="w-5 h-5 ml-2 transform group-hover:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="overflow-hidden transition-all duration-200 max-h-0 group-hover:max-h-96">
                          <p className="text-gray-600 mt-2 pl-4">
                            Supports scheduling of courses in regional languages and mother tongue, promoting better understanding and cultural connection.
                          </p>
                        </div>
                      </div>

                      <div className="group cursor-pointer">
                        <div className="flex items-center text-lg text-gray-800 hover:text-blue-500 transition-colors duration-200">
                          <span>Multiple entry/exit points</span>
                          <svg className="w-5 h-5 ml-2 transform group-hover:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="overflow-hidden transition-all duration-200 max-h-0 group-hover:max-h-96">
                          <p className="text-gray-600 mt-2 pl-4">
                            Facilitates flexible program completion with multiple entry and exit options, allowing students to pause and resume their education as needed.
                          </p>
                        </div>
                      </div>

                      <div className="group cursor-pointer">
                        <div className="flex items-center text-lg text-gray-800 hover:text-blue-500 transition-colors duration-200">
                          <span>Project work and internship scheduling</span>
                          <svg className="w-5 h-5 ml-2 transform group-hover:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="overflow-hidden transition-all duration-200 max-h-0 group-hover:max-h-96">
                          <p className="text-gray-600 mt-2 pl-4">
                            Integrates practical experience through projects and internships into the academic schedule, ensuring hands-on learning opportunities.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 border border-black transition-all duration-300">
                    <h4 className="text-2xl font-semibold mb-2 text-black text-center">Our Implementation</h4>
                    <hr className="border-t border-gray-300 mb-8" />
                    <div className="space-y-6">
                      <div className="group cursor-pointer">
                        <div className="flex items-center text-lg text-black group-hover:text-black transition-all duration-300 pb-2">
                          <span>Dynamic multidisciplinary timetables</span>
                          <svg className="w-5 h-5 ml-2 transform group-hover:rotate-180 transition-transform duration-500 ease-in-out" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="overflow-hidden transition-all duration-500 ease-in-out max-h-0 group-hover:max-h-32">
                          <p className="text-gray-800 mt-3 pl-4 text-base opacity-0 group-hover:opacity-100 transition-opacity duration-500 pb-2">
                            AI-powered scheduling system that automatically creates conflict-free timetables across multiple disciplines and departments.
                          </p>
                        </div>
                      </div>

                      <div className="group cursor-pointer">
                        <div className="flex items-center text-lg text-gray-800 hover:text-green-500 transition-colors duration-200">
                          <span>Automated credit tracking system</span>
                          <svg className="w-5 h-5 ml-2 transform group-hover:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="overflow-hidden transition-all duration-200 max-h-0 group-hover:max-h-96">
                          <p className="text-gray-600 mt-2 pl-4">
                            Intelligent system that tracks and manages credits across different courses and programs, ensuring compliance with degree requirements.
                          </p>
                        </div>
                      </div>

                      <div className="group cursor-pointer">
                        <div className="flex items-center text-lg text-gray-800 hover:text-green-500 transition-colors duration-200">
                          <span>Cross-departmental enrollment support</span>
                          <svg className="w-5 h-5 ml-2 transform group-hover:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="overflow-hidden transition-all duration-200 max-h-0 group-hover:max-h-96">
                          <p className="text-gray-600 mt-2 pl-4">
                            Seamless enrollment process for courses across different departments, with automatic conflict resolution and capacity management.
                          </p>
                        </div>
                      </div>

                      <div className="group cursor-pointer">
                        <div className="flex items-center text-lg text-gray-800 hover:text-green-500 transition-colors duration-200">
                          <span>Flexible scheduling for multiple programs</span>
                          <svg className="w-5 h-5 ml-2 transform group-hover:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="overflow-hidden transition-all duration-200 max-h-0 group-hover:max-h-96">
                          <p className="text-gray-600 mt-2 pl-4">
                            Adaptive scheduling system that accommodates multiple program requirements while maintaining flexibility for student choices.
                          </p>
                        </div>
                      </div>

                      <div className="group cursor-pointer">
                        <div className="flex items-center text-lg text-gray-800 hover:text-green-500 transition-colors duration-200">
                          <span>Real-time course mapping</span>
                          <svg className="w-5 h-5 ml-2 transform group-hover:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="overflow-hidden transition-all duration-200 max-h-0 group-hover:max-h-96">
                          <p className="text-gray-600 mt-2 pl-4">
                            Dynamic visualization of course relationships and prerequisites, helping students plan their academic journey effectively.
                          </p>
                        </div>
                      </div>

                      <div className="group cursor-pointer">
                        <div className="flex items-center text-lg text-gray-800 hover:text-green-500 transition-colors duration-200">
                          <span>Comprehensive progress tracking</span>
                          <svg className="w-5 h-5 ml-2 transform group-hover:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="overflow-hidden transition-all duration-200 max-h-0 group-hover:max-h-96">
                          <p className="text-gray-600 mt-2 pl-4">
                            Detailed tracking of academic progress, credit accumulation, and completion status across multiple programs and disciplines.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-12 sm:py-16 lg:py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Text Content */}
              <div className="lg:w-1/2 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8">Get in Touch</h2>
                <p className="text-base sm:text-lg text-gray-800 mb-6 sm:mb-8">
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
              
              {/* Image */}
              <div className="lg:w-1/2 flex justify-center lg:justify-end">
                <div className="w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 relative">
                  <img 
                    src="/images/contact.png" 
                    alt="Contact us illustration" 
                    className="w-full h-full object-contain animate-float-slow"
                    style={{ 
                      filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.1))',
                      animationDelay: '0.5s'
                    }}
                  />
                </div>
              </div>
            </div>
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