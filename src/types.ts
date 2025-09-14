// FIX: Define types for the application
export interface TimetableSlot {
  courseName: string;
  facultyName: string;
  room: string;
}

export interface TimetableData {
  [day: string]: {
    [time: string]: TimetableSlot | undefined;
  };
}

export interface ChatMessage {
  sender: 'user' | 'model';
  text: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  role: 'student' | 'faculty' | 'admin';
  preferences: string;
  profileComplete: boolean;
  profileCompleted?: boolean; // New flag to track if profile setup is complete
  email: string;
  college?: string;
  organizationToken?: string; // 6-digit token for students/faculty to join organization
  adminPassword?: string; // For administrative role verification
  organization?: Organization; // For admin users who own an organization
}

export interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
}

export interface Faculty {
  id: string;
  name: string;
  department: string;
  expertise: string[];
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: 'Lecture Hall' | 'Lab' | 'Classroom';
}

export type AppView = 'LANDING' | 'LOGIN' | 'PROFILE_SETUP' | 'DASHBOARD' | 'ADMIN' | 'ABOUT' | 'CONTACT' | 'PROFILE' | 'PROFILE_EDIT' | 'GENERATE_TT' | 'ADMIN_INFO';

export interface AuthCredentials {
    email: string;
    password?: string;
}

// Firestore admin-related types
export interface AdminProfile {
  email: string;
  name: string;
  role: 'admin';
}

export interface AdminSettings {
  organizationName: string;
  currentSemester?: string;
  notes?: string;
}

// Administrative Info types
export interface FacultyMember {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'HOD' | 'Professor' | 'Associate Professor' | 'Assistant Professor' | 'Lab Assistant' | 'Teaching Assistant';
  specialization: string[];
  phone?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  hodId: string;
  description?: string;
}

export interface StudentInfo {
  year: number;
  branch: string;
  numberOfStudents: number;
}

export interface RoomInfo {
  id: string;
  name: string;
  type: 'Lecture Hall' | 'Lab' | 'Classroom' | 'Conference Room' | 'Library';
  capacity: number;
  department: string;
  floor: number;
  building: string;
  equipment?: string[];
}

export interface AdministrativeData {
  departments: Department[];
  faculties: FacultyMember[];
  students: StudentInfo[];
  rooms: RoomInfo[];
  subjects?: Subject[];
  sentiment?: string;
  lastUpdated: number;
}

// Organization structure with token-based access
export interface Organization {
  id: string;
  name: string;
  token: string; // 6-digit unique token
  adminId: string; // UID of the admin who created this organization
  createdAt: number;
  administrativeData?: AdministrativeData;
  timetableData?: TimetableData;
  isPublished?: boolean; // Whether timetable is published for students/faculty
} 

// Subjects offered per year/branch/discipline used for TT generation
export interface Subject {
  code: string;
  name: string;
  year: number;
  branch: string;
  discipline?: string;
  credits?: number;
}