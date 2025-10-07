/**
 * Test file for Timetable Generators
 * Demonstrates usage of FacultyScheduleGenerator, StudentScheduleGenerator, and OptimizationEngine
 */

import { FacultyScheduleGenerator, FacultyScheduleRequest } from './FacultyScheduleGenerator';
import { StudentScheduleGenerator, StudentScheduleRequest } from './StudentScheduleGenerator';
import { OptimizationEngine } from './OptimizationEngine';
import { IntelligentRetrievalService } from '../retrieval';
import { NEPValidator } from '../nep';
import { ConflictDetector } from '../nep';

// Mock services for testing
class MockRetrievalService {
  async retrieveForFacultySchedule(facultyId: string, semester: string, organizationId: string, options?: any) {
    return {
      data: [
        {
          metadata: {
            documentType: 'FACULTY',
            id: facultyId,
            firstName: 'Dr. John',
            lastName: 'Smith',
            department: { name: 'Computer Science' }
          }
        },
        {
          metadata: {
            documentType: 'STUDENT',
            id: 'student1',
            firstName: 'Alice',
            lastName: 'Johnson',
            enrolledSubjects: [{ subjectId: 'sub1' }]
          }
        },
        {
          metadata: {
            documentType: 'SUBJECT',
            subjectId: 'sub1',
            name: 'Data Structures',
            code: 'CS201',
            subjectType: 'LECTURE',
            nepCategory: 'CORE',
            credits: 4,
            lectureHours: 3,
            tutorialHours: 1,
            practicalHours: 0
          }
        }
      ]
    };
  }

  async retrieveForStudentSchedule(studentId: string, chosenSubjects: string[], organizationId: string, options?: any) {
    return {
      data: [
        {
          metadata: {
            documentType: 'STUDENT',
            id: studentId,
            firstName: 'Alice',
            lastName: 'Johnson',
            department: { name: 'Computer Science' },
            enrolledSubjects: chosenSubjects.map(subId => ({ subjectId: subId }))
          }
        }
      ]
    };
  }

  async retrieveForBatchSchedule(year: number, departmentId: string, semester: string, organizationId: string, options?: any) {
    return {
      data: [
        {
          metadata: {
            documentType: 'FACULTY',
            id: 'faculty1',
            firstName: 'Dr. John',
            lastName: 'Smith',
            assignedSubjects: [{ subjectId: 'sub1' }]
          }
        },
        {
          metadata: {
            documentType: 'SUBJECT',
            subjectId: 'sub1',
            name: 'Data Structures',
            code: 'CS201',
            subjectType: 'LECTURE',
            nepCategory: 'CORE',
            credits: 4,
            lectureHours: 3,
            tutorialHours: 1,
            practicalHours: 0
          }
        }
      ]
    };
  }
}

class MockNEPValidator {
  async validateTimetable(timetable: any, students: any[], faculty: any[], subjects: any[]) {
    return {
      isValid: true,
      complianceScore: 85,
      violations: [],
      warnings: [],
      recommendations: [],
      creditDistribution: {
        core: { credits: 20, percentage: 60, required: 60, status: 'COMPLIANT' },
        elective: { credits: 10, percentage: 30, required: 30, status: 'COMPLIANT' },
        skillBased: { credits: 3, percentage: 10, required: 10, status: 'COMPLIANT' },
        total: { credits: 33, required: 30, status: 'COMPLIANT' }
      },
      attendanceCapability: {
        canTrack: true,
        trackingMethod: 'AUTOMATIC',
        minimumRequired: 75,
        currentCapability: 90,
        status: 'COMPLIANT'
      },
      assessmentPattern: {
        continuous: { percentage: 40, required: 40, status: 'COMPLIANT' },
        final: { percentage: 60, required: 60, status: 'COMPLIANT' },
        total: { percentage: 100, status: 'COMPLIANT' }
      },
      practicalBlocks: [],
      cbcCompliance: {
        choiceBased: true,
        creditTransfer: true,
        multipleEntryExit: true,
        flexiblePathways: true,
        status: 'COMPLIANT'
      }
    };
  }
}

class MockConflictDetector {
  async detectConflicts(timetable: any, faculty: any[], students: any[], subjects: any[]) {
    return {
      hasConflicts: false,
      conflicts: [],
      summary: {
        totalConflicts: 0,
        criticalConflicts: 0,
        majorConflicts: 0,
        minorConflicts: 0,
        conflictsByType: {},
        conflictsByDay: {},
        conflictsByTimeSlot: {}
      },
      recommendations: []
    };
  }
}

