import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import jsPDF from 'jspdf';
import { default as autoTable } from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Sidebar } from './Sidebar';
import { Chat } from './Chat';
import { Timetable } from './Timetable';
import { UserProfile, ChatMessage, TimetableData } from '../types';
import { Icon } from './Icons';
import { setOrgTimetable } from '../firebase';

interface GenerateTTProps {
  user: UserProfile;
  onLogout: () => void;
  onNavigate: (view: 'DASHBOARD' | 'PROFILE_EDIT' | 'GENERATE_TT' | 'ADMIN_INFO') => void;
}

const ai = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY!);

const slotSchema = {
    type: "OBJECT", 
    properties: { 
        courseName: {type: "STRING", description: "Name of the course"}, 
        facultyName: {type: "STRING", description: "Name of the faculty member teaching"}, 
        room: {type: "STRING", description: "Room or lab number"}
    },
    required: ["courseName", "facultyName", "room"]
};

const daySchema = {
    type: "OBJECT",
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
    type: "OBJECT",
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
    type: "OBJECT",
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

export const GenerateTT: React.FC<GenerateTTProps> = ({ user, onLogout, onNavigate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'model', text: `Hi ${user.name}! Generate a timetable for your organization. Use the chat to create a new timetable.` }
  ]);
  const [timetableData, setTimetableData] = useState<TimetableData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<TimetableData | null>(null);
  const timetableRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    const userMessage: ChatMessage = { sender: 'user', text: message };
    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await ai.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: timetableSchema,
        }
      }).generateContent({
        contents: [{
          parts: [`You are a university timetable generator. Create a JSON timetable based on the user's request. Take into account their preferences. Make the schedule realistic and avoid clashes.
        USER_PREFERENCES: ${user.preferences || 'none'}
        
        PROMPT: ${message}`]
        }]
      });

      const timetableJsonString = result.response.text();
      try {
        const parsedData: TimetableData = JSON.parse(timetableJsonString);
        setTimetableData(parsedData);
        setEditData(parsedData);
        setMessages(prev => [...prev, { sender: 'model', text: "Here is your generated timetable. You can preview it, edit it, or generate a new one." }]);
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

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(timetableData);
  };

  const handleSaveEdit = () => {
    if (editData) {
      setTimetableData(editData);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData(timetableData);
    setIsEditing(false);
  };

  const handlePublish = async () => {
    if (!timetableData || !user.college) {
      alert('Please generate a timetable and ensure your college is set in your profile.');
      return;
    }
    await setOrgTimetable(user.college, timetableData);
    alert('Timetable published successfully!');
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
      <Sidebar user={user} onLogout={onLogout} isOpen={isSidebarOpen} setOpen={setSidebarOpen} onNavigate={onNavigate} />
      <main className="flex-1 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6">
        <div className="lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md text-black bg-white border border-black">
            <Icon name="menu" className="w-6 h-6" />
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 flex-1 min-h-0">
          <div className="lg:col-span-2 min-h-0 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-black">Generate Timetable</h2>
              <div className="flex space-x-2">
                {timetableData && !isEditing && (
                  <>
                    <button
                      onClick={handleEdit}
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-white border border-black rounded-md text-black hover:bg-black/5 transition"
                    >
                      <Icon name="edit" className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={handlePublish}
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-black text-white rounded-md hover:bg-black/80 transition"
                    >
                      <Icon name="save" className="w-4 h-4" />
                      <span>Publish</span>
                    </button>
                  </>
                )}
                {isEditing && (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                    >
                      <Icon name="save" className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                    >
                      <Icon name="close" className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </>
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
              <Timetable data={isEditing ? editData : timetableData} />
            </div>
          </div>
          <div className="min-h-0">
            <Chat
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              title="Timetable Generator"
              placeholder="e.g., Generate a timetable for Computer Science students"
            />
          </div>
        </div>
      </main>
    </div>
  );
};
