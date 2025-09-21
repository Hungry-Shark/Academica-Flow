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
import { getOrgTimetable, raiseTimetableQuery, getOrganizationByToken, publishTimetable } from '../firebase';

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
  const [isPublished, setIsPublished] = useState(false);
  const [organizationName, setOrganizationName] = useState<string>('');
  const timetableRef = useRef<HTMLDivElement>(null);

  // Load organization timetable for all users based on organization token
  useEffect(() => {
    const loadOrg = async () => {
      if (!user.organizationToken) return;
      
      try {
        // Get organization details
        const organization = await getOrganizationByToken(user.organizationToken);
        if (organization) {
          setOrganizationName(organization.name);
          setIsPublished(organization.isPublished || false);
          
          // Only show timetable if published (for students/faculty) or if user is admin
          if (user.role === 'admin' || organization.isPublished) {
            const data = await getOrgTimetable(user.organizationToken);
            setTimetableData(data);
          } else {
            setTimetableData(null);
          }
        }
      } catch (error) {
        console.error('Error loading organization data:', error);
      }
    };
    loadOrg();
  }, [user.organizationToken, user.role]);

  // Refresh timetable data when component becomes visible (for when returning from GenerateTT)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user.organizationToken) {
        const loadOrg = async () => {
          try {
            const organization = await getOrganizationByToken(user.organizationToken);
            if (organization) {
              setOrganizationName(organization.name);
              setIsPublished(organization.isPublished || false);
              
              if (user.role === 'admin' || organization.isPublished) {
                const data = await getOrgTimetable(user.organizationToken);
                setTimetableData(data);
              }
            }
          } catch (error) {
            console.error('Error refreshing organization data:', error);
          }
        };
        loadOrg();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user.organizationToken, user.role]);

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

  const handleRefreshTimetable = async () => {
    if (!user.organizationToken) return;
    try {
      const organization = await getOrganizationByToken(user.organizationToken);
      if (organization) {
        setIsPublished(organization.isPublished || false);
        if (user.role === 'admin' || organization.isPublished) {
          const data = await getOrgTimetable(user.organizationToken);
          setTimetableData(data);
        }
      }
    } catch (error) {
      console.error('Error refreshing timetable:', error);
    }
  };

  const handlePublishTimetable = async () => {
    if (!user.organizationToken || user.role !== 'admin') return;
    
    try {
      await publishTimetable(user.organizationToken);
      setIsPublished(true);
      alert('Timetable published successfully! Students and faculty can now view it.');
    } catch (error) {
      console.error('Error publishing timetable:', error);
      alert('Failed to publish timetable. Please try again.');
    }
  };


  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64">
        <Sidebar user={user} onLogout={onLogout} isOpen={isSidebarOpen} setOpen={setSidebarOpen} onNavigate={onNavigate} />
      </div>
      <main className="flex-1 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 lg:ml-64 overflow-y-auto">
        <div className="lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md text-black bg-white border border-black">
            <Icon name="menu" className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col gap-4 lg:gap-6 flex-1 min-h-0">
          {/* Organization Status Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-black">{organizationName || 'Organization'} - Timetable Status</h2>
                <p className="text-sm text-gray-600">Organization Token: {user.organizationToken || 'Not set'}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isPublished 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isPublished ? 'Published' : 'Draft'}
                </div>
                {user.role === 'admin' && timetableData && !isPublished && (
                  <button 
                    onClick={handlePublishTimetable}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    Publish Timetable
                  </button>
                )}
              </div>
            </div>
            {!isPublished && user.role !== 'admin' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Icon name="clock" className="w-5 h-5 text-yellow-600" />
                  <p className="text-yellow-800 font-medium">Timetable Not Published Yet</p>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  The admin is still working on the timetable. It will appear here once published.
                </p>
              </div>
            )}
            {!timetableData && user.role === 'admin' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Icon name="info" className="w-5 h-5 text-blue-600" />
                  <p className="text-blue-800 font-medium">No Timetable Generated</p>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  Go to "Generate Timetable" to create your organization's timetable using AI.
                </p>
              </div>
            )}
          </div>
          {/* Main Timetable Layout (read-only) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 flex-1 min-h-0">
            <div className="lg:col-span-4 min-h-0 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-black">
                  {user.role === 'admin' ? 'Organization Timetable' : 'Your Timetable'}
                  {isPublished && user.role !== 'admin' && (
                    <span className="ml-2 text-sm text-green-600 font-normal">• Published</span>
                  )}
                </h2>
                <div className="flex space-x-2">
                  {isAdmin && (
                    <button 
                      onClick={handleRefreshTimetable} 
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                      <Icon name="refresh" className="w-4 h-4" />
                      <span>Refresh</span>
                    </button>
                  )}
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
              <div ref={timetableRef} className="flex-1 min-h-0 relative">
                <Timetable 
                  data={timetableData} 
                  collegeName={organizationName || "RAJKIYA ENGINEERING COLLEGE, SONBHARDRA"}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};