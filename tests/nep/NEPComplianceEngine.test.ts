/**
 * NEP 2020 Compliance Engine Test Suite
 * Comprehensive test cases for all NEP compliance scenarios
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  NEPComplianceEngine, 
  NEPValidator, 
  ConflictDetector, 
  ConstraintSolver, 
  ComplianceReporter 
} from '../../src/nep';
import { 
  GeneratedTimetable, 
  StudentProfile, 
  FacultyProfile, 
  SubjectDetails, 
  ScheduleSlot 
} from '../../src/types/nep-interfaces';

describe('NEP 2020 Compliance Engine', () => {
  let engine: NEPComplianceEngine;
  let mockTimetable: GeneratedTimetable;
  let mockStudents: StudentProfile[];
  let mockFaculty: FacultyProfile[];
  let mockSubjects: SubjectDetails[];

  beforeEach(() => {
    engine = new NEPComplianceEngine({
      enableValidation: true,
      enableConflictDetection: true,
      enableConstraintSolving: true,
      enableReporting: true,
      validationThreshold: 70,
      conflictResolutionTimeout: 30000,
      maxRetryAttempts: 3,
      enableCaching: true,
      enableLogging: true
    });

    // Setup mock data
    mockTimetable = createMockTimetable();
    mockStudents = createMockStudents();
    mockFaculty = createMockFaculty();
    mockSubjects = createMockSubjects();
  });

  afterEach(() => {
    engine.reset();
  });

  describe('NEPValidator', () => {
    it('should validate credit distribution correctly', async () => {
      const validator = new NEPValidator();
      const result = await validator.validateTimetable(
        mockTimetable,
        mockStudents,
        mockFaculty,
        mockSubjects
      );

      expect(result).toBeDefined();
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);
      expect(result.creditDistribution).toBeDefined();
      expect(result.creditDistribution.core.required).toBe(60);
      expect(result.creditDistribution.elective.required).toBe(30);
      expect(result.creditDistribution.skillBased.required).toBe(10);
    });

    it('should detect contact hours violations', async () => {
      const validator = new NEPValidator();
      const result = await validator.validateTimetable(
        mockTimetable,
        mockStudents,
        mockFaculty,
        mockSubjects
      );

      const contactHourViolations = result.violations.filter(v => v.type === 'CONTACT_HOURS');
      expect(contactHourViolations).toBeDefined();
    });

    it('should validate attendance capability', async () => {
      const validator = new NEPValidator();
      const result = await validator.validateTimetable(
        mockTimetable,
        mockStudents,
        mockFaculty,
        mockSubjects
      );

      expect(result.attendanceCapability).toBeDefined();
      expect(result.attendanceCapability.minimumRequired).toBe(75);
    });

    it('should validate assessment pattern', async () => {
      const validator = new NEPValidator();
      const result = await validator.validateTimetable(
        mockTimetable,
        mockStudents,
        mockFaculty,
        mockSubjects
      );

      expect(result.assessmentPattern).toBeDefined();
      expect(result.assessmentPattern.continuous.required).toBe(40);
      expect(result.assessmentPattern.final.required).toBe(60);
    });

    it('should validate practical blocks', async () => {
      const validator = new NEPValidator();
      const result = await validator.validateTimetable(
        mockTimetable,
        mockStudents,
        mockFaculty,
        mockSubjects
      );

      expect(result.practicalBlocks).toBeDefined();
      result.practicalBlocks.forEach(block => {
        expect(block.required).toBe(2); // Minimum 2 hours
      });
    });

    it('should validate CBC compliance', async () => {
      const validator = new NEPValidator();
      const result = await validator.validateTimetable(
        mockTimetable,
        mockStudents,
        mockFaculty,
        mockSubjects
      );

      expect(result.cbcCompliance).toBeDefined();
      expect(result.cbcCompliance.choiceBased).toBeDefined();
      expect(result.cbcCompliance.creditTransfer).toBeDefined();
      expect(result.cbcCompliance.multipleEntryExit).toBeDefined();
      expect(result.cbcCompliance.flexiblePathways).toBeDefined();
    });
  });

  describe('ConflictDetector', () => {
    it('should detect faculty double-booking conflicts', async () => {
      const detector = new ConflictDetector();
      const result = await detector.detectConflicts(
        mockTimetable,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      expect(result).toBeDefined();
      expect(result.hasConflicts).toBeDefined();
      expect(result.conflicts).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should detect room capacity conflicts', async () => {
      const detector = new ConflictDetector();
      const result = await detector.detectConflicts(
        mockTimetable,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      const roomConflicts = result.conflicts.filter(c => c.type === 'ROOM_CAPACITY_EXCEEDED');
      expect(roomConflicts).toBeDefined();
    });

    it('should detect student subject conflicts', async () => {
      const detector = new ConflictDetector();
      const result = await detector.detectConflicts(
        mockTimetable,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      const studentConflicts = result.conflicts.filter(c => c.type === 'STUDENT_SUBJECT_CONFLICT');
      expect(studentConflicts).toBeDefined();
    });

    it('should detect time slot overlaps', async () => {
      const detector = new ConflictDetector();
      const result = await detector.detectConflicts(
        mockTimetable,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      const timeSlotConflicts = result.conflicts.filter(c => c.type === 'TIME_SLOT_OVERLAP');
      expect(timeSlotConflicts).toBeDefined();
    });

    it('should detect prerequisite conflicts', async () => {
      const detector = new ConflictDetector();
      const result = await detector.detectConflicts(
        mockTimetable,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      const prerequisiteConflicts = result.conflicts.filter(c => c.type === 'PREREQUISITES_NOT_MET');
      expect(prerequisiteConflicts).toBeDefined();
    });

    it('should detect credit overload', async () => {
      const detector = new ConflictDetector();
      const result = await detector.detectConflicts(
        mockTimetable,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      const creditConflicts = result.conflicts.filter(c => c.type === 'CREDIT_OVERLOAD');
      expect(creditConflicts).toBeDefined();
    });

    it('should detect room double-booking', async () => {
      const detector = new ConflictDetector();
      const result = await detector.detectConflicts(
        mockTimetable,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      const roomDoubleBookingConflicts = result.conflicts.filter(c => c.type === 'ROOM_DOUBLE_BOOKING');
      expect(roomDoubleBookingConflicts).toBeDefined();
    });

    it('should detect faculty overload', async () => {
      const detector = new ConflictDetector();
      const result = await detector.detectConflicts(
        mockTimetable,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      const facultyOverloadConflicts = result.conflicts.filter(c => c.type === 'FACULTY_OVERLOAD');
      expect(facultyOverloadConflicts).toBeDefined();
    });

    it('should detect student overload', async () => {
      const detector = new ConflictDetector();
      const result = await detector.detectConflicts(
        mockTimetable,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      const studentOverloadConflicts = result.conflicts.filter(c => c.type === 'STUDENT_OVERLOAD');
      expect(studentOverloadConflicts).toBeDefined();
    });

    it('should detect resource unavailable conflicts', async () => {
      const detector = new ConflictDetector();
      const result = await detector.detectConflicts(
        mockTimetable,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      const resourceConflicts = result.conflicts.filter(c => c.type === 'RESOURCE_UNAVAILABLE');
      expect(resourceConflicts).toBeDefined();
    });
  });

  describe('ConstraintSolver', () => {
    it('should solve faculty double-booking conflicts', async () => {
      const solver = new ConstraintSolver();
      const conflicts = [
        {
          id: 'test-conflict',
          type: 'FACULTY_DOUBLE_BOOKING',
          severity: 'CRITICAL' as const,
          message: 'Test conflict',
          description: 'Test description',
          affectedEntities: [],
          timeSlot: '9:00-10:00',
          day: 'Monday',
          details: {},
          suggestedResolution: 'Test resolution',
          priority: 10
        }
      ];

      const result = await solver.solveConflicts(
        mockTimetable,
        conflicts,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.resolvedConflicts).toBeDefined();
      expect(result.unresolvedConflicts).toBeDefined();
      expect(result.optimizedTimetable).toBeDefined();
      expect(result.optimizationMetrics).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });

    it('should solve room capacity conflicts', async () => {
      const solver = new ConstraintSolver();
      const conflicts = [
        {
          id: 'test-room-conflict',
          type: 'ROOM_CAPACITY_EXCEEDED',
          severity: 'MAJOR' as const,
          message: 'Room capacity exceeded',
          description: 'Test description',
          affectedEntities: [],
          timeSlot: '9:00-10:00',
          day: 'Monday',
          details: {},
          suggestedResolution: 'Test resolution',
          priority: 8
        }
      ];

      const result = await solver.solveConflicts(
        mockTimetable,
        conflicts,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      expect(result).toBeDefined();
      expect(result.resolvedConflicts).toBeDefined();
    });

    it('should solve student subject conflicts', async () => {
      const solver = new ConstraintSolver();
      const conflicts = [
        {
          id: 'test-student-conflict',
          type: 'STUDENT_SUBJECT_CONFLICT',
          severity: 'MAJOR' as const,
          message: 'Student subject conflict',
          description: 'Test description',
          affectedEntities: [],
          timeSlot: '9:00-10:00',
          day: 'Monday',
          details: {},
          suggestedResolution: 'Test resolution',
          priority: 7
        }
      ];

      const result = await solver.solveConflicts(
        mockTimetable,
        conflicts,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      expect(result).toBeDefined();
      expect(result.resolvedConflicts).toBeDefined();
    });
  });

  describe('ComplianceReporter', () => {
    it('should generate comprehensive compliance report', async () => {
      const reporter = new ComplianceReporter();
      const nepValidation = await new NEPValidator().validateTimetable(
        mockTimetable,
        mockStudents,
        mockFaculty,
        mockSubjects
      );
      const conflictDetection = await new ConflictDetector().detectConflicts(
        mockTimetable,
        mockFaculty,
        mockStudents,
        mockSubjects
      );
      const constraintSolver = await new ConstraintSolver().solveConflicts(
        mockTimetable,
        conflictDetection.conflicts,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      const report = await reporter.generateComplianceReport(
        nepValidation,
        conflictDetection,
        constraintSolver,
        'org-123',
        'dept-456',
        'Fall 2024',
        '2024-25'
      );

      expect(report).toBeDefined();
      expect(report.reportId).toBeDefined();
      expect(report.generatedAt).toBeDefined();
      expect(report.organizationId).toBe('org-123');
      expect(report.departmentId).toBe('dept-456');
      expect(report.semester).toBe('Fall 2024');
      expect(report.academicYear).toBe('2024-25');
      expect(report.overallComplianceScore).toBeGreaterThanOrEqual(0);
      expect(report.overallComplianceScore).toBeLessThanOrEqual(100);
      expect(report.nepCompliance).toBeDefined();
      expect(report.conflictResolution).toBeDefined();
      expect(report.optimization).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.executiveSummary).toBeDefined();
      expect(report.detailedAnalysis).toBeDefined();
      expect(report.actionItems).toBeDefined();
    });
  });

  describe('NEPComplianceEngine Integration', () => {
    it('should run complete compliance analysis', async () => {
      const result = await engine.runComplianceAnalysis(
        mockTimetable,
        mockStudents,
        mockFaculty,
        mockSubjects,
        {
          organizationId: 'org-123',
          departmentId: 'dept-456',
          semester: 'Fall 2024',
          academicYear: '2024-25',
          generateReport: true,
          resolveConflicts: true,
          optimizeSchedule: true,
          includeRecommendations: true
        }
      );

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.validation).toBeDefined();
      expect(result.conflictDetection).toBeDefined();
      expect(result.constraintSolver).toBeDefined();
      expect(result.complianceReport).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('should validate timetable against NEP requirements', async () => {
      const result = await engine.validateTimetable(
        mockTimetable,
        mockStudents,
        mockFaculty,
        mockSubjects
      );

      expect(result).toBeDefined();
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);
    });

    it('should detect conflicts in timetable', async () => {
      const result = await engine.detectConflicts(
        mockTimetable,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      expect(result).toBeDefined();
      expect(result.hasConflicts).toBeDefined();
      expect(result.conflicts).toBeDefined();
    });

    it('should solve conflicts in timetable', async () => {
      const conflicts = [
        {
          id: 'test-conflict',
          type: 'FACULTY_DOUBLE_BOOKING',
          severity: 'CRITICAL' as const,
          message: 'Test conflict',
          description: 'Test description',
          affectedEntities: [],
          timeSlot: '9:00-10:00',
          day: 'Monday',
          details: {},
          suggestedResolution: 'Test resolution',
          priority: 10
        }
      ];

      const result = await engine.solveConflicts(
        mockTimetable,
        conflicts,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      expect(result).toBeDefined();
      expect(result.resolvedConflicts).toBeDefined();
    });

    it('should generate compliance report', async () => {
      const nepValidation = await engine.validateTimetable(
        mockTimetable,
        mockStudents,
        mockFaculty,
        mockSubjects
      );
      const conflictDetection = await engine.detectConflicts(
        mockTimetable,
        mockFaculty,
        mockStudents,
        mockSubjects
      );
      const constraintSolver = await engine.solveConflicts(
        mockTimetable,
        conflictDetection.conflicts,
        mockFaculty,
        mockStudents,
        mockSubjects
      );

      const report = await engine.generateComplianceReport(
        nepValidation,
        conflictDetection,
        constraintSolver,
        {
          organizationId: 'org-123',
          departmentId: 'dept-456',
          semester: 'Fall 2024',
          academicYear: '2024-25'
        }
      );

      expect(report).toBeDefined();
      expect(report.reportId).toBeDefined();
    });

    it('should get compliance score', async () => {
      const score = await engine.getComplianceScore(
        mockTimetable,
        mockStudents,
        mockFaculty,
        mockSubjects
      );

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should check if timetable is NEP compliant', async () => {
      const isCompliant = await engine.isNEPCompliant(
        mockTimetable,
        mockStudents,
        mockFaculty,
        mockSubjects
      );

      expect(typeof isCompliant).toBe('boolean');
    });

    it('should get compliance recommendations', async () => {
      const recommendations = await engine.getComplianceRecommendations(
        mockTimetable,
        mockStudents,
        mockFaculty,
        mockSubjects
      );

      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should update configuration', () => {
      const newConfig = {
        validationThreshold: 80,
        enableCaching: false
      };

      engine.updateConfig(newConfig);
      const config = engine.getConfig();

      expect(config.validationThreshold).toBe(80);
      expect(config.enableCaching).toBe(false);
    });

    it('should get engine status', () => {
      const status = engine.getStatus();

      expect(status).toBeDefined();
      expect(status.validator).toBe(true);
      expect(status.conflictDetector).toBe(true);
      expect(status.constraintSolver).toBe(true);
      expect(status.reporter).toBe(true);
      expect(status.config).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty timetable', async () => {
      const emptyTimetable: GeneratedTimetable = {
        id: '',
        name: '',
        description: '',
        organizationId: '',
        departmentId: '',
        semester: '',
        academicYear: '',
        generatedAt: new Date(),
        schedule: [],
        metadata: {},
        conflicts: [],
        optimization: {
          facultyWorkloadBalance: 0,
          roomUtilization: 0,
          studentSatisfaction: 0,
          overallScore: 0
        }
      };

      const result = await engine.runComplianceAnalysis(
        emptyTimetable,
        [],
        [],
        [],
        {
          organizationId: 'org-123',
          semester: 'Fall 2024',
          academicYear: '2024-25'
        }
      );

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it('should handle invalid data', async () => {
      const invalidTimetable = null as any;

      const result = await engine.runComplianceAnalysis(
        invalidTimetable,
        mockStudents,
        mockFaculty,
        mockSubjects,
        {
          organizationId: 'org-123',
          semester: 'Fall 2024',
          academicYear: '2024-25'
        }
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle timeout scenarios', async () => {
      const engineWithTimeout = new NEPComplianceEngine({
        enableValidation: true,
        enableConflictDetection: true,
        enableConstraintSolving: true,
        enableReporting: true,
        validationThreshold: 70,
        conflictResolutionTimeout: 1, // 1ms timeout
        maxRetryAttempts: 1,
        enableCaching: true,
        enableLogging: true
      });

      const result = await engineWithTimeout.runComplianceAnalysis(
        mockTimetable,
        mockStudents,
        mockFaculty,
        mockSubjects,
        {
          organizationId: 'org-123',
          semester: 'Fall 2024',
          academicYear: '2024-25'
        }
      );

      expect(result).toBeDefined();
    });
  });
});

// Helper functions to create mock data
function createMockTimetable(): GeneratedTimetable {
  return {
    id: 'timetable-123',
    name: 'Fall 2024 Timetable',
    description: 'Mock timetable for testing',
    organizationId: 'org-123',
    departmentId: 'dept-456',
    semester: 'Fall 2024',
    academicYear: '2024-25',
    generatedAt: new Date(),
    schedule: [
      {
        id: 'slot-1',
        day: 'Monday',
        timeSlot: '9:00-10:00',
        subjectId: 'subject-1',
        subjectName: 'Mathematics',
        facultyId: 'faculty-1',
        facultyName: 'Dr. Smith',
        roomId: 'room-1',
        roomName: 'Room 101',
        roomCapacity: 50,
        studentIds: ['student-1', 'student-2'],
        duration: 1,
        type: 'LECTURE',
        metadata: {
          attendanceTracking: 'AUTOMATIC'
        }
      }
    ],
    metadata: {},
    conflicts: [],
    optimization: {
      facultyWorkloadBalance: 85,
      roomUtilization: 75,
      studentSatisfaction: 80,
      overallScore: 80
    }
  };
}

function createMockStudents(): StudentProfile[] {
  return [
    {
      id: 'student-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@university.edu',
      studentId: 'STU001',
      year: 2024,
      semester: 'Fall',
      departmentId: 'dept-456',
      enrolledSubjects: ['subject-1', 'subject-2'],
      creditsCompleted: 60,
      creditsEnrolled: 30,
      gpa: 3.5,
      attendancePercentage: 85,
      entryLevel: 'FRESHMAN',
      exitLevel: 'SENIOR',
      preferences: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
}

function createMockFaculty(): FacultyProfile[] {
  return [
    {
      id: 'faculty-1',
      firstName: 'Dr. Jane',
      lastName: 'Smith',
      email: 'jane.smith@university.edu',
      employeeId: 'FAC001',
      departmentId: 'dept-456',
      specializations: ['Mathematics', 'Statistics'],
      qualifications: ['PhD Mathematics'],
      experience: 10,
      currentWorkload: 20,
      maxWorkload: 40,
      availability: {
        monday: { start: '9:00', end: '17:00' },
        tuesday: { start: '9:00', end: '17:00' },
        wednesday: { start: '9:00', end: '17:00' },
        thursday: { start: '9:00', end: '17:00' },
        friday: { start: '9:00', end: '17:00' }
      },
      preferences: {},
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
}

function createMockSubjects(): SubjectDetails[] {
  return [
    {
      id: 'subject-1',
      name: 'Mathematics',
      code: 'MATH101',
      credits: 4,
      category: 'CORE',
      type: 'LECTURE',
      departmentId: 'dept-456',
      prerequisites: [],
      coRequisites: [],
      description: 'Basic Mathematics',
      learningOutcomes: ['Understand basic mathematical concepts'],
      assessmentPattern: {
        continuousAssessment: 40,
        finalExam: 60,
        assignments: 20,
        quizzes: 10,
        projects: 10
      },
      creditTransferable: true,
      offeredInYears: [2024],
      offeredInSemesters: ['Fall', 'Spring'],
      maxEnrollment: 50,
      minEnrollment: 10,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
}

