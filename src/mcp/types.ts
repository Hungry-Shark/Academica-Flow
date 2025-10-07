/**
 * Model Context Protocol (MCP) Types and Interfaces
 * Defines data structures for real-time external system integration
 */

// ================================
// CORE MCP TYPES
// ================================

export interface MCPConnection {
  id: string;
  name: string;
  type: 'NEP_POLICY' | 'ERP_SYSTEM' | 'HR_SYSTEM' | 'FACILITY_MANAGEMENT' | 'ACADEMIC_CALENDAR' | 'EXAMINATION_SYSTEM';
  endpoint: string;
  apiKey?: string;
  credentials?: MCPCredentials;
  isActive: boolean;
  lastSync: Date;
  version: string;
  retryCount: number;
  maxRetries: number;
  timeout: number;
  cacheExpiry: number;
}

export interface MCPCredentials {
  username?: string;
  password?: string;
  apiKey?: string;
  token?: string;
  clientId?: string;
  clientSecret?: string;
  certificate?: string;
  privateKey?: string;
}

export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: MCPError;
  metadata: MCPResponseMetadata;
  timestamp: Date;
}

export interface MCPResponseMetadata {
  requestId: string;
  source: string;
  version: string;
  cacheHit: boolean;
  processingTime: number;
  rateLimitRemaining?: number;
  rateLimitReset?: Date;
}

export interface MCPError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  statusCode?: number;
  timestamp: Date;
}

// ================================
// NEP POLICY CONNECTOR TYPES
// ================================

export interface NEPPolicyData {
  id: string;
  version: string;
  title: string;
  description: string;
  effectiveDate: Date;
  expiryDate?: Date;
  category: NEPPolicyCategory;
  requirements: NEPRequirement[];
  complianceRules: NEPComplianceRule[];
  lastUpdated: Date;
  source: string;
  status: 'ACTIVE' | 'DRAFT' | 'DEPRECATED' | 'EXPIRED';
}

export interface NEPPolicyCategory {
  id: string;
  name: string;
  description: string;
  parentCategory?: string;
  weight: number;
}

export interface NEPRequirement {
  id: string;
  title: string;
  description: string;
  type: 'CREDIT_DISTRIBUTION' | 'ASSESSMENT_PATTERN' | 'ATTENDANCE' | 'PREREQUISITES' | 'FACULTY_QUALIFICATION' | 'INFRASTRUCTURE';
  mandatory: boolean;
  weight: number;
  validationRules: ValidationRule[];
  applicableTo: string[]; // Department IDs, Year levels, etc.
}

export interface NEPComplianceRule {
  id: string;
  name: string;
  description: string;
  condition: string; // JSON logic expression
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
  action: 'BLOCK' | 'WARN' | 'NOTIFY' | 'LOG';
  parameters: Record<string, any>;
}

export interface ValidationRule {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'GREATER_THAN_OR_EQUALS' | 'LESS_THAN_OR_EQUALS' | 'IN' | 'NOT_IN' | 'CONTAINS' | 'NOT_CONTAINS' | 'REGEX';
  value: any;
  errorMessage: string;
}

export interface NEPComplianceCheck {
  policyId: string;
  requirementId: string;
  isCompliant: boolean;
  score: number;
  violations: NEPViolation[];
  recommendations: string[];
  checkedAt: Date;
  context: Record<string, any>;
}

export interface NEPViolation {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
  message: string;
  field: string;
  expectedValue: any;
  actualValue: any;
  suggestion: string;
}

// ================================
// EXTERNAL SYSTEM CONNECTOR TYPES
// ================================

export interface ERPStudentData {
  studentId: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  currentYear: number;
  currentSemester: number;
  admissionYear: number;
  departmentId: string;
  departmentName: string;
  programId: string;
  programName: string;
  isActive: boolean;
  academicStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'DROPPED';
  cgpa?: number;
  creditsEarned: number;
  lastUpdated: Date;
}

export interface HRFacultyData {
  facultyId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation: string;
  departmentId: string;
  departmentName: string;
  qualification: string;
  specializations: string[];
  joiningDate: Date;
  isActive: boolean;
  maxHoursPerWeek: number;
  currentWorkload: number;
  availability: FacultyAvailabilityWindow[];
  lastUpdated: Date;
}

export interface FacultyAvailabilityWindow {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  isAvailable: boolean;
  reason?: string;
}

export interface FacilityRoomData {
  roomId: string;
  name: string;
  code: string;
  type: 'LECTURE_HALL' | 'TUTORIAL_ROOM' | 'LABORATORY' | 'SEMINAR_HALL' | 'LIBRARY' | 'AUDITORIUM' | 'CONFERENCE_ROOM' | 'COMPUTER_LAB' | 'RESEARCH_LAB';
  capacity: number;
  floor: number;
  building: string;
  departmentId?: string;
  equipment: string[];
  isAccessible: boolean;
  isActive: boolean;
  availability: RoomAvailabilityWindow[];
  lastUpdated: Date;
}

