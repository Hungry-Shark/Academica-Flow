/**
 * NEP 2020 Compliant Timetable System - TypeScript Interfaces
 * Based on Prisma Schema with comprehensive validation rules
 */

// ================================
// ENUMS AND CONSTANTS
// ================================

export enum OrgType {
  UNIVERSITY = 'UNIVERSITY',
  COLLEGE = 'COLLEGE',
  INSTITUTE = 'INSTITUTE',
  SCHOOL = 'SCHOOL'
}

export enum NepCategory {
  CORE = 'CORE',
  ELECTIVE = 'ELECTIVE',
  SKILL_BASED = 'SKILL_BASED',
  FOUNDATION = 'FOUNDATION',
  INTERDISCIPLINARY = 'INTERDISCIPLINARY',
  PROJECT = 'PROJECT',
  INTERNSHIP = 'INTERNSHIP',
  RESEARCH = 'RESEARCH'
}

export enum RoomType {
  LECTURE_HALL = 'LECTURE_HALL',
  TUTORIAL_ROOM = 'TUTORIAL_ROOM',
  LABORATORY = 'LABORATORY',
  SEMINAR_HALL = 'SEMINAR_HALL',
  LIBRARY = 'LIBRARY',
  AUDITORIUM = 'AUDITORIUM',
  CONFERENCE_ROOM = 'CONFERENCE_ROOM',
  COMPUTER_LAB = 'COMPUTER_LAB',
  RESEARCH_LAB = 'RESEARCH_LAB'
}

export enum ClassType {
  LECTURE = 'LECTURE',
  TUTORIAL = 'TUTORIAL',
  PRACTICAL = 'PRACTICAL',
  LABORATORY = 'LABORATORY',
  SEMINAR = 'SEMINAR',
  PROJECT = 'PROJECT',
  INTERNSHIP = 'INTERNSHIP',
  RESEARCH = 'RESEARCH'
}

export enum TimetableStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export enum ConstraintType {
  // Faculty Constraints
  FACULTY_MAX_HOURS_PER_DAY = 'FACULTY_MAX_HOURS_PER_DAY',
  FACULTY_MAX_HOURS_PER_WEEK = 'FACULTY_MAX_HOURS_PER_WEEK',
  FACULTY_AVAILABILITY = 'FACULTY_AVAILABILITY',
  FACULTY_NO_BACK_TO_BACK_CLASSES = 'FACULTY_NO_BACK_TO_BACK_CLASSES',
  FACULTY_LUNCH_BREAK = 'FACULTY_LUNCH_BREAK',
  
  // Room Constraints
  ROOM_CAPACITY = 'ROOM_CAPACITY',
  ROOM_AVAILABILITY = 'ROOM_AVAILABILITY',
  ROOM_EQUIPMENT_REQUIREMENTS = 'ROOM_EQUIPMENT_REQUIREMENTS',
  ROOM_NO_DOUBLE_BOOKING = 'ROOM_NO_DOUBLE_BOOKING',
  
  // Student Constraints
  STUDENT_MAX_HOURS_PER_DAY = 'STUDENT_MAX_HOURS_PER_DAY',
  STUDENT_NO_BACK_TO_BACK_CLASSES = 'STUDENT_NO_BACK_TO_BACK_CLASSES',
  STUDENT_LUNCH_BREAK = 'STUDENT_LUNCH_BREAK',
  STUDENT_CREDIT_LIMITS = 'STUDENT_CREDIT_LIMITS',
  
  // Academic Constraints
  SUBJECT_PREREQUISITES = 'SUBJECT_PREREQUISITES',
  SUBJECT_CONFLICTS = 'SUBJECT_CONFLICTS',
  NEP_CREDIT_DISTRIBUTION = 'NEP_CREDIT_DISTRIBUTION',
  CONTINUOUS_ASSESSMENT_SCHEDULING = 'CONTINUOUS_ASSESSMENT_SCHEDULING',
  
