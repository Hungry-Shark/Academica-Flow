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
import { setOrgTimetable, getAdministrativeData, getOrgTimetable, getAdminContextForOrg } from '../firebase';

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
      if (!user.organizationToken) return;
      try {
        const [adminData, existingTT] = await Promise.all([
          getAdminContextForOrg(user.organizationToken),
          getOrgTimetable(user.organizationToken)
        ]);
        setAdminContext(adminData);
        setExistingOrgTT(existingTT);
        console.log('Loaded admin context for timetable generation:', adminData);
      } catch (error) {
        console.warn('Could not load admin context:', error);
        // Continue without admin context - user can still generate timetables
        setAdminContext(null);
        setExistingOrgTT(null);
      }
    };
    loadContext();
  }, [user.organizationToken]);

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    const userMessage: ChatMessage = { sender: 'user', text: message };
    setMessages(prev => [...prev, userMessage]);

    try {
      const prompt = `You are a university timetable generator for Rajkiya Engineering College, Sonbhardra. Create a JSON timetable based on the user's request. Use the provided organization context and follow the exact academic format.

        CRITICAL: Return ONLY a valid JSON object. Do not include any text before or after the JSON. Do not include markdown formatting or code blocks.

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
        PROMPT: ${message}

        Return ONLY the JSON object, nothing else.`;

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
      
      // Robust JSON parsing with fallback strategies
      const parseTimetableJSON = (jsonString: string) => {
        // Strategy 1: Try direct parsing
        try {
          return JSON.parse(jsonString);
        } catch (e) {
          console.warn("Direct parsing failed, trying extraction strategies...");
        }

        // Strategy 2: Extract JSON from markdown code blocks
        const codeBlockMatch = jsonString.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          try {
            return JSON.parse(codeBlockMatch[1]);
          } catch (e) {
            console.warn("Code block extraction failed");
          }
        }

        // Strategy 3: Find the first complete JSON object
        const jsonMatch = jsonString.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.warn("First JSON object extraction failed");
          }
        }

        // Strategy 4: Try to fix common JSON issues
        let cleanedJson = jsonString.trim();
        
        // Remove trailing commas and extra content after valid JSON
        const lastBraceIndex = cleanedJson.lastIndexOf('}');
        if (lastBraceIndex > 0) {
          cleanedJson = cleanedJson.substring(0, lastBraceIndex + 1);
        }
        
        // Remove any text before the first {
        const firstBraceIndex = cleanedJson.indexOf('{');
        if (firstBraceIndex > 0) {
          cleanedJson = cleanedJson.substring(firstBraceIndex);
        }

        try {
          return JSON.parse(cleanedJson);
        } catch (e) {
          console.warn("Cleaned JSON parsing failed");
        }

        // Strategy 5: Look for timetable object specifically
        const timetableMatch = jsonString.match(/"timetable"\s*:\s*(\{[\s\S]*?\})/);
        if (timetableMatch) {
          try {
            return { timetable: JSON.parse(timetableMatch[1]) };
          } catch (e) {
            console.warn("Timetable object extraction failed");
          }
        }

        throw new Error("All parsing strategies failed");
      };

      try {
        const raw: unknown = parseTimetableJSON(timetableJsonString);
        console.log("Raw parsed JSON:", raw);
        const normalized = normalizeTimetable(raw);
        console.log("Normalized timetable:", normalized);
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
    if (!timetableData || !user.organizationToken) {
      alert('Please generate a timetable and ensure your organization token is set in your profile.');
      return;
    }
    await setOrgTimetable(user.organizationToken, timetableData, false);
    alert('Timetable saved successfully! Go to Dashboard to publish it for students and faculty.');
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
    // First clean up the string
    const cleaned = t.trim().toLowerCase()
      .replace(/[\u2012-\u2015]/g, '-') // Normalize different dash characters
      .replace(/\s+/g, ' '); // Normalize spaces
    
    // Try to match different time formats
    const formats = [
      /^(\d{1,2})\s*:\s*(\d{2})\s*(am|pm)$/i,  // Standard format: 9:30 am
      /^(\d{1,2})\.(\d{2})\s*(am|pm)$/i,       // Dot format: 9.30 am
      /^(\d{1,2})\s*(\d{2})\s*(am|pm)$/i       // No separator: 930 am
    ];
    
    for (const format of formats) {
      const m = cleaned.match(format);
      if (m) {
        let hour = parseInt(m[1], 10);
        const minutes = m[2].padStart(2, '0');
        const meridiem = m[3].toLowerCase();
        
        // Ensure 12-hour time format
        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;
        
        // Format back to standard format
        hour = hour % 12 || 12; // Convert 24h to 12h format
        return `${hour}:${minutes} ${meridiem}`;
      }
    }
    
    return cleaned; // Return cleaned string if no format matches
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
    
    // Extract course name from various possible field names
    const course = (
      value.courseName ||
      value.course ||
      value.subject ||
      value.subjectCode ||
      value.code ||
      ''
    ).toString().trim();
    
    // Extract faculty name from various possible field names
    const faculty = (
      value.facultyName ||
      value.faculty ||
      value.teacher ||
      value.instructor ||
      value.prof ||
      ''
    ).toString().trim();
    
    // Extract room from various possible field names
    const room = (
      value.room ||
      value.location ||
      value.venue ||
      value.lab ||
      value.classroom ||
      ''
    ).toString().trim();
    
    // Only return if at least one field has content
    if (!course && !faculty && !room) return undefined;
    
    // Format the fields according to the expected format
    const formattedCourse = course.replace(/\s+/g, '').toUpperCase();
    const formattedFaculty = faculty.replace(/[()]/g, '').trim().toUpperCase();
    const formattedRoom = room.replace(/\s+/g, '-').toUpperCase();
    
    return {
      courseName: formattedCourse,
      facultyName: formattedFaculty ? `(${formattedFaculty})` : '',
      room: formattedRoom
    };
  };

  const normalizeTimetable = (raw: any): TimetableData => {
    const result: TimetableData = {} as TimetableData;
    if (!raw || typeof raw !== 'object') return result;
    
    // Handle different JSON structures and extract timetable data
    let timetableData = raw;
    if (raw.timetable && typeof raw.timetable === 'object') timetableData = raw.timetable;
    if (raw.data && typeof raw.data === 'object') timetableData = raw.data;
    
    const dayKeys = Object.keys(timetableData);
    
    // Process each canonical day
    canonicalDays.forEach(day => {
      // Create empty day object
      const upperDay = day.toUpperCase();
      result[upperDay] = {};
      
      // Find matching day key case-insensitively
      const mapKey = findKeyInsensitive(day, dayKeys);
      if (!mapKey || !timetableData[mapKey] || typeof timetableData[mapKey] !== 'object') return;
      
      const dayObj = timetableData[mapKey];
      const slotKeys = Object.keys(dayObj);
      
      // Process each canonical time slot
      canonicalSlots.forEach(canonicalSlot => {
        // Find matching slot with normalized time format
        const slotKey = slotKeys.find(k => {
          const normalizedCanonical = normalizeSlot(canonicalSlot);
          const normalizedKey = normalizeSlot(k);
          return normalizedCanonical === normalizedKey;
        });
        
        if (!slotKey) return;
        
        // Extract and validate slot data
        const slotData = dayObj[slotKey];
        if (!slotData || typeof slotData !== 'object') return;
        
        const normalizedSlot = coerceSlot(slotData);
        if (normalizedSlot) {
          result[upperDay][canonicalSlot] = {
            courseName: normalizedSlot.courseName.trim().toUpperCase(),
            facultyName: normalizedSlot.facultyName.trim().toUpperCase(),
            room: normalizedSlot.room.trim().toUpperCase()
          };
        }
      });
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
