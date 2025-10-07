/**
 * NEP 2020 Compliance Validation Utilities
 * Comprehensive validation rules and helper functions
 */

import {
  StudentProfile,
  FacultyProfile,
  SubjectDetails,
  GeneratedTimetable,
  ScheduleSlot,
  NEPValidationRules,
  ValidationResult,
  NEPComplianceResponse,
  TimetableNEPCompliance,
  ConflictDetail,
  ConstraintViolation,
  NepCategory,
  ClassType,
  AssessmentType
} from '../types/nep-interfaces';

// ================================
// NEP VALIDATION RULES CONSTANTS
// ================================

export const DEFAULT_NEP_RULES: NEPValidationRules = {
  // Credit Limits
  minCreditsPerSemester: 20,
  maxCreditsPerSemester: 30,
  totalCreditsForDegree: 160,
  
  // Daily Limits
  maxHoursPerDay: 6,
  minBreakBetweenClasses: 15, // 15 minutes
  
  // Practical Requirements
  minPracticalBlockDuration: 120, // 2 hours in minutes
  practicalSessionGap: 30, // 30 minutes gap between practicals
  
  // Attendance Requirements
  minAttendancePercentage: 75,
  attendanceTrackingRequired: true,
  
  // Assessment Pattern
  continuousAssessmentWeight: 40,
  endSemesterExamWeight: 60,
  assessmentGapDays: 7, // minimum 7 days between assessments
  
  // NEP Distribution
  corePercentage: 60,
  electivePercentage: 30,
  skillPercentage: 10,
  
  // Faculty Constraints
  maxFacultyHoursPerWeek: 40,
  minFacultyHoursPerWeek: 20,
  facultyLunchBreakRequired: true,
  facultyLunchBreakDuration: 60, // 1 hour
};

// ================================
// STUDENT PROFILE VALIDATION
// ================================

export class StudentProfileValidator {
  private rules: NEPValidationRules;

  constructor(rules: NEPValidationRules = DEFAULT_NEP_RULES) {
    this.rules = rules;
  }

  /**
   * Validate student's NEP compliance
   */
  validateNEPCompliance(student: StudentProfile): NEPComplianceResponse {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Credit Distribution Validation
    const creditValidation = this.validateCreditDistribution(student);
    if (!creditValidation.isValid) {
      errors.push(...creditValidation.errors);
      recommendations.push(...creditValidation.recommendations);
    }

    // Semester Credit Limits Validation
    const semesterValidation = this.validateSemesterCredits(student);
    if (!semesterValidation.isValid) {
      errors.push(...semesterValidation.errors);
      recommendations.push(...semesterValidation.recommendations);
    }

    // Attendance Validation
    const attendanceValidation = this.validateAttendance(student);
    if (!attendanceValidation.isValid) {
      errors.push(...attendanceValidation.errors);
      recommendations.push(...attendanceValidation.recommendations);
    }

    // Assessment Pattern Validation
    const assessmentValidation = this.validateAssessmentPattern(student);
    if (!assessmentValidation.isValid) {
      errors.push(...assessmentValidation.errors);
      recommendations.push(...assessmentValidation.recommendations);
    }

    // Calculate compliance score
    const complianceScore = this.calculateComplianceScore(student, errors, warnings);

    return {
      isCompliant: errors.length === 0,
      complianceScore,
      violations: errors,
      recommendations,
      detailedBreakdown: {
        creditDistribution: {
          core: {
            current: student.coreCreditsEarned,
            required: Math.ceil(student.totalCreditsEarned * this.rules.corePercentage / 100),
            percentage: student.totalCreditsEarned > 0 ? 
              (student.coreCreditsEarned / student.totalCreditsEarned) * 100 : 0
          },
          elective: {
            current: student.electiveCreditsEarned,
            required: Math.ceil(student.totalCreditsEarned * this.rules.electivePercentage / 100),
            percentage: student.totalCreditsEarned > 0 ? 
              (student.electiveCreditsEarned / student.totalCreditsEarned) * 100 : 0
          },
          skill: {
            current: student.skillCreditsEarned,
            required: Math.ceil(student.totalCreditsEarned * this.rules.skillPercentage / 100),
            percentage: student.totalCreditsEarned > 0 ? 
              (student.skillCreditsEarned / student.totalCreditsEarned) * 100 : 0
          }
        },
        assessmentPattern: {
          continuous: {
            current: this.calculateContinuousAssessmentWeight(student),
            required: this.rules.continuousAssessmentWeight
          },
          endSemester: {
            current: this.calculateEndSemesterExamWeight(student),
            required: this.rules.endSemesterExamWeight
          }
        },
        attendance: {
          current: this.calculateAverageAttendance(student),
          required: this.rules.minAttendancePercentage,
          status: this.calculateAverageAttendance(student) >= this.rules.minAttendancePercentage ? 
            'COMPLIANT' : 'NON_COMPLIANT'
        }
      }
    };
  }

  private validateCreditDistribution(student: StudentProfile): ValidationResult {
    const errors: string[] = [];
    const recommendations: string[] = [];

    if (student.totalCreditsEarned === 0) {
      return { isValid: true, errors: [], warnings: [], score: 100, recommendations: [] };
    }

    const corePercentage = (student.coreCreditsEarned / student.totalCreditsEarned) * 100;
    const electivePercentage = (student.electiveCreditsEarned / student.totalCreditsEarned) * 100;
    const skillPercentage = (student.skillCreditsEarned / student.totalCreditsEarned) * 100;

    if (corePercentage < this.rules.corePercentage) {
      errors.push(`Core credits insufficient: ${corePercentage.toFixed(2)}% (required: ${this.rules.corePercentage}%)`);
      recommendations.push(`Enroll in more core subjects to reach ${this.rules.corePercentage}% requirement`);
    }

    if (electivePercentage < this.rules.electivePercentage) {
      errors.push(`Elective credits insufficient: ${electivePercentage.toFixed(2)}% (required: ${this.rules.electivePercentage}%)`);
      recommendations.push(`Enroll in more elective subjects to reach ${this.rules.electivePercentage}% requirement`);
    }

    if (skillPercentage < this.rules.skillPercentage) {
      errors.push(`Skill-based credits insufficient: ${skillPercentage.toFixed(2)}% (required: ${this.rules.skillPercentage}%)`);
      recommendations.push(`Enroll in more skill-based subjects to reach ${this.rules.skillPercentage}% requirement`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      score: this.calculateCreditDistributionScore(corePercentage, electivePercentage, skillPercentage),
      recommendations
    };
  }

  private validateSemesterCredits(student: StudentProfile): ValidationResult {
    const errors: string[] = [];
    const recommendations: string[] = [];

    const currentSemesterCredits = student.enrolledSubjects
      .filter(subject => subject.isActive)
      .reduce((total, subject) => total + subject.subject.credits, 0);

    if (currentSemesterCredits < this.rules.minCreditsPerSemester) {
      errors.push(`Semester credits insufficient: ${currentSemesterCredits} (minimum: ${this.rules.minCreditsPerSemester})`);
      recommendations.push(`Enroll in additional subjects to meet minimum credit requirement`);
    }

    if (currentSemesterCredits > this.rules.maxCreditsPerSemester) {
      errors.push(`Semester credits exceeded: ${currentSemesterCredits} (maximum: ${this.rules.maxCreditsPerSemester})`);
      recommendations.push(`Consider dropping some subjects to stay within credit limit`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      score: currentSemesterCredits >= this.rules.minCreditsPerSemester && 
             currentSemesterCredits <= this.rules.maxCreditsPerSemester ? 100 : 0,
      recommendations
    };
  }

  private validateAttendance(student: StudentProfile): ValidationResult {
    const errors: string[] = [];
    const recommendations: string[] = [];

    if (!this.rules.attendanceTrackingRequired) {
      return { isValid: true, errors: [], warnings: [], score: 100, recommendations: [] };
    }

    const averageAttendance = this.calculateAverageAttendance(student);
    
    if (averageAttendance < this.rules.minAttendancePercentage) {
      errors.push(`Attendance insufficient: ${averageAttendance.toFixed(2)}% (minimum: ${this.rules.minAttendancePercentage}%)`);
      recommendations.push(`Improve attendance to meet minimum requirement`);
    }

    return {
      isValid: averageAttendance >= this.rules.minAttendancePercentage,
      errors,
      warnings: [],
      score: (averageAttendance / this.rules.minAttendancePercentage) * 100,
      recommendations
    };
  }

  private validateAssessmentPattern(student: StudentProfile): ValidationResult {
    const errors: string[] = [];
    const recommendations: string[] = [];

    const continuousWeight = this.calculateContinuousAssessmentWeight(student);
    const endSemesterWeight = this.calculateEndSemesterExamWeight(student);

    if (Math.abs(continuousWeight - this.rules.continuousAssessmentWeight) > 5) {
      errors.push(`Continuous assessment weight deviation: ${continuousWeight}% (required: ${this.rules.continuousAssessmentWeight}%)`);
    }

    if (Math.abs(endSemesterWeight - this.rules.endSemesterExamWeight) > 5) {
      errors.push(`End semester exam weight deviation: ${endSemesterWeight}% (required: ${this.rules.endSemesterExamWeight}%)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      score: 100 - Math.abs(continuousWeight - this.rules.continuousAssessmentWeight) - 
             Math.abs(endSemesterWeight - this.rules.endSemesterExamWeight),
      recommendations
    };
  }

  private calculateComplianceScore(student: StudentProfile, errors: string[], warnings: string[]): number {
    let score = 100;
    
    // Deduct points for errors
    score -= errors.length * 10;
    
    // Deduct points for warnings
    score -= warnings.length * 5;
    
    // Credit distribution score
    const creditScore = this.calculateCreditDistributionScore(
      student.totalCreditsEarned > 0 ? (student.coreCreditsEarned / student.totalCreditsEarned) * 100 : 0,
      student.totalCreditsEarned > 0 ? (student.electiveCreditsEarned / student.totalCreditsEarned) * 100 : 0,
      student.totalCreditsEarned > 0 ? (student.skillCreditsEarned / student.totalCreditsEarned) * 100 : 0
    );
    
    score = (score + creditScore) / 2;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateCreditDistributionScore(core: number, elective: number, skill: number): number {
    const coreScore = Math.max(0, 100 - Math.abs(core - this.rules.corePercentage) * 2);
    const electiveScore = Math.max(0, 100 - Math.abs(elective - this.rules.electivePercentage) * 2);
    const skillScore = Math.max(0, 100 - Math.abs(skill - this.rules.skillPercentage) * 2);
    
    return (coreScore + electiveScore + skillScore) / 3;
  }

  private calculateAverageAttendance(student: StudentProfile): number {
    if (student.attendanceRecords.length === 0) return 100;
    
    const totalClasses = student.attendanceRecords.length;
    const attendedClasses = student.attendanceRecords.filter(record => record.isPresent).length;
    
    return (attendedClasses / totalClasses) * 100;
  }

  private calculateContinuousAssessmentWeight(student: StudentProfile): number {
    const subjects = student.enrolledSubjects.filter(subject => subject.isActive);
    if (subjects.length === 0) return 0;
    
    const totalWeight = subjects.reduce((sum, subject) => 
      sum + subject.subject.continuousAssessmentWeight, 0);
    
    return totalWeight / subjects.length;
  }

  private calculateEndSemesterExamWeight(student: StudentProfile): number {
    const subjects = student.enrolledSubjects.filter(subject => subject.isActive);
    if (subjects.length === 0) return 0;
    
    const totalWeight = subjects.reduce((sum, subject) => 
      sum + subject.subject.endSemesterExamWeight, 0);
    
    return totalWeight / subjects.length;
  }
}

// ================================
// FACULTY PROFILE VALIDATION
// ================================

export class FacultyProfileValidator {
  private rules: NEPValidationRules;

  constructor(rules: NEPValidationRules = DEFAULT_NEP_RULES) {
    this.rules = rules;
  }

  /**
   * Validate faculty workload compliance
   */
  validateWorkload(faculty: FacultyProfile): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check maximum hours per week
    if (faculty.currentWorkload > this.rules.maxFacultyHoursPerWeek) {
      errors.push(`Faculty workload exceeded: ${faculty.currentWorkload} hours (maximum: ${this.rules.maxFacultyHoursPerWeek})`);
      recommendations.push(`Reduce teaching load or redistribute classes`);
    }

    // Check minimum hours per week
    if (faculty.currentWorkload < this.rules.minFacultyHoursPerWeek) {
      warnings.push(`Faculty workload below minimum: ${faculty.currentWorkload} hours (minimum: ${this.rules.minFacultyHoursPerWeek})`);
      recommendations.push(`Assign additional teaching responsibilities`);
    }

    // Check availability
    if (!faculty.isAvailable) {
      errors.push(`Faculty is not available for teaching`);
      recommendations.push(`Check faculty availability status`);
    }

    // Check specialization alignment
    const specializationValidation = this.validateSpecializations(faculty);
    if (!specializationValidation.isValid) {
      warnings.push(...specializationValidation.errors);
      recommendations.push(...specializationValidation.recommendations);
    }

    const score = this.calculateWorkloadScore(faculty);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
      recommendations
    };
  }

  private validateSpecializations(faculty: FacultyProfile): ValidationResult {
    const errors: string[] = [];
    const recommendations: string[] = [];

    if (faculty.specializations.length === 0) {
      warnings.push(`No specializations defined for faculty`);
      recommendations.push(`Add faculty specializations for better subject assignment`);
    }

    if (faculty.nepCategories.length === 0) {
      warnings.push(`No NEP categories assigned to faculty`);
      recommendations.push(`Assign appropriate NEP categories to faculty`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: faculty.specializations.length > 0 && faculty.nepCategories.length > 0 ? 100 : 50,
      recommendations
    };
  }

  private calculateWorkloadScore(faculty: FacultyProfile): number {
    let score = 100;

    // Deduct for overloading
    if (faculty.currentWorkload > this.rules.maxFacultyHoursPerWeek) {
      score -= (faculty.currentWorkload - this.rules.maxFacultyHoursPerWeek) * 5;
    }

    // Deduct for underloading
    if (faculty.currentWorkload < this.rules.minFacultyHoursPerWeek) {
      score -= (this.rules.minFacultyHoursPerWeek - faculty.currentWorkload) * 2;
    }

    // Availability bonus
    if (faculty.isAvailable) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }
}

// ================================
// SUBJECT DETAILS VALIDATION
// ================================

export class SubjectDetailsValidator {
  private rules: NEPValidationRules;

  constructor(rules: NEPValidationRules = DEFAULT_NEP_RULES) {
    this.rules = rules;
  }

  /**
   * Validate subject NEP compliance
   */
  validateNEPCompliance(subject: SubjectDetails): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Validate assessment pattern
    const assessmentValidation = this.validateAssessmentPattern(subject);
    if (!assessmentValidation.isValid) {
      errors.push(...assessmentValidation.errors);
      recommendations.push(...assessmentValidation.recommendations);
    }

    // Validate credit structure
    const creditValidation = this.validateCreditStructure(subject);
    if (!creditValidation.isValid) {
      errors.push(...creditValidation.errors);
      recommendations.push(...creditValidation.recommendations);
    }

    // Validate NEP category alignment
    const categoryValidation = this.validateNEPCategory(subject);
    if (!categoryValidation.isValid) {
      warnings.push(...categoryValidation.errors);
      recommendations.push(...categoryValidation.recommendations);
    }

    // Validate faculty assignment
    const facultyValidation = this.validateFacultyAssignment(subject);
    if (!facultyValidation.isValid) {
      errors.push(...facultyValidation.errors);
      recommendations.push(...facultyValidation.recommendations);
    }

    const score = this.calculateSubjectScore(subject, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
      recommendations
    };
  }

  private validateAssessmentPattern(subject: SubjectDetails): ValidationResult {
    const errors: string[] = [];
    const recommendations: string[] = [];

    const totalWeight = subject.continuousAssessmentWeight + subject.endSemesterExamWeight;
    
    if (Math.abs(totalWeight - 100) > 1) {
      errors.push(`Assessment weights must sum to 100% (current: ${totalWeight}%)`);
      recommendations.push(`Adjust assessment weights to sum to 100%`);
    }

    if (Math.abs(subject.continuousAssessmentWeight - this.rules.continuousAssessmentWeight) > 10) {
      warnings.push(`Continuous assessment weight deviation: ${subject.continuousAssessmentWeight}% (recommended: ${this.rules.continuousAssessmentWeight}%)`);
    }

    if (Math.abs(subject.endSemesterExamWeight - this.rules.endSemesterExamWeight) > 10) {
      warnings.push(`End semester exam weight deviation: ${subject.endSemesterExamWeight}% (recommended: ${this.rules.endSemesterExamWeight}%)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.abs(totalWeight - 100) <= 1 ? 100 : 50,
      recommendations
    };
  }

  private validateCreditStructure(subject: SubjectDetails): ValidationResult {
    const errors: string[] = [];
    const recommendations: string[] = [];

    if (subject.credits <= 0) {
      errors.push(`Subject credits must be greater than 0`);
      recommendations.push(`Assign appropriate credit value to subject`);
    }

    if (subject.credits > 6) {
      warnings.push(`Subject credits exceed typical maximum: ${subject.credits} (recommended: ≤6)`);
      recommendations.push(`Consider splitting high-credit subjects`);
    }

    const totalHours = subject.lectureHours + subject.tutorialHours + subject.practicalHours;
    if (totalHours === 0) {
      errors.push(`Subject must have at least one hour of instruction`);
      recommendations.push(`Assign appropriate instruction hours`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: subject.credits > 0 && totalHours > 0 ? 100 : 0,
      recommendations
    };
  }

  private validateNEPCategory(subject: SubjectDetails): ValidationResult {
    const errors: string[] = [];
    const recommendations: string[] = [];

    if (!subject.nepCategory) {
      errors.push(`Subject must have a NEP category assigned`);
      recommendations.push(`Assign appropriate NEP category to subject`);
    }

    // Validate category-specific requirements
    if (subject.nepCategory === NepCategory.SKILL_BASED && subject.practicalHours === 0) {
      warnings.push(`Skill-based subjects should include practical hours`);
      recommendations.push(`Add practical components to skill-based subjects`);
    }

    if (subject.nepCategory === NepCategory.INTERDISCIPLINARY && subject.assignedFaculties.length < 2) {
      warnings.push(`Interdisciplinary subjects should have multiple faculty members`);
      recommendations.push(`Assign faculty from different departments`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: subject.nepCategory ? 100 : 0,
      recommendations
    };
  }

  private validateFacultyAssignment(subject: SubjectDetails): ValidationResult {
    const errors: string[] = [];
    const recommendations: string[] = [];

    if (subject.assignedFaculties.length === 0) {
      errors.push(`Subject must have at least one assigned faculty member`);
      recommendations.push(`Assign faculty members to subject`);
    }

    const primaryFaculty = subject.assignedFaculties.find(f => f.isPrimary);
    if (!primaryFaculty) {
      warnings.push(`Subject should have a primary faculty member`);
      recommendations.push(`Designate one faculty member as primary instructor`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: subject.assignedFaculties.length > 0 ? 100 : 0,
      recommendations
    };
  }

  private calculateSubjectScore(subject: SubjectDetails, errors: string[], warnings: string[]): number {
    let score = 100;
    
    // Deduct for errors
    score -= errors.length * 15;
    
    // Deduct for warnings
    score -= warnings.length * 5;
    
    // Assessment pattern score
    const totalWeight = subject.continuousAssessmentWeight + subject.endSemesterExamWeight;
    if (Math.abs(totalWeight - 100) <= 1) {
      score += 10;
    }
    
    // Faculty assignment bonus
    if (subject.assignedFaculties.length > 0) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }
}

// ================================
// TIMETABLE VALIDATION
// ================================

export class TimetableValidator {
  private rules: NEPValidationRules;

  constructor(rules: NEPValidationRules = DEFAULT_NEP_RULES) {
    this.rules = rules;
  }

  /**
   * Validate generated timetable for NEP compliance
   */
  validateTimetable(timetable: GeneratedTimetable): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Validate daily hour limits
    const dailyValidation = this.validateDailyHourLimits(timetable);
    if (!dailyValidation.isValid) {
      errors.push(...dailyValidation.errors);
      recommendations.push(...dailyValidation.recommendations);
    }

    // Validate practical block requirements
    const practicalValidation = this.validatePracticalBlocks(timetable);
    if (!practicalValidation.isValid) {
      errors.push(...practicalValidation.errors);
      recommendations.push(...practicalValidation.recommendations);
    }

    // Validate faculty workload
    const facultyValidation = this.validateFacultyWorkload(timetable);
    if (!facultyValidation.isValid) {
      errors.push(...facultyValidation.errors);
      recommendations.push(...facultyValidation.recommendations);
    }

    // Validate room utilization
    const roomValidation = this.validateRoomUtilization(timetable);
    if (!roomValidation.isValid) {
      warnings.push(...roomValidation.errors);
      recommendations.push(...roomValidation.recommendations);
    }

    // Validate NEP compliance
    const nepValidation = this.validateNEPCompliance(timetable);
    if (!nepValidation.isValid) {
      errors.push(...nepValidation.errors);
      recommendations.push(...nepValidation.recommendations);
    }

    const score = this.calculateTimetableScore(timetable, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
      recommendations
    };
  }

  private validateDailyHourLimits(timetable: GeneratedTimetable): ValidationResult {
    const errors: string[] = [];
    const recommendations: string[] = [];

    // Group slots by day and calculate hours
    const dailyHours = new Map<number, number>();
    
    timetable.slots.forEach(slot => {
      const day = slot.dayOfWeek;
      const duration = slot.duration / 60; // Convert minutes to hours
      
      if (dailyHours.has(day)) {
        dailyHours.set(day, dailyHours.get(day)! + duration);
      } else {
        dailyHours.set(day, duration);
      }
    });

    // Check daily hour limits
    dailyHours.forEach((hours, day) => {
      if (hours > this.rules.maxHoursPerDay) {
        errors.push(`Day ${this.getDayName(day)} exceeds maximum hours: ${hours} (maximum: ${this.rules.maxHoursPerDay})`);
        recommendations.push(`Redistribute classes to reduce daily load`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      score: errors.length === 0 ? 100 : 50,
      recommendations
    };
  }

  private validatePracticalBlocks(timetable: GeneratedTimetable): ValidationResult {
    const errors: string[] = [];
    const recommendations: string[] = [];

    // Find practical sessions
    const practicalSlots = timetable.slots.filter(slot => 
      slot.classType === ClassType.PRACTICAL || slot.classType === ClassType.LABORATORY
    );

    // Group by day and check block duration
    const dailyPracticals = new Map<number, ScheduleSlot[]>();
    
    practicalSlots.forEach(slot => {
      const day = slot.dayOfWeek;
      if (!dailyPracticals.has(day)) {
        dailyPracticals.set(day, []);
      }
      dailyPracticals.get(day)!.push(slot);
    });

    dailyPracticals.forEach((slots, day) => {
      // Sort by start time
      slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      // Check for minimum block duration
      let currentBlockDuration = 0;
      let currentBlockStart = slots[0]?.startTime;
      
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        const nextSlot = slots[i + 1];
        
        currentBlockDuration += slot.duration;
        
        // Check if this is the end of a block
        if (!nextSlot || this.getTimeDifference(slot.endTime, nextSlot.startTime) > this.rules.practicalSessionGap) {
          if (currentBlockDuration < this.rules.minPracticalBlockDuration) {
            errors.push(`Practical block on ${this.getDayName(day)} too short: ${currentBlockDuration} minutes (minimum: ${this.rules.minPracticalBlockDuration})`);
            recommendations.push(`Extend practical sessions to meet minimum block duration`);
          }
          
          // Reset for next block
          currentBlockDuration = 0;
          currentBlockStart = nextSlot?.startTime;
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      score: errors.length === 0 ? 100 : 50,
      recommendations
    };
  }

  private validateFacultyWorkload(timetable: GeneratedTimetable): ValidationResult {
    const errors: string[] = [];
    const recommendations: string[] = [];

    // Calculate faculty workload
    const facultyWorkload = new Map<string, number>();
    
    timetable.slots.forEach(slot => {
      const facultyId = slot.facultyId;
      const hours = slot.duration / 60; // Convert minutes to hours
      
      if (facultyWorkload.has(facultyId)) {
        facultyWorkload.set(facultyId, facultyWorkload.get(facultyId)! + hours);
      } else {
        facultyWorkload.set(facultyId, hours);
      }
    });

    // Check workload limits
    facultyWorkload.forEach((hours, facultyId) => {
      if (hours > this.rules.maxFacultyHoursPerWeek) {
        errors.push(`Faculty ${facultyId} workload exceeded: ${hours} hours (maximum: ${this.rules.maxFacultyHoursPerWeek})`);
        recommendations.push(`Redistribute classes to reduce faculty workload`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      score: errors.length === 0 ? 100 : 50,
      recommendations
    };
  }

  private validateRoomUtilization(timetable: GeneratedTimetable): ValidationResult {
    const errors: string[] = [];
    const recommendations: string[] = [];

    // Calculate room utilization
    const roomUtilization = new Map<string, number>();
    
    timetable.slots.forEach(slot => {
      const roomId = slot.roomId;
      const hours = slot.duration / 60; // Convert minutes to hours
      
      if (roomUtilization.has(roomId)) {
        roomUtilization.set(roomId, roomUtilization.get(roomId)! + hours);
      } else {
        roomUtilization.set(roomId, hours);
      }
    });

    // Check for overutilization
    roomUtilization.forEach((hours, roomId) => {
      if (hours > 40) { // Assuming 40 hours per week is maximum
        warnings.push(`Room ${roomId} overutilized: ${hours} hours per week`);
        recommendations.push(`Consider using additional rooms or redistributing classes`);
      }
    });

    return {
      isValid: true, // Room utilization issues are warnings, not errors
      errors,
      warnings,
      score: 100,
      recommendations
    };
  }

  private validateNEPCompliance(timetable: GeneratedTimetable): ValidationResult {
    const errors: string[] = [];
    const recommendations: string[] = [];

    // Check NEP compliance from timetable
    if (timetable.nepCompliance && !timetable.nepCompliance.isCompliant) {
      errors.push(...timetable.nepCompliance.violations);
      recommendations.push(...timetable.nepCompliance.recommendations);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      score: timetable.nepCompliance?.complianceScore || 0,
      recommendations
    };
  }

  private calculateTimetableScore(timetable: GeneratedTimetable, errors: string[], warnings: string[]): number {
    let score = 100;
    
    // Deduct for errors
    score -= errors.length * 15;
    
    // Deduct for warnings
    score -= warnings.length * 5;
    
    // Add quality metrics
    if (timetable.qualityMetrics) {
      score = (score + timetable.qualityMetrics.overallScore) / 2;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  }

  private getTimeDifference(endTime: string, startTime: string): number {
    const end = new Date(`2000-01-01 ${endTime}`);
    const start = new Date(`2000-01-01 ${startTime}`);
    return (start.getTime() - end.getTime()) / (1000 * 60); // Return difference in minutes
  }
}

// ================================
// UTILITY FUNCTIONS
// ================================

export function validateNEPRules(rules: NEPValidationRules): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Validate credit percentages sum to 100
  const totalPercentage = rules.corePercentage + rules.electivePercentage + rules.skillPercentage;
  if (Math.abs(totalPercentage - 100) > 1) {
    errors.push(`Credit distribution percentages must sum to 100% (current: ${totalPercentage}%)`);
    recommendations.push(`Adjust credit distribution percentages to sum to 100%`);
  }

  // Validate assessment weights sum to 100
  const totalAssessmentWeight = rules.continuousAssessmentWeight + rules.endSemesterExamWeight;
  if (Math.abs(totalAssessmentWeight - 100) > 1) {
    errors.push(`Assessment weights must sum to 100% (current: ${totalAssessmentWeight}%)`);
    recommendations.push(`Adjust assessment weights to sum to 100%`);
  }

  // Validate credit limits
  if (rules.minCreditsPerSemester > rules.maxCreditsPerSemester) {
    errors.push(`Minimum credits per semester cannot be greater than maximum credits`);
    recommendations.push(`Adjust credit limits to ensure minimum ≤ maximum`);
  }

  // Validate hour limits
  if (rules.maxHoursPerDay > 8) {
    warnings.push(`Maximum hours per day exceeds recommended limit: ${rules.maxHoursPerDay} (recommended: ≤8)`);
    recommendations.push(`Consider reducing maximum daily hours for better student welfare`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: errors.length === 0 ? 100 : 50,
    recommendations
  };
}

export function createDefaultNEPRules(): NEPValidationRules {
  return { ...DEFAULT_NEP_RULES };
}

export function createCustomNEPRules(overrides: Partial<NEPValidationRules>): NEPValidationRules {
  return { ...DEFAULT_NEP_RULES, ...overrides };
}

