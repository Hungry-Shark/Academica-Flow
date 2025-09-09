// FIX: Create the Dashboard component and implement Gemini API call
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import jsPDF from 'jspdf';
import { default as autoTable } from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Sidebar } from './Sidebar';
import { Chat } from './Chat';
import { Timetable } from './Timetable';
import { UserProfile, ChatMessage, TimetableData } from '../types';
// FIX: Import the Icon component to resolve the 'Cannot find name' error.
import { Icon } from './Icons';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
  isAdmin?: boolean;
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });

const slotSchema = {
    type: Type.OBJECT, 
    properties: { 
        courseName: {type: Type.STRING, description: "Name of the course"}, 
        facultyName: {type: Type.STRING, description: "Name of the faculty member teaching"}, 
        room: {type: Type.STRING, description: "Room or lab number"}
    },
    required: ["courseName", "facultyName", "room"]
};

const daySchema = {
    type: Type.OBJECT,
    properties: {
        "09:00-10:00": slotSchema,
        "10:00-11:00": slotSchema,
        "11:00-12:00": slotSchema,
        "12:00-13:00": slotSchema,
        "13:00-14:00": slotSchema,
        "14:00-15:00": slotSchema,
        "15:00-16:00": slotSchema,
        "16:00-17:00": slotSchema,
    },
    description: "A map of time slots to class details. Omit any time slots that are empty."
};

const saturdaySchema = {
    type: Type.OBJECT,
    properties: {
        "09:00-10:00": slotSchema,
        "10:00-11:00": slotSchema,
        "11:00-12:00": slotSchema,
        "12:00-13:00": slotSchema,
        "13:00-14:00": slotSchema,
    },
    description: "A map of time slots to class details for Saturday. Omit any time slots that are empty."
};


const timetableSchema = {
    type: Type.OBJECT,
    properties: {
        Monday: daySchema,
        Tuesday: daySchema,
        Wednesday: daySchema,
        Thursday: daySchema,
        Friday: daySchema,
        Saturday: saturdaySchema,
    },
    description: "The complete weekly timetable. Omit any days that have no classes."
};

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, isAdmin }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'model', text: isAdmin
      ? `Hi ${user.name}! You can generate a course timetable for students. Use the chat to create a new timetable.`
      : `Hi ${user.name}! You can view your timetable here once it is finalized by the administrator.` }
  ]);
  const [timetableData, setTimetableData] = useState<TimetableData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const timetableRef = useRef<HTMLDivElement>(null);

  // Only admins can generate timetables
  const handleSendMessage = async (message: string) => {
    if (!isAdmin) return;
    setIsLoading(true);
    const userMessage: ChatMessage = { sender: 'user', text: message };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a university timetable generator. Create a JSON timetable based on the user's request. Take into account their preferences. Make the schedule realistic and avoid clashes.
        USER_PREFERENCES: ${user.preferences || 'none'}
        
        PROMPT: ${message}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: timetableSchema,
        },
      });

      const timetableJsonString = response.text;
      try {
        const parsedData: TimetableData = JSON.parse(timetableJsonString);
        setTimetableData(parsedData);
        setMessages(prev => [...prev, { sender: 'model', text: "Here is your generated timetable. Let me know if you'd like any adjustments." }]);
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

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} onLogout={onLogout} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <main className="flex-1 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6">
        <div className="lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md text-black bg-white border border-black">
            <Icon name="menu" className="w-6 h-6" />
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 flex-1 min-h-0">
          <div className="lg:col-span-2 min-h-0 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-black">{isAdmin ? 'Generated Timetable' : 'Your Timetable'}</h2>
              <div className="flex space-x-2">
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
          <div className="min-h-0">
            {isAdmin ? (
              <Chat
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                title="Timetable Assistant"
                placeholder="e.g., Generate a timetable for a CS student"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-black/60">
                <Icon name="spinner" className="w-8 h-8 mb-2 animate-spin" />
                <span>Waiting for administrator to finalize your timetable.</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
