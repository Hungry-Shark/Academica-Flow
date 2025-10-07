/**
 * Jest Test Setup
 * Global test configuration and setup
 */

import { PrismaClient } from '@prisma/client';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
declare global {
  var prisma: PrismaClient;
}

// Setup Prisma client for tests
beforeAll(async () => {
  global.prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/academica_flow_test'
      }
    }
  });
  
  // Connect to test database
  await global.prisma.$connect();
});

// Cleanup after all tests
afterAll(async () => {
  if (global.prisma) {
    await global.prisma.$disconnect();
  }
});

// Cleanup after each test
afterEach(async () => {
  // Clean up test data
  if (global.prisma) {
    // Delete test data in reverse order of dependencies
    await global.prisma.timetableSlot.deleteMany();
    await global.prisma.timetableFaculty.deleteMany();
    await global.prisma.timetableStudent.deleteMany();
    await global.prisma.timetableSubject.deleteMany();
    await global.prisma.timetableRoom.deleteMany();
    await global.prisma.timetable.deleteMany();
    await global.prisma.enrollment.deleteMany();
    await global.prisma.subjectPrerequisite.deleteMany();
    await global.prisma.subjectFaculty.deleteMany();
    await global.prisma.facultyAvailability.deleteMany();
    await global.prisma.roomAvailability.deleteMany();
    await global.prisma.constraint.deleteMany();
    await global.prisma.timeSlot.deleteMany();
    await global.prisma.room.deleteMany();
    await global.prisma.subject.deleteMany();
    await global.prisma.student.deleteMany();
    await global.prisma.faculty.deleteMany();
    await global.prisma.semester.deleteMany();
    await global.prisma.academicYear.deleteMany();
    await global.prisma.department.deleteMany();
    await global.prisma.nepSettings.deleteMany();
    await global.prisma.organization.deleteMany();
  }
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/academica_flow_test';
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379';
process.env.CHROMA_URL = process.env.TEST_CHROMA_URL || 'http://localhost:8000';
process.env.MCP_URL = process.env.TEST_MCP_URL || 'http://localhost:3001';
process.env.OPENAI_API_KEY = process.env.TEST_OPENAI_API_KEY || 'test-key';
process.env.JWT_SECRET = process.env.TEST_JWT_SECRET || 'test-secret';

// Helper functions for tests
export const testUtils = {
  // Create test organization
  async createTestOrganization(prisma: PrismaClient) {
    return await prisma.organization.create({
      data: {
        name: 'Test University',
        code: 'TEST',
        type: 'UNIVERSITY',
        address: '123 Test Street',
        website: 'https://test.edu',
        phone: '123-456-7890',
        email: 'test@university.edu',
        isActive: true,
        nepSettings: {
          create: {
            corePercentage: 60,
            electivePercentage: 30,
            skillPercentage: 10,
            minCreditsPerSemester: 20,
            maxCreditsPerSemester: 30,
            totalCreditsForDegree: 160,
            continuousAssessmentWeight: 40,
            endSemesterExamWeight: 60,
            maxFacultyHoursPerWeek: 40,
            minFacultyHoursPerWeek: 20,
            allowCrossDepartmentElectives: true,
            allowInterDisciplinaryCourses: true,
            allowOnlineCourses: false
          }
        }
      }
    });
  },

  // Create test department
  async createTestDepartment(prisma: PrismaClient, organizationId: string) {
    return await prisma.department.create({
      data: {
        organizationId,
        name: 'Computer Science and Engineering',
        code: 'CSE',
        description: 'Test Computer Science Department',
        nepCategories: ['CORE', 'ELECTIVE', 'SKILL_BASED']
      }
    });
  },

  // Create test faculty
  async createTestFaculty(prisma: PrismaClient, organizationId: string, departmentId: string) {
    return await prisma.faculty.create({
      data: {
        organizationId,
        departmentId,
        employeeId: 'TEST001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.edu',
        phone: '123-456-7890',
        designation: 'Professor',
        qualification: 'Ph.D. in Computer Science',
        specializations: ['Machine Learning', 'Data Structures'],
        nepCategories: ['CORE', 'ELECTIVE'],
        maxHoursPerWeek: 40,
        currentWorkload: 0,
        isAvailable: true
      }
    });
  },

  // Create test student
  async createTestStudent(prisma: PrismaClient, organizationId: string, departmentId: string) {
    return await prisma.student.create({
      data: {
        organizationId,
        departmentId,
        rollNumber: 'TEST2024001',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@test.edu',
        phone: '123-456-7891',
        dateOfBirth: new Date('2000-01-01'),
        currentYear: 1,
        currentSemester: 1,
        admissionYear: 2024,
        isActive: true,
        totalCreditsEarned: 0,
        coreCreditsEarned: 0,
        electiveCreditsEarned: 0,
        skillCreditsEarned: 0
      }
    });
  },

  // Create test subject
  async createTestSubject(prisma: PrismaClient, organizationId: string, departmentId: string) {
    return await prisma.subject.create({
      data: {
        organizationId,
        departmentId,
        code: 'CSE101',
        name: 'Introduction to Computer Science',
        description: 'Basic concepts of computer science',
        nepCategory: 'CORE',
        credits: 4,
        lectureHours: 3,
        tutorialHours: 1,
        practicalHours: 0,
        continuousAssessmentWeight: 40,
        endSemesterExamWeight: 60,
        isOffered: true,
        offeredInYears: [1, 2]
      }
    });
  },

  // Create test room
  async createTestRoom(prisma: PrismaClient, organizationId: string) {
    return await prisma.room.create({
      data: {
        organizationId,
        name: 'Lecture Hall 1',
        code: 'LH1',
        type: 'LECTURE_HALL',
        capacity: 100,
        floor: 1,
        building: 'Main Building',
        equipment: ['Projector', 'Whiteboard', 'Air Conditioning'],
        isAccessible: true
      }
    });
  },

  // Create test time slot
  async createTestTimeSlot(prisma: PrismaClient, organizationId: string) {
    return await prisma.timeSlot.create({
      data: {
        organizationId,
        name: 'Slot 1',
        startTime: '09:00',
        endTime: '10:00',
        duration: 60,
        dayOfWeek: 1, // Monday
        isActive: true
      }
    });
  },

  // Wait for async operations
  async wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Generate random test data
  generateRandomString(length: number = 10) {
    return Math.random().toString(36).substring(2, 2 + length);
  },

  // Generate random email
  generateRandomEmail() {
    return `test.${this.generateRandomString(8)}@test.edu`;
  },

  // Generate random phone number
  generateRandomPhone() {
    return `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  }
};

// Export for use in tests
export { testUtils };

