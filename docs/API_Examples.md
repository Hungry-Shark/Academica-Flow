# NEP 2020 Timetable System - API Examples

## Overview

This document provides comprehensive API examples for the NEP 2020 compliant timetable system, demonstrating how to interact with the database schema for various operations.

## Prerequisites

```bash
# Install dependencies
npm install @prisma/client prisma

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed
```

## Core API Examples

### 1. Organization Management

#### Create Organization with NEP Settings
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createOrganization() {
  const organization = await prisma.organization.create({
    data: {
      name: 'Delhi Technological University',
      code: 'DTU',
      type: 'UNIVERSITY',
      address: 'Delhi, India',
      website: 'https://dtu.ac.in',
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
          allowCrossDepartmentElectives: true,
          allowInterDisciplinaryCourses: true,
        }
      }
    },
    include: {
      nepSettings: true
    }
  });
  
  return organization;
}
```

### 2. Academic Structure Management

#### Create Academic Year and Semesters
```typescript
async function createAcademicStructure(organizationId: string) {
  // Create Academic Year
  const academicYear = await prisma.academicYear.create({
    data: {
      organizationId,
      year: '2024-25',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2025-06-30'),
      isActive: true,
    }
  });

  // Create Semesters
  const oddSemester = await prisma.semester.create({
    data: {
      organizationId,
      academicYearId: academicYear.id,
      name: 'Odd Semester',
      number: 1,
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-12-31'),
      isActive: true,
    }
  });

  const evenSemester = await prisma.semester.create({
    data: {
      organizationId,
      academicYearId: academicYear.id,
      name: 'Even Semester',
      number: 2,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-06-30'),
      isActive: false,
    }
  });

  return { academicYear, oddSemester, evenSemester };
}
```

### 3. Faculty Management

#### Create Faculty with Specializations
```typescript
async function createFaculty(organizationId: string, departmentId: string) {
  const faculty = await prisma.faculty.create({
    data: {
      organizationId,
      departmentId,
      employeeId: 'CSE001',
      firstName: 'Dr. Rajesh',
      lastName: 'Kumar',
      email: 'rajesh.kumar@dtu.ac.in',
      designation: 'Professor',
      qualification: 'Ph.D. in Computer Science',
      specializations: ['Data Structures', 'Algorithms', 'Machine Learning'],
      nepCategories: ['CORE', 'ELECTIVE', 'SKILL_BASED'],
      maxHoursPerWeek: 40,
      currentWorkload: 0,
      isAvailable: true,
    }
  });

  // Set availability
  const availability = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true },
  ];

  for (const slot of availability) {
    await prisma.facultyAvailability.create({
      data: {
        facultyId: faculty.id,
        ...slot
      }
    });
  }

  return faculty;
}
```

### 4. Subject Management (NEP 2020 Compliant)

#### Create NEP Compliant Subjects
```typescript
async function createNEPSubjects(organizationId: string, departmentId: string) {
  const subjects = [
    // Core Subjects (60%)
    {
      code: 'CS101',
      name: 'Programming Fundamentals',
      credits: 4,
      lectureHours: 3,
      tutorialHours: 1,
      practicalHours: 0,
      nepCategory: 'CORE',
      offeredInYears: [1],
      continuousAssessmentWeight: 40,
      endSemesterExamWeight: 60,
    },
    {
      code: 'CS102',
      name: 'Data Structures and Algorithms',
      credits: 4,
      lectureHours: 3,
      tutorialHours: 1,
      practicalHours: 0,
      nepCategory: 'CORE',
      offeredInYears: [1, 2],
      continuousAssessmentWeight: 40,
      endSemesterExamWeight: 60,
    },
    // Elective Subjects (30%)
    {
      code: 'CS401',
      name: 'Machine Learning',
      credits: 3,
      lectureHours: 2,
      tutorialHours: 1,
      practicalHours: 0,
      nepCategory: 'ELECTIVE',
      offeredInYears: [4],
      continuousAssessmentWeight: 50,
      endSemesterExamWeight: 50,
    },
    // Skill-based Subjects (10%)
    {
      code: 'CS501',
      name: 'Programming Lab - Python',
      credits: 2,
      lectureHours: 0,
      tutorialHours: 0,
      practicalHours: 2,
      nepCategory: 'SKILL_BASED',
      offeredInYears: [1, 2],
      continuousAssessmentWeight: 60,
      endSemesterExamWeight: 40,
    },
    // Interdisciplinary Subjects
    {
      code: 'ID101',
      name: 'Mathematics for Engineers',
      credits: 4,
      lectureHours: 3,
      tutorialHours: 1,
      practicalHours: 0,
      nepCategory: 'INTERDISCIPLINARY',
      offeredInYears: [1, 2],
      continuousAssessmentWeight: 40,
      endSemesterExamWeight: 60,
    },
  ];

  const createdSubjects = [];
  for (const subjectData of subjects) {
    const subject = await prisma.subject.create({
      data: {
        organizationId,
        departmentId,
        ...subjectData,
        isOffered: true,
      }
    });
    createdSubjects.push(subject);
  }

  return createdSubjects;
}
```

### 5. Student Management and Enrollment

#### Create Student with Credit Tracking
```typescript
async function createStudent(organizationId: string, departmentId: string) {
  const student = await prisma.student.create({
    data: {
      organizationId,
      departmentId,
      rollNumber: '2024CSE001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@dtu.ac.in',
      currentYear: 1,
      currentSemester: 1,
      admissionYear: 2024,
      isActive: true,
      totalCreditsEarned: 0,
      coreCreditsEarned: 0,
      electiveCreditsEarned: 0,
      skillCreditsEarned: 0,
    }
  });

  return student;
}

