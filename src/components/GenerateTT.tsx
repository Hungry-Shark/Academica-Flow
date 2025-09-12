import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import jsPDF from 'jspdf';
import { default as autoTable } from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Sidebar } from './Sidebar';
import { Chat } from './Chat';
import { Timetable } from './Timetable';
import { UserProfile, ChatMessage, TimetableData, AdministrativeData, TimetableSlot } from '../types';
import { Icon } from './Icons';
import { setOrgTimetable, getAdministrativeData, getOrgTimetable } from '../firebase';

interface GenerateTTProps {
  user: UserProfile;
  onLogout: () => void;
  onNavigate: (view: 'DASHBOARD' | 'PROFILE_EDIT' | 'GENERATE_TT' | 'ADMIN_INFO') => void;
}

const ai = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY!);

const slotSchema = {
    type: "OBJECT", 
    properties: { 
        courseName: {type: "STRING", description: "Course code like BCS701, BOE070, BCS753, etc."}, 
        facultyName: {type: "STRING", description: "Faculty initials like (NU), (AKT), (VT), etc."}, 
        room: {type: "STRING", description: "Room or lab like AB2-CC, AB2/T6, etc."}
    },
    required: ["courseName", "facultyName", "room"]
};

const daySchema = {
    type: "OBJECT",
    properties: {
        "9:30 am-10:20 am": slotSchema,
        "10:20 am-11:10 am": slotSchema,
        "11:10 am-12:00 pm": slotSchema,
        "12:00 pm-12:50 pm": slotSchema,
        "12:50 pm-2:20 pm": slotSchema,
        "2:20 pm-3:10 pm": slotSchema,
        "3:10 pm-4:00 pm": slotSchema,
        "4:00 pm-4:50 pm": slotSchema,
    },
    description: "A map of time slots to class details. Use exact time format. Omit any time slots that are empty."
};

