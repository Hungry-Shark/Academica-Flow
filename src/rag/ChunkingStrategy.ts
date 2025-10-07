/**
 * Intelligent Chunking Strategy for Different Document Types
 * Handles faculty, student, room, and policy data with context-aware chunking
 */

import { DocumentChunk, DocumentMetadata, DocumentType, ChunkType } from './DocumentProcessor';
import { MetadataExtractor } from './MetadataExtractor';

export interface ChunkingOptions {
  maxChunkSize: number;
  overlapSize: number;
  preserveContext: boolean;
  includeMetadata: boolean;
  chunkByEntity: boolean;
}

export class ChunkingStrategy {
  private metadataExtractor: MetadataExtractor;
  private options: ChunkingOptions;

  constructor(metadataExtractor: MetadataExtractor, options: ChunkingOptions) {
    this.metadataExtractor = metadataExtractor;
    this.options = options;
  }

  // ================================
  // FACULTY CHUNKING METHODS
  // ================================

  /**
   * Chunk faculty profile data
   */
  async chunkFacultyProfile(faculty: any, organizationId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    // Main profile chunk
    const profileContent = this.buildFacultyProfileContent(faculty);
    const profileMetadata = await this.metadataExtractor.extractFacultyMetadata(faculty, organizationId);
    
    chunks.push({
      id: `faculty_profile_${faculty.id}`,
      content: profileContent,
      metadata: {
        ...profileMetadata,
        chunkType: ChunkType.FACULTY_PROFILE,
        documentType: DocumentType.FACULTY,
        facultyId: faculty.id,
        employeeId: faculty.employeeId,
        facultyName: `${faculty.firstName} ${faculty.lastName}`,
        designation: faculty.designation,
        specializations: faculty.specializations,
        nepCategories: faculty.nepCategories,
        tags: ['faculty', 'profile', faculty.designation.toLowerCase()],
        keywords: this.extractKeywords(profileContent)
      },
      chunkType: ChunkType.FACULTY_PROFILE,
      sourceId: faculty.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return chunks;
  }

  /**
   * Chunk faculty availability data
   */
  async chunkFacultyAvailability(faculty: any, organizationId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    if (faculty.availability && faculty.availability.length > 0) {
      const availabilityContent = this.buildFacultyAvailabilityContent(faculty);
      const availabilityMetadata = await this.metadataExtractor.extractFacultyMetadata(faculty, organizationId);
      
      chunks.push({
        id: `faculty_availability_${faculty.id}`,
        content: availabilityContent,
        metadata: {
          ...availabilityMetadata,
          chunkType: ChunkType.FACULTY_AVAILABILITY,
          documentType: DocumentType.FACULTY,
          facultyId: faculty.id,
          employeeId: faculty.employeeId,
          facultyName: `${faculty.firstName} ${faculty.lastName}`,
          tags: ['faculty', 'availability', 'schedule'],
          keywords: ['availability', 'schedule', 'time', 'hours']
        },
        chunkType: ChunkType.FACULTY_AVAILABILITY,
        sourceId: faculty.id,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return chunks;
  }

  /**
   * Chunk faculty specializations
   */
  async chunkFacultySpecializations(faculty: any, organizationId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    if (faculty.specializations && faculty.specializations.length > 0) {
      const specializationContent = this.buildFacultySpecializationContent(faculty);
      const specializationMetadata = await this.metadataExtractor.extractFacultyMetadata(faculty, organizationId);
      
      chunks.push({
        id: `faculty_specializations_${faculty.id}`,
        content: specializationContent,
        metadata: {
          ...specializationMetadata,
          chunkType: ChunkType.FACULTY_SPECIALIZATIONS,
          documentType: DocumentType.FACULTY,
          facultyId: faculty.id,
          employeeId: faculty.employeeId,
          facultyName: `${faculty.firstName} ${faculty.lastName}`,
          specializations: faculty.specializations,
          nepCategories: faculty.nepCategories,
          tags: ['faculty', 'specializations', 'expertise'],
          keywords: [...faculty.specializations, ...faculty.nepCategories]
        },
        chunkType: ChunkType.FACULTY_SPECIALIZATIONS,
        sourceId: faculty.id,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return chunks;
  }

  // ================================
  // STUDENT CHUNKING METHODS
  // ================================

  /**
   * Chunk student profile data
   */
  async chunkStudentProfile(student: any, organizationId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    const profileContent = this.buildStudentProfileContent(student);
    const profileMetadata = await this.metadataExtractor.extractStudentMetadata(student, organizationId);
    
    chunks.push({
      id: `student_profile_${student.id}`,
      content: profileContent,
      metadata: {
        ...profileMetadata,
        chunkType: ChunkType.STUDENT_PROFILE,
        documentType: DocumentType.STUDENT,
        studentId: student.id,
        rollNumber: student.rollNumber,
        studentName: `${student.firstName} ${student.lastName}`,
        currentYear: student.currentYear,
        currentSemester: student.currentSemester,
        admissionYear: student.admissionYear,
        tags: ['student', 'profile', `year_${student.currentYear}`],
        keywords: this.extractKeywords(profileContent)
      },
      chunkType: ChunkType.STUDENT_PROFILE,
      sourceId: student.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return chunks;
  }

  /**
   * Chunk student enrollment data
   */
  async chunkStudentEnrollments(student: any, organizationId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    if (student.enrollments && student.enrollments.length > 0) {
      // Group enrollments by semester
      const enrollmentsBySemester = this.groupEnrollmentsBySemester(student.enrollments);
      
      for (const [semesterId, enrollments] of Object.entries(enrollmentsBySemester)) {
        const enrollmentContent = this.buildStudentEnrollmentContent(student, enrollments, semesterId);
        const enrollmentMetadata = await this.metadataExtractor.extractStudentMetadata(student, organizationId);
        
        chunks.push({
          id: `student_enrollment_${student.id}_${semesterId}`,
          content: enrollmentContent,
          metadata: {
            ...enrollmentMetadata,
            chunkType: ChunkType.STUDENT_ENROLLMENT,
            documentType: DocumentType.STUDENT,
            studentId: student.id,
            rollNumber: student.rollNumber,
            studentName: `${student.firstName} ${student.lastName}`,
            semester: semesterId,
            subjectIds: enrollments.map((e: any) => e.subjectId),
            subjectCodes: enrollments.map((e: any) => e.subject.code),
            tags: ['student', 'enrollment', 'subjects', `semester_${semesterId}`],
            keywords: enrollments.map((e: any) => e.subject.name)
          },
          chunkType: ChunkType.STUDENT_ENROLLMENT,
          sourceId: student.id,
          organizationId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    return chunks;
  }

  /**
   * Chunk student credit data
   */
  async chunkStudentCredits(student: any, organizationId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    const creditContent = this.buildStudentCreditContent(student);
    const creditMetadata = await this.metadataExtractor.extractStudentMetadata(student, organizationId);
    
    chunks.push({
      id: `student_credits_${student.id}`,
      content: creditContent,
      metadata: {
        ...creditMetadata,
        chunkType: ChunkType.STUDENT_CREDITS,
        documentType: DocumentType.STUDENT,
        studentId: student.id,
        rollNumber: student.rollNumber,
        studentName: `${student.firstName} ${student.lastName}`,
        currentYear: student.currentYear,
        currentSemester: student.currentSemester,
        tags: ['student', 'credits', 'nep_compliance', `year_${student.currentYear}`],
        keywords: ['credits', 'core', 'elective', 'skill-based', 'nep']
      },
      chunkType: ChunkType.STUDENT_CREDITS,
      sourceId: student.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return chunks;
  }

  // ================================
  // SUBJECT CHUNKING METHODS
  // ================================

  /**
   * Chunk subject details
   */
  async chunkSubjectDetails(subject: any, organizationId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    const subjectContent = this.buildSubjectDetailsContent(subject);
    const subjectMetadata = await this.metadataExtractor.extractSubjectMetadata(subject, organizationId);
    
    chunks.push({
      id: `subject_details_${subject.id}`,
      content: subjectContent,
      metadata: {
        ...subjectMetadata,
        chunkType: ChunkType.SUBJECT_DETAILS,
        documentType: DocumentType.SUBJECT,
        subjectId: subject.id,
        subjectCode: subject.code,
        subjectName: subject.name,
        nepCategory: subject.nepCategory,
        credits: subject.credits,
        offeredInYears: subject.offeredInYears,
        tags: ['subject', 'details', subject.nepCategory.toLowerCase()],
        keywords: this.extractKeywords(subjectContent)
      },
      chunkType: ChunkType.SUBJECT_DETAILS,
      sourceId: subject.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return chunks;
  }

  /**
   * Chunk subject prerequisites
   */
  async chunkSubjectPrerequisites(subject: any, organizationId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    if (subject.prerequisites && subject.prerequisites.length > 0) {
      const prerequisiteContent = this.buildSubjectPrerequisiteContent(subject);
      const prerequisiteMetadata = await this.metadataExtractor.extractSubjectMetadata(subject, organizationId);
      
      chunks.push({
        id: `subject_prerequisites_${subject.id}`,
        content: prerequisiteContent,
        metadata: {
          ...prerequisiteMetadata,
          chunkType: ChunkType.SUBJECT_PREREQUISITES,
          documentType: DocumentType.SUBJECT,
          subjectId: subject.id,
          subjectCode: subject.code,
          subjectName: subject.name,
          prerequisiteIds: subject.prerequisites.map((p: any) => p.prerequisiteId),
          prerequisiteCodes: subject.prerequisites.map((p: any) => p.prerequisite.code),
          tags: ['subject', 'prerequisites', 'dependencies'],
          keywords: subject.prerequisites.map((p: any) => p.prerequisite.name)
        },
        chunkType: ChunkType.SUBJECT_PREREQUISITES,
        sourceId: subject.id,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return chunks;
  }

  /**
   * Chunk subject assessment pattern
   */
  async chunkSubjectAssessment(subject: any, organizationId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    const assessmentContent = this.buildSubjectAssessmentContent(subject);
    const assessmentMetadata = await this.metadataExtractor.extractSubjectMetadata(subject, organizationId);
    
    chunks.push({
      id: `subject_assessment_${subject.id}`,
      content: assessmentContent,
      metadata: {
        ...assessmentMetadata,
        chunkType: ChunkType.SUBJECT_ASSESSMENT,
        documentType: DocumentType.SUBJECT,
        subjectId: subject.id,
        subjectCode: subject.code,
        subjectName: subject.name,
        nepCategory: subject.nepCategory,
        tags: ['subject', 'assessment', 'evaluation', 'nep'],
        keywords: ['assessment', 'continuous', 'exam', 'evaluation', 'grading']
      },
      chunkType: ChunkType.SUBJECT_ASSESSMENT,
      sourceId: subject.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return chunks;
  }

  // ================================
  // ROOM CHUNKING METHODS
  // ================================

  /**
   * Chunk room details
   */
  async chunkRoomDetails(room: any, organizationId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    const roomContent = this.buildRoomDetailsContent(room);
    const roomMetadata = await this.metadataExtractor.extractRoomMetadata(room, organizationId);
    
    chunks.push({
      id: `room_details_${room.id}`,
      content: roomContent,
      metadata: {
        ...roomMetadata,
        chunkType: ChunkType.ROOM_DETAILS,
        documentType: DocumentType.ROOM,
        roomId: room.id,
        roomCode: room.code,
        roomName: room.name,
        roomType: room.type,
        capacity: room.capacity,
        equipment: room.equipment,
        tags: ['room', 'details', room.type.toLowerCase()],
        keywords: this.extractKeywords(roomContent)
      },
      chunkType: ChunkType.ROOM_DETAILS,
      sourceId: room.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return chunks;
  }

  /**
   * Chunk room availability
   */
  async chunkRoomAvailability(room: any, organizationId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    if (room.availability && room.availability.length > 0) {
      const availabilityContent = this.buildRoomAvailabilityContent(room);
      const availabilityMetadata = await this.metadataExtractor.extractRoomMetadata(room, organizationId);
      
      chunks.push({
        id: `room_availability_${room.id}`,
        content: availabilityContent,
        metadata: {
          ...availabilityMetadata,
          chunkType: ChunkType.ROOM_AVAILABILITY,
          documentType: DocumentType.ROOM,
          roomId: room.id,
          roomCode: room.code,
          roomName: room.name,
          roomType: room.type,
          tags: ['room', 'availability', 'schedule'],
          keywords: ['availability', 'schedule', 'time', 'booking']
        },
        chunkType: ChunkType.ROOM_AVAILABILITY,
        sourceId: room.id,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return chunks;
  }

  /**
   * Chunk room equipment
   */
  async chunkRoomEquipment(room: any, organizationId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    if (room.equipment && room.equipment.length > 0) {
      const equipmentContent = this.buildRoomEquipmentContent(room);
      const equipmentMetadata = await this.metadataExtractor.extractRoomMetadata(room, organizationId);
      
      chunks.push({
        id: `room_equipment_${room.id}`,
        content: equipmentContent,
        metadata: {
          ...equipmentMetadata,
          chunkType: ChunkType.ROOM_EQUIPMENT,
          documentType: DocumentType.ROOM,
          roomId: room.id,
          roomCode: room.code,
          roomName: room.name,
          roomType: room.type,
          equipment: room.equipment,
          tags: ['room', 'equipment', 'facilities'],
          keywords: room.equipment
        },
        chunkType: ChunkType.ROOM_EQUIPMENT,
        sourceId: room.id,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return chunks;
  }

  // ================================
  // POLICY CHUNKING METHODS
  // ================================

  /**
   * Chunk constraint rules
   */
  async chunkConstraintRule(constraint: any, organizationId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    const constraintContent = this.buildConstraintRuleContent(constraint);
    const constraintMetadata = await this.metadataExtractor.extractConstraintMetadata(constraint, organizationId);
    
    chunks.push({
      id: `constraint_rule_${constraint.id}`,
      content: constraintContent,
      metadata: {
        ...constraintMetadata,
        chunkType: ChunkType.CONSTRAINT_RULE,
        documentType: DocumentType.CONSTRAINT,
        constraintType: constraint.type,
        priority: constraint.priority,
        weight: constraint.weight,
        tags: ['constraint', 'rule', 'policy', constraint.type.toLowerCase()],
        keywords: this.extractKeywords(constraintContent)
      },
      chunkType: ChunkType.CONSTRAINT_RULE,
      sourceId: constraint.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return chunks;
  }

  /**
   * Chunk NEP compliance rules
   */
  async chunkNEPCompliance(constraint: any, organizationId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    if (constraint.type === 'NEP_CREDIT_DISTRIBUTION') {
      const nepContent = this.buildNEPComplianceContent(constraint);
      const nepMetadata = await this.metadataExtractor.extractConstraintMetadata(constraint, organizationId);
      
      chunks.push({
        id: `nep_compliance_${constraint.id}`,
        content: nepContent,
        metadata: {
          ...nepMetadata,
          chunkType: ChunkType.NEP_COMPLIANCE,
          documentType: DocumentType.POLICY,
          policyType: 'NEP_COMPLIANCE',
          ruleCategory: 'CREDIT_DISTRIBUTION',
          tags: ['nep', 'compliance', 'policy', 'credits'],
          keywords: ['nep', 'compliance', 'credits', 'core', 'elective', 'skill']
        },
        chunkType: ChunkType.NEP_COMPLIANCE,
        sourceId: constraint.id,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return chunks;
  }

  // ================================
  // TIMETABLE CHUNKING METHODS
  // ================================

  /**
   * Chunk timetable slots
   */
  async chunkTimetableSlots(timetable: any, organizationId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    if (timetable.slots && timetable.slots.length > 0) {
      // Group slots by day for better context
      const slotsByDay = this.groupSlotsByDay(timetable.slots);
      
      for (const [day, slots] of Object.entries(slotsByDay)) {
        const slotContent = this.buildTimetableSlotContent(timetable, slots, day);
        const slotMetadata = await this.metadataExtractor.extractTimetableMetadata(timetable, organizationId);
        
        chunks.push({
          id: `timetable_slots_${timetable.id}_${day}`,
          content: slotContent,
          metadata: {
            ...slotMetadata,
            chunkType: ChunkType.TIMETABLE_SLOT,
            documentType: DocumentType.TIMETABLE,
            timetableId: timetable.id,
            dayOfWeek: parseInt(day),
            slotCount: slots.length,
            facultyIds: slots.map((s: any) => s.facultyId),
            subjectIds: slots.map((s: any) => s.subjectId),
            roomIds: slots.map((s: any) => s.roomId),
            tags: ['timetable', 'slots', 'schedule', `day_${day}`],
            keywords: slots.map((s: any) => s.subject.name)
          },
          chunkType: ChunkType.TIMETABLE_SLOT,
          sourceId: timetable.id,
          organizationId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    return chunks;
  }

  /**
   * Chunk timetable constraints
   */
  async chunkTimetableConstraints(timetable: any, organizationId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    
    if (timetable.constraintViolations && timetable.constraintViolations.length > 0) {
      const constraintContent = this.buildTimetableConstraintContent(timetable);
      const constraintMetadata = await this.metadataExtractor.extractTimetableMetadata(timetable, organizationId);
      
      chunks.push({
        id: `timetable_constraints_${timetable.id}`,
        content: constraintContent,
        metadata: {
          ...constraintMetadata,
          chunkType: ChunkType.TIMETABLE_CONSTRAINTS,
          documentType: DocumentType.TIMETABLE,
          timetableId: timetable.id,
          totalConflicts: timetable.totalConflicts,
          tags: ['timetable', 'constraints', 'violations'],
          keywords: ['constraints', 'violations', 'conflicts', 'rules']
        },
        chunkType: ChunkType.TIMETABLE_CONSTRAINTS,
        sourceId: timetable.id,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return chunks;
  }

  // ================================
  // CONTENT BUILDING METHODS
  // ================================

  private buildFacultyProfileContent(faculty: any): string {
    return `Faculty Profile: ${faculty.firstName} ${faculty.lastName}
Employee ID: ${faculty.employeeId}
Designation: ${faculty.designation}
Department: ${faculty.department.name}
Email: ${faculty.email}
Phone: ${faculty.phone || 'Not provided'}
Qualification: ${faculty.qualification || 'Not provided'}
Specializations: ${faculty.specializations.join(', ')}
NEP Categories: ${faculty.nepCategories.join(', ')}
Max Hours Per Week: ${faculty.maxHoursPerWeek}
Current Workload: ${faculty.currentWorkload} hours
Available: ${faculty.isAvailable ? 'Yes' : 'No'}`;
  }

  private buildFacultyAvailabilityContent(faculty: any): string {
    const availability = faculty.availability
      .filter((a: any) => a.isAvailable)
      .map((a: any) => `${this.getDayName(a.dayOfWeek)}: ${a.startTime} - ${a.endTime}`)
      .join('\n');
    
    return `Faculty Availability: ${faculty.firstName} ${faculty.lastName}
Available Time Slots:
${availability || 'No availability data'}`;
  }

  private buildFacultySpecializationContent(faculty: any): string {
    return `Faculty Specializations: ${faculty.firstName} ${faculty.lastName}
Areas of Expertise: ${faculty.specializations.join(', ')}
NEP Teaching Categories: ${faculty.nepCategories.join(', ')}
Can teach subjects in: ${faculty.specializations.join(', ')}`;
  }

  private buildStudentProfileContent(student: any): string {
    return `Student Profile: ${student.firstName} ${student.lastName}
Roll Number: ${student.rollNumber}
Department: ${student.department.name}
Current Year: ${student.currentYear}
Current Semester: ${student.currentSemester}
Admission Year: ${student.admissionYear}
Email: ${student.email}
Phone: ${student.phone || 'Not provided'}
Total Credits Earned: ${student.totalCreditsEarned}
Core Credits: ${student.coreCreditsEarned}
Elective Credits: ${student.electiveCreditsEarned}
Skill Credits: ${student.skillCreditsEarned}
Active: ${student.isActive ? 'Yes' : 'No'}`;
  }

  private buildStudentEnrollmentContent(student: any, enrollments: any[], semesterId: string): string {
    const subjects = enrollments.map(e => `${e.subject.code} - ${e.subject.name} (${e.subject.credits} credits)`).join('\n');
    
    return `Student Enrollments: ${student.firstName} ${student.lastName}
Semester: ${semesterId}
Enrolled Subjects:
${subjects}
Total Credits: ${enrollments.reduce((sum, e) => sum + e.subject.credits, 0)}`;
  }

  private buildStudentCreditContent(student: any): string {
    const totalCredits = student.totalCreditsEarned;
    const corePercentage = totalCredits > 0 ? (student.coreCreditsEarned / totalCredits * 100).toFixed(1) : 0;
    const electivePercentage = totalCredits > 0 ? (student.electiveCreditsEarned / totalCredits * 100).toFixed(1) : 0;
    const skillPercentage = totalCredits > 0 ? (student.skillCreditsEarned / totalCredits * 100).toFixed(1) : 0;
    
    return `Student Credit Summary: ${student.firstName} ${student.lastName}
Total Credits Earned: ${totalCredits}
Core Credits: ${student.coreCreditsEarned} (${corePercentage}%)
Elective Credits: ${student.electiveCreditsEarned} (${electivePercentage}%)
Skill-based Credits: ${student.skillCreditsEarned} (${skillPercentage}%)
NEP Compliance: ${this.checkNEPCompliance(student) ? 'Compliant' : 'Non-compliant'}`;
  }

  private buildSubjectDetailsContent(subject: any): string {
    return `Subject Details: ${subject.name}
Code: ${subject.code}
Department: ${subject.department.name}
NEP Category: ${subject.nepCategory}
Credits: ${subject.credits}
Lecture Hours: ${subject.lectureHours}
Tutorial Hours: ${subject.tutorialHours}
Practical Hours: ${subject.practicalHours}
Offered in Years: ${subject.offeredInYears.join(', ')}
Continuous Assessment: ${subject.continuousAssessmentWeight}%
End Semester Exam: ${subject.endSemesterExamWeight}%
Offered: ${subject.isOffered ? 'Yes' : 'No'}`;
  }

  private buildSubjectPrerequisiteContent(subject: any): string {
    const prerequisites = subject.prerequisites
      .map((p: any) => `${p.prerequisite.code} - ${p.prerequisite.name} (${p.isMandatory ? 'Mandatory' : 'Optional'})`)
      .join('\n');
    
    return `Subject Prerequisites: ${subject.name}
Prerequisites:
${prerequisites || 'No prerequisites'}`;
  }

  private buildSubjectAssessmentContent(subject: any): string {
    return `Subject Assessment Pattern: ${subject.name}
Continuous Assessment Weight: ${subject.continuousAssessmentWeight}%
End Semester Exam Weight: ${subject.endSemesterExamWeight}%
Total Assessment Weight: ${subject.continuousAssessmentWeight + subject.endSemesterExamWeight}%
NEP Compliant: ${subject.continuousAssessmentWeight >= 40 && subject.endSemesterExamWeight >= 60 ? 'Yes' : 'No'}`;
  }

  private buildRoomDetailsContent(room: any): string {
    return `Room Details: ${room.name}
Code: ${room.code}
Type: ${room.type}
Capacity: ${room.capacity} students
Floor: ${room.floor || 'Not specified'}
Building: ${room.building || 'Not specified'}
Equipment: ${room.equipment.join(', ')}
Accessible: ${room.isAccessible ? 'Yes' : 'No'}`;
  }

  private buildRoomAvailabilityContent(room: any): string {
    const availability = room.availability
      .filter((a: any) => a.isAvailable)
      .map((a: any) => `${this.getDayName(a.dayOfWeek)}: ${a.startTime} - ${a.endTime}`)
      .join('\n');
    
    return `Room Availability: ${room.name}
Available Time Slots:
${availability || 'No availability data'}`;
  }

  private buildRoomEquipmentContent(room: any): string {
    return `Room Equipment: ${room.name}
Available Equipment: ${room.equipment.join(', ')}
Equipment Details: ${room.equipment.map(eq => `${eq} available`).join(', ')}`;
  }

  private buildConstraintRuleContent(constraint: any): string {
    return `Constraint Rule: ${constraint.name}
Type: ${constraint.type}
Description: ${constraint.description || 'No description'}
Priority: ${constraint.priority}
Weight: ${constraint.weight}
Active: ${constraint.isActive ? 'Yes' : 'No'}
Configuration: ${JSON.stringify(constraint.config, null, 2)}`;
  }

  private buildNEPComplianceContent(constraint: any): string {
    const config = constraint.config;
    return `NEP Compliance Rule: ${constraint.name}
Core Percentage: ${config.corePercentage || 60}%
Elective Percentage: ${config.electivePercentage || 30}%
Skill Percentage: ${config.skillPercentage || 10}%
Total: ${(config.corePercentage || 60) + (config.electivePercentage || 30) + (config.skillPercentage || 10)}%
NEP 2020 Compliant: Yes`;
  }

  private buildTimetableSlotContent(timetable: any, slots: any[], day: string): string {
    const dayName = this.getDayName(parseInt(day));
    const slotDetails = slots.map(slot => 
      `${slot.startTime}-${slot.endTime}: ${slot.subject.name} (${slot.faculty.firstName} ${slot.faculty.lastName}) in ${slot.room.name}`
    ).join('\n');
    
    return `Timetable Slots - ${dayName}
Timetable: ${timetable.name}
Date: ${timetable.generatedAt}
Slots:
${slotDetails}`;
  }

  private buildTimetableConstraintContent(timetable: any): string {
    const violations = timetable.constraintViolations
      .map((v: any) => `${v.constraintName}: ${v.description}`)
      .join('\n');
    
    return `Timetable Constraint Violations: ${timetable.name}
Total Conflicts: ${timetable.totalConflicts}
Violations:
${violations || 'No violations'}`;
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private groupEnrollmentsBySemester(enrollments: any[]): Record<string, any[]> {
    return enrollments.reduce((groups, enrollment) => {
      const semester = enrollment.semesterId;
      if (!groups[semester]) {
        groups[semester] = [];
      }
      groups[semester].push(enrollment);
      return groups;
    }, {} as Record<string, any[]>);
  }

  private groupSlotsByDay(slots: any[]): Record<string, any[]> {
    return slots.reduce((groups, slot) => {
      const day = slot.dayOfWeek.toString();
      if (!groups[day]) {
        groups[day] = [];
      }
      groups[day].push(slot);
      return groups;
    }, {} as Record<string, any[]>);
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'there', 'could', 'other', 'after', 'first', 'well', 'also', 'where', 'much', 'some', 'very', 'when', 'come', 'here', 'just', 'into', 'over', 'think', 'back', 'even', 'before', 'great', 'where', 'right', 'should', 'being', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'].includes(word));
    
    // Return unique keywords, limited to 10
    return [...new Set(words)].slice(0, 10);
  }

  private checkNEPCompliance(student: any): boolean {
    const totalCredits = student.totalCreditsEarned;
    if (totalCredits === 0) return false;
    
    const corePercentage = (student.coreCreditsEarned / totalCredits) * 100;
    const electivePercentage = (student.electiveCreditsEarned / totalCredits) * 100;
    const skillPercentage = (student.skillCreditsEarned / totalCredits) * 100;
    
    return corePercentage >= 60 && electivePercentage >= 30 && skillPercentage >= 10;
  }
}