// Enroll Student in Subjects
async function enrollStudent(studentId: string, subjectIds: string[], semesterId: string) {
  const enrollments = [];
  
  for (const subjectId of subjectIds) {
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        subjectId,
        semesterId,
        isActive: true,
        creditsEarned: 0,
      }
    });
    enrollments.push(enrollment);
  }

  return enrollments;
}
```

### 6. Timetable Generation

#### Generate Timetable with Constraints
```typescript
async function generateTimetable(
  organizationId: string,
  academicYearId: string,
  semesterId: string,
  departmentId: string,
  year: number
) {
  // Get all constraints
  const constraints = await prisma.constraint.findMany({
    where: { organizationId, isActive: true }
  });

  // Get available faculty
  const faculty = await prisma.faculty.findMany({
    where: {
      organizationId,
      departmentId,
      isAvailable: true,
    },
    include: {
      availability: true,
      subjects: {
        include: { subject: true }
      }
    }
  });

  // Get available rooms
  const rooms = await prisma.room.findMany({
    where: { organizationId },
    include: { availability: true }
  });

  // Get time slots
  const timeSlots = await prisma.timeSlot.findMany({
    where: { organizationId, isActive: true }
  });

  // Get subjects for the year
  const subjects = await prisma.subject.findMany({
    where: {
      organizationId,
      departmentId,
      offeredInYears: { has: year },
      isOffered: true,
    },
    include: {
      faculties: {
        include: { faculty: true }
      }
    }
  });

  // Create timetable
  const timetable = await prisma.timetable.create({
    data: {
      organizationId,
      academicYearId,
      semesterId,
      departmentId,
      year,
      name: `Timetable - Year ${year}`,
      description: `Generated timetable for year ${year} students`,
      status: 'DRAFT',
      version: 1,
      generatedAt: new Date(),
      totalConflicts: 0,
    }
  });

  // Generate timetable slots (simplified example)
  const timetableSlots = [];
  const days = [1, 2, 3, 4, 5]; // Monday to Friday
  
  for (const day of days) {
    for (const timeSlot of timeSlots) {
      // Find available subject, faculty, and room
      const availableSubject = subjects.find(s => s.faculties.length > 0);
      const availableFaculty = availableSubject?.faculties[0]?.faculty;
      const availableRoom = rooms.find(r => r.availability.some(a => a.dayOfWeek === day && a.isAvailable));

      if (availableSubject && availableFaculty && availableRoom) {
        const slot = await prisma.timetableSlot.create({
          data: {
            timetableId: timetable.id,
            timeSlotId: timeSlot.id,
            dayOfWeek: day,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            subjectId: availableSubject.id,
            facultyId: availableFaculty.id,
            roomId: availableRoom.id,
            classType: 'LECTURE',
            isOnline: false,
            maxStudents: availableRoom.capacity,
            hasConflicts: false,
          }
        });
        timetableSlots.push(slot);
      }
    }
  }

  return { timetable, timetableSlots };
}
```

### 7. NEP 2020 Compliance Checking

#### Check Credit Distribution Compliance
```typescript
async function checkNEPCompliance(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      enrollments: {
        include: {
          subject: true
        }
      }
    }
  });

  if (!student) throw new Error('Student not found');

  const totalCredits = student.totalCreditsEarned;
  const coreCredits = student.coreCreditsEarned;
  const electiveCredits = student.electiveCreditsEarned;
  const skillCredits = student.skillCreditsEarned;

  const corePercentage = (coreCredits / totalCredits) * 100;
  const electivePercentage = (electiveCredits / totalCredits) * 100;
  const skillPercentage = (skillCredits / totalCredits) * 100;

  const compliance = {
    totalCredits,
    coreCredits,
    electiveCredits,
    skillCredits,
    corePercentage,
    electivePercentage,
    skillPercentage,
    isCompliant: corePercentage >= 60 && electivePercentage >= 30 && skillPercentage >= 10,
    violations: []
  };

  if (corePercentage < 60) {
    compliance.violations.push(`Core credits insufficient: ${corePercentage.toFixed(2)}% (required: 60%)`);
  }
  if (electivePercentage < 30) {
    compliance.violations.push(`Elective credits insufficient: ${electivePercentage.toFixed(2)}% (required: 30%)`);
  }
  if (skillPercentage < 10) {
    compliance.violations.push(`Skill-based credits insufficient: ${skillPercentage.toFixed(2)}% (required: 10%)`);
  }

  return compliance;
}
```

### 8. Faculty Workload Management

#### Check Faculty Workload
```typescript
async function checkFacultyWorkload(facultyId: string) {
  const faculty = await prisma.faculty.findUnique({
    where: { id: facultyId },
    include: {
      timetables: {
        include: {
          timetable: {
            include: {
              slots: true
            }
          }
        }
      }
    }
  });

  if (!faculty) throw new Error('Faculty not found');

  const currentWorkload = faculty.timetables.reduce((total, tf) => {
    return total + tf.timetable.slots.filter(slot => slot.facultyId === facultyId).length;
  }, 0);

  const workloadStatus = {
    facultyId: faculty.id,
    employeeId: faculty.employeeId,
    name: `${faculty.firstName} ${faculty.lastName}`,
    maxHoursPerWeek: faculty.maxHoursPerWeek,
    currentWorkload,
    utilizationPercentage: (currentWorkload / faculty.maxHoursPerWeek) * 100,
    isOverloaded: currentWorkload > faculty.maxHoursPerWeek,
    isUnderloaded: currentWorkload < (faculty.maxHoursPerWeek * 0.5),
  };

  return workloadStatus;
}
```

### 9. Room Utilization Analysis

#### Analyze Room Utilization
```typescript
async function analyzeRoomUtilization(organizationId: string, timeSlotId?: string) {
  const rooms = await prisma.room.findMany({
    where: { organizationId },
    include: {
      timetables: {
        include: {
          timetable: {
            include: {
              slots: {
                where: timeSlotId ? { timeSlotId } : undefined
              }
            }
          }
        }
      }
    }
  });

  const analysis = rooms.map(room => {
    const totalSlots = room.timetables.reduce((total, tr) => {
      return total + tr.timetable.slots.length;
    }, 0);

    const utilizationPercentage = (totalSlots / 40) * 100; // Assuming 40 slots per week

    return {
      roomId: room.id,
      name: room.name,
      code: room.code,
      capacity: room.capacity,
      type: room.type,
      totalSlots,
      utilizationPercentage,
      isOverutilized: utilizationPercentage > 100,
      isUnderutilized: utilizationPercentage < 50,
    };
  });

  return analysis;
}
```

### 10. Conflict Detection and Resolution

#### Detect Timetable Conflicts
```typescript
async function detectConflicts(timetableId: string) {
  const timetable = await prisma.timetable.findUnique({
    where: { id: timetableId },
    include: {
      slots: {
        include: {
          faculty: true,
          room: true,
          subject: true,
          timeSlot: true
        }
      }
    }
  });

  if (!timetable) throw new Error('Timetable not found');

  const conflicts = [];

  // Check faculty conflicts
  const facultySlots = new Map();
  for (const slot of timetable.slots) {
    const key = `${slot.facultyId}-${slot.dayOfWeek}-${slot.startTime}`;
    if (facultySlots.has(key)) {
      conflicts.push({
        type: 'FACULTY_CONFLICT',
        facultyId: slot.facultyId,
        facultyName: `${slot.faculty.firstName} ${slot.faculty.lastName}`,
        day: slot.dayOfWeek,
        time: slot.startTime,
        conflictingSlots: [facultySlots.get(key), slot.id]
      });
    } else {
      facultySlots.set(key, slot.id);
    }
  }

  // Check room conflicts
  const roomSlots = new Map();
  for (const slot of timetable.slots) {
    const key = `${slot.roomId}-${slot.dayOfWeek}-${slot.startTime}`;
    if (roomSlots.has(key)) {
      conflicts.push({
        type: 'ROOM_CONFLICT',
        roomId: slot.roomId,
        roomName: slot.room.name,
        day: slot.dayOfWeek,
        time: slot.startTime,
        conflictingSlots: [roomSlots.get(key), slot.id]
      });
    } else {
      roomSlots.set(key, slot.id);
    }
  }

  // Update timetable with conflict information
  await prisma.timetable.update({
    where: { id: timetableId },
    data: {
      totalConflicts: conflicts.length,
      constraintViolations: conflicts,
    }
  });

  return conflicts;
}
```

## Advanced Queries

### 1. Get NEP Compliance Report
```typescript
async function getNEPComplianceReport(organizationId: string) {
  const students = await prisma.student.findMany({
    where: { organizationId },
    include: {
      enrollments: {
        include: {
          subject: true
        }
      }
    }
  });

  const report = students.map(student => {
    const totalCredits = student.totalCreditsEarned;
    const coreCredits = student.coreCreditsEarned;
    const electiveCredits = student.electiveCreditsEarned;
    const skillCredits = student.skillCreditsEarned;

    return {
      studentId: student.id,
      rollNumber: student.rollNumber,
      name: `${student.firstName} ${student.lastName}`,
      totalCredits,
      coreCredits,
      electiveCredits,
      skillCredits,
      corePercentage: totalCredits > 0 ? (coreCredits / totalCredits) * 100 : 0,
      electivePercentage: totalCredits > 0 ? (electiveCredits / totalCredits) * 100 : 0,
      skillPercentage: totalCredits > 0 ? (skillCredits / totalCredits) * 100 : 0,
      isCompliant: totalCredits > 0 && 
        (coreCredits / totalCredits) >= 0.6 && 
        (electiveCredits / totalCredits) >= 0.3 && 
        (skillCredits / totalCredits) >= 0.1
    };
  });

  return report;
}
```

### 2. Get Faculty Workload Report
```typescript
async function getFacultyWorkloadReport(organizationId: string) {
  const faculties = await prisma.faculty.findMany({
    where: { organizationId },
    include: {
      timetables: {
        include: {
          timetable: {
            include: {
              slots: true
            }
          }
        }
      }
    }
  });

  const report = faculties.map(faculty => {
    const currentWorkload = faculty.timetables.reduce((total, tf) => {
      return total + tf.timetable.slots.filter(slot => slot.facultyId === faculty.id).length;
    }, 0);

    return {
      facultyId: faculty.id,
      employeeId: faculty.employeeId,
      name: `${faculty.firstName} ${faculty.lastName}`,
      department: faculty.department.name,
      designation: faculty.designation,
      maxHoursPerWeek: faculty.maxHoursPerWeek,
      currentWorkload,
      utilizationPercentage: (currentWorkload / faculty.maxHoursPerWeek) * 100,
      status: currentWorkload > faculty.maxHoursPerWeek ? 'OVERLOADED' : 
              currentWorkload < (faculty.maxHoursPerWeek * 0.5) ? 'UNDERLOADED' : 'OPTIMAL'
    };
  });

  return report;
}
```

## Error Handling and Validation

### 1. Validate NEP Compliance
```typescript
async function validateNEPCompliance(organizationId: string, studentId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          include: {
            subject: true
          }
        }
      }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const nepSettings = await prisma.nepSettings.findUnique({
      where: { organizationId }
    });

    if (!nepSettings) {
      throw new Error('NEP settings not found for organization');
    }

    const compliance = await checkNEPCompliance(studentId);
    
    return {
      isValid: compliance.isCompliant,
      violations: compliance.violations,
      recommendations: generateRecommendations(compliance, nepSettings)
    };
  } catch (error) {
    console.error('Error validating NEP compliance:', error);
    throw error;
  }
}

function generateRecommendations(compliance: any, nepSettings: any) {
  const recommendations = [];
  
  if (compliance.corePercentage < nepSettings.corePercentage) {
    recommendations.push(`Enroll in more core subjects to reach ${nepSettings.corePercentage}% requirement`);
  }
  
  if (compliance.electivePercentage < nepSettings.electivePercentage) {
    recommendations.push(`Enroll in more elective subjects to reach ${nepSettings.electivePercentage}% requirement`);
  }
  
  if (compliance.skillPercentage < nepSettings.skillPercentage) {
    recommendations.push(`Enroll in more skill-based subjects to reach ${nepSettings.skillPercentage}% requirement`);
  }
  
  return recommendations;
}
```

This comprehensive API example demonstrates how to use the NEP 2020 compliant database schema for various operations including organization management, academic structure, faculty and student management, timetable generation, compliance checking, and advanced reporting.