const saturdaySchema = {
    type: "OBJECT",
    properties: {
        "9:30 am-10:20 am": slotSchema,
        "10:20 am-11:10 am": slotSchema,
        "11:10 am-12:00 pm": slotSchema,
        "12:00 pm-12:50 pm": slotSchema,
        "12:50 pm-2:20 pm": slotSchema,
    },
    description: "A map of time slots to class details for Saturday. Use exact time format. Omit any time slots that are empty."
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
  const [adminContext, setAdminContext] = useState<AdministrativeData | null>(null);
  const [existingOrgTT, setExistingOrgTT] = useState<TimetableData | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(256);

  // Enforce admin-only access
  useEffect(() => {
    if (user.role !== 'admin') {
      onNavigate('DASHBOARD');
    }
  }, [user.role, onNavigate]);

  // Load admin context and existing timetable
  useEffect(() => {
    const loadContext = async () => {
      if (!user.college) return;
      try {
        const [adminData, existingTT] = await Promise.all([
          getAdministrativeData(user.college),
          getOrgTimetable(user.college)
        ]);
        setAdminContext(adminData);
        setExistingOrgTT(existingTT);
      } catch (error) {
        console.warn('Could not load admin context:', error);
        // Continue without admin context - user can still generate timetables
        setAdminContext(null);
        setExistingOrgTT(null);
      }
    };
    loadContext();
  }, [user.college]);

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    const userMessage: ChatMessage = { sender: 'user', text: message };
    setMessages(prev => [...prev, userMessage]);

    try {
      const prompt = `You are a university timetable generator for Rajkiya Engineering College, Sonbhardra. Create a JSON timetable based on the user's request. Use the provided organization context and follow the exact academic format.

        IMPORTANT FORMATTING RULES:
        - Use exact time slots: "9:30 am-10:20 am", "10:20 am-11:10 am", "11:10 am-12:00 pm", "12:00 pm-12:50 pm", "12:50 pm-2:20 pm", "2:20 pm-3:10 pm", "3:10 pm-4:00 pm", "4:00 pm-4:50 pm"
        - Course codes should be like: BCS701, BOE070, BCS753, BCS754, BCS751, BCS752
        - Faculty names should be initials in parentheses: (NU), (AKT), (VT), (KS), (MY), (AS)
        - Rooms should be like: AB2-CC, AB2/T6, AB1-CC, CLASS ROOM-AB2/T-1/SC
        - Days should be: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
        - Avoid clashes with existing timetable
        - Use organization context for realistic scheduling

        USER_PREFERENCES: ${user.preferences || 'none'}
        ORGANIZATION_CONTEXT: ${JSON.stringify(adminContext || {}, null, 2)}
        EXISTING_TIMETABLE: ${JSON.stringify(existingOrgTT || {}, null, 2)}
        PROMPT: ${message}`;

      const result = await ai.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json"
        }
      }).generateContent({
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }]
      });

      const timetableJsonString = result.response.text();
      try {
        const raw: unknown = JSON.parse(timetableJsonString);
        const normalized = normalizeTimetable(raw);
        setTimetableData(normalized);
        setEditData(normalized);
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

  // -------- Helpers: Normalize AI JSON to our canonical TimetableData --------
  const canonicalDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const canonicalSlots = [
    '9:30 am-10:20 am',
    '10:20 am-11:10 am',
    '11:10 am-12:00 pm',
    '12:00 pm-12:50 pm',
    '12:50 pm-2:20 pm',
    '2:20 pm-3:10 pm',
    '3:10 pm-4:00 pm',
    '4:00 pm-4:50 pm'
  ];

  const normalizeTime = (t: string) => {
    const m = t.trim().toLowerCase().replace(/[\u2012-\u2015]/g, '-').replace(/\s+/g, ' ')
      .match(/^(\d{1,2})\s*:\s*(\d{2})\s*(am|pm)$/i);
    if (!m) return t.trim().toLowerCase().replace(/\s+/g, ' ');
    const hour = String(parseInt(m[1], 10));
    const minutes = m[2];
    const meridiem = m[3].toLowerCase();
    return `${hour}:${minutes} ${meridiem}`;
  };

  const normalizeSlot = (s: string) => {
    const cleaned = s.trim().toLowerCase().replace(/[\u2012-\u2015]/g, '-').replace(/\s*-\s*/g, '-');
    const parts = cleaned.split('-');
    if (parts.length !== 2) return s.trim().toLowerCase().replace(/\s+/g, ' ');
    return `${normalizeTime(parts[0])}-${normalizeTime(parts[1])}`;
  };

  const findKeyInsensitive = (target: string, keys: string[]) => {
    const lower = target.toLowerCase();
    return keys.find(k => k.toLowerCase() === lower);
  };

  const findSlotKey = (targetSlot: string, keys: string[]) => {
    const normTarget = normalizeSlot(targetSlot);
    return keys.find(k => normalizeSlot(k) === normTarget);
  };

  const coerceSlot = (value: any): TimetableSlot | undefined => {
    if (!value || typeof value !== 'object') return undefined;
    const course = value.courseName || value.course || value.subject || value.code || '';
    const faculty = value.facultyName || value.faculty || value.teacher || value.instructor || '';
    const room = value.room || value.location || value.lab || '';
    if (!course && !faculty && !room) return undefined;
    return { courseName: String(course), facultyName: String(faculty), room: String(room) };
  };

  const normalizeTimetable = (raw: any): TimetableData => {
    const result: TimetableData = {} as TimetableData;
    if (!raw || typeof raw !== 'object') return result;
    const dayKeys = Object.keys(raw);
    canonicalDays.forEach(day => {
      const mapKey = findKeyInsensitive(day, dayKeys);
      const dayObj = mapKey ? raw[mapKey] : undefined;
      result[day.toUpperCase()] = {} as any;
      if (dayObj && typeof dayObj === 'object') {
        const slotKeys = Object.keys(dayObj);
        canonicalSlots.forEach(slot => {
          const k = findSlotKey(slot, slotKeys);
          const val = k ? coerceSlot(dayObj[k]) : undefined;
          if (val) {
            (result[day.toUpperCase()] as any)[slot] = val;
          }
        });
      }
    });
    return result;
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar 
        user={user} 
        onLogout={onLogout} 
        isOpen={isSidebarOpen} 
        setOpen={setSidebarOpen} 
        onNavigate={onNavigate}
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
      />
      <main className="flex-1 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 overflow-hidden">
        <div className="lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md text-black bg-white border border-black">
            <Icon name="menu" className="w-6 h-6" />
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 flex-1 min-h-0">
          <div className="lg:col-span-4 min-h-0 flex flex-col gap-4">
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
            <div ref={timetableRef} className="flex-1 min-h-0 overflow-auto">
              <Timetable 
                data={isEditing ? editData : timetableData} 
                editable={isEditing}
                onChange={(day, slot, value) => {
                  setEditData(prev => {
                    const next: TimetableData = JSON.parse(JSON.stringify(prev || {}));
                    const dayKey = day.toUpperCase();
                    if (!next[dayKey]) next[dayKey] = {} as any;
                    (next[dayKey] as any)[slot] = value;
                    return next;
                  });
                }}
              />
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
