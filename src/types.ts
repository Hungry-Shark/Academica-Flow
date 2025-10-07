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
  profileImageUrl?: string; // URL of the user's profile image
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

// Timetable Generation Component Props
export interface TimetableGeneratorProps {
  user: UserProfile;
  onClose: () => void;
}

// Faculty Timetable Generator specific types
export interface FacultyPreferences {
  preferredTimeSlots: string[];
  avoidTimeSlots: string[];
  preferredDays: string[];
  avoidDays: string[];
  maxConsecutiveHours: number;
  preferMorningSlots: boolean;
  preferEveningSlots: boolean;
  breakBetweenClasses: number;
  avoidBackToBackClasses: boolean;
  preferOnlineClasses: boolean;
  preferLabSessions: boolean;
}

export interface FacultyConstraints {
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  minBreakBetweenClasses: number;
  lunchBreakRequired: boolean;
  lunchBreakDuration: number;
  noWeekendClasses: boolean;
  maxConsecutiveDays: number;
}

export interface FacultyScheduleSlot {
  id: string;
  day: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  duration: number;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectType: 'LECTURE' | 'TUTORIAL' | 'PRACTICAL' | 'LABORATORY' | 'SEMINAR';
  facultyId: string;
  facultyName: string;
  roomId: string;
  roomName: string;
  roomCapacity: number;
  isOnline: boolean;
  isRecurring: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
  studentCount?: number;
  classType: 'REGULAR' | 'MAKEUP' | 'EXTRA' | 'ASSESSMENT';
}

export interface FacultyScheduleResult {
  success: boolean;
  facultyId: string;
  semester: string;
  academicYear: string;
  schedule: FacultyScheduleSlot[];
  summary: FacultyScheduleSummary;
  conflicts: FacultyConflict[];
  recommendations: string[];
  nepCompliance: any; // NEPValidationResult from nep-interfaces
  processingTime: number;
  metadata: FacultyScheduleMetadata;
}

export interface FacultyScheduleSummary {
  totalHours: number;
  totalClasses: number;
  totalCredits: number;
  subjectDistribution: SubjectDistribution;
  timeDistribution: TimeDistribution;
  dayDistribution: DayDistribution;
  workloadBalance: number;
  preferencesMet: number;
  nepComplianceScore: number;
  teachingLoad: number;
  researchTime: number;
  administrativeTime: number;
}

export interface SubjectDistribution {
  core: number;
  elective: number;
  skillBased: number;
  total: number;
}

export interface TimeDistribution {
  morning: number;
  afternoon: number;
  evening: number;
}