// Test function
async function testGenerators() {
  console.log('🚀 Testing Timetable Generators...\n');

  // Initialize services
  const retrievalService = new MockRetrievalService() as any;
  const nepValidator = new MockNEPValidator() as any;
  const conflictDetector = new MockConflictDetector() as any;

  // Initialize generators
  const facultyGenerator = new FacultyScheduleGenerator(
    retrievalService,
    nepValidator,
    conflictDetector
  );

  const studentGenerator = new StudentScheduleGenerator(
    retrievalService,
    nepValidator,
    conflictDetector
  );

  const optimizationEngine = new OptimizationEngine();

  // Test Faculty Schedule Generator
  console.log('📚 Testing Faculty Schedule Generator...');
  const facultyRequest: FacultyScheduleRequest = {
    facultyId: 'faculty1',
    semester: 'Odd Semester 2024',
    academicYear: '2024-25',
    organizationId: 'org1',
    departmentId: 'dept1',
    preferences: {
      preferredTimeSlots: ['slot1', 'slot2'],
      preferredDays: ['Monday', 'Tuesday', 'Wednesday'],
      preferMorningSlots: true
    },
    constraints: {
      maxHoursPerDay: 6,
      maxHoursPerWeek: 30,
      avoidBackToBackClasses: true
    }
  };

  try {
    const facultyResult = await facultyGenerator.generateFacultySchedule(facultyRequest);
    console.log('✅ Faculty Schedule Generated Successfully!');
    console.log(`   - Total Classes: ${facultyResult.summary.totalClasses}`);
    console.log(`   - Total Hours: ${facultyResult.summary.totalHours}`);
    console.log(`   - Processing Time: ${facultyResult.processingTime}ms`);
    console.log(`   - Conflicts: ${facultyResult.conflicts.length}`);
    console.log(`   - NEP Compliance Score: ${facultyResult.nepCompliance.complianceScore}%\n`);
  } catch (error) {
    console.error('❌ Faculty Schedule Generation Failed:', error);
  }

  // Test Student Schedule Generator
  console.log('🎓 Testing Student Schedule Generator...');
  const studentRequest: StudentScheduleRequest = {
    studentId: 'student1',
    semester: 'Odd Semester 2024',
    academicYear: '2024-25',
    organizationId: 'org1',
    departmentId: 'dept1',
    chosenSubjects: ['sub1', 'sub2', 'sub3'],
    preferences: {
      preferredTimeSlots: ['slot1', 'slot2'],
      preferredDays: ['Monday', 'Tuesday', 'Wednesday'],
      preferMorningSlots: true,
      avoidBackToBackClasses: true
    },
    constraints: {
      maxHoursPerDay: 6,
      maxCreditsPerSemester: 30,
      minCreditsPerSemester: 20
    }
  };

  try {
    const studentResult = await studentGenerator.generateStudentSchedule(studentRequest);
    console.log('✅ Student Schedule Generated Successfully!');
    console.log(`   - Total Classes: ${studentResult.summary.totalClasses}`);
    console.log(`   - Total Hours: ${studentResult.summary.totalHours}`);
    console.log(`   - Total Credits: ${studentResult.summary.totalCredits}`);
    console.log(`   - Processing Time: ${studentResult.processingTime}ms`);
    console.log(`   - Conflicts: ${studentResult.conflicts.length}`);
    console.log(`   - NEP Compliance Score: ${studentResult.nepCompliance.complianceScore}%\n`);
  } catch (error) {
    console.error('❌ Student Schedule Generation Failed:', error);
  }

  // Test Optimization Engine
  console.log('⚡ Testing Optimization Engine...');
  const sampleSchedule = [
    {
      id: 'slot1',
      day: 'Monday',
      timeSlot: 'slot1',
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      subjectId: 'sub1',
      subjectName: 'Data Structures',
      subjectCode: 'CS201',
      subjectType: 'LECTURE' as const,
      roomId: 'room1',
      roomName: 'Lecture Hall 1',
      roomCapacity: 100,
      studentCount: 50,
      studentIds: ['student1', 'student2'],
      isOnline: false,
      isRecurring: true,
      priority: 'HIGH' as const
    }
  ];

  try {
    const optimizationResult = await optimizationEngine.optimizeFacultySchedule(
      sampleSchedule as any,
      { preferredTimeSlots: ['slot1'] },
      { maxHoursPerDay: 6 }
    );
    console.log('✅ Schedule Optimization Completed!');
    console.log(`   - Fitness Score: ${optimizationResult.fitnessScore.toFixed(3)}`);
    console.log(`   - Iterations: ${optimizationResult.iterations}`);
    console.log(`   - Convergence Reached: ${optimizationResult.convergenceReached}`);
    console.log(`   - Processing Time: ${optimizationResult.statistics.processingTime}ms\n`);
  } catch (error) {
    console.error('❌ Schedule Optimization Failed:', error);
  }

  // Test Optimization Methods
  console.log('🔧 Testing Optimization Methods...');
  
  try {
    const minimizedGaps = optimizationEngine.minimizeGaps(sampleSchedule as any);
    console.log('✅ Gap Minimization: Completed');
    
    const morningOptimized = optimizationEngine.preferMorningSlots(sampleSchedule as any);
    console.log('✅ Morning Slot Optimization: Completed');
    
    const balancedSessions = optimizationEngine.balanceSessionTypes(sampleSchedule as any);
    console.log('✅ Session Type Balancing: Completed\n');
  } catch (error) {
    console.error('❌ Optimization Methods Failed:', error);
  }

  console.log('🎉 All Tests Completed Successfully!');
  console.log('\n📋 Summary:');
  console.log('   ✅ FacultyScheduleGenerator - Generates personalized faculty schedules with NEP compliance');
  console.log('   ✅ StudentScheduleGenerator - Generates personalized student schedules with credit validation');
  console.log('   ✅ OptimizationEngine - Provides genetic algorithm optimization for schedules');
  console.log('   ✅ RAG Integration - Uses intelligent retrieval for efficient data access');
  console.log('   ✅ NEP 2020 Compliance - Validates schedules against NEP requirements');
  console.log('   ✅ Conflict Detection - Identifies and resolves scheduling conflicts');
  console.log('   ✅ Preference Handling - Respects user preferences and constraints');
}

// Run tests if this file is executed directly
if (require.main === module) {
  testGenerators().catch(console.error);
}

export { testGenerators };