  // Institutional Constraints
  DEPARTMENT_PREFERENCES = 'DEPARTMENT_PREFERENCES',
  CROSS_DEPARTMENT_ELECTIVES = 'CROSS_DEPARTMENT_ELECTIVES',
  INTERDISCIPLINARY_COURSES = 'INTERDISCIPLINARY_COURSES',
  PROJECT_WORK_SCHEDULING = 'PROJECT_WORK_SCHEDULING'
}

export enum UserType {
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export enum NotificationType {
  TIMETABLE_GENERATED = 'TIMETABLE_GENERATED',
  TIMETABLE_PUBLISHED = 'TIMETABLE_PUBLISHED',
  SCHEDULE_CHANGE = 'SCHEDULE_CHANGE',
  ROOM_CHANGE = 'ROOM_CHANGE',
  FACULTY_CHANGE = 'FACULTY_CHANGE',
  CONFLICT_DETECTED = 'CONFLICT_DETECTED',
  DEADLINE_REMINDER = 'DEADLINE_REMINDER',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// ================================
// CORE INTERFACES
// ================================

export interface Organization {
  id: string;
  name: string;
  code: string;
  type: OrgType;
  address?: string;
  website?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  nepSettings?: NepSettings;
}

export interface NepSettings {
  id: string;
  organizationId: string;
  corePercentage: number; // 60%
  electivePercentage: number; // 30%
  skillPercentage: number; // 10%
  minCreditsPerSemester: number; // 20
  maxCreditsPerSemester: number; // 30
  totalCreditsForDegree: number; // 160
  continuousAssessmentWeight: number; // 40%
  endSemesterExamWeight: number; // 60%
  maxFacultyHoursPerWeek: number; // 40
  minFacultyHoursPerWeek: number; // 20
  allowCrossDepartmentElectives: boolean;
  allowInterDisciplinaryCourses: boolean;
  allowOnlineCourses: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  hodId?: string;
  nepCategories: NepCategory[];
  createdAt: Date;
  updatedAt: Date;
}

// ================================
// STUDENT PROFILE INTERFACE
// ================================

export interface StudentProfile {
  id: string;
  organizationId: string;
  departmentId: string;
  department: Department;
  
  // Basic Information
  rollNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  
  // Academic Information
  currentYear: number; // 1, 2, 3, 4
  currentSemester: number; // 1, 2, 3, 4, 5, 6, 7, 8
  admissionYear: number;
  isActive: boolean;
  
  // NEP 2020 Credit Tracking
  totalCreditsEarned: number;
  coreCreditsEarned: number;
  electiveCreditsEarned: number;
  skillCreditsEarned: number;
  
  // Academic Progress
  cgpa?: number;
  currentSemesterGPA?: number;
  
  // Chosen Subjects (Current Semester)
  enrolledSubjects: EnrolledSubject[];
  
  // Attendance Tracking
  attendanceRecords: AttendanceRecord[];
  
  // Assessment Records
  assessmentRecords: AssessmentRecord[];
  
  // NEP Compliance Status
  nepCompliance: NEPComplianceStatus;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface EnrolledSubject {
  id: string;
  subjectId: string;
  subject: SubjectDetails;
  semesterId: string;
  enrollmentDate: Date;
  isActive: boolean;
  grade?: string;
  creditsEarned: number;
  attendancePercentage: number;
  isEligibleForExam: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  subjectId: string;
  date: Date;
  isPresent: boolean;
  classType: ClassType;
  remarks?: string;
}

export interface AssessmentRecord {
  id: string;
  studentId: string;
  subjectId: string;
  semesterId: string;
  assessmentType: 'CONTINUOUS' | 'END_SEMESTER';
  marksObtained: number;
  maxMarks: number;
  weightage: number;
  conductedDate: Date;
  remarks?: string;
}

export interface NEPComplianceStatus {
  isCompliant: boolean;
  totalCredits: number;
  coreCredits: number;
  electiveCredits: number;
  skillCredits: number;
  corePercentage: number;
  electivePercentage: number;
  skillPercentage: number;
  violations: string[];
  recommendations: string[];
  lastChecked: Date;
}

// ================================
// FACULTY PROFILE INTERFACE
// ================================

export interface FacultyProfile {
  id: string;
  organizationId: string;
  departmentId: string;
  department: Department;
  
  // Basic Information
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation: string;
  qualification?: string;
  
  // NEP 2020 Specific
  specializations: string[];
  nepCategories: NepCategory[];
  
  // Workload Management
  maxHoursPerWeek: number;
  currentWorkload: number;
  isAvailable: boolean;
  
  // Availability Windows
  availability: FacultyAvailability[];
  
  // Teaching Assignments
  assignedSubjects: AssignedSubject[];
  
  // Workload Analysis
  workloadAnalysis: FacultyWorkloadAnalysis;
  
  // Performance Metrics
  performanceMetrics: FacultyPerformanceMetrics;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface FacultyAvailability {
  id: string;
  facultyId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  isAvailable: boolean;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignedSubject {
  id: string;
  subjectId: string;
  subject: SubjectDetails;
  isPrimary: boolean;
  canTeach: boolean;
  assignedAt: Date;
}

export interface FacultyWorkloadAnalysis {
  currentHoursPerWeek: number;
  maxHoursPerWeek: number;
  utilizationPercentage: number;
  isOverloaded: boolean;
  isUnderloaded: boolean;
  recommendedHours: number;
  workloadDistribution: {
    lectures: number;
    tutorials: number;
    practicals: number;
    projects: number;
    research: number;
  };
  availabilityScore: number; // 0-100
}

export interface FacultyPerformanceMetrics {
  averageStudentRating: number;
  totalClassesTaken: number;
  punctualityScore: number;
  studentFeedbackCount: number;
  researchPublications: number;
  lastEvaluationDate?: Date;
}

// ================================
// SUBJECT DETAILS INTERFACE
// ================================

export interface SubjectDetails {
  id: string;
  organizationId: string;
  departmentId: string;
  department: Department;
  
  // Basic Information
  code: string;
  name: string;
  description?: string;
  
  // NEP 2020 Classification
  nepCategory: NepCategory;
  credits: number;
  lectureHours: number; // L-T-P format
  tutorialHours: number;
  practicalHours: number;
  
  // Prerequisites
  prerequisites: SubjectPrerequisite[];
  isPrerequisiteFor: SubjectPrerequisite[];
  
  // Assessment Configuration
  continuousAssessmentWeight: number; // 40%
  endSemesterExamWeight: number; // 60%
  assessmentPattern: AssessmentPattern;
  
  // Availability
  isOffered: boolean;
  offeredInYears: number[]; // [1, 2, 3, 4]
  
  // Faculty Assignment
  assignedFaculties: SubjectFaculty[];
  
  // NEP Compliance Validation
  nepValidation: SubjectNEPValidation;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface SubjectPrerequisite {
  id: string;
  subjectId: string;
  prerequisiteId: string;
  prerequisite: SubjectDetails;
  isMandatory: boolean;
  createdAt: Date;
}

export interface SubjectFaculty {
  id: string;
  subjectId: string;
  facultyId: string;
  faculty: FacultyProfile;
  isPrimary: boolean;
  canTeach: boolean;
  createdAt: Date;
}

export interface AssessmentPattern {
  continuousAssessment: {
    weight: number;
    components: AssessmentComponent[];
  };
  endSemesterExam: {
    weight: number;
    duration: number; // in minutes
    maxMarks: number;
  };
  totalMarks: number;
  passingMarks: number;
  gradeScale: GradeScale[];
}

export interface AssessmentComponent {
  name: string;
  weight: number;
  maxMarks: number;
  frequency: 'WEEKLY' | 'MONTHLY' | 'ONCE' | 'MULTIPLE';
  description: string;
}

export interface GradeScale {
  grade: string;
  minMarks: number;
  maxMarks: number;
  gradePoints: number;
  description: string;
}

export interface SubjectNEPValidation {
  isValid: boolean;
  creditDistribution: {
    core: number;
    elective: number;
    skill: number;
  };
  assessmentCompliance: boolean;
  prerequisiteValidation: boolean;
  facultyAvailability: boolean;
  violations: string[];
  recommendations: string[];
}

// ================================
// TIMETABLE REQUEST INTERFACE
// ================================

export interface TimetableRequest {
  id: string;
  organizationId: string;
  academicYearId: string;
  semesterId?: string;
  
  // Request Parameters
  name: string;
  description?: string;
  year?: number; // Specific year (1, 2, 3, 4)
  departmentId?: string;
  
  // Generation Preferences
  preferences: TimetablePreferences;
  
  // Constraints
  constraints: ConstraintRule[];
  
  // Target Audience
  targetStudents?: string[]; // Student IDs
  targetFaculties?: string[]; // Faculty IDs
  targetSubjects?: string[]; // Subject IDs
  
  // Optimization Parameters
  optimization: OptimizationParameters;
  
  // Request Metadata
  requestedBy: string; // User ID
  requestedAt: Date;
  priority: Priority;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  
  // Results
  generatedTimetable?: GeneratedTimetable;
  errors?: string[];
  warnings?: string[];
}

export interface TimetablePreferences {
  // Time Preferences
  preferredTimeSlots: string[]; // Time slot IDs
  avoidTimeSlots: string[]; // Time slot IDs to avoid
  
  // Room Preferences
  preferredRooms: string[]; // Room IDs
  avoidRooms: string[]; // Room IDs to avoid
  
  // Faculty Preferences
  preferredFaculties: string[]; // Faculty IDs
  avoidFaculties: string[]; // Faculty IDs to avoid
  
  // Subject Preferences
  subjectGrouping: boolean; // Group related subjects together
  practicalBlocking: boolean; // Block practical sessions
  
  // NEP Compliance
  enforceNEPCompliance: boolean;
  strictCreditDistribution: boolean;
  
  // Quality Preferences
  minimizeConflicts: boolean;
  optimizeFacultyWorkload: boolean;
  optimizeRoomUtilization: boolean;
  balanceStudentLoad: boolean;
}

export interface OptimizationParameters {
  maxIterations: number;
  convergenceThreshold: number;
  populationSize: number;
  mutationRate: number;
  crossoverRate: number;
  elitismRate: number;
  weights: {
    conflictPenalty: number;
    workloadPenalty: number;
    utilizationPenalty: number;
    preferenceBonus: number;
    nepComplianceBonus: number;
  };
}

// ================================
// CONFLICT RULE INTERFACE
// ================================

export interface ConflictRule {
  id: string;
  organizationId: string;
  name: string;
  type: ConstraintType;
  description?: string;
  
  // Rule Configuration
  config: ConstraintConfig;
  
  // Priority and Weight
  priority: number; // 1 = highest priority
  weight: number; // Weight in optimization (0.0 - 1.0)
  
  // Activation
  isActive: boolean;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
  
  // Scope
  appliesTo: {
    departments?: string[];
    years?: number[];
    semesters?: string[];
    subjects?: string[];
    faculties?: string[];
    rooms?: string[];
  };
  
  // Validation
  validationRules: ValidationRule[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ConstraintConfig {
  // Faculty Constraints
  maxHoursPerDay?: number;
  maxHoursPerWeek?: number;
  minBreakBetweenClasses?: number; // in minutes
  lunchBreakRequired?: boolean;
  lunchBreakDuration?: number; // in minutes
  
  // Room Constraints
  maxCapacity?: number;
  requiredEquipment?: string[];
  accessibilityRequired?: boolean;
  noDoubleBooking?: boolean;
  
  // Student Constraints
  maxHoursPerDay?: number;
  maxCreditsPerSemester?: number;
  minCreditsPerSemester?: number;
  noBackToBackClasses?: boolean;
  
  // NEP Constraints
  corePercentage?: number;
  electivePercentage?: number;
  skillPercentage?: number;
  continuousAssessmentWeight?: number;
  endSemesterExamWeight?: number;
  
  // Academic Constraints
  prerequisiteEnforcement?: boolean;
  subjectConflictPrevention?: boolean;
  assessmentScheduling?: {
    continuousAssessmentGap?: number; // days between assessments
    endSemesterExamGap?: number; // days before exam
  };
  
  // Institutional Constraints
  departmentPreferences?: Record<string, number>; // department -> priority
  crossDepartmentElectives?: boolean;
  interdisciplinaryCourses?: boolean;
  projectWorkScheduling?: {
    minBlockDuration?: number; // hours
    maxBlockDuration?: number; // hours
  };
}

export interface ValidationRule {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'GREATER_THAN_OR_EQUALS' | 'LESS_THAN_OR_EQUALS' | 'IN' | 'NOT_IN' | 'CONTAINS' | 'NOT_CONTAINS';
  value: any;
  errorMessage: string;
}

// ================================
// SCHEDULE SLOT INTERFACE
// ================================

export interface ScheduleSlot {
  id: string;
  timetableId: string;
  timeSlotId: string;
  timeSlot: TimeSlot;
  
  // Timing
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  duration: number; // in minutes
  
  // Class Information
  subjectId: string;
  subject: SubjectDetails;
  facultyId: string;
  faculty: FacultyProfile;
  roomId: string;
  room: Room;
  
  // Class Details
  classType: ClassType;
  isOnline: boolean;
  maxStudents: number;
  enrolledStudents: number;
  
  // Metadata
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  
  // Conflict Tracking
  hasConflicts: boolean;
  conflictDetails: ConflictDetail[];
  
  // Attendance Tracking
  attendanceRequired: boolean;
  attendanceRecords: AttendanceRecord[];
  
  // Assessment
  isAssessmentSlot: boolean;
  assessmentType?: 'CONTINUOUS' | 'END_SEMESTER';
  assessmentWeight?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  id: string;
  organizationId: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  dayOfWeek?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  type: RoomType;
  capacity: number;
  floor?: number;
  building?: string;
  equipment: string[];
  isAccessible: boolean;
  availability: RoomAvailability[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomAvailability {
  id: string;
  roomId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringPattern {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval: number;
  daysOfWeek?: number[];
  endDate?: Date;
  exceptions?: Date[];
}

export interface ConflictDetail {
  type: 'FACULTY_CONFLICT' | 'ROOM_CONFLICT' | 'STUDENT_CONFLICT' | 'SUBJECT_CONFLICT' | 'TIME_CONFLICT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  conflictingSlotId?: string;
  conflictingEntityId?: string;
  conflictingEntityType?: string;
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  action: 'RESCHEDULE' | 'CHANGE_ROOM' | 'CHANGE_FACULTY' | 'CANCEL' | 'ACCEPT';
  reason: string;
  resolvedBy: string;
  resolvedAt: Date;
  newSlotDetails?: Partial<ScheduleSlot>;
}

// ================================
// GENERATED TIMETABLE INTERFACE
// ================================

export interface GeneratedTimetable {
  id: string;
  organizationId: string;
  academicYearId: string;
  semesterId?: string;
  
  // Timetable Information
  name: string;
  description?: string;
  year?: number;
  departmentId?: string;
  department?: Department;
  
  // Status and Metadata
  status: TimetableStatus;
  version: number;
  generatedAt: Date;
  generatedBy: string;
  
  // Optimization Results
  totalConflicts: number;
  constraintViolations: ConstraintViolation[];
  optimizationScore: number; // 0-100
  qualityMetrics: TimetableQualityMetrics;
  
  // Schedule Data
  slots: ScheduleSlot[];
  
  // NEP Compliance
  nepCompliance: TimetableNEPCompliance;
  
  // Statistics
  statistics: TimetableStatistics;
  
  // Validation Results
  validation: TimetableValidation;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ConstraintViolation {
  constraintId: string;
  constraintName: string;
  constraintType: ConstraintType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedSlots: string[];
  suggestedResolution?: string;
}

export interface TimetableQualityMetrics {
  facultyWorkloadBalance: number; // 0-100
  roomUtilization: number; // 0-100
  studentLoadBalance: number; // 0-100
  conflictScore: number; // 0-100 (lower is better)
  preferenceSatisfaction: number; // 0-100
  nepComplianceScore: number; // 0-100
  overallScore: number; // 0-100
}

export interface TimetableNEPCompliance {
  isCompliant: boolean;
  creditDistribution: {
    core: number;
    elective: number;
    skill: number;
  };
  assessmentPatternCompliance: boolean;
  prerequisiteCompliance: boolean;
  facultyWorkloadCompliance: boolean;
  violations: string[];
  recommendations: string[];
  complianceScore: number; // 0-100
}

export interface TimetableStatistics {
  totalSlots: number;
  totalHours: number;
  averageSlotsPerDay: number;
  facultyUtilization: Record<string, number>; // facultyId -> hours
  roomUtilization: Record<string, number>; // roomId -> hours
  subjectDistribution: Record<string, number>; // subjectId -> slots
  classTypeDistribution: Record<ClassType, number>;
  conflictCount: number;
  resolutionCount: number;
}

export interface TimetableValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  passedChecks: string[];
  failedChecks: string[];
  overallScore: number; // 0-100
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedSlots: string[];
  suggestedFix?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  affectedSlots: string[];
  suggestedImprovement?: string;
}

// ================================
// VALIDATION UTILITIES
// ================================

export interface NEPValidationRules {
  // Credit Limits
  minCreditsPerSemester: number;
  maxCreditsPerSemester: number;
  totalCreditsForDegree: number;
  
  // Daily Limits
  maxHoursPerDay: number; // 6 hours
  minBreakBetweenClasses: number; // in minutes
  
  // Practical Requirements
  minPracticalBlockDuration: number; // 2 hours
  practicalSessionGap: number; // minimum gap between practicals
  
  // Attendance Requirements
  minAttendancePercentage: number; // 75%
  attendanceTrackingRequired: boolean;
  
  // Assessment Pattern
  continuousAssessmentWeight: number; // 40%
  endSemesterExamWeight: number; // 60%
  assessmentGapDays: number; // minimum days between assessments
  
  // NEP Distribution
  corePercentage: number; // 60%
  electivePercentage: number; // 30%
  skillPercentage: number; // 10%
  
  // Faculty Constraints
  maxFacultyHoursPerWeek: number;
  minFacultyHoursPerWeek: number;
  facultyLunchBreakRequired: boolean;
  facultyLunchBreakDuration: number; // in minutes
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100
  recommendations: string[];
}

// ================================
// UTILITY TYPES
// ================================

export type TimetableRequestStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type ConflictSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ValidationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AssessmentType = 'CONTINUOUS' | 'END_SEMESTER';
export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type ConflictAction = 'RESCHEDULE' | 'CHANGE_ROOM' | 'CHANGE_FACULTY' | 'CANCEL' | 'ACCEPT';

// ================================
// API RESPONSE TYPES
// ================================

export interface TimetableGenerationResponse {
  success: boolean;
  timetable?: GeneratedTimetable;
  errors?: string[];
  warnings?: string[];
  processingTime: number; // in milliseconds
  optimizationIterations: number;
  finalScore: number;
}

export interface NEPComplianceResponse {
  isCompliant: boolean;
  complianceScore: number;
  violations: string[];
  recommendations: string[];
  detailedBreakdown: {
    creditDistribution: {
      core: { current: number; required: number; percentage: number };
      elective: { current: number; required: number; percentage: number };
      skill: { current: number; required: number; percentage: number };
    };
    assessmentPattern: {
      continuous: { current: number; required: number };
      endSemester: { current: number; required: number };
    };
    attendance: {
      current: number;
      required: number;
      status: 'COMPLIANT' | 'NON_COMPLIANT';
    };
  };
}

export interface ConflictResolutionResponse {
  success: boolean;
  resolvedConflicts: number;
  remainingConflicts: number;
  resolutionActions: ConflictResolution[];
  updatedTimetable?: GeneratedTimetable;
  errors?: string[];
}

