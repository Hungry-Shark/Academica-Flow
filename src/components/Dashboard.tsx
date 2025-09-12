// FIX: Create the Dashboard component and implement Gemini API call
import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import { default as autoTable } from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Sidebar } from './Sidebar';
import { Timetable } from './Timetable';
import { UserProfile, ChatMessage, TimetableData } from '../types';
// FIX: Import the Icon component to resolve the 'Cannot find name' error.
import { Icon } from './Icons';
import { getFirebaseAuth } from '../firebase';
import { getOrgTimetable, raiseTimetableQuery } from '../firebase';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
  isAdmin?: boolean;
  onNavigate: (view: 'DASHBOARD' | 'PROFILE_EDIT' | 'GENERATE_TT' | 'ADMIN_INFO') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, isAdmin, onNavigate }) => {
  const [timetableData, setTimetableData] = useState<TimetableData | null>(null);
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

          {/* Main Timetable Layout (read-only) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 flex-1 min-h-0">
            <div className="lg:col-span-4 min-h-0 flex flex-col gap-4">
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
          </div>
        </div>
      </main>
    </div>
  );
};