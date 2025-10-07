/**
 * Metadata Extractor for RAG Document Processing
 * Extracts searchable metadata from various document types
 */

import { DocumentMetadata, DocumentType, ChunkType } from './DocumentProcessor';
import { NepCategory, ClassType, ConstraintType } from '../types/nep-interfaces';

export interface ExtractionOptions {
  includeKeywords: boolean;
  includeTags: boolean;
  includeNEPCompliance: boolean;
  includeTemporalData: boolean;
  includeRelationships: boolean;
}

export class MetadataExtractor {
  private options: ExtractionOptions;

  constructor(options: ExtractionOptions = {
    includeKeywords: true,
    includeTags: true,
    includeNEPCompliance: true,
    includeTemporalData: true,
    includeRelationships: true
  }) {
    this.options = options;
  }

  // ================================
  // FACULTY METADATA EXTRACTION
  // ================================

  async extractFacultyMetadata(faculty: any, organizationId: string): Promise<Partial<DocumentMetadata>> {
    const metadata: Partial<DocumentMetadata> = {
      organizationId,
      departmentId: faculty.departmentId,
      documentType: DocumentType.FACULTY,
      facultyId: faculty.id,
      employeeId: faculty.employeeId,
      facultyName: `${faculty.firstName} ${faculty.lastName}`,
      designation: faculty.designation,
      specializations: faculty.specializations || [],
      nepCategories: faculty.nepCategories || [],
      lastModified: new Date(faculty.updatedAt),
      version: 1
    };

    if (this.options.includeKeywords) {
      metadata.keywords = this.extractFacultyKeywords(faculty);
    }

    if (this.options.includeTags) {
      metadata.tags = this.extractFacultyTags(faculty);
    }

    if (this.options.includeNEPCompliance) {
      metadata.tags = [...(metadata.tags || []), ...this.extractNEPComplianceTags(faculty)];
    }

    if (this.options.includeTemporalData) {
      metadata.lastModified = new Date(faculty.updatedAt);
    }

    return metadata;
  }

  private extractFacultyKeywords(faculty: any): string[] {
    const keywords: string[] = [];
    
    // Basic information keywords
    keywords.push(faculty.firstName.toLowerCase());
    keywords.push(faculty.lastName.toLowerCase());
    keywords.push(faculty.employeeId.toLowerCase());
    keywords.push(faculty.designation.toLowerCase());
    
    // Specializations
    if (faculty.specializations) {
      keywords.push(...faculty.specializations.map((s: string) => s.toLowerCase()));
    }
    
    // NEP categories
    if (faculty.nepCategories) {
      keywords.push(...faculty.nepCategories.map((c: string) => c.toLowerCase()));
    }
    
    // Department
    if (faculty.department) {
      keywords.push(faculty.department.name.toLowerCase());
      keywords.push(faculty.department.code.toLowerCase());
    }
    
    // Workload keywords
    keywords.push('faculty', 'teacher', 'instructor', 'professor');
    keywords.push('workload', 'hours', 'availability');
    
    return [...new Set(keywords)];
  }

  private extractFacultyTags(faculty: any): string[] {
    const tags: string[] = ['faculty', 'staff'];
    
    // Designation tags
    if (faculty.designation) {
      tags.push(faculty.designation.toLowerCase().replace(/\s+/g, '_'));
    }
    
    // Department tags
    if (faculty.department) {
      tags.push(`dept_${faculty.department.code.toLowerCase()}`);
    }
    
    // Specialization tags
    if (faculty.specializations) {
      tags.push(...faculty.specializations.map((s: string) => `specialization_${s.toLowerCase().replace(/\s+/g, '_')}`));
    }
    
    // NEP category tags
    if (faculty.nepCategories) {
      tags.push(...faculty.nepCategories.map((c: string) => `nep_${c.toLowerCase()}`));
    }
    
    // Availability tags
    if (faculty.isAvailable) {
      tags.push('available');
    } else {
      tags.push('unavailable');
    }
    
    // Workload tags
    if (faculty.currentWorkload > 0) {
      tags.push('has_workload');
    }
    
    return [...new Set(tags)];
  }

  // ================================
  // STUDENT METADATA EXTRACTION
  // ================================

  async extractStudentMetadata(student: any, organizationId: string): Promise<Partial<DocumentMetadata>> {
    const metadata: Partial<DocumentMetadata> = {
      organizationId,
      departmentId: student.departmentId,
      documentType: DocumentType.STUDENT,
      studentId: student.id,
      rollNumber: student.rollNumber,
      studentName: `${student.firstName} ${student.lastName}`,
      currentYear: student.currentYear,
      currentSemester: student.currentSemester,
      admissionYear: student.admissionYear,
      lastModified: new Date(student.updatedAt),
      version: 1
    };

    if (this.options.includeKeywords) {
      metadata.keywords = this.extractStudentKeywords(student);
    }

    if (this.options.includeTags) {
      metadata.tags = this.extractStudentTags(student);
    }

    if (this.options.includeNEPCompliance) {
      metadata.tags = [...(metadata.tags || []), ...this.extractStudentNEPTags(student)];
    }

    return metadata;
  }

  private extractStudentKeywords(student: any): string[] {
    const keywords: string[] = [];
    
    // Basic information keywords
    keywords.push(student.firstName.toLowerCase());
    keywords.push(student.lastName.toLowerCase());
    keywords.push(student.rollNumber.toLowerCase());
    
    // Academic information
    keywords.push(`year_${student.currentYear}`);
    keywords.push(`semester_${student.currentSemester}`);
    keywords.push(`admission_${student.admissionYear}`);
    
    // Department
    if (student.department) {
      keywords.push(student.department.name.toLowerCase());
      keywords.push(student.department.code.toLowerCase());
    }
    
    // Credit information
    keywords.push('student', 'enrollment', 'credits');
    keywords.push('core', 'elective', 'skill-based');
    
    // NEP compliance keywords
    if (student.totalCreditsEarned > 0) {
      const corePercentage = (student.coreCreditsEarned / student.totalCreditsEarned) * 100;
      const electivePercentage = (student.electiveCreditsEarned / student.totalCreditsEarned) * 100;
      const skillPercentage = (student.skillCreditsEarned / student.totalCreditsEarned) * 100;
      
      keywords.push(`core_${corePercentage.toFixed(0)}%`);
      keywords.push(`elective_${electivePercentage.toFixed(0)}%`);
      keywords.push(`skill_${skillPercentage.toFixed(0)}%`);
    }
    
    return [...new Set(keywords)];
  }

  private extractStudentTags(student: any): string[] {
    const tags: string[] = ['student', 'enrolled'];
    
    // Year tags
    tags.push(`year_${student.currentYear}`);
    tags.push(`semester_${student.currentSemester}`);
    
    // Department tags
    if (student.department) {
      tags.push(`dept_${student.department.code.toLowerCase()}`);
    }
    
    // Status tags
    if (student.isActive) {
      tags.push('active');
    } else {
      tags.push('inactive');
    }
    
    // Credit status tags
    if (student.totalCreditsEarned > 0) {
      tags.push('has_credits');
    }
    
    return [...new Set(tags)];
  }

  private extractStudentNEPTags(student: any): string[] {
    const tags: string[] = [];
    
    if (student.totalCreditsEarned > 0) {
      const corePercentage = (student.coreCreditsEarned / student.totalCreditsEarned) * 100;
      const electivePercentage = (student.electiveCreditsEarned / student.totalCreditsEarned) * 100;
      const skillPercentage = (student.skillCreditsEarned / student.totalCreditsEarned) * 100;
      
      // NEP compliance tags
      if (corePercentage >= 60) {
        tags.push('nep_core_compliant');
      } else {
        tags.push('nep_core_deficient');
      }
      
      if (electivePercentage >= 30) {
        tags.push('nep_elective_compliant');
      } else {
        tags.push('nep_elective_deficient');
      }
      
      if (skillPercentage >= 10) {
        tags.push('nep_skill_compliant');
      } else {
        tags.push('nep_skill_deficient');
      }
      
      // Overall compliance
      if (corePercentage >= 60 && electivePercentage >= 30 && skillPercentage >= 10) {
        tags.push('nep_compliant');
      } else {
        tags.push('nep_non_compliant');
      }
    }
    
    return tags;
  }

  // ================================
  // SUBJECT METADATA EXTRACTION
  // ================================

  async extractSubjectMetadata(subject: any, organizationId: string): Promise<Partial<DocumentMetadata>> {
    const metadata: Partial<DocumentMetadata> = {
      organizationId,
      departmentId: subject.departmentId,
      documentType: DocumentType.SUBJECT,
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      nepCategory: subject.nepCategory,
      credits: subject.credits,
      offeredInYears: subject.offeredInYears,
      lastModified: new Date(subject.updatedAt),
      version: 1
    };

    if (this.options.includeKeywords) {
      metadata.keywords = this.extractSubjectKeywords(subject);
    }

    if (this.options.includeTags) {
      metadata.tags = this.extractSubjectTags(subject);
    }

    if (this.options.includeNEPCompliance) {
      metadata.tags = [...(metadata.tags || []), ...this.extractSubjectNEPTags(subject)];
    }

    return metadata;
  }

  private extractSubjectKeywords(subject: any): string[] {
    const keywords: string[] = [];
    
    // Basic information keywords
    keywords.push(subject.name.toLowerCase());
    keywords.push(subject.code.toLowerCase());
    
    // NEP category keywords
    keywords.push(subject.nepCategory.toLowerCase());
    
    // Credit information
    keywords.push(`${subject.credits}_credits`);
    keywords.push(`l${subject.lectureHours}_t${subject.tutorialHours}_p${subject.practicalHours}`);
    
    // Years offered
    if (subject.offeredInYears) {
      keywords.push(...subject.offeredInYears.map((year: number) => `year_${year}`));
    }
    
    // Department
    if (subject.department) {
      keywords.push(subject.department.name.toLowerCase());
      keywords.push(subject.department.code.toLowerCase());
    }
    
    // Assessment keywords
    keywords.push(`ca_${subject.continuousAssessmentWeight}%`);
    keywords.push(`exam_${subject.endSemesterExamWeight}%`);
    
    // General subject keywords
    keywords.push('subject', 'course', 'curriculum');
    
    return [...new Set(keywords)];
  }

  private extractSubjectTags(subject: any): string[] {
    const tags: string[] = ['subject', 'course'];
    
    // NEP category tags
    tags.push(`nep_${subject.nepCategory.toLowerCase()}`);
    
    // Credit tags
    tags.push(`${subject.credits}_credits`);
    
    // Years offered tags
    if (subject.offeredInYears) {
      tags.push(...subject.offeredInYears.map((year: number) => `year_${year}`));
    }
    
    // Department tags
    if (subject.department) {
      tags.push(`dept_${subject.department.code.toLowerCase()}`);
    }
    
    // Assessment pattern tags
    if (subject.continuousAssessmentWeight >= 40 && subject.endSemesterExamWeight >= 60) {
      tags.push('nep_assessment_compliant');
    } else {
      tags.push('nep_assessment_non_compliant');
    }
    
    // Availability tags
    if (subject.isOffered) {
      tags.push('offered');
    } else {
      tags.push('not_offered');
    }
    
    return [...new Set(tags)];
  }

  private extractSubjectNEPTags(subject: any): string[] {
    const tags: string[] = [];
    
    // NEP category specific tags
    switch (subject.nepCategory) {
      case NepCategory.CORE:
        tags.push('core_subject', 'mandatory');
        break;
      case NepCategory.ELECTIVE:
        tags.push('elective_subject', 'optional');
        break;
      case NepCategory.SKILL_BASED:
        tags.push('skill_subject', 'practical');
        break;
      case NepCategory.FOUNDATION:
        tags.push('foundation_subject', 'basic');
        break;
      case NepCategory.INTERDISCIPLINARY:
        tags.push('interdisciplinary_subject', 'cross_department');
        break;
      case NepCategory.PROJECT:
        tags.push('project_subject', 'research');
        break;
      case NepCategory.INTERNSHIP:
        tags.push('internship_subject', 'industry');
        break;
      case NepCategory.RESEARCH:
        tags.push('research_subject', 'thesis');
        break;
    }
    
    // Assessment compliance tags
    if (subject.continuousAssessmentWeight >= 40 && subject.endSemesterExamWeight >= 60) {
      tags.push('nep_assessment_compliant');
    } else {
      tags.push('nep_assessment_non_compliant');
    }
    
    return tags;
  }

