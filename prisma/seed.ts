import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding NEP 2020 Compliant Timetable System...');

  // 1. Create Organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Rajkiya Engineering College, Sonbhadra',
      code: 'RECS',
      type: 'COLLEGE',
      address: 'Sonbhadra, Uttar Pradesh, India',
      website: 'https://recs.edu.in',
      phone: '+91-1234567890',
      email: 'info@recs.edu.in',
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
          allowOnlineCourses: false,
        }
      }
    }
  });

  console.log('✅ Organization created:', organization.name);

  // 2. Create Academic Year
  const academicYear = await prisma.academicYear.create({
    data: {
      organizationId: organization.id,
      year: '2024-25',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2025-06-30'),
      isActive: true,
    }
  });

  console.log('✅ Academic Year created:', academicYear.year);

  // 3. Create Semesters
  const oddSemester = await prisma.semester.create({
    data: {
      organizationId: organization.id,
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
      organizationId: organization.id,
      academicYearId: academicYear.id,
      name: 'Even Semester',
      number: 2,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-06-30'),
      isActive: false,
    }
  });

  console.log('✅ Semesters created');

  // 4. Create Departments
  const cseDept = await prisma.department.create({
    data: {
      organizationId: organization.id,
      name: 'Computer Science and Engineering',
      code: 'CSE',
      description: 'Department of Computer Science and Engineering',
      nepCategories: ['CORE', 'ELECTIVE', 'SKILL_BASED', 'INTERDISCIPLINARY'],
    }
  });

  const eceDept = await prisma.department.create({
    data: {
      organizationId: organization.id,
      name: 'Electronics and Communication Engineering',
      code: 'ECE',
      description: 'Department of Electronics and Communication Engineering',
      nepCategories: ['CORE', 'ELECTIVE', 'SKILL_BASED', 'INTERDISCIPLINARY'],
    }
  });

  console.log('✅ Departments created');

  // 5. Create Faculty
  const faculty1 = await prisma.faculty.create({
    data: {
      organizationId: organization.id,
      departmentId: cseDept.id,
      employeeId: 'CSE001',
      firstName: 'Dr. Rajesh',
      lastName: 'Kumar',
      email: 'rajesh.kumar@recs.edu.in',
      phone: '+91-9876543210',
      designation: 'Professor',
      qualification: 'Ph.D. in Computer Science',
      specializations: ['Data Structures', 'Algorithms', 'Machine Learning'],
      nepCategories: ['CORE', 'ELECTIVE', 'SKILL_BASED'],
      maxHoursPerWeek: 40,
      currentWorkload: 0,
      isAvailable: true,
    }
  });

  const faculty2 = await prisma.faculty.create({
    data: {
      organizationId: organization.id,
      departmentId: cseDept.id,
      employeeId: 'CSE002',
      firstName: 'Prof. Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@recs.edu.in',
      phone: '+91-9876543211',
      designation: 'Associate Professor',
      qualification: 'M.Tech. in Computer Science',
      specializations: ['Database Systems', 'Web Development', 'Software Engineering'],
      nepCategories: ['CORE', 'ELECTIVE', 'SKILL_BASED'],
      maxHoursPerWeek: 40,
      currentWorkload: 0,
      isAvailable: true,
    }
  });

  const faculty3 = await prisma.faculty.create({
    data: {
      organizationId: organization.id,
      departmentId: eceDept.id,
      employeeId: 'ECE001',
      firstName: 'Dr. Amit',
      lastName: 'Verma',
      email: 'amit.verma@recs.edu.in',
      phone: '+91-9876543212',
      designation: 'Professor',
      qualification: 'Ph.D. in Electronics',
      specializations: ['Digital Electronics', 'Communication Systems', 'VLSI Design'],
      nepCategories: ['CORE', 'ELECTIVE', 'INTERDISCIPLINARY'],
      maxHoursPerWeek: 40,
      currentWorkload: 0,
      isAvailable: true,
    }
  });

  // Set HOD
  await prisma.department.update({
    where: { id: cseDept.id },
    data: { hodId: faculty1.id }
  });

  await prisma.department.update({
    where: { id: eceDept.id },
    data: { hodId: faculty3.id }
  });

  console.log('✅ Faculty created and HODs assigned');

  // 6. Create Faculty Availability
  const facultyAvailability = [
    { facultyId: faculty1.id, dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { facultyId: faculty1.id, dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { facultyId: faculty1.id, dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { facultyId: faculty1.id, dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { facultyId: faculty1.id, dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { facultyId: faculty2.id, dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { facultyId: faculty2.id, dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { facultyId: faculty2.id, dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { facultyId: faculty2.id, dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { facultyId: faculty2.id, dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { facultyId: faculty3.id, dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { facultyId: faculty3.id, dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { facultyId: faculty3.id, dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { facultyId: faculty3.id, dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true },
    { facultyId: faculty3.id, dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true },
  ];

  for (const availability of facultyAvailability) {
    await prisma.facultyAvailability.create({ data: availability });
  }

  console.log('✅ Faculty availability created');

  // 7. Create Students
  const students = [];
  for (let i = 1; i <= 10; i++) {
    const student = await prisma.student.create({
      data: {
        organizationId: organization.id,
        departmentId: i <= 5 ? cseDept.id : eceDept.id,
        rollNumber: `2024${i <= 5 ? 'CSE' : 'ECE'}${i.toString().padStart(3, '0')}`,
        firstName: `Student${i}`,
        lastName: 'Name',
        email: `student${i}@recs.edu.in`,
        phone: `+91-9876543${(100 + i).toString()}`,
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
    students.push(student);
  }

  console.log('✅ Students created');

  // 8. Create Subjects (NEP 2020 Compliant)
  const subjects = [];

  // Core Subjects (60%)
  const coreSubjects = [
    { code: 'CS101', name: 'Programming Fundamentals', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0, nepCategory: 'CORE' as const, offeredInYears: [1] },
    { code: 'CS102', name: 'Data Structures and Algorithms', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0, nepCategory: 'CORE' as const, offeredInYears: [1, 2] },
    { code: 'CS201', name: 'Database Management Systems', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0, nepCategory: 'CORE' as const, offeredInYears: [2] },
    { code: 'CS202', name: 'Computer Networks', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0, nepCategory: 'CORE' as const, offeredInYears: [2, 3] },
    { code: 'CS301', name: 'Software Engineering', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0, nepCategory: 'CORE' as const, offeredInYears: [3] },
    { code: 'CS302', name: 'Operating Systems', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0, nepCategory: 'CORE' as const, offeredInYears: [3] },
  ];

  // Elective Subjects (30%)
  const electiveSubjects = [
    { code: 'CS401', name: 'Machine Learning', credits: 3, lectureHours: 2, tutorialHours: 1, practicalHours: 0, nepCategory: 'ELECTIVE' as const, offeredInYears: [4] },
    { code: 'CS402', name: 'Artificial Intelligence', credits: 3, lectureHours: 2, tutorialHours: 1, practicalHours: 0, nepCategory: 'ELECTIVE' as const, offeredInYears: [4] },
    { code: 'CS403', name: 'Web Technologies', credits: 3, lectureHours: 2, tutorialHours: 1, practicalHours: 0, nepCategory: 'ELECTIVE' as const, offeredInYears: [3, 4] },
    { code: 'CS404', name: 'Mobile Application Development', credits: 3, lectureHours: 2, tutorialHours: 1, practicalHours: 0, nepCategory: 'ELECTIVE' as const, offeredInYears: [4] },
  ];

  // Skill-based Subjects (10%)
  const skillSubjects = [
    { code: 'CS501', name: 'Programming Lab - Python', credits: 2, lectureHours: 0, tutorialHours: 0, practicalHours: 2, nepCategory: 'SKILL_BASED' as const, offeredInYears: [1, 2] },
    { code: 'CS502', name: 'Web Development Lab', credits: 2, lectureHours: 0, tutorialHours: 0, practicalHours: 2, nepCategory: 'SKILL_BASED' as const, offeredInYears: [2, 3] },
    { code: 'CS503', name: 'Data Science Lab', credits: 2, lectureHours: 0, tutorialHours: 0, practicalHours: 2, nepCategory: 'SKILL_BASED' as const, offeredInYears: [3, 4] },
  ];

  // Interdisciplinary Subjects
  const interDisciplinarySubjects = [
    { code: 'ID101', name: 'Mathematics for Engineers', credits: 4, lectureHours: 3, tutorialHours: 1, practicalHours: 0, nepCategory: 'INTERDISCIPLINARY' as const, offeredInYears: [1, 2] },
    { code: 'ID102', name: 'Communication Skills', credits: 2, lectureHours: 2, tutorialHours: 0, practicalHours: 0, nepCategory: 'INTERDISCIPLINARY' as const, offeredInYears: [1, 2] },
  ];

  const allSubjects = [...coreSubjects, ...electiveSubjects, ...skillSubjects, ...interDisciplinarySubjects];

  for (const subjectData of allSubjects) {
    const subject = await prisma.subject.create({
      data: {
        organizationId: organization.id,
        departmentId: cseDept.id,
        ...subjectData,
        continuousAssessmentWeight: 40,
        endSemesterExamWeight: 60,
        isOffered: true,
      }
    });
    subjects.push(subject);
  }

  console.log('✅ Subjects created with NEP 2020 compliance');

  // 9. Create Subject-Faculty Mapping
  const subjectFacultyMappings = [
    { subjectId: subjects[0].id, facultyId: faculty1.id, isPrimary: true }, // CS101 - Dr. Rajesh
    { subjectId: subjects[1].id, facultyId: faculty1.id, isPrimary: true }, // CS102 - Dr. Rajesh
    { subjectId: subjects[2].id, facultyId: faculty2.id, isPrimary: true }, // CS201 - Prof. Priya
    { subjectId: subjects[3].id, facultyId: faculty2.id, isPrimary: true }, // CS202 - Prof. Priya
    { subjectId: subjects[4].id, facultyId: faculty1.id, isPrimary: true }, // CS301 - Dr. Rajesh
    { subjectId: subjects[5].id, facultyId: faculty2.id, isPrimary: true }, // CS302 - Prof. Priya
    { subjectId: subjects[6].id, facultyId: faculty1.id, isPrimary: true }, // CS401 - Dr. Rajesh
    { subjectId: subjects[7].id, facultyId: faculty1.id, isPrimary: true }, // CS402 - Dr. Rajesh
    { subjectId: subjects[8].id, facultyId: faculty2.id, isPrimary: true }, // CS403 - Prof. Priya
    { subjectId: subjects[9].id, facultyId: faculty2.id, isPrimary: true }, // CS404 - Prof. Priya
  ];

  for (const mapping of subjectFacultyMappings) {
    await prisma.subjectFaculty.create({ data: mapping });
  }

  console.log('✅ Subject-Faculty mappings created');

  // 10. Create Rooms
  const rooms = [
    {
      name: 'Lecture Hall 1',
      code: 'LH1',
      type: 'LECTURE_HALL' as const,
      capacity: 60,
      floor: 1,
      building: 'Main Building',
      equipment: ['Projector', 'Whiteboard', 'Air Conditioning'],
      isAccessible: true,
    },
    {
      name: 'Lecture Hall 2',
      code: 'LH2',
      type: 'LECTURE_HALL' as const,
      capacity: 60,
      floor: 1,
      building: 'Main Building',
      equipment: ['Projector', 'Whiteboard', 'Air Conditioning'],
      isAccessible: true,
    },
    {
      name: 'Computer Lab A',
      code: 'CLAB-A',
      type: 'COMPUTER_LAB' as const,
      capacity: 30,
      floor: 2,
      building: 'CSE Building',
      equipment: ['Computers', 'Projector', 'Whiteboard', 'Air Conditioning'],
      isAccessible: true,
    },
    {
      name: 'Computer Lab B',
      code: 'CLAB-B',
      type: 'COMPUTER_LAB' as const,
      capacity: 30,
      floor: 2,
      building: 'CSE Building',
      equipment: ['Computers', 'Projector', 'Whiteboard', 'Air Conditioning'],
      isAccessible: true,
    },
  ];

  for (const roomData of rooms) {
    await prisma.room.create({
      data: {
        organizationId: organization.id,
        ...roomData,
      }
    });
  }

  console.log('✅ Rooms created');

  // 11. Create Time Slots
  const timeSlots = [
    { name: 'Slot 1', startTime: '09:00', endTime: '10:00', duration: 60 },
    { name: 'Slot 2', startTime: '10:00', endTime: '11:00', duration: 60 },
    { name: 'Slot 3', startTime: '11:00', endTime: '12:00', duration: 60 },
    { name: 'Slot 4', startTime: '12:00', endTime: '13:00', duration: 60 },
    { name: 'Slot 5', startTime: '14:00', endTime: '15:00', duration: 60 },
    { name: 'Slot 6', startTime: '15:00', endTime: '16:00', duration: 60 },
    { name: 'Slot 7', startTime: '16:00', endTime: '17:00', duration: 60 },
  ];

  for (const slotData of timeSlots) {
    await prisma.timeSlot.create({
      data: {
        organizationId: organization.id,
        ...slotData,
        isActive: true,
      }
    });
  }

  console.log('✅ Time slots created');

  // 12. Create Constraints
  const constraints = [
    {
      name: 'Faculty Maximum Hours Per Week',
      type: 'FACULTY_MAX_HOURS_PER_WEEK' as const,
      description: 'Faculty cannot exceed maximum hours per week',
      config: { maxHours: 40 },
      priority: 1,
      weight: 1.0,
    },
    {
      name: 'Room Capacity Constraint',
      type: 'ROOM_CAPACITY' as const,
      description: 'Room capacity must not be exceeded',
      config: { enforceCapacity: true },
      priority: 1,
      weight: 1.0,
    },
    {
      name: 'NEP Credit Distribution',
      type: 'NEP_CREDIT_DISTRIBUTION' as const,
      description: 'Enforce 60-30-10 credit distribution',
      config: { corePercentage: 60, electivePercentage: 30, skillPercentage: 10 },
      priority: 2,
      weight: 0.8,
    },
    {
      name: 'No Back-to-Back Classes',
      type: 'FACULTY_NO_BACK_TO_BACK_CLASSES' as const,
      description: 'Faculty should not have back-to-back classes',
      config: { minGapMinutes: 15 },
      priority: 3,
      weight: 0.6,
    },
  ];

  for (const constraintData of constraints) {
    await prisma.constraint.create({
      data: {
        organizationId: organization.id,
        ...constraintData,
        isActive: true,
      }
    });
  }

  console.log('✅ Constraints created');

  // 13. Create Sample Enrollments
  for (let i = 0; i < 5; i++) {
    await prisma.enrollment.create({
      data: {
        studentId: students[i].id,
        subjectId: subjects[0].id, // CS101
        semesterId: oddSemester.id,
        isActive: true,
        creditsEarned: 0,
      }
    });

    await prisma.enrollment.create({
      data: {
        studentId: students[i].id,
        subjectId: subjects[1].id, // CS102
        semesterId: oddSemester.id,
        isActive: true,
        creditsEarned: 0,
      }
    });
  }

  console.log('✅ Sample enrollments created');

  console.log('🎉 Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Organization: ${organization.name}`);
  console.log(`- Academic Year: ${academicYear.year}`);
  console.log(`- Departments: 2 (CSE, ECE)`);
  console.log(`- Faculty: 3`);
  console.log(`- Students: 10`);
  console.log(`- Subjects: ${subjects.length} (NEP 2020 compliant)`);
  console.log(`- Rooms: 4`);
  console.log(`- Time Slots: 7`);
  console.log(`- Constraints: 4`);
  console.log(`- Enrollments: 10`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