export interface RoomAvailabilityWindow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reason?: string;
  bookingId?: string;
}

export interface AcademicCalendarData {
  eventId: string;
  title: string;
  description?: string;
  type: 'SEMESTER_START' | 'SEMESTER_END' | 'EXAMINATION' | 'HOLIDAY' | 'BREAK' | 'REGISTRATION' | 'RESULT_DECLARATION' | 'CUSTOM';
  startDate: Date;
  endDate: Date;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  affectedDepartments: string[];
  affectedYears: number[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  lastUpdated: Date;
}

export interface RecurringPattern {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  daysOfWeek?: number[];
  endDate?: Date;
  exceptions?: Date[];
}

export interface ExaminationScheduleData {
  examId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  examType: 'MID_TERM' | 'END_TERM' | 'QUIZ' | 'ASSIGNMENT' | 'PROJECT' | 'VIVA';
  startDate: Date;
  endDate: Date;
  duration: number; // in minutes
  venue: string;
  roomId?: string;
  invigilatorId?: string;
  invigilatorName?: string;
  maxStudents: number;
  registeredStudents: string[];
  departmentId: string;
  year: number;
  semester: number;
  isOnline: boolean;
  lastUpdated: Date;
}

// ================================
// MCP SERVER TYPES
// ================================

export interface MCPServerConfig {
  port: number;
  host: string;
  maxConnections: number;
  rateLimitPerMinute: number;
  cacheSize: number;
  cacheTTL: number;
  enableAuditLog: boolean;
  enableMetrics: boolean;
  sslEnabled: boolean;
  sslCertPath?: string;
  sslKeyPath?: string;
  corsOrigins: string[];
  apiVersion: string;
}

export interface MCPAuthentication {
  method: 'API_KEY' | 'JWT' | 'OAUTH2' | 'BASIC' | 'CERTIFICATE';
  credentials: MCPCredentials;
  expiresAt?: Date;
  permissions: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}

export interface MCPAuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  userAgent: string;
  requestBody?: any;
  responseBody?: any;
  error?: MCPError;
}

export interface MCPMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  activeConnections: number;
  dataSyncCount: number;
  lastSyncTime: Date;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

// ================================
// LIVE DATA SYNCHRONIZER TYPES
// ================================

export interface SyncEvent {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE';
  source: string;
  resourceType: 'STUDENT' | 'FACULTY' | 'ROOM' | 'SUBJECT' | 'POLICY' | 'CALENDAR' | 'EXAMINATION';
  resourceId: string;
  data: any;
  timestamp: Date;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  retryCount: number;
  maxRetries: number;
  processed: boolean;
  error?: MCPError;
}

export interface SyncConfiguration {
  enabled: boolean;
  interval: number; // in milliseconds
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
  parallelSync: boolean;
  maxConcurrentSyncs: number;
  dataValidation: boolean;
  conflictResolution: 'LAST_WINS' | 'MANUAL' | 'MERGE' | 'REJECT';
  notificationEnabled: boolean;
  webhookUrl?: string;
}

export interface DataValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100
  recommendations: string[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  value?: any;
  expectedValue?: any;
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion: string;
  value?: any;
}

// ================================
// CACHE AND RATE LIMITING TYPES
// ================================

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: Date;
  expiry: Date;
  version: string;
  source: string;
  accessCount: number;
  lastAccessed: Date;
}

export interface RateLimitInfo {
  key: string;
  requests: number;
  windowStart: Date;
  windowEnd: Date;
  limit: number;
  remaining: number;
  resetTime: Date;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors: string[];
}

// ================================
// NOTIFICATION TYPES
// ================================

export interface MCPNotification {
  id: string;
  type: 'SYNC_SUCCESS' | 'SYNC_FAILURE' | 'POLICY_UPDATE' | 'DATA_CHANGE' | 'SYSTEM_ALERT' | 'COMPLIANCE_VIOLATION';
  title: string;
  message: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: Date;
  source: string;
  data?: any;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  parameters?: Record<string, any>;
}

// ================================
// UTILITY TYPES
// ================================

export type MCPConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR' | 'RATE_LIMITED';
export type SyncStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type DataSource = 'NEP_POLICY' | 'ERP_SYSTEM' | 'HR_SYSTEM' | 'FACILITY_MANAGEMENT' | 'ACADEMIC_CALENDAR' | 'EXAMINATION_SYSTEM';
export type ResourceType = 'STUDENT' | 'FACULTY' | 'ROOM' | 'SUBJECT' | 'POLICY' | 'CALENDAR' | 'EXAMINATION';
export type EventType = 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE';
