/**
 * Comprehensive Test Data Generator
 * Generates realistic test data for testing all system components
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export interface TestDataConfig {
  students: number;
  faculty: number;
  departments: number;
  subjects: number;
  rooms: number;
  timeSlots: number;
  organizations: number;
  academicYears: number;
  semesters: number;
  constraints: number;
  timetables: number;
  enableNEPCompliance: boolean;
  enableConflictScenarios: boolean;
  enablePerformanceLoad: boolean;
}

export interface GeneratedTestData {
  organizations: any[];
  departments: any[];
  faculties: any[];
  students: any[];
  subjects: any[];
  rooms: any[];
  timeSlots: any[];
  academicYears: any[];
  semesters: any[];
  constraints: any[];
  timetables: any[];
  enrollments: any[];
  facultyAvailability: any[];
  roomAvailability: any[];
  subjectPrerequisites: any[];
  subjectFaculty: any[];
}

export class TestDataGenerator {
  private prisma: PrismaClient;
  private config: TestDataConfig;

  constructor(prisma: PrismaClient, config: TestDataConfig) {
    this.prisma = prisma;
    this.config = config;
  }

  /**
   * Generate comprehensive test data
   */
  async generateTestData(): Promise<GeneratedTestData> {
    console.log('Starting comprehensive test data generation...');
    
    const startTime = Date.now();
    
    try {
      // Generate base organizational structure
      const organizations = await this.generateOrganizations();
      const departments = await this.generateDepartments(organizations);
      const academicYears = await this.generateAcademicYears(organizations);
      const semesters = await this.generateSemesters(academicYears);
      
      // Generate people
      const faculties = await this.generateFaculties(organizations, departments);
      const students = await this.generateStudents(organizations, departments);
      
      // Generate academic content
      const subjects = await this.generateSubjects(organizations, departments);
      const subjectPrerequisites = await this.generateSubjectPrerequisites(subjects);
      const subjectFaculty = await this.generateSubjectFaculty(subjects, faculties);
      
      // Generate infrastructure
      const rooms = await this.generateRooms(organizations);
      const timeSlots = await this.generateTimeSlots(organizations);
      
      // Generate constraints
      const constraints = await this.generateConstraints(organizations);
      
      // Generate timetables
      const timetables = await this.generateTimetables(organizations, academicYears, semesters, departments);
      
      // Generate enrollments
      const enrollments = await this.generateEnrollments(students, subjects, semesters);
      
      // Generate availability data
      const facultyAvailability = await this.generateFacultyAvailability(faculties);
      const roomAvailability = await this.generateRoomAvailability(rooms);
      
      const processingTime = Date.now() - startTime;
      console.log(`Test data generation completed in ${processingTime}ms`);
      
      return {
        organizations,
        departments,
        faculties,
        students,
        subjects,
        rooms,
        timeSlots,
        academicYears,
        semesters,
        constraints,
        timetables,
        enrollments,
        facultyAvailability,
        roomAvailability,
        subjectPrerequisites,
        subjectFaculty
      };
      
    } catch (error) {
      console.error('Test data generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate organizations
   */
  private async generateOrganizations(): Promise<any[]> {
    console.log(`Generating ${this.config.organizations} organizations...`);
    
    const organizations = [];
    
    for (let i = 0; i < this.config.organizations; i++) {
      const org = await this.prisma.organization.create({
        data: {
          name: faker.company.name() + ' University',
          code: faker.string.alphanumeric(4).toUpperCase(),
          type: faker.helpers.arrayElement(['UNIVERSITY', 'COLLEGE', 'INSTITUTE']),
          address: faker.location.streetAddress(),
          website: faker.internet.url(),
          phone: faker.phone.number(),
          email: faker.internet.email(),
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
      organizations.push(org);
    }
    
    return organizations;
  }

  /**
   * Generate departments
   */
  private async generateDepartments(organizations: any[]): Promise<any[]> {
    console.log(`Generating ${this.config.departments} departments...`);
    
    const departments = [];
    const departmentNames = [
      'Computer Science and Engineering',
      'Electronics and Communication Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Electrical Engineering',
      'Information Technology',
      'Data Science',
      'Artificial Intelligence',
      'Cybersecurity',
      'Software Engineering',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Management Studies',
      'Economics',
      'English',
      'Psychology',
      'Sociology',
      'History'
    ];
    
    for (const org of organizations) {
      const orgDepartments = faker.helpers.arrayElements(departmentNames, this.config.departments);
      
      for (let i = 0; i < orgDepartments.length; i++) {
        const dept = await this.prisma.department.create({
          data: {
            organizationId: org.id,
            name: orgDepartments[i],
            code: faker.string.alphanumeric(3).toUpperCase(),
            description: faker.lorem.sentence(),
            nepCategories: faker.helpers.arrayElements([
              'CORE', 'ELECTIVE', 'SKILL_BASED', 'FOUNDATION', 
              'INTERDISCIPLINARY', 'PROJECT', 'INTERNSHIP', 'RESEARCH'
            ], faker.number.int({ min: 2, max: 5 }))
          }
        });
        departments.push(dept);
      }
    }
    
    return departments;
  }

  /**
   * Generate academic years
   */
  private async generateAcademicYears(organizations: any[]): Promise<any[]> {
    console.log(`Generating ${this.config.academicYears} academic years...`);
    
    const academicYears = [];
    const currentYear = new Date().getFullYear();
    
    for (const org of organizations) {
      for (let i = 0; i < this.config.academicYears; i++) {
        const year = currentYear - i;
        const academicYear = await this.prisma.academicYear.create({
          data: {
            organizationId: org.id,
            year: `${year}-${(year + 1).toString().slice(-2)}`,
            startDate: new Date(year, 7, 1), // August 1st
            endDate: new Date(year + 1, 6, 30), // July 31st
            isActive: i === 0
          }
        });
        academicYears.push(academicYear);
      }
    }
    
    return academicYears;
  }

  /**
   * Generate semesters
   */
  private async generateSemesters(academicYears: any[]): Promise<any[]> {
    console.log(`Generating ${this.config.semesters} semesters...`);
    
    const semesters = [];
    
    for (const academicYear of academicYears) {
      for (let i = 1; i <= this.config.semesters; i++) {
        const semester = await this.prisma.semester.create({
          data: {
            organizationId: academicYear.organizationId,
            academicYearId: academicYear.id,
            name: i % 2 === 1 ? 'Odd Semester' : 'Even Semester',
            number: i,
            startDate: new Date(academicYear.startDate.getFullYear(), (i - 1) * 6, 1),
            endDate: new Date(academicYear.startDate.getFullYear(), i * 6 - 1, 30),
            isActive: i <= 2
          }
        });
        semesters.push(semester);
      }
    }
    
    return semesters;
  }

  /**
   * Generate faculties
   */
  private async generateFaculties(organizations: any[], departments: any[]): Promise<any[]> {
    console.log(`Generating ${this.config.faculty} faculties...`);
    
    const faculties = [];
    const designations = [
      'Professor', 'Associate Professor', 'Assistant Professor', 
      'Lecturer', 'Senior Lecturer', 'Principal'
    ];
    
    for (const dept of departments) {
      const facultyCount = Math.ceil(this.config.faculty / departments.length);
      
      for (let i = 0; i < facultyCount; i++) {
        const faculty = await this.prisma.faculty.create({
          data: {
            organizationId: dept.organizationId,
            departmentId: dept.id,
            employeeId: faker.string.alphanumeric(8).toUpperCase(),
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            designation: faker.helpers.arrayElement(designations),
            qualification: faker.helpers.arrayElement([
              'Ph.D. in Computer Science',
              'M.Tech in Information Technology',
              'Ph.D. in Electronics',
              'M.E. in Mechanical Engineering',
              'Ph.D. in Mathematics',
              'M.Sc. in Physics',
              'Ph.D. in Chemistry',
              'MBA in Management'
            ]),
            specializations: faker.helpers.arrayElements([
              'Machine Learning', 'Data Structures', 'Algorithms', 'Database Systems',
              'Computer Networks', 'Software Engineering', 'Artificial Intelligence',
              'Cybersecurity', 'Web Development', 'Mobile Development'
            ], faker.number.int({ min: 2, max: 5 })),
            nepCategories: faker.helpers.arrayElements([
              'CORE', 'ELECTIVE', 'SKILL_BASED', 'FOUNDATION', 
              'INTERDISCIPLINARY', 'PROJECT', 'INTERNSHIP', 'RESEARCH'
            ], faker.number.int({ min: 2, max: 4 })),
            maxHoursPerWeek: faker.number.int({ min: 20, max: 40 }),
            currentWorkload: faker.number.int({ min: 0, max: 35 }),
            isAvailable: faker.datatype.boolean(0.9)
          }
        });
        faculties.push(faculty);
      }
    }
    
    return faculties;
  }

  /**
   * Generate students
   */
  private async generateStudents(organizations: any[], departments: any[]): Promise<any[]> {
    console.log(`Generating ${this.config.students} students...`);
    
    const students = [];
    
    for (const dept of departments) {
      const studentCount = Math.ceil(this.config.students / departments.length);
      
      for (let i = 0; i < studentCount; i++) {
        const student = await this.prisma.student.create({
          data: {
            organizationId: dept.organizationId,
            departmentId: dept.id,
            rollNumber: faker.string.alphanumeric(10).toUpperCase(),
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            dateOfBirth: faker.date.birthdate({ min: 18, max: 25, mode: 'age' }),
            currentYear: faker.number.int({ min: 1, max: 4 }),
            currentSemester: faker.number.int({ min: 1, max: 8 }),
            admissionYear: faker.number.int({ min: 2020, max: 2024 }),
            isActive: faker.datatype.boolean(0.95),
            totalCreditsEarned: faker.number.int({ min: 0, max: 120 }),
            coreCreditsEarned: faker.number.int({ min: 0, max: 80 }),
            electiveCreditsEarned: faker.number.int({ min: 0, max: 40 }),
            skillCreditsEarned: faker.number.int({ min: 0, max: 20 })
          }
        });
        students.push(student);
      }
    }
    
    return students;
  }

  /**
   * Generate subjects
   */
  private async generateSubjects(organizations: any[], departments: any[]): Promise<any[]> {
    console.log(`Generating ${this.config.subjects} subjects...`);
    
    const subjects = [];
    const subjectTemplates = [
      { name: 'Data Structures', code: 'DS', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0 },
      { name: 'Algorithms', code: 'ALG', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0 },
      { name: 'Database Systems', code: 'DB', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0 },
      { name: 'Computer Networks', code: 'CN', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0 },
      { name: 'Software Engineering', code: 'SE', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0 },
      { name: 'Machine Learning', code: 'ML', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0 },
      { name: 'Web Development', code: 'WD', credits: 3, lectureHours: 2, tutorialHours: 0, practicalHours: 2 },
      { name: 'Mobile Development', code: 'MD', credits: 3, lectureHours: 2, tutorialHours: 0, practicalHours: 2 },
      { name: 'Cybersecurity', code: 'CS', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0 },
      { name: 'Artificial Intelligence', code: 'AI', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0 }
    ];
    
    for (const dept of departments) {
      const subjectCount = Math.ceil(this.config.subjects / departments.length);
      const deptSubjects = faker.helpers.arrayElements(subjectTemplates, subjectCount);
      
      for (let i = 0; i < deptSubjects.length; i++) {
        const template = deptSubjects[i];
        const subject = await this.prisma.subject.create({
          data: {
            organizationId: dept.organizationId,
            departmentId: dept.id,
            code: `${dept.code}${template.code}${faker.number.int({ min: 100, max: 999 })}`,
            name: template.name,
            description: faker.lorem.sentence(),
            nepCategory: faker.helpers.arrayElement(['CORE', 'ELECTIVE', 'SKILL_BASED', 'FOUNDATION']),
            credits: template.credits,
            lectureHours: template.lectureHours,
            tutorialHours: template.tutorialHours,
            practicalHours: template.practicalHours,
            continuousAssessmentWeight: 40,
            endSemesterExamWeight: 60,
            isOffered: faker.datatype.boolean(0.9),
            offeredInYears: faker.helpers.arrayElements([1, 2, 3, 4], faker.number.int({ min: 1, max: 3 }))
          }
        });
        subjects.push(subject);
      }
    }
    
    return subjects;
  }

  /**
   * Generate rooms
   */
  private async generateRooms(organizations: any[]): Promise<any[]> {
    console.log(`Generating ${this.config.rooms} rooms...`);
    
    const rooms = [];
    const roomTypes = ['LECTURE_HALL', 'TUTORIAL_ROOM', 'LABORATORY', 'SEMINAR_HALL', 'COMPUTER_LAB'];
    
    for (const org of organizations) {
      const roomCount = Math.ceil(this.config.rooms / organizations.length);
      
      for (let i = 0; i < roomCount; i++) {
        const room = await this.prisma.room.create({
          data: {
            organizationId: org.id,
            name: faker.helpers.arrayElement([
              'Lecture Hall', 'Tutorial Room', 'Computer Lab', 'Seminar Hall', 'Laboratory'
            ]) + ` ${faker.number.int({ min: 1, max: 50 })}`,
            code: faker.string.alphanumeric(6).toUpperCase(),
            type: faker.helpers.arrayElement(roomTypes),
            capacity: faker.number.int({ min: 20, max: 200 }),
            floor: faker.number.int({ min: 0, max: 5 }),
            building: faker.helpers.arrayElement(['A Block', 'B Block', 'C Block', 'Main Building', 'Science Block']),
            equipment: faker.helpers.arrayElements([
              'Projector', 'Whiteboard', 'Computers', 'Air Conditioning', 'Sound System', 'WiFi'
            ], faker.number.int({ min: 2, max: 5 })),
            isAccessible: faker.datatype.boolean(0.8)
          }
        });
        rooms.push(room);
      }
    }
    
    return rooms;
  }

  /**
   * Generate time slots
   */
  private async generateTimeSlots(organizations: any[]): Promise<any[]> {
    console.log(`Generating ${this.config.timeSlots} time slots...`);
    
    const timeSlots = [];
    const timeSlotTemplates = [
      { name: 'Slot 1', startTime: '09:00', endTime: '10:00', duration: 60 },
      { name: 'Slot 2', startTime: '10:00', endTime: '11:00', duration: 60 },
      { name: 'Slot 3', startTime: '11:00', endTime: '12:00', duration: 60 },
      { name: 'Slot 4', startTime: '12:00', endTime: '13:00', duration: 60 },
      { name: 'Slot 5', startTime: '14:00', endTime: '15:00', duration: 60 },
      { name: 'Slot 6', startTime: '15:00', endTime: '16:00', duration: 60 },
      { name: 'Slot 7', startTime: '16:00', endTime: '17:00', duration: 60 }
    ];
    
    for (const org of organizations) {
      for (let i = 0; i < this.config.timeSlots; i++) {
        const template = timeSlotTemplates[i % timeSlotTemplates.length];
        const timeSlot = await this.prisma.timeSlot.create({
          data: {
            organizationId: org.id,
            name: template.name,
            startTime: template.startTime,
            endTime: template.endTime,
            duration: template.duration,
            dayOfWeek: faker.number.int({ min: 0, max: 6 }),
            isActive: true
          }
        });
        timeSlots.push(timeSlot);
      }
    }
    
    return timeSlots;
  }

  /**
   * Generate constraints
   */
  private async generateConstraints(organizations: any[]): Promise<any[]> {
    console.log(`Generating ${this.config.constraints} constraints...`);
    
    const constraints = [];
    const constraintTypes = [
      'FACULTY_MAX_HOURS_PER_DAY',
      'FACULTY_MAX_HOURS_PER_WEEK',
      'FACULTY_AVAILABILITY',
      'ROOM_CAPACITY',
      'ROOM_AVAILABILITY',
      'STUDENT_MAX_HOURS_PER_DAY',
      'NEP_CREDIT_DISTRIBUTION',
      'SUBJECT_PREREQUISITES'
    ];
    
    for (const org of organizations) {
      const constraintCount = Math.ceil(this.config.constraints / organizations.length);
      
      for (let i = 0; i < constraintCount; i++) {
        const constraint = await this.prisma.constraint.create({
          data: {
            organizationId: org.id,
            name: faker.lorem.words(3),
            type: faker.helpers.arrayElement(constraintTypes),
            description: faker.lorem.sentence(),
            config: {
              maxHours: faker.number.int({ min: 6, max: 8 }),
              minHours: faker.number.int({ min: 1, max: 3 }),
              priority: faker.helpers.arrayElement(['HIGH', 'MEDIUM', 'LOW']),
              enabled: true
            },
            priority: faker.number.int({ min: 1, max: 10 }),
            weight: faker.number.float({ min: 0.1, max: 1.0 }),
            isActive: true
          }
        });
        constraints.push(constraint);
      }
    }
    
    return constraints;
  }

  /**
   * Generate timetables
   */
  private async generateTimetables(
    organizations: any[], 
    academicYears: any[], 
    semesters: any[], 
    departments: any[]
  ): Promise<any[]> {
    console.log(`Generating ${this.config.timetables} timetables...`);
    
    const timetables = [];
    
    for (const org of organizations) {
      const timetableCount = Math.ceil(this.config.timetables / organizations.length);
      const orgAcademicYears = academicYears.filter(ay => ay.organizationId === org.id);
      const orgSemesters = semesters.filter(s => s.organizationId === org.id);
      const orgDepartments = departments.filter(d => d.organizationId === org.id);
      
      for (let i = 0; i < timetableCount; i++) {
        const timetable = await this.prisma.timetable.create({
          data: {
            organizationId: org.id,
            academicYearId: faker.helpers.arrayElement(orgAcademicYears).id,
            semesterId: faker.helpers.arrayElement(orgSemesters).id,
            name: `Timetable ${i + 1}`,
            description: faker.lorem.sentence(),
            year: faker.number.int({ min: 1, max: 4 }),
            departmentId: faker.helpers.arrayElement(orgDepartments).id,
            status: faker.helpers.arrayElement(['DRAFT', 'GENERATED', 'PUBLISHED']),
            version: faker.number.int({ min: 1, max: 5 }),
            totalConflicts: faker.number.int({ min: 0, max: 10 }),
            optimizationScore: faker.number.float({ min: 0.5, max: 1.0 })
          }
        });
        timetables.push(timetable);
      }
    }
    
    return timetables;
  }

  /**
   * Generate enrollments
   */
  private async generateEnrollments(students: any[], subjects: any[], semesters: any[]): Promise<any[]> {
    console.log('Generating enrollments...');
    
    const enrollments = [];
    
    for (const student of students) {
      const enrollmentCount = faker.number.int({ min: 4, max: 8 });
      const studentSubjects = faker.helpers.arrayElements(subjects, enrollmentCount);
      const studentSemesters = semesters.filter(s => s.organizationId === student.organizationId);
      
      for (const subject of studentSubjects) {
        if (subject.organizationId === student.organizationId) {
          const enrollment = await this.prisma.enrollment.create({
            data: {
              studentId: student.id,
              subjectId: subject.id,
              semesterId: faker.helpers.arrayElement(studentSemesters).id,
              enrollmentDate: faker.date.recent(),
              isActive: faker.datatype.boolean(0.9),
              grade: faker.helpers.arrayElement(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', null]),
              creditsEarned: subject.credits
            }
          });
          enrollments.push(enrollment);
        }
      }
    }
    
    return enrollments;
  }

  /**
   * Generate faculty availability
   */
  private async generateFacultyAvailability(faculties: any[]): Promise<any[]> {
    console.log('Generating faculty availability...');
    
    const availability = [];
    
    for (const faculty of faculties) {
      const availabilityCount = faker.number.int({ min: 3, max: 7 }); // 3-7 days per week
      
      for (let i = 0; i < availabilityCount; i++) {
        const dayAvailability = await this.prisma.facultyAvailability.create({
          data: {
            facultyId: faculty.id,
            dayOfWeek: faker.number.int({ min: 0, max: 6 }),
            startTime: faker.helpers.arrayElement(['09:00', '10:00', '11:00', '14:00', '15:00']),
            endTime: faker.helpers.arrayElement(['17:00', '18:00', '19:00', '20:00']),
            isAvailable: faker.datatype.boolean(0.9),
            reason: faker.helpers.arrayElement(['Office Hours', 'Research Time', 'Meetings', 'Personal Time'])
          }
        });
        availability.push(dayAvailability);
      }
    }
    
    return availability;
  }

  /**
   * Generate room availability
   */
  private async generateRoomAvailability(rooms: any[]): Promise<any[]> {
    console.log('Generating room availability...');
    
    const availability = [];
    
    for (const room of rooms) {
      const availabilityCount = faker.number.int({ min: 5, max: 7 }); // 5-7 days per week
      
      for (let i = 0; i < availabilityCount; i++) {
        const dayAvailability = await this.prisma.roomAvailability.create({
          data: {
            roomId: room.id,
            dayOfWeek: faker.number.int({ min: 0, max: 6 }),
            startTime: '08:00',
            endTime: '20:00',
            isAvailable: faker.datatype.boolean(0.95),
            reason: faker.helpers.arrayElement(['Available', 'Maintenance', 'Reserved', 'Cleaning'])
          }
        });
        availability.push(dayAvailability);
      }
    }
    
    return availability;
  }

  /**
   * Generate subject prerequisites
   */
  private async generateSubjectPrerequisites(subjects: any[]): Promise<any[]> {
    console.log('Generating subject prerequisites...');
    
    const prerequisites = [];
    
    for (const subject of subjects) {
      const prerequisiteCount = faker.number.int({ min: 0, max: 3 });
      const potentialPrerequisites = subjects.filter(s => 
        s.id !== subject.id && 
        s.organizationId === subject.organizationId &&
        s.departmentId === subject.departmentId
      );
      
      if (potentialPrerequisites.length > 0) {
        const selectedPrerequisites = faker.helpers.arrayElements(
          potentialPrerequisites, 
          Math.min(prerequisiteCount, potentialPrerequisites.length)
        );
        
        for (const prerequisite of selectedPrerequisites) {
          const prereq = await this.prisma.subjectPrerequisite.create({
            data: {
              subjectId: subject.id,
              prerequisiteId: prerequisite.id,
              isMandatory: faker.datatype.boolean(0.8)
            }
          });
          prerequisites.push(prereq);
        }
      }
    }
    
    return prerequisites;
  }

  /**
   * Generate subject-faculty relationships
   */
  private async generateSubjectFaculty(subjects: any[], faculties: any[]): Promise<any[]> {
    console.log('Generating subject-faculty relationships...');
    
    const subjectFaculty = [];
    
    for (const subject of subjects) {
      const facultyCount = faker.number.int({ min: 1, max: 3 });
      const potentialFaculty = faculties.filter(f => 
        f.organizationId === subject.organizationId &&
        f.departmentId === subject.departmentId
      );
      
      if (potentialFaculty.length > 0) {
        const selectedFaculty = faker.helpers.arrayElements(
          potentialFaculty, 
          Math.min(facultyCount, potentialFaculty.length)
        );
        
        for (let i = 0; i < selectedFaculty.length; i++) {
          const sf = await this.prisma.subjectFaculty.create({
            data: {
              subjectId: subject.id,
              facultyId: selectedFaculty[i].id,
              isPrimary: i === 0, // First faculty is primary
              canTeach: faker.datatype.boolean(0.95)
            }
          });
          subjectFaculty.push(sf);
        }
      }
    }
    
    return subjectFaculty;
  }

  /**
   * Generate NEP compliance test scenarios
   */
  async generateNEPComplianceScenarios(): Promise<any[]> {
    console.log('Generating NEP compliance test scenarios...');
    
    const scenarios = [];
    
    // Scenario 1: Credit distribution compliance
    scenarios.push({
      name: 'Credit Distribution Compliance',
      description: 'Test NEP 2020 credit distribution requirements (60% core, 30% elective, 10% skill-based)',
      testData: {
        coreCredits: 60,
        electiveCredits: 30,
        skillCredits: 10,
        totalCredits: 100
      },
      expectedCompliance: true
    });
    
    // Scenario 2: Credit distribution violation
    scenarios.push({
      name: 'Credit Distribution Violation',
      description: 'Test NEP 2020 credit distribution violation (70% core, 20% elective, 10% skill-based)',
      testData: {
        coreCredits: 70,
        electiveCredits: 20,
        skillCredits: 10,
        totalCredits: 100
      },
      expectedCompliance: false
    });
    
    // Scenario 3: Assessment pattern compliance
    scenarios.push({
      name: 'Assessment Pattern Compliance',
      description: 'Test NEP 2020 assessment pattern (40% continuous, 60% final)',
      testData: {
        continuousAssessment: 40,
        finalExam: 60,
        totalAssessment: 100
      },
      expectedCompliance: true
    });
    
    // Scenario 4: Faculty workload compliance
    scenarios.push({
      name: 'Faculty Workload Compliance',
      description: 'Test NEP 2020 faculty workload limits (max 40 hours/week)',
      testData: {
        facultyWorkload: 35,
        maxAllowedWorkload: 40
      },
      expectedCompliance: true
    });
    
    return scenarios;
  }

  /**
   * Generate conflict resolution test scenarios
   */
  async generateConflictResolutionScenarios(): Promise<any[]> {
    console.log('Generating conflict resolution test scenarios...');
    
    const scenarios = [];
    
    // Scenario 1: Faculty double booking
    scenarios.push({
      name: 'Faculty Double Booking',
      description: 'Test resolution of faculty double booking conflicts',
      testData: {
        facultyId: 'faculty_1',
        conflictingSlots: [
          { day: 'Monday', time: '09:00-10:00', subject: 'CS101' },
          { day: 'Monday', time: '09:00-10:00', subject: 'CS102' }
        ]
      },
      expectedResolution: 'Reschedule one class to different time slot'
    });
    
    // Scenario 2: Room double booking
    scenarios.push({
      name: 'Room Double Booking',
      description: 'Test resolution of room double booking conflicts',
      testData: {
        roomId: 'room_1',
        conflictingSlots: [
          { day: 'Tuesday', time: '11:00-12:00', faculty: 'Prof. Smith' },
          { day: 'Tuesday', time: '11:00-12:00', faculty: 'Prof. Jones' }
        ]
      },
      expectedResolution: 'Assign different room to one class'
    });
    
    // Scenario 3: Student schedule conflict
    scenarios.push({
      name: 'Student Schedule Conflict',
      description: 'Test resolution of student schedule conflicts',
      testData: {
        studentId: 'student_1',
        conflictingSubjects: ['CS101', 'CS102'],
        timeSlot: 'Wednesday 10:00-11:00'
      },
      expectedResolution: 'Reschedule one subject to different time slot'
    });
    
    return scenarios;
  }

  /**
   * Generate performance load test data
   */
  async generatePerformanceLoadTestData(): Promise<any> {
    console.log('Generating performance load test data...');
    
    const loadTestConfig = {
      students: 10000,
      faculty: 500,
      departments: 50,
      subjects: 1000,
      rooms: 200,
      timeSlots: 50,
      constraints: 100,
      timetables: 100
    };
    
    const loadTestGenerator = new TestDataGenerator(this.prisma, loadTestConfig);
    return await loadTestGenerator.generateTestData();
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(): Promise<void> {
    console.log('Cleaning up test data...');
    
    try {
      // Delete in reverse order of dependencies
      await this.prisma.timetableSlot.deleteMany();
      await this.prisma.timetableFaculty.deleteMany();
      await this.prisma.timetableStudent.deleteMany();
      await this.prisma.timetableSubject.deleteMany();
      await this.prisma.timetableRoom.deleteMany();
      await this.prisma.timetable.deleteMany();
      await this.prisma.enrollment.deleteMany();
      await this.prisma.subjectPrerequisite.deleteMany();
      await this.prisma.subjectFaculty.deleteMany();
      await this.prisma.facultyAvailability.deleteMany();
      await this.prisma.roomAvailability.deleteMany();
      await this.prisma.constraint.deleteMany();
      await this.prisma.timeSlot.deleteMany();
      await this.prisma.room.deleteMany();
      await this.prisma.subject.deleteMany();
      await this.prisma.student.deleteMany();
      await this.prisma.faculty.deleteMany();
      await this.prisma.semester.deleteMany();
      await this.prisma.academicYear.deleteMany();
      await this.prisma.department.deleteMany();
      await this.prisma.nepSettings.deleteMany();
      await this.prisma.organization.deleteMany();
      
      console.log('Test data cleanup completed');
    } catch (error) {
      console.error('Test data cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Get default configuration
   */
  static getDefaultConfig(): TestDataConfig {
    return {
      students: 1000,
      faculty: 50,
      departments: 10,
      subjects: 100,
      rooms: 50,
      timeSlots: 10,
      organizations: 2,
      academicYears: 2,
      semesters: 4,
      constraints: 20,
      timetables: 10,
      enableNEPCompliance: true,
      enableConflictScenarios: true,
      enablePerformanceLoad: false
    };
  }
}