export interface DayDistribution {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface FacultyConflict {
  type: 'TIME_CONFLICT' | 'WORKLOAD_OVERLOAD' | 'ROOM_CONFLICT' | 'STUDENT_CONFLICT' | 'NEP_VIOLATION';
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  message: string;
  affectedSlot: string;
  suggestedResolution: string;
  details: Record<string, any>;
}

export interface FacultyScheduleMetadata {
  generatedAt: Date;
  facultyName: string;
  departmentName: string;
  assignedSubjects: string[];
  totalCredits: number;
  roomsUsed: string[];
  optimizationApplied: boolean;
  constraintsViolated: number;
  preferencesMet: number;
  teachingLoad: number;
  researchTime: number;
  administrativeTime: number;
}

// Student Timetable Generator specific types
export interface SubjectSelection {
  subjectId: string;
  subject: any; // SubjectDetails from nep-interfaces
  isSelected: boolean;
  prerequisites: string[];
  prerequisitesMet: boolean;
}

export interface CreditSummary {
  current: number;
  required: number;
  byCategory: {
    core: { current: number; required: number };
    elective: { current: number; required: number };
    skill: { current: number; required: number };
  };
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

export interface StudentScheduleResult {
  success: boolean;
  studentId: string;
  semester: string;
  schedule: StudentScheduleSlot[];
  summary: StudentScheduleSummary;
  conflicts: StudentConflict[];
  recommendations: string[];
  nepCompliance: any; // NEPValidationResult from nep-interfaces
  processingTime: number;
  metadata: StudentScheduleMetadata;
}

export interface StudentScheduleSlot {
  id: string;
  day: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  duration: number;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectType: 'LECTURE' | 'TUTORIAL' | 'PRACTICAL' | 'LABORATORY' | 'SEMINAR';
  facultyId: string;
  facultyName: string;
  roomId: string;
  roomName: string;
  roomCapacity: number;
  isOnline: boolean;
  isRecurring: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}

export interface StudentScheduleSummary {
  totalHours: number;
  totalClasses: number;
  totalCredits: number;
  subjectDistribution: SubjectDistribution;
  timeDistribution: TimeDistribution;
  dayDistribution: DayDistribution;
  facultyDistribution: FacultyDistribution;
  workloadBalance: number;
  preferencesMet: number;
  nepComplianceScore: number;
}

export interface FacultyDistribution {
  [facultyId: string]: {
    name: string;
    hours: number;
    subjects: string[];
  };
}

export interface StudentConflict {
  type: 'TIME_CONFLICT' | 'CREDIT_OVERLOAD' | 'PREREQUISITE_NOT_MET' | 'NEP_VIOLATION' | 'FACULTY_UNAVAILABLE';
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  message: string;
  affectedSlot: string;
  suggestedResolution: string;
  details: Record<string, any>;
}

export interface StudentScheduleMetadata {
  generatedAt: Date;
  studentName: string;
  departmentName: string;
  chosenSubjects: string[];
  totalCredits: number;
  facultiesInvolved: string[];
  roomsUsed: string[];
  optimizationApplied: boolean;
  constraintsViolated: number;
  preferencesMet: number;
}

// Batch Timetable Generator specific types
export interface BatchSelection {
  year: number;
  departmentId: string;
  department: any; // Department from nep-interfaces
  studentCount: number;
  isSelected: boolean;
}

export interface GenerationProgress {
  batchId: string;
  batchName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  conflicts: number;
  errors: string[];
}

export interface ResourceUtilization {
  facultyUtilization: Record<string, number>;
  roomUtilization: Record<string, number>;
  averageWorkload: number;
  conflictCount: number;
  optimizationScore: number;
}

export interface ConflictResolution {
  totalConflicts: number;
  resolvedConflicts: number;
  remainingConflicts: number;
  conflicts: any[]; // ConstraintViolation from nep-interfaces
}

// Timetable Visualization specific types
export interface HoverDetails {
  slot: any; // ScheduleSlot from nep-interfaces
  x: number;
  y: number;
}

export interface TimetableVisualizationProps {
  timetable: any; // GeneratedTimetable from nep-interfaces
  onClose: () => void;
  isEditable?: boolean;
  onSlotClick?: (slot: any) => void;
  onSlotEdit?: (slot: any) => void;
}

// Analytics and Optimization Types
export interface TimetableAnalytics {
  resourceUtilization: ResourceUtilizationReport;
  studentWorkload: StudentWorkloadAnalysis;
  nepCompliance: NEPComplianceScoring;
  conflictPatterns: ConflictPatternAnalysis;
  scheduleEfficiency: ScheduleEfficiencyMetrics;
  generatedAt: Date;
  organizationId: string;
  semester: string;
  academicYear: string;
}

export interface ResourceUtilizationReport {
  roomUtilization: RoomUtilization[];
  facultyUtilization: FacultyUtilization[];
  overallUtilization: number;
  peakHours: TimeSlotUtilization[];
  underutilizedResources: UnderutilizedResource[];
  recommendations: string[];
}

export interface RoomUtilization {
  roomId: string;
  roomName: string;
  capacity: number;
  utilizationPercentage: number;
  totalHoursUsed: number;
  peakHours: string[];
  averageOccupancy: number;
  efficiency: number;
}

export interface FacultyUtilization {
  facultyId: string;
  facultyName: string;
  department: string;
  totalHours: number;
  maxHours: number;
  utilizationPercentage: number;
  workloadBalance: number;
  teachingLoad: number;
  researchTime: number;
  administrativeTime: number;
  efficiency: number;
}

export interface TimeSlotUtilization {
  timeSlot: string;
  utilizationPercentage: number;
  roomCount: number;
  facultyCount: number;
  studentCount: number;
}

export interface UnderutilizedResource {
  type: 'ROOM' | 'FACULTY';
  id: string;
  name: string;
  utilizationPercentage: number;
  potentialHours: number;
  recommendations: string[];
}

export interface StudentWorkloadAnalysis {
  averageDailyHours: number;
  workloadDistribution: WorkloadDistribution;
  breakTimeAnalysis: BreakTimeAnalysis;
  travelTimeAnalysis: TravelTimeAnalysis;
  stressIndicators: StressIndicator[];
  recommendations: string[];
}

export interface WorkloadDistribution {
  light: number; // < 4 hours
  moderate: number; // 4-6 hours
  heavy: number; // 6-8 hours
  excessive: number; // > 8 hours
}

export interface BreakTimeAnalysis {
  averageBreakTime: number;
  insufficientBreaks: number;
  optimalBreakDistribution: boolean;
  lunchBreakCompliance: number;
  recommendations: string[];
}

export interface TravelTimeAnalysis {
  averageTravelTime: number;
  excessiveTravel: number;
  optimalRoomAllocation: boolean;
  recommendations: string[];
}

export interface StressIndicator {
  type: 'BACK_TO_BACK_CLASSES' | 'LONG_DAYS' | 'INSUFFICIENT_BREAKS' | 'EXCESSIVE_TRAVEL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  count: number;
  affectedStudents: number;
  recommendations: string[];
}

export interface NEPComplianceScoring {
  overallScore: number;
  departmentScores: DepartmentComplianceScore[];
  complianceAreas: ComplianceArea[];
  violations: NEPViolation[];
  recommendations: string[];
  lastUpdated: Date;
}

export interface DepartmentComplianceScore {
  departmentId: string;
  departmentName: string;
  score: number;
  coreCredits: number;
  electiveCredits: number;
  skillCredits: number;
  totalCredits: number;
  compliancePercentage: number;
}

export interface ComplianceArea {
  area: string;
  score: number;
  weight: number;
  details: string;
  status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
}

export interface NEPViolation {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedStudents: number;
  suggestedFix: string;
  priority: number;
}

export interface ConflictPatternAnalysis {
  totalConflicts: number;
  conflictTypes: ConflictType[];
  recurringConflicts: RecurringConflict[];
  resolutionRate: number;
  preventionStrategies: string[];
}

export interface ConflictType {
  type: 'FACULTY_DOUBLE_BOOKING' | 'ROOM_DOUBLE_BOOKING' | 'STUDENT_SCHEDULE_CONFLICT' | 'RESOURCE_OVERALLOCATION';
  count: number;
  percentage: number;
  averageResolutionTime: number;
  commonCauses: string[];
}

export interface RecurringConflict {
  pattern: string;
  frequency: number;
  affectedResources: string[];
  suggestedResolution: string;
  priority: number;
}

export interface ScheduleEfficiencyMetrics {
  overallEfficiency: number;
  timeSlotEfficiency: TimeSlotEfficiency[];
  resourceEfficiency: ResourceEfficiency[];
  studentEfficiency: StudentEfficiency;
  facultyEfficiency: FacultyEfficiency;
  recommendations: string[];
}

export interface TimeSlotEfficiency {
  timeSlot: string;
  efficiency: number;
  utilization: number;
  conflicts: number;
  optimal: boolean;
}

export interface ResourceEfficiency {
  resourceId: string;
  resourceName: string;
  type: 'ROOM' | 'FACULTY';
  efficiency: number;
  utilization: number;
  waste: number;
  potential: number;
}

export interface StudentEfficiency {
  averageEfficiency: number;
  timeWaste: number;
  travelEfficiency: number;
  breakEfficiency: number;
  studyTimeEfficiency: number;
}

export interface FacultyEfficiency {
  averageEfficiency: number;
  teachingEfficiency: number;
  researchTimeEfficiency: number;
  administrativeEfficiency: number;
  workloadBalance: number;
}

// Predictive Optimization Types
export interface PredictiveOptimization {
  enrollmentPredictions: EnrollmentPrediction[];
  roomAllocationSuggestions: RoomAllocationSuggestion[];
  facultyWorkloadRecommendations: FacultyWorkloadRecommendation[];
  scheduleTemplates: ScheduleTemplate[];
  capacityPlanning: CapacityPlanningInsight[];
  generatedAt: Date;
  organizationId: string;
  semester: string;
  academicYear: string;
}

export interface EnrollmentPrediction {
  courseId: string;
  courseName: string;
  predictedEnrollment: number;
  confidence: number;
  historicalTrend: number[];
  factors: PredictionFactor[];
  recommendations: string[];
}

export interface PredictionFactor {
  factor: string;
  impact: number;
  weight: number;
  description: string;
}

export interface RoomAllocationSuggestion {
  roomId: string;
  roomName: string;
  currentUtilization: number;
  suggestedUtilization: number;
  improvement: number;
  suggestedCourses: string[];
  reasoning: string;
  priority: number;
}

export interface FacultyWorkloadRecommendation {
  facultyId: string;
  facultyName: string;
  currentWorkload: number;
  recommendedWorkload: number;
  adjustment: number;
  suggestedCourses: string[];
  reasoning: string;
  priority: number;
}

export interface ScheduleTemplate {
  templateId: string;
  name: string;
  description: string;
  department: string;
  year: number;
  efficiency: number;
  template: TimetableData;
  usageCount: number;
  successRate: number;
}

export interface CapacityPlanningInsight {
  resourceType: 'ROOM' | 'FACULTY' | 'EQUIPMENT';
  resourceId: string;
  resourceName: string;
  currentCapacity: number;
  projectedDemand: number;
  capacityGap: number;
  recommendations: string[];
  priority: number;
  timeline: string;
}

// Student Experience Optimizer Types
export interface StudentExperienceOptimizer {
  travelTimeOptimization: TravelTimeOptimization;
  workloadBalancing: WorkloadBalancing;
  breakTimingOptimization: BreakTimingOptimization;
  preferenceConsideration: PreferenceConsideration;
  groupStudyAllocation: GroupStudyAllocation;
  generatedAt: Date;
  organizationId: string;
  semester: string;
  academicYear: string;
}

export interface TravelTimeOptimization {
  currentAverageTravelTime: number;
  optimizedAverageTravelTime: number;
  improvement: number;
  roomReassignments: RoomReassignment[];
  timeSlotAdjustments: TimeSlotAdjustment[];
  recommendations: string[];
}

export interface RoomReassignment {
  courseId: string;
  courseName: string;
  currentRoom: string;
  suggestedRoom: string;
  travelTimeReduction: number;
  reasoning: string;
}

export interface TimeSlotAdjustment {
  courseId: string;
  courseName: string;
  currentTimeSlot: string;
  suggestedTimeSlot: string;
  travelTimeReduction: number;
  reasoning: string;
}

export interface WorkloadBalancing {
  currentWorkloadDistribution: WorkloadDistribution;
  optimizedWorkloadDistribution: WorkloadDistribution;
  improvement: number;
  dailyAdjustments: DailyAdjustment[];
  recommendations: string[];
}

export interface DailyAdjustment {
  day: string;
  currentHours: number;
  suggestedHours: number;
  adjustment: number;
  reasoning: string;
}

export interface BreakTimingOptimization {
  currentBreakDistribution: BreakDistribution;
  optimizedBreakDistribution: BreakDistribution;
  improvement: number;
  breakAdjustments: BreakAdjustment[];
  recommendations: string[];
}

export interface BreakDistribution {
  morning: number;
  afternoon: number;
  evening: number;
  total: number;
}

export interface BreakAdjustment {
  day: string;
  timeSlot: string;
  currentBreak: number;
  suggestedBreak: number;
  reasoning: string;
}

export interface PreferenceConsideration {
  studentPreferences: StudentPreference[];
  facultyPreferences: FacultyPreference[];
  roomPreferences: RoomPreference[];
  satisfactionScore: number;
  recommendations: string[];
}

export interface StudentPreference {
  preference: string;
  weight: number;
  satisfaction: number;
  impact: number;
  recommendations: string[];
}

export interface FacultyPreference {
  preference: string;
  weight: number;
  satisfaction: number;
  impact: number;
  recommendations: string[];
}

export interface RoomPreference {
  preference: string;
  weight: number;
  satisfaction: number;
  impact: number;
  recommendations: string[];
}

export interface GroupStudyAllocation {
  currentGroupStudyTime: number;
  optimizedGroupStudyTime: number;
  improvement: number;
  groupStudySlots: GroupStudySlot[];
  recommendations: string[];
}

export interface GroupStudySlot {
  day: string;
  timeSlot: string;
  duration: number;
  capacity: number;
  utilization: number;
  efficiency: number;
}

// Reporting Dashboard Types
export interface ReportingDashboard {
  visualAnalytics: VisualAnalytics;
  exportableReports: ExportableReport[];
  complianceTracking: ComplianceTracking;
  performanceMetrics: PerformanceMetrics;
  administrativeInsights: AdministrativeInsight[];
  generatedAt: Date;
  organizationId: string;
  semester: string;
  academicYear: string;
}

export interface VisualAnalytics {
  charts: Chart[];
  graphs: Graph[];
  heatmaps: Heatmap[];
  dashboards: Dashboard[];
}

export interface Chart {
  id: string;
  type: 'BAR' | 'LINE' | 'PIE' | 'DOUGHNUT' | 'RADAR' | 'SCATTER';
  title: string;
  data: any;
  options: any;
  description: string;
}

export interface Graph {
  id: string;
  type: 'NETWORK' | 'TREE' | 'FLOW' | 'TIMELINE';
  title: string;
  data: any;
  options: any;
  description: string;
}

export interface Heatmap {
  id: string;
  title: string;
  data: any;
  options: any;
  description: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  layout: Layout;
  refreshRate: number;
}

export interface Widget {
  id: string;
  type: 'CHART' | 'GRAPH' | 'HEATMAP' | 'TABLE' | 'METRIC' | 'ALERT';
  title: string;
  data: any;
  options: any;
  position: Position;
  size: Size;
}

export interface Layout {
  columns: number;
  rows: number;
  gaps: number;
  responsive: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ExportableReport {
  id: string;
  name: string;
  type: 'PDF' | 'EXCEL' | 'CSV' | 'JSON' | 'HTML';
  description: string;
  data: any;
  template: string;
  generatedAt: Date;
  size: number;
}

export interface ComplianceTracking {
  overallCompliance: number;
  departmentCompliance: DepartmentCompliance[];
  violationTracking: ViolationTracking[];
  improvementTracking: ImprovementTracking[];
  alerts: ComplianceAlert[];
}

export interface DepartmentCompliance {
  departmentId: string;
  departmentName: string;
  complianceScore: number;
  trend: number;
  violations: number;
  improvements: number;
}

export interface ViolationTracking {
  violationId: string;
  type: string;
  severity: string;
  count: number;
  trend: number;
  resolutionRate: number;
  lastOccurrence: Date;
}

export interface ImprovementTracking {
  improvementId: string;
  area: string;
  currentScore: number;
  targetScore: number;
  progress: number;
  timeline: string;
  status: 'ON_TRACK' | 'BEHIND' | 'COMPLETED';
}

export interface ComplianceAlert {
  id: string;
  type: 'VIOLATION' | 'IMPROVEMENT' | 'DEADLINE' | 'THRESHOLD';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  actionRequired: string;
}

export interface PerformanceMetrics {
  overallPerformance: number;
  keyMetrics: KeyMetric[];
  trends: Trend[];
  benchmarks: Benchmark[];
  recommendations: string[];
}

export interface KeyMetric {
  name: string;
  value: number;
  unit: string;
  target: number;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  trend: number;
  description: string;
}

export interface Trend {
  metric: string;
  data: TrendData[];
  direction: 'UP' | 'DOWN' | 'STABLE';
  significance: number;
  description: string;
}

export interface TrendData {
  date: Date;
  value: number;
  label: string;
}

export interface Benchmark {
  metric: string;
  currentValue: number;
  benchmarkValue: number;
  industryAverage: number;
  bestPractice: number;
  gap: number;
  recommendations: string[];
}

export interface AdministrativeInsight {
  id: string;
  type: 'EFFICIENCY' | 'COST' | 'QUALITY' | 'COMPLIANCE' | 'INNOVATION';
  title: string;
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priority: number;
  actionable: boolean;
  recommendations: string[];
  timeline: string;
  resources: string[];
}

// Real-time Dashboard Types
export interface RealTimeDashboard {
  liveMetrics: LiveMetric[];
  alerts: RealTimeAlert[];
  updates: RealTimeUpdate[];
  lastUpdated: Date;
  refreshRate: number;
}

export interface LiveMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  lastUpdated: Date;
}

export interface RealTimeAlert {
  id: string;
  type: 'SYSTEM' | 'PERFORMANCE' | 'COMPLIANCE' | 'RESOURCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  actionRequired: string;
}

export interface RealTimeUpdate {
  id: string;
  type: 'DATA' | 'CONFIGURATION' | 'SCHEDULE' | 'RESOURCE';
  description: string;
  timestamp: Date;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  details: string;
}

// Automated Report Generation Types
export interface AutomatedReportGeneration {
  scheduledReports: ScheduledReport[];
  reportTemplates: ReportTemplate[];
  deliveryChannels: DeliveryChannel[];
  generationHistory: GenerationHistory[];
  configuration: ReportConfiguration;
}

export interface ScheduledReport {
  id: string;
  name: string;
  template: string;
  schedule: string; // cron expression
  recipients: string[];
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON' | 'HTML';
  lastGenerated: Date;
  nextGeneration: Date;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  errorMessage?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'ANALYTICS' | 'COMPLIANCE' | 'PERFORMANCE' | 'UTILIZATION' | 'CUSTOM';
  template: string;
  parameters: ReportParameter[];
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}

export interface ReportParameter {
  name: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT';
  required: boolean;
  defaultValue: any;
  options?: string[];
  description: string;
}

export interface DeliveryChannel {
  id: string;
  type: 'EMAIL' | 'FTP' | 'API' | 'CLOUD_STORAGE';
  configuration: any;
  enabled: boolean;
  lastUsed: Date;
}

export interface GenerationHistory {
  id: string;
  reportId: string;
  reportName: string;
  generatedAt: Date;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  size: number;
  duration: number;
  recipients: string[];
  errorMessage?: string;
}

export interface ReportConfiguration {
  defaultFormat: string;
  maxRetries: number;
  timeout: number;
  compression: boolean;
  encryption: boolean;
  retentionDays: number;
  backupEnabled: boolean;
}