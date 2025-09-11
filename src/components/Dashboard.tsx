// FIX: Create the Dashboard component and implement Gemini API call
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import jsPDF from 'jspdf';
import { default as autoTable } from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Sidebar } from './Sidebar';
import { Chat } from './Chat';
import { Timetable } from './Timetable';
import { UserProfile, ChatMessage, TimetableData } from '../types';
// FIX: Import the Icon component to resolve the 'Cannot find name' error.
import { Icon } from './Icons';
import { getFirebaseAuth } from '../firebase';
import { getOrgTimetable, setOrgTimetable, raiseTimetableQuery } from '../firebase';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
  isAdmin?: boolean;
  onNavigate: (view: 'DASHBOARD' | 'PROFILE_EDIT' | 'GENERATE_TT' | 'ADMIN_INFO') => void;
}

const ai = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY!);


export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, isAdmin, onNavigate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'model', text: isAdmin
      ? `Hi ${user.name}! You can generate a course timetable for students. Use the chat to create a new timetable.`
      : `Hi ${user.name}! You can view your timetable here once it is finalized by the administrator.` }
  ]);
  const [timetableData, setTimetableData] = useState<TimetableData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'timetable'>('timetable');
  const timetableRef = useRef<HTMLDivElement>(null);

  // Load organization timetable for non-admin users based on college
  useEffect(() => {
    const loadOrg = async () => {
      if (isAdmin) return;
      const data = await getOrgTimetable(user.college);
      setTimetableData(data);
    };
    loadOrg();
  }, [isAdmin, user.college]);

  // Only admins can generate timetables
  const handleSendMessage = async (message: string) => {
    if (!isAdmin) return;
    setIsLoading(true);
    const userMessage: ChatMessage = { sender: 'user', text: message };
    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await ai.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json"
        }
      }).generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `You are a university timetable generator. Create a JSON timetable based on the user's request. Take into account their preferences. Make the schedule realistic and avoid clashes.
        USER_PREFERENCES: ${user.preferences || 'none'}
        
        PROMPT: ${message}`
          }]
        }]
      });

      const timetableJsonString = result.response.text();
      try {
        const parsedData: TimetableData = JSON.parse(timetableJsonString);
        setTimetableData(parsedData);
        setMessages(prev => [...prev, { sender: 'model', text: "Here is your generated timetable. Let me know if you'd like any adjustments." }]);
        // Save to organization collection if admin has college set
        if (user.college) {
          await setOrgTimetable(user.college, parsedData);
        }
      } catch (e) {
        console.error("Failed to parse timetable JSON:", e, "Received:", timetableJsonString);
        setMessages(prev => [...prev, { sender: 'model', text: "I had trouble structuring the timetable. Could you try rephrasing your request?" }]);
      }
    } catch (error) {
      console.error("Error generating timetable:", error);
      setMessages(prev => [...prev, { sender: 'model', text: "Sorry, I encountered an error while generating the timetable. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!timetableRef.current) return;
    
    const doc = new jsPDF({ orientation: 'landscape' });
    const tableElement = timetableRef.current.querySelector('table');

    if (tableElement) {
        autoTable(doc, { 
            html: tableElement,
            theme: 'grid',
            headStyles: { fillColor: '#000000', textColor: '#ffffff' },
        });
        doc.save('timetable.pdf');
    } else {
        alert("Could not find timetable data to export.");
    }
  };

  const handleDownloadImage = () => {
    if (!timetableRef.current) return;

    html2canvas(timetableRef.current, { scale: 2 }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'timetable.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const handleRaiseQuery = async () => {
    const message = prompt('Describe the problem you found with the timetable:');
    if (!message) return;
    const auth = getFirebaseAuth();
    if (!auth.currentUser) return;
    await raiseTimetableQuery(auth.currentUser.uid, message);
    alert('Your query has been submitted to the admin.');
  };


  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} onLogout={onLogout} isOpen={isSidebarOpen} setOpen={setSidebarOpen} onNavigate={onNavigate} />
      <main className="flex-1 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6">
        <div className="lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md text-black bg-white border border-black">
            <Icon name="menu" className="w-6 h-6" />
          </button>
        </div>
        

        <div className="flex flex-col gap-4 lg:gap-6 flex-1 min-h-0">
          {/* Generated Timetables by Branch and Year Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-black">Generated Timetables by Branch & Year</h2>
              <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">All Branches</option>
                <option value="cse">Computer Science</option>
                <option value="ece">Electronics & Communication</option>
                <option value="me">Mechanical Engineering</option>
                <option value="ce">Civil Engineering</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="font-semibold text-black">CSE - 1st Year</h3>
                <p className="text-sm text-gray-600">Section A & B</p>
                <p className="text-xs text-gray-500 mt-1">Last updated: 2 hours ago</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="font-semibold text-black">CSE - 2nd Year</h3>
                <p className="text-sm text-gray-600">Section A & B</p>
                <p className="text-xs text-gray-500 mt-1">Last updated: 1 day ago</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="font-semibold text-black">ECE - 1st Year</h3>
                <p className="text-sm text-gray-600">Section A</p>
                <p className="text-xs text-gray-500 mt-1">Last updated: 3 hours ago</p>
              </div>
            </div>
          </div>

          {/* Main Timetable and Chat Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 flex-1 min-h-0">
            <div className="lg:col-span-3 min-h-0 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-black">{isAdmin ? 'Current Timetable' : 'Your Timetable'}</h2>
                <div className="flex space-x-2">
                  {!isAdmin && (
                    <button onClick={handleRaiseQuery} className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-black rounded-md text-black hover:bg-black/5 transition">
                      <Icon name="mail" className="w-4 h-4" />
                      <span>Raise query</span>
                    </button>
                  )}
                  <button
                    onClick={handleDownloadPdf}
                    disabled={!timetableData}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-black rounded-md text-black hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Icon name="download" className="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={handleDownloadImage}
                    disabled={!timetableData}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-black rounded-md text-black hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Icon name="image" className="w-4 h-4" />
                    <span>Image</span>
                  </button>
                </div>
              </div>
              <div ref={timetableRef} className="flex-1 min-h-0">
                <Timetable data={timetableData} />
              </div>
            </div>
            
            {/* Compact Timetable Assistant */}
            <div className="min-h-0 max-h-80 lg:max-h-96">
              {isAdmin ? (
                <div className="h-full">
                  <Chat
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    title="Assistant"
                    placeholder="Generate timetable..."
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-black/60 bg-gray-50 rounded-lg p-4">
                  <Icon name="spinner" className="w-6 h-6 mb-2 animate-spin" />
                  <span className="text-sm text-center">{timetableData ? 'Latest timetable loaded.' : 'Waiting for admin to finalize timetable.'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};