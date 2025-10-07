/**
 * NEP 2020 Timetable System - Comprehensive Usage Examples
 * Demonstrates how to use all interfaces and services
 */

import { PrismaClient } from '@prisma/client';
import { TimetableService } from '../src/services/timetable-service';
import {
  StudentProfile,
  FacultyProfile,
  SubjectDetails,
  TimetableRequest,
  GeneratedTimetable,
  ConflictRule,
  NEPComplianceResponse,
  TimetableGenerationResponse,
  NepCategory,
  ClassType,
  ConstraintType,
  Priority,
  TimetableStatus
} from '../src/types/nep-interfaces';
import {
  StudentProfileValidator,
  FacultyProfileValidator,
  SubjectDetailsValidator,
  TimetableValidator,
  createCustomNEPRules
} from '../src/utils/nep-validation';

// ================================
// INITIALIZATION
// ================================

const prisma = new PrismaClient();
const timetableService = new TimetableService(prisma);

// Custom NEP rules for specific institution
const customNEPRules = createCustomNEPRules({
  corePercentage: 65, // 65% core instead of 60%
  electivePercentage: 25, // 25% elective instead of 30%
  skillPercentage: 10, // 10% skill-based (same)
  maxHoursPerDay: 7, // 7 hours instead of 6
  minPracticalBlockDuration: 150, // 2.5 hours instead of 2
  continuousAssessmentWeight: 45, // 45% instead of 40%
  endSemesterExamWeight: 55, // 55% instead of 60%
});

// ================================
// STUDENT PROFILE EXAMPLES
// ================================

async function studentProfileExamples() {
  console.log('=== STUDENT PROFILE EXAMPLES ===');

  // 1. Get complete student profile with NEP compliance
  const studentId = 'student_123';
  const studentProfile = await timetableService.getStudentProfile(studentId);
  
  if (studentProfile) {
    console.log('Student Profile:', {
      name: `${studentProfile.firstName} ${studentProfile.lastName}`,
      rollNumber: studentProfile.rollNumber,
      currentYear: studentProfile.currentYear,
      totalCredits: studentProfile.totalCreditsEarned,
      nepCompliance: studentProfile.nepCompliance
    });

    // 2. Check NEP compliance
    const compliance = await timetableService.checkStudentNEPCompliance(studentId);
    console.log('NEP Compliance:', {
      isCompliant: compliance.isCompliant,
      score: compliance.complianceScore,
      violations: compliance.violations,
      recommendations: compliance.recommendations
    });

    // 3. Update student credits after completing a subject
    await timetableService.updateStudentCredits(
      studentId,
      'subject_456',
      4, // 4 credits
      NepCategory.CORE
    );
    console.log('Updated student credits for core subject');

    // 4. Validate student profile with custom rules
    const validator = new StudentProfileValidator(customNEPRules);
    const validation = validator.validateNEPCompliance(studentProfile);
    console.log('Custom Validation:', {
      isValid: validation.isValid,
      score: validation.score,
      errors: validation.errors
    });
  }
}

// ================================
// FACULTY PROFILE EXAMPLES
// ================================

async function facultyProfileExamples() {
  console.log('=== FACULTY PROFILE EXAMPLES ===');

  // 1. Get complete faculty profile with workload analysis
  const facultyId = 'faculty_789';
  const facultyProfile = await timetableService.getFacultyProfile(facultyId);
  
  if (facultyProfile) {
    console.log('Faculty Profile:', {
      name: `${facultyProfile.firstName} ${facultyProfile.lastName}`,
      employeeId: facultyProfile.employeeId,
      designation: facultyProfile.designation,
      specializations: facultyProfile.specializations,
      currentWorkload: facultyProfile.currentWorkload,
      maxWorkload: facultyProfile.maxHoursPerWeek,
      workloadAnalysis: facultyProfile.workloadAnalysis
    });

    // 2. Validate faculty workload
    const validator = new FacultyProfileValidator();
    const workloadValidation = validator.validateWorkload(facultyProfile);
    console.log('Workload Validation:', {
      isValid: workloadValidation.isValid,
      score: workloadValidation.score,
      errors: workloadValidation.errors,
      recommendations: workloadValidation.recommendations
    });

    // 3. Update faculty workload
    await timetableService.updateFacultyWorkload(facultyId, 2); // Add 2 hours
    console.log('Updated faculty workload');

    // 4. Check faculty availability
    const availability = facultyProfile.availability.filter(a => a.isAvailable);
    console.log('Available Days:', availability.map(a => a.dayOfWeek));
  }
}

// ================================
// SUBJECT MANAGEMENT EXAMPLES
// ================================

async function subjectManagementExamples() {
  console.log('=== SUBJECT MANAGEMENT EXAMPLES ===');

  // 1. Get subject details with NEP validation
  const subjectId = 'subject_456';
  const subjectDetails = await timetableService.getSubjectDetails(subjectId);
  
  if (subjectDetails) {
    console.log('Subject Details:', {
      code: subjectDetails.code,
      name: subjectDetails.name,
      nepCategory: subjectDetails.nepCategory,
      credits: subjectDetails.credits,
      lectureHours: subjectDetails.lectureHours,
      tutorialHours: subjectDetails.tutorialHours,
      practicalHours: subjectDetails.practicalHours,
      continuousAssessmentWeight: subjectDetails.continuousAssessmentWeight,
      endSemesterExamWeight: subjectDetails.endSemesterExamWeight,
      nepValidation: subjectDetails.nepValidation
    });

    // 2. Validate subject NEP compliance
    const validator = new SubjectDetailsValidator();
    const validation = validator.validateNEPCompliance(subjectDetails);
    console.log('Subject Validation:', {
      isValid: validation.isValid,
      score: validation.score,
      errors: validation.errors,
      recommendations: validation.recommendations
    });

    // 3. Check prerequisites
    console.log('Prerequisites:', subjectDetails.prerequisites.map(p => ({
      subject: p.prerequisite.name,
      isMandatory: p.isMandatory
    })));

    // 4. Check assigned faculties
    console.log('Assigned Faculties:', subjectDetails.assignedFaculties.map(f => ({
      name: `${f.faculty.firstName} ${f.faculty.lastName}`,
      isPrimary: f.isPrimary,
      canTeach: f.canTeach
    })));
  }
}

// ================================
// TIMETABLE GENERATION EXAMPLES
// ================================