  // ================================
  // ROOM METADATA EXTRACTION
  // ================================

  async extractRoomMetadata(room: any, organizationId: string): Promise<Partial<DocumentMetadata>> {
    const metadata: Partial<DocumentMetadata> = {
      organizationId,
      documentType: DocumentType.ROOM,
      roomId: room.id,
      roomCode: room.code,
      roomName: room.name,
      roomType: room.type,
      capacity: room.capacity,
      equipment: room.equipment || [],
      lastModified: new Date(room.updatedAt),
      version: 1
    };

    if (this.options.includeKeywords) {
      metadata.keywords = this.extractRoomKeywords(room);
    }

    if (this.options.includeTags) {
      metadata.tags = this.extractRoomTags(room);
    }

    return metadata;
  }

  private extractRoomKeywords(room: any): string[] {
    const keywords: string[] = [];
    
    // Basic information keywords
    keywords.push(room.name.toLowerCase());
    keywords.push(room.code.toLowerCase());
    keywords.push(room.type.toLowerCase());
    
    // Capacity keywords
    keywords.push(`capacity_${room.capacity}`);
    
    // Equipment keywords
    if (room.equipment) {
      keywords.push(...room.equipment.map((eq: string) => eq.toLowerCase()));
    }
    
    // Location keywords
    if (room.floor) {
      keywords.push(`floor_${room.floor}`);
    }
    if (room.building) {
      keywords.push(room.building.toLowerCase());
    }
    
    // Accessibility keywords
    if (room.isAccessible) {
      keywords.push('accessible', 'wheelchair');
    }
    
    // General room keywords
    keywords.push('room', 'classroom', 'facility');
    
    return [...new Set(keywords)];
  }

  private extractRoomTags(room: any): string[] {
    const tags: string[] = ['room', 'facility'];
    
    // Room type tags
    tags.push(`type_${room.type.toLowerCase()}`);
    
    // Capacity tags
    if (room.capacity <= 30) {
      tags.push('small_room');
    } else if (room.capacity <= 60) {
      tags.push('medium_room');
    } else {
      tags.push('large_room');
    }
    
    // Equipment tags
    if (room.equipment && room.equipment.length > 0) {
      tags.push('equipped');
      tags.push(...room.equipment.map((eq: string) => `has_${eq.toLowerCase().replace(/\s+/g, '_')}`));
    } else {
      tags.push('basic_room');
    }
    
    // Accessibility tags
    if (room.isAccessible) {
      tags.push('accessible');
    }
    
    // Location tags
    if (room.floor) {
      tags.push(`floor_${room.floor}`);
    }
    if (room.building) {
      tags.push(`building_${room.building.toLowerCase().replace(/\s+/g, '_')}`);
    }
    
    return [...new Set(tags)];
  }

  // ================================
  // CONSTRAINT METADATA EXTRACTION
  // ================================

  async extractConstraintMetadata(constraint: any, organizationId: string): Promise<Partial<DocumentMetadata>> {
    const metadata: Partial<DocumentMetadata> = {
      organizationId,
      documentType: DocumentType.CONSTRAINT,
      constraintType: constraint.type,
      priority: constraint.priority,
      weight: constraint.weight,
      lastModified: new Date(constraint.updatedAt),
      version: 1
    };

    if (this.options.includeKeywords) {
      metadata.keywords = this.extractConstraintKeywords(constraint);
    }

    if (this.options.includeTags) {
      metadata.tags = this.extractConstraintTags(constraint);
    }

    return metadata;
  }

  private extractConstraintKeywords(constraint: any): string[] {
    const keywords: string[] = [];
    
    // Basic information keywords
    keywords.push(constraint.name.toLowerCase());
    keywords.push(constraint.type.toLowerCase());
    
    // Description keywords
    if (constraint.description) {
      keywords.push(...constraint.description.toLowerCase().split(/\s+/));
    }
    
    // Priority keywords
    keywords.push(`priority_${constraint.priority}`);
    keywords.push(`weight_${constraint.weight}`);
    
    // Configuration keywords
    if (constraint.config) {
      keywords.push(...Object.keys(constraint.config).map(key => key.toLowerCase()));
    }
    
    // General constraint keywords
    keywords.push('constraint', 'rule', 'policy', 'regulation');
    
    return [...new Set(keywords)];
  }

  private extractConstraintTags(constraint: any): string[] {
    const tags: string[] = ['constraint', 'rule'];
    
    // Constraint type tags
    tags.push(`type_${constraint.type.toLowerCase()}`);
    
    // Priority tags
    if (constraint.priority <= 2) {
      tags.push('high_priority');
    } else if (constraint.priority <= 4) {
      tags.push('medium_priority');
    } else {
      tags.push('low_priority');
    }
    
    // Weight tags
    if (constraint.weight >= 0.8) {
      tags.push('high_weight');
    } else if (constraint.weight >= 0.5) {
      tags.push('medium_weight');
    } else {
      tags.push('low_weight');
    }
    
    // Status tags
    if (constraint.isActive) {
      tags.push('active');
    } else {
      tags.push('inactive');
    }
    
    // NEP compliance tags
    if (constraint.type.includes('NEP')) {
      tags.push('nep_compliance');
    }
    
    return [...new Set(tags)];
  }

  // ================================
  // TIMETABLE METADATA EXTRACTION
  // ================================

  async extractTimetableMetadata(timetable: any, organizationId: string): Promise<Partial<DocumentMetadata>> {
    const metadata: Partial<DocumentMetadata> = {
      organizationId,
      departmentId: timetable.departmentId,
      documentType: DocumentType.TIMETABLE,
      timetableId: timetable.id,
      academicYear: timetable.academicYearId,
      semester: timetable.semesterId,
      year: timetable.year,
      lastModified: new Date(timetable.updatedAt),
      version: 1
    };

    if (this.options.includeKeywords) {
      metadata.keywords = this.extractTimetableKeywords(timetable);
    }

    if (this.options.includeTags) {
      metadata.tags = this.extractTimetableTags(timetable);
    }

    return metadata;
  }

  private extractTimetableKeywords(timetable: any): string[] {
    const keywords: string[] = [];
    
    // Basic information keywords
    keywords.push(timetable.name.toLowerCase());
    
    // Academic information
    if (timetable.academicYear) {
      keywords.push(timetable.academicYear.toLowerCase());
    }
    if (timetable.semester) {
      keywords.push(timetable.semester.toLowerCase());
    }
    if (timetable.year) {
      keywords.push(`year_${timetable.year}`);
    }
    
    // Status keywords
    keywords.push(timetable.status.toLowerCase());
    
    // Quality keywords
    if (timetable.optimizationScore) {
      keywords.push(`score_${timetable.optimizationScore}`);
    }
    if (timetable.totalConflicts) {
      keywords.push(`conflicts_${timetable.totalConflicts}`);
    }
    
    // General timetable keywords
    keywords.push('timetable', 'schedule', 'timetable_generation');
    
    return [...new Set(keywords)];
  }

  private extractTimetableTags(timetable: any): string[] {
    const tags: string[] = ['timetable', 'schedule'];
    
    // Status tags
    tags.push(`status_${timetable.status.toLowerCase()}`);
    
    // Year tags
    if (timetable.year) {
      tags.push(`year_${timetable.year}`);
    }
    
    // Quality tags
    if (timetable.optimizationScore >= 80) {
      tags.push('high_quality');
    } else if (timetable.optimizationScore >= 60) {
      tags.push('medium_quality');
    } else {
      tags.push('low_quality');
    }
    
    // Conflict tags
    if (timetable.totalConflicts === 0) {
      tags.push('conflict_free');
    } else if (timetable.totalConflicts <= 5) {
      tags.push('low_conflicts');
    } else {
      tags.push('high_conflicts');
    }
    
    return [...new Set(tags)];
  }

  // ================================
  // NEP COMPLIANCE TAGS
  // ================================

  private extractNEPComplianceTags(entity: any): string[] {
    const tags: string[] = [];
    
    // Add NEP compliance tags based on entity type
    if (entity.nepCategories) {
      tags.push(...entity.nepCategories.map((cat: string) => `nep_${cat.toLowerCase()}`));
    }
    
    // Add general NEP tags
    tags.push('nep_2020', 'compliance');
    
    return [...new Set(tags)];
  }
}

