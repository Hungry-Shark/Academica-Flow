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
import { setOrgTimetable, getAdministrativeData, getOrgTimetable, getAdminContextForOrg, getOrganizationByToken } from '../firebase';

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
  const [timetableInfo, setTimetableInfo] = useState<{
    branch?: string;
    semester?: string;
    academicYear?: string;
  }>({});

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
        // Loaded admin context for timetable generation
      } catch (error) {
        console.warn('Could not load admin context:', error);
        // Continue without admin context - user can still generate timetables
        setAdminContext(null);
        setExistingOrgTT(null);
      }
    };
    loadContext();
  }, [user.organizationToken]);

  // Extract timetable information from user query
  const extractTimetableInfo = (query: string) => {
    const info: { branch?: string; semester?: string; academicYear?: string } = {};
    
    // Extract branch information - improved patterns
    const branchPatterns = [
      /(?:for|of|in)\s+(cse|computer science|cs|it|ece|electronics|ele|mechanical|civil|electrical)\s+(?:year|sem|semester)/i,
      /(cse|computer science|cs|it|ece|electronics|ele|mechanical|civil|electrical)\s+(?:year|sem|semester)/i,
      /(?:cse|computer science|cs|it|ece|electronics|ele|mechanical|civil|electrical)/i
    ];
    
    for (const pattern of branchPatterns) {
      const match = query.match(pattern);
      if (match) {
        const branch = match[1] || match[0];
        if (branch.toLowerCase().includes('cse') || branch.toLowerCase().includes('computer')) {
          info.branch = 'COMPUTER SCIENCE AND ENGINEERING';
        } else if (branch.toLowerCase().includes('it')) {
          info.branch = 'INFORMATION TECHNOLOGY';
        } else if (branch.toLowerCase().includes('ece')) {
          info.branch = 'ELECTRONICS AND COMMUNICATION ENGINEERING';
        } else if (branch.toLowerCase().includes('electronics') || branch.toLowerCase().includes('ele')) {
          info.branch = 'ELECTRONICS AND COMMUNICATION ENGINEERING';
        } else if (branch.toLowerCase().includes('mechanical')) {
          info.branch = 'MECHANICAL ENGINEERING';
        } else if (branch.toLowerCase().includes('civil')) {
          info.branch = 'CIVIL ENGINEERING';
        } else if (branch.toLowerCase().includes('electrical')) {
          info.branch = 'ELECTRICAL ENGINEERING';
        } else {
          info.branch = branch.toUpperCase();
        }
        break;
      }
    }
    
    // If no branch found, try to extract from the beginning of the query
    if (!info.branch) {
      const queryStart = query.toLowerCase().trim();
      if (queryStart.includes('cse') || queryStart.includes('computer')) {
        info.branch = 'COMPUTER SCIENCE AND ENGINEERING';
      } else if (queryStart.includes('it')) {
        info.branch = 'INFORMATION TECHNOLOGY';
      } else if (queryStart.includes('ece') || queryStart.includes('electronics') || queryStart.includes('ele')) {
        info.branch = 'ELECTRONICS AND COMMUNICATION ENGINEERING';
      }
    }
    
    // Extract year/semester information
    const yearPatterns = [
      /(\d+)(?:st|nd|rd|th)?\s+(?:year|sem|semester)/i,
      /(?:year|sem|semester)\s+(\d+)/i,
      /(\d+)(?:st|nd|rd|th)?\s+(?:sem|semester)/i
    ];
    
    for (const pattern of yearPatterns) {
      const match = query.match(pattern);
      if (match) {
        const year = parseInt(match[1]);
        if (year >= 1 && year <= 4) {
          info.semester = `${year}${year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year`;
          break;
        }
      }
    }
    
    // Extract academic year
    const academicYearPattern = /(\d{4})-(\d{4})/;
    const academicYearMatch = query.match(academicYearPattern);
    if (academicYearMatch) {
      info.academicYear = `${academicYearMatch[1]}-${academicYearMatch[2]}`;
    } else {
      info.academicYear = '2025-26'; // Default
    }
    
    return info;
  };

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    const userMessage: ChatMessage = { sender: 'user', text: message };
    setMessages(prev => [...prev, userMessage]);
    
    // Extract timetable information from the query
    const extractedInfo = extractTimetableInfo(message);
    setTimetableInfo(extractedInfo);

    try {
      const prompt = `You are a university timetable generator for Rajkiya Engineering College, Sonbhardra. Create a JSON timetable based on the user's request. Use the provided organization context and follow the exact academic format.

        CRITICAL: Return ONLY a valid JSON object. Do not include any text before or after the JSON. Do not include markdown formatting or code blocks.

        IMPORTANT FORMATTING RULES:
        - Use exact time slots as object keys: "9:30 am-10:20 am", "10:20 am-11:10 am", "11:10 am-12:00 pm", "12:00 pm-12:50 pm", "12:50 pm-2:20 pm", "2:20 pm-3:10 pm", "3:10 pm-4:00 pm", "4:00 pm-4:50 pm"
        - Course codes should be like: BCS701, BOE070, BCS753, BCS754, BCS751, BCS752 (for CS) or BEC701, BEC702, BEC703, BEC704 (for Electronics)
        - Faculty names should be initials in SINGLE parentheses: (NU), (AKT), (VT), (KS), (MY), (AS) - NOT double parentheses
        - Days should be: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
        - Avoid clashes with existing timetable
        - Return data as OBJECTS with time slot keys, NOT arrays

        CLASSROOM RESTRICTIONS (CRITICAL):
        - Use ONLY 1-2 classrooms per year/branch
        - For 1st-2nd year: Use S-1, S-2 (regular classrooms)
        - For 3rd-4th year: Use S-3, S-4 (advanced classrooms)
        - For labs: Use LAB-1, LAB-2 only
        - DO NOT use more than 2 different room numbers per timetable

        YEAR-SPECIFIC SCHEDULING RULES (from sentiment):
        - 1st Year: Full timetable, basic subjects, Saturday half-day with non-credit subjects
        - 2nd Year: Full timetable, intermediate subjects, Saturday half-day
        - 3rd Year: Less scheduled, Friday half-day, daily labs, no Saturday classes
        - 4th Year: First half only, daily labs, Friday half-day, no Saturday classes

        VARIETY REQUIREMENTS:
        - Use DIFFERENT course codes for different time slots and days
        - Use DIFFERENT faculty members for different subjects
        - Create realistic scheduling patterns based on year requirements
        - Ensure faculty don't have conflicting schedules
        - Mix lectures and practicals appropriately
        - Follow year-specific scheduling patterns from sentiment

        COURSE CODES BY YEAR (use appropriate ones):
        - 1st Year: BCS101, BCS102, BCS103, BCS104, BCS105, BCS106 (CS) or BEC101, BEC102, BEC103, BEC104, BEC105, BEC106 (Electronics)
        - 2nd Year: BCS201, BCS202, BCS203, BCS204, BCS205, BCS206 (CS) or BEC201, BEC202, BEC203, BEC204, BEC205, BEC206 (Electronics)
        - 3rd Year: BCS301, BCS302, BCS303, BCS304, BCS305, BCS306 (CS) or BEC301, BEC302, BEC303, BEC304, BEC305, BEC306 (Electronics)
        - 4th Year: BCS401, BCS402, BCS403, BCS404, BCS405, BCS406 (CS) or BEC401, BEC402, BEC403, BEC404, BEC405, BEC406 (Electronics)

        FACULTY ASSIGNMENTS: Use faculty from organization context if available, otherwise use: (NU), (AKT), (VT), (KS), (MY), (AS), (RS), (PK), (SM), (DJ)

        REQUIRED JSON STRUCTURE:
        {
          "Monday": {
            "9:30 am-10:20 am": {"courseName": "BCS201", "facultyName": "(NU)", "room": "S-1"},
            "10:20 am-11:10 am": {"courseName": "BCS202", "facultyName": "(AKT)", "room": "S-2"}
          },
          "Tuesday": { ... }
        }

        USER_PREFERENCES: ${user.preferences || 'none'}
        ORGANIZATION_CONTEXT: ${JSON.stringify(adminContext || {}, null, 2)}
        EXISTING_TIMETABLE: ${JSON.stringify(existingOrgTT || {}, null, 2)}
        SENTIMENT_RULES: ${adminContext?.sentiment || 'No specific sentiment rules provided'}
        PROMPT: ${message}

        IMPORTANT: Follow the sentiment rules for year-specific scheduling. Use only 1-2 classrooms per timetable. Return ONLY the JSON object, nothing else.`;

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
        const normalized = normalizeTimetable(raw);
        
        // Validate timetable variety
        const validationResult = validateTimetableVariety(normalized);
        
        if (!validationResult.isValid) {
          console.warn("Generated timetable lacks variety:", validationResult.issues);
          
          // Try to enhance the timetable with more variety
          const enhancedTimetable = enhanceTimetableVariety(normalized, extractedInfo.branch);
          const enhancedValidation = validateTimetableVariety(enhancedTimetable);
          
          if (enhancedValidation.isValid) {
            setTimetableData(enhancedTimetable);
            setEditData(enhancedTimetable);
            setMessages(prev => [...prev, { 
              sender: 'model', 
              text: "I generated a timetable with improved variety. You can preview it, edit it, or generate a new one." 
            }]);
          } else {
            setTimetableData(normalized);
            setEditData(normalized);
            setMessages(prev => [...prev, { 
              sender: 'model', 
              text: `I generated a timetable, but it seems to have repetitive data. ${validationResult.issues.join(' ')} Please try generating again or be more specific about the subjects and faculty you want.` 
            }]);
          }
        } else {
          setMessages(prev => [...prev, { sender: 'model', text: "Here is your generated timetable. You can preview it, edit it, or generate a new one." }]);
          setTimetableData(normalized);
          setEditData(normalized);
        }
      } catch (e) {
        console.error("Failed to parse timetable JSON");
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

  const handleSaveDraft = async () => {
    if (!timetableData || !user.organizationToken) {
      alert('Please generate a timetable and ensure your organization token is set in your profile.');
      return;
    }
    try {
      await setOrgTimetable(user.organizationToken, timetableData, false);
      alert('Timetable saved as draft. Go to Dashboard to publish it when ready.');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    }
  };

  const handlePublish = async () => {
    if (!timetableData || !user.organizationToken) {
      alert('Please generate a timetable and ensure your organization token is set in your profile.');
      return;
    }
    try {
      setIsLoading(true);
      
      // Verify organization token first
      const org = await getOrganizationByToken(user.organizationToken);
      if (!org) {
        throw new Error('Organization not found');
      }
      if (org.adminId !== user.uid) {
        throw new Error('You are not authorized to publish timetables for this organization');
      }
      
      // Try to publish the timetable
      await setOrgTimetable(user.organizationToken, timetableData, true);
      alert('Timetable published successfully! It is now visible to students and faculty on the Dashboard.');
    } catch (error) {
      console.error('Error publishing timetable:', error);
      let errorMessage = 'Failed to publish timetable. ';
      
      if (error instanceof Error) {
        if (error.message.includes('Missing or insufficient permissions')) {
          errorMessage += 'Please ensure you have admin permissions.';
        } else if (error.message.includes('Organization not found')) {
          errorMessage += 'Please verify your organization token.';
        } else if (error.message.includes('not authorized')) {
          errorMessage += 'You do not have permission to publish timetables for this organization.';
        } else {
          errorMessage += 'An unexpected error occurred. Please try again.';
        }
      }
      
      alert(errorMessage);
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
    // Remove any existing parentheses and add single ones
    const formattedFaculty = faculty.replace(/[()]/g, '').trim().toUpperCase();
    const formattedRoom = room.replace(/\s+/g, '-').toUpperCase();
    
    
    return {
      courseName: formattedCourse,
      facultyName: formattedFaculty ? `(${formattedFaculty})` : '',
      room: formattedRoom
    };
  };

  // Enhancement function to add variety to repetitive timetables
  const enhanceTimetableVariety = (timetable: TimetableData, branch?: string): TimetableData => {
    const enhanced = JSON.parse(JSON.stringify(timetable)) as TimetableData;
    
    // Determine year from existing course codes
    const existingCourses = new Set<string>();
    Object.values(enhanced).forEach(dayData => {
      Object.values(dayData).forEach(slot => {
        if (slot && slot.courseName) {
          existingCourses.add(slot.courseName);
        }
      });
    });
    
    // Determine year and appropriate course codes
    let courseOptions: string[];
    let roomOptions: string[];
    
    const hasBCS1 = Array.from(existingCourses).some(c => c.includes('BCS1'));
    const hasBCS2 = Array.from(existingCourses).some(c => c.includes('BCS2'));
    const hasBCS3 = Array.from(existingCourses).some(c => c.includes('BCS3'));
    const hasBCS4 = Array.from(existingCourses).some(c => c.includes('BCS4'));
    const hasBEC1 = Array.from(existingCourses).some(c => c.includes('BEC1'));
    const hasBEC2 = Array.from(existingCourses).some(c => c.includes('BEC2'));
    const hasBEC3 = Array.from(existingCourses).some(c => c.includes('BEC3'));
    const hasBEC4 = Array.from(existingCourses).some(c => c.includes('BEC4'));
    
    // Determine course options based on branch and year
    const isElectronics = branch?.toLowerCase().includes('electronics') || branch?.toLowerCase().includes('ece');
    
    if (hasBCS1 || hasBEC1) {
      if (isElectronics) {
        courseOptions = ['BEC101', 'BEC102', 'BEC103', 'BEC104', 'BEC105', 'BEC106'];
      } else {
        courseOptions = ['BCS101', 'BCS102', 'BCS103', 'BCS104', 'BCS105', 'BCS106'];
      }
      roomOptions = ['S-1', 'S-2'];
    } else if (hasBCS2 || hasBEC2) {
      if (isElectronics) {
        courseOptions = ['BEC201', 'BEC202', 'BEC203', 'BEC204', 'BEC205', 'BEC206'];
      } else {
        courseOptions = ['BCS201', 'BCS202', 'BCS203', 'BCS204', 'BCS205', 'BCS206'];
      }
      roomOptions = ['S-1', 'S-2'];
    } else if (hasBCS3 || hasBEC3) {
      if (isElectronics) {
        courseOptions = ['BEC301', 'BEC302', 'BEC303', 'BEC304', 'BEC305', 'BEC306'];
      } else {
        courseOptions = ['BCS301', 'BCS302', 'BCS303', 'BCS304', 'BCS305', 'BCS306'];
      }
      roomOptions = ['S-3', 'S-4'];
    } else if (hasBCS4 || hasBEC4) {
      if (isElectronics) {
        courseOptions = ['BEC401', 'BEC402', 'BEC403', 'BEC404', 'BEC405', 'BEC406'];
      } else {
        courseOptions = ['BCS401', 'BCS402', 'BCS403', 'BCS404', 'BCS405', 'BCS406'];
      }
      roomOptions = ['S-3', 'S-4'];
    } else {
      if (isElectronics) {
        courseOptions = ['BEC201', 'BEC202', 'BEC203', 'BEC204', 'BEC205', 'BEC206'];
      } else {
        courseOptions = ['BCS201', 'BCS202', 'BCS203', 'BCS204', 'BCS205', 'BCS206'];
      }
      roomOptions = ['S-1', 'S-2'];
    }
    
    const facultyOptions = ['NU', 'AKT', 'VT', 'KS', 'MY', 'AS', 'RS', 'PK', 'SM', 'DJ'];
    
    let courseIndex = 0;
    let facultyIndex = 0;
    let roomIndex = 0;
    
    Object.values(enhanced).forEach(dayData => {
      Object.entries(dayData).forEach(([slot, slotData]) => {
        if (slotData && slotData.courseName) {
          // Rotate through different options to add variety
          slotData.courseName = courseOptions[courseIndex % courseOptions.length];
          slotData.facultyName = `(${facultyOptions[facultyIndex % facultyOptions.length]})`;
          slotData.room = roomOptions[roomIndex % roomOptions.length];
          
          courseIndex++;
          facultyIndex++;
          roomIndex++;
        }
      });
    });
    
    return enhanced;
  };

  // Validation function to check timetable variety and quality
  const validateTimetableVariety = (timetable: TimetableData): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    if (!timetable || Object.keys(timetable).length === 0) {
      return { isValid: false, issues: ["No timetable data generated"] };
    }
    
    const allCourses = new Set<string>();
    const allFaculty = new Set<string>();
    const allRooms = new Set<string>();
    let totalSlots = 0;
    let filledSlots = 0;
    
    Object.values(timetable).forEach(dayData => {
      Object.values(dayData).forEach(slot => {
        totalSlots++;
        if (slot && slot.courseName) {
          filledSlots++;
          allCourses.add(slot.courseName);
          allFaculty.add(slot.facultyName);
          allRooms.add(slot.room);
        }
      });
    });
    
    // Check for variety
    if (allCourses.size < 2) {
      issues.push("Only one unique course found - need more variety in subjects");
    }
    
    if (allFaculty.size < 2) {
      issues.push("Only one unique faculty found - need more variety in instructors");
    }
    
    // Check classroom count (should be 1-2)
    if (allRooms.size > 2) {
      issues.push(`Too many classrooms used (${allRooms.size}) - should use only 1-2 classrooms per year/branch`);
    }
    
    if (allRooms.size === 0) {
      issues.push("No rooms assigned to classes");
    }
    
    // Check for excessive repetition (more than 80% of slots have the same data)
    if (filledSlots > 0) {
      const courseCounts = new Map<string, number>();
      const facultyCounts = new Map<string, number>();
      const roomCounts = new Map<string, number>();
      
      Object.values(timetable).forEach(dayData => {
        Object.values(dayData).forEach(slot => {
          if (slot && slot.courseName) {
            courseCounts.set(slot.courseName, (courseCounts.get(slot.courseName) || 0) + 1);
            facultyCounts.set(slot.facultyName, (facultyCounts.get(slot.facultyName) || 0) + 1);
            roomCounts.set(slot.room, (roomCounts.get(slot.room) || 0) + 1);
          }
        });
      });
      
      const maxCourseCount = Math.max(...courseCounts.values());
      const maxFacultyCount = Math.max(...facultyCounts.values());
      const maxRoomCount = Math.max(...roomCounts.values());
      
      if (maxCourseCount / filledSlots > 0.8) {
        issues.push("One course appears in more than 80% of slots - too repetitive");
      }
      
      if (maxFacultyCount / filledSlots > 0.8) {
        issues.push("One faculty appears in more than 80% of slots - too repetitive");
      }
      
      if (maxRoomCount / filledSlots > 0.8) {
        issues.push("One room appears in more than 80% of slots - too repetitive");
      }
    }
    
    // Check for proper scheduling (not too many empty slots)
    const fillRate = filledSlots / totalSlots;
    if (fillRate < 0.3) {
      issues.push("Timetable has too many empty slots - consider adding more classes");
    }
    
    return {
      isValid: issues.length === 0,
      issues
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
      if (!mapKey || !timetableData[mapKey]) return;
      
      const dayObj = timetableData[mapKey];
      
      // Handle array format (AI sometimes returns arrays instead of objects)
      if (Array.isArray(dayObj)) {
        // Map array indices to time slots
        dayObj.forEach((slotData, index) => {
          if (index < canonicalSlots.length && slotData) {
            const normalizedSlot = coerceSlot(slotData);
            if (normalizedSlot) {
              result[upperDay][canonicalSlots[index]] = {
                courseName: normalizedSlot.courseName.trim().toUpperCase(),
                facultyName: normalizedSlot.facultyName.trim().toUpperCase(),
                room: normalizedSlot.room.trim().toUpperCase()
              };
            }
          }
        });
        return;
      }
      
      // Handle object format
      if (typeof dayObj !== 'object') return;
      
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
                      onClick={handleSaveDraft}
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                    >
                      <Icon name="save" className="w-4 h-4" />
                      <span>Save Draft</span>
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
                collegeName={user.organization?.name || "RAJKIYA ENGINEERING COLLEGE, SONBHARDRA"}
                branch={timetableInfo.branch}
                semester={timetableInfo.semester}
                academicYear={timetableInfo.academicYear}
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