async function timetableGenerationExamples() {
  console.log('=== TIMETABLE GENERATION EXAMPLES ===');

  // 1. Create timetable request
  const timetableRequest: TimetableRequest = {
    id: 'request_001',
    organizationId: 'org_123',
    academicYearId: 'year_2024_25',
    semesterId: 'sem_odd_2024',
    name: 'CSE 3rd Year Timetable - Odd Semester 2024',
    description: 'Timetable for Computer Science Engineering 3rd year students',
    year: 3,
    departmentId: 'dept_cse',
    preferences: {
      preferredTimeSlots: ['slot_1', 'slot_2', 'slot_3'],
      avoidTimeSlots: ['slot_7'], // Avoid late evening slots
      preferredRooms: ['room_lh1', 'room_lh2'],
      avoidRooms: ['room_old_lab'],
      preferredFaculties: ['faculty_001', 'faculty_002'],
      avoidFaculties: [],
      subjectGrouping: true,
      practicalBlocking: true,
      enforceNEPCompliance: true,
      strictCreditDistribution: true,
      minimizeConflicts: true,
      optimizeFacultyWorkload: true,
      optimizeRoomUtilization: true,
      balanceStudentLoad: true
    },
    constraints: [
      {
        id: 'constraint_001',
        organizationId: 'org_123',
        name: 'Faculty Maximum Hours Per Week',
        type: ConstraintType.FACULTY_MAX_HOURS_PER_WEEK,
        description: 'Faculty cannot exceed 40 hours per week',
        config: { maxHoursPerWeek: 40 },
        priority: 1,
        weight: 1.0,
        isActive: true,
        effectiveFrom: new Date(),
        appliesTo: {
          departments: ['dept_cse'],
          years: [3]
        },
        validationRules: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    optimization: {
      maxIterations: 1000,
      convergenceThreshold: 0.01,
      populationSize: 50,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      elitismRate: 0.1,
      weights: {
        conflictPenalty: 10.0,
        workloadPenalty: 5.0,
        utilizationPenalty: 3.0,
        preferenceBonus: 2.0,
        nepComplianceBonus: 8.0
      }
    },
    targetStudents: ['student_001', 'student_002', 'student_003'],
    targetFaculties: ['faculty_001', 'faculty_002', 'faculty_003'],
    targetSubjects: ['subject_001', 'subject_002', 'subject_003'],
    requestedBy: 'admin_001',
    requestedAt: new Date(),
    priority: Priority.HIGH,
    status: 'PENDING'
  };

  // 2. Generate timetable
  console.log('Generating timetable...');
  const generationResponse = await timetableService.generateTimetable(timetableRequest);
  
  console.log('Generation Response:', {
    success: generationResponse.success,
    processingTime: generationResponse.processingTime,
    optimizationIterations: generationResponse.optimizationIterations,
    finalScore: generationResponse.finalScore,
    errors: generationResponse.errors,
    warnings: generationResponse.warnings
  });

  if (generationResponse.success && generationResponse.timetable) {
    const timetable = generationResponse.timetable;
    
    // 3. Display timetable information
    console.log('Generated Timetable:', {
      id: timetable.id,
      name: timetable.name,
      status: timetable.status,
      totalSlots: timetable.slots.length,
      totalConflicts: timetable.totalConflicts,
      optimizationScore: timetable.optimizationScore,
      qualityMetrics: timetable.qualityMetrics,
      nepCompliance: timetable.nepCompliance
    });

    // 4. Display schedule slots
    console.log('Schedule Slots:');
    timetable.slots.forEach((slot, index) => {
      console.log(`${index + 1}. ${slot.subject.name} - ${slot.faculty.firstName} ${slot.faculty.lastName} - ${slot.room.name} - ${slot.startTime}-${slot.endTime}`);
    });

    // 5. Check NEP compliance for the timetable
    const nepCompliance = await timetableService.checkTimetableNEPCompliance(timetable.id);
    console.log('Timetable NEP Compliance:', {
      isCompliant: nepCompliance.isCompliant,
      score: nepCompliance.complianceScore,
      violations: nepCompliance.violations,
      recommendations: nepCompliance.recommendations
    });

    // 6. Resolve conflicts if any
    if (timetable.totalConflicts > 0) {
      console.log('Resolving conflicts...');
      const conflictResolution = await timetableService.resolveConflicts(timetable.id);
      console.log('Conflict Resolution:', {
        success: conflictResolution.success,
        resolvedConflicts: conflictResolution.resolvedConflicts,
        remainingConflicts: conflictResolution.remainingConflicts,
        resolutionActions: conflictResolution.resolutionActions
      });
    }

    // 7. Validate timetable
    const validator = new TimetableValidator();
    const validation = validator.validateTimetable(timetable);
    console.log('Timetable Validation:', {
      isValid: validation.isValid,
      score: validation.score,
      errors: validation.errors,
      warnings: validation.warnings,
      recommendations: validation.recommendations
    });
  }
}

// ================================
// CONSTRAINT MANAGEMENT EXAMPLES
// ================================

async function constraintManagementExamples() {
  console.log('=== CONSTRAINT MANAGEMENT EXAMPLES ===');

  // 1. Create NEP compliance constraint
  const nepConstraint: ConflictRule = {
    id: 'nep_constraint_001',
    organizationId: 'org_123',
    name: 'NEP Credit Distribution',
    type: ConstraintType.NEP_CREDIT_DISTRIBUTION,
    description: 'Enforce 60-30-10 credit distribution as per NEP 2020',
    config: {
      corePercentage: 60,
      electivePercentage: 30,
      skillPercentage: 10
    },
    priority: 1,
    weight: 1.0,
    isActive: true,
    effectiveFrom: new Date(),
    appliesTo: {
      departments: ['dept_cse', 'dept_ece'],
      years: [1, 2, 3, 4]
    },
    validationRules: [
      {
        field: 'corePercentage',
        operator: 'GREATER_THAN_OR_EQUALS',
        value: 60,
        errorMessage: 'Core subjects must be at least 60% of total credits'
      },
      {
        field: 'electivePercentage',
        operator: 'GREATER_THAN_OR_EQUALS',
        value: 30,
        errorMessage: 'Elective subjects must be at least 30% of total credits'
      },
      {
        field: 'skillPercentage',
        operator: 'GREATER_THAN_OR_EQUALS',
        value: 10,
        errorMessage: 'Skill-based subjects must be at least 10% of total credits'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // 2. Create faculty workload constraint
  const facultyConstraint: ConflictRule = {
    id: 'faculty_constraint_001',
    organizationId: 'org_123',
    name: 'Faculty Maximum Hours Per Week',
    type: ConstraintType.FACULTY_MAX_HOURS_PER_WEEK,
    description: 'Faculty cannot exceed 40 hours per week',
    config: {
      maxHoursPerWeek: 40,
      facultyLunchBreakRequired: true,
      facultyLunchBreakDuration: 60
    },
    priority: 2,
    weight: 0.8,
    isActive: true,
    effectiveFrom: new Date(),
    appliesTo: {
      faculties: ['faculty_001', 'faculty_002', 'faculty_003']
    },
    validationRules: [
      {
        field: 'currentWorkload',
        operator: 'LESS_THAN_OR_EQUALS',
        value: 40,
        errorMessage: 'Faculty workload cannot exceed 40 hours per week'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // 3. Create room capacity constraint
  const roomConstraint: ConflictRule = {
    id: 'room_constraint_001',
    organizationId: 'org_123',
    name: 'Room Capacity Constraint',
    type: ConstraintType.ROOM_CAPACITY,
    description: 'Room capacity must not be exceeded',
    config: {
      maxCapacity: 60,
      noDoubleBooking: true
    },
    priority: 3,
    weight: 0.6,
    isActive: true,
    effectiveFrom: new Date(),
    appliesTo: {
      rooms: ['room_lh1', 'room_lh2', 'room_lh3']
    },
    validationRules: [
      {
        field: 'enrolledStudents',
        operator: 'LESS_THAN_OR_EQUALS',
        value: 60,
        errorMessage: 'Number of enrolled students cannot exceed room capacity'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  console.log('Created Constraints:', {
    nepConstraint: nepConstraint.name,
    facultyConstraint: facultyConstraint.name,
    roomConstraint: roomConstraint.name
  });
}

// ================================
// ADVANCED TIMETABLE EXAMPLES
// ================================

async function advancedTimetableExamples() {
  console.log('=== ADVANCED TIMETABLE EXAMPLES ===');

  // 1. Create batch timetable request for multiple years
  const batchRequest: TimetableRequest = {
    id: 'batch_request_001',
    organizationId: 'org_123',
    academicYearId: 'year_2024_25',
    semesterId: 'sem_odd_2024',
    name: 'Batch Timetable - All Years - Odd Semester 2024',
    description: 'Comprehensive timetable for all years of CSE department',
    departmentId: 'dept_cse',
    preferences: {
      preferredTimeSlots: ['slot_1', 'slot_2', 'slot_3', 'slot_4'],
      avoidTimeSlots: ['slot_7'],
      preferredRooms: ['room_lh1', 'room_lh2', 'room_lh3'],
      avoidRooms: [],
      preferredFaculties: [],
      avoidFaculties: [],
      subjectGrouping: true,
      practicalBlocking: true,
      enforceNEPCompliance: true,
      strictCreditDistribution: true,
      minimizeConflicts: true,
      optimizeFacultyWorkload: true,
      optimizeRoomUtilization: true,
      balanceStudentLoad: true
    },
    constraints: [],
    optimization: {
      maxIterations: 2000,
      convergenceThreshold: 0.005,
      populationSize: 100,
      mutationRate: 0.08,
      crossoverRate: 0.85,
      elitismRate: 0.15,
      weights: {
        conflictPenalty: 15.0,
        workloadPenalty: 8.0,
        utilizationPenalty: 5.0,
        preferenceBonus: 3.0,
        nepComplianceBonus: 12.0
      }
    },
    requestedBy: 'admin_001',
    requestedAt: new Date(),
    priority: Priority.URGENT,
    status: 'PENDING'
  };

  // 2. Generate batch timetable
  console.log('Generating batch timetable...');
  const batchResponse = await timetableService.generateTimetable(batchRequest);
  
  if (batchResponse.success && batchResponse.timetable) {
    console.log('Batch Timetable Generated:', {
      totalSlots: batchResponse.timetable.slots.length,
      optimizationScore: batchResponse.finalScore,
      processingTime: batchResponse.processingTime
    });

    // 3. Analyze timetable by year
    const slotsByYear = new Map<number, any[]>();
    batchResponse.timetable.slots.forEach(slot => {
      const year = slot.subject.offeredInYears[0] || 1;
      if (!slotsByYear.has(year)) {
        slotsByYear.set(year, []);
      }
      slotsByYear.get(year)!.push(slot);
    });

    console.log('Timetable by Year:');
    slotsByYear.forEach((slots, year) => {
      console.log(`Year ${year}: ${slots.length} slots`);
    });

    // 4. Analyze faculty workload distribution
    const facultyWorkload = new Map<string, number>();
    batchResponse.timetable.slots.forEach(slot => {
      const hours = slot.duration / 60;
      if (facultyWorkload.has(slot.facultyId)) {
        facultyWorkload.set(slot.facultyId, facultyWorkload.get(slot.facultyId)! + hours);
      } else {
        facultyWorkload.set(slot.facultyId, hours);
      }
    });

    console.log('Faculty Workload Distribution:');
    facultyWorkload.forEach((hours, facultyId) => {
      console.log(`Faculty ${facultyId}: ${hours} hours`);
    });

    // 5. Analyze room utilization
    const roomUtilization = new Map<string, number>();
    batchResponse.timetable.slots.forEach(slot => {
      const hours = slot.duration / 60;
      if (roomUtilization.has(slot.roomId)) {
        roomUtilization.set(slot.roomId, roomUtilization.get(slot.roomId)! + hours);
      } else {
        roomUtilization.set(slot.roomId, hours);
      }
    });

    console.log('Room Utilization:');
    roomUtilization.forEach((hours, roomId) => {
      const utilizationPercentage = (hours / 40) * 100; // Assuming 40 hours per week
      console.log(`Room ${roomId}: ${hours} hours (${utilizationPercentage.toFixed(1)}%)`);
    });
  }
}

// ================================
// ERROR HANDLING EXAMPLES
// ================================

async function errorHandlingExamples() {
  console.log('=== ERROR HANDLING EXAMPLES ===');

  try {
    // 1. Handle invalid student ID
    const invalidStudent = await timetableService.getStudentProfile('invalid_id');
    if (!invalidStudent) {
      console.log('Student not found - handled gracefully');
    }

    // 2. Handle timetable generation with invalid constraints
    const invalidRequest: TimetableRequest = {
      id: 'invalid_request',
      organizationId: 'invalid_org',
      academicYearId: 'invalid_year',
      name: 'Invalid Request',
      preferences: {
        preferredTimeSlots: [],
        avoidTimeSlots: [],
        preferredRooms: [],
        avoidRooms: [],
        preferredFaculties: [],
        avoidFaculties: [],
        subjectGrouping: false,
        practicalBlocking: false,
        enforceNEPCompliance: false,
        strictCreditDistribution: false,
        minimizeConflicts: false,
        optimizeFacultyWorkload: false,
        optimizeRoomUtilization: false,
        balanceStudentLoad: false
      },
      constraints: [],
      optimization: {
        maxIterations: 100,
        convergenceThreshold: 0.01,
        populationSize: 10,
        mutationRate: 0.1,
        crossoverRate: 0.8,
        elitismRate: 0.1,
        weights: {
          conflictPenalty: 1.0,
          workloadPenalty: 1.0,
          utilizationPenalty: 1.0,
          preferenceBonus: 1.0,
          nepComplianceBonus: 1.0
        }
      },
      requestedBy: 'admin_001',
      requestedAt: new Date(),
      priority: Priority.LOW,
      status: 'PENDING'
    };

    const invalidResponse = await timetableService.generateTimetable(invalidRequest);
    console.log('Invalid Request Response:', {
      success: invalidResponse.success,
      errors: invalidResponse.errors
    });

  } catch (error) {
    console.error('Error handled:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// ================================
// MAIN EXECUTION
// ================================

async function main() {
  try {
    console.log('🚀 Starting NEP 2020 Timetable System Examples...\n');

    await studentProfileExamples();
    console.log('\n' + '='.repeat(50) + '\n');

    await facultyProfileExamples();
    console.log('\n' + '='.repeat(50) + '\n');

    await subjectManagementExamples();
    console.log('\n' + '='.repeat(50) + '\n');

    await constraintManagementExamples();
    console.log('\n' + '='.repeat(50) + '\n');

    await timetableGenerationExamples();
    console.log('\n' + '='.repeat(50) + '\n');

    await advancedTimetableExamples();
    console.log('\n' + '='.repeat(50) + '\n');

    await errorHandlingExamples();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('✅ All examples completed successfully!');

  } catch (error) {
    console.error('❌ Error in main execution:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  studentProfileExamples,
  facultyProfileExamples,
  subjectManagementExamples,
  constraintManagementExamples,
  timetableGenerationExamples,
  advancedTimetableExamples,
  errorHandlingExamples
};

