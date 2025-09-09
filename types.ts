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
  name:string;
  role: 'student' | 'faculty' | 'admin';
  preferences: string;
  profileComplete: boolean;
  email: string;
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

export type AppView = 'LOGIN' | 'PROFILE_SETUP' | 'DASHBOARD' | 'ADMIN';

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