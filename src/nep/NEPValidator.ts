/**
 * NEP 2020 Compliance Validator
 * Validates timetable and academic data against NEP 2020 requirements
 */

import { StudentProfile, FacultyProfile, SubjectDetails, GeneratedTimetable, ScheduleSlot } from '../types/nep-interfaces';

export interface NEPValidationResult {
  isValid: boolean;
  complianceScore: number; // 0-100
  violations: NEPViolation[];
  warnings: NEPWarning[];
  recommendations: string[];
  creditDistribution: CreditDistribution;
  attendanceCapability: AttendanceCapability;
  assessmentPattern: AssessmentPattern;
  practicalBlocks: PracticalBlock[];
  cbcCompliance: CBCCompliance;
}

export interface NEPViolation {
  type: 'CREDIT_DISTRIBUTION' | 'CONTACT_HOURS' | 'ATTENDANCE' | 'ASSESSMENT' | 'PRACTICAL_BLOCKS' | 'CBC_COMPLIANCE';
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  message: string;
  details: Record<string, any>;
  affectedEntities: string[];
  suggestedFix: string;
}

export interface NEPWarning {
  type: string;
  message: string;
  details: Record<string, any>;
  affectedEntities: string[];
}

export interface CreditDistribution {
  core: { credits: number; percentage: number; required: number; status: 'COMPLIANT' | 'NON_COMPLIANT' };
  elective: { credits: number; percentage: number; required: number; status: 'COMPLIANT' | 'NON_COMPLIANT' };
  skillBased: { credits: number; percentage: number; required: number; status: 'COMPLIANT' | 'NON_COMPLIANT' };
  total: { credits: number; required: number; status: 'COMPLIANT' | 'NON_COMPLIANT' };
}

export interface AttendanceCapability {
  canTrack: boolean;
  trackingMethod: 'AUTOMATIC' | 'MANUAL' | 'HYBRID';
  minimumRequired: number; // 75%
  currentCapability: number;
  status: 'COMPLIANT' | 'NON_COMPLIANT';
}

export interface AssessmentPattern {
  continuous: { percentage: number; required: number; status: 'COMPLIANT' | 'NON_COMPLIANT' };
  final: { percentage: number; required: number; status: 'COMPLIANT' | 'NON_COMPLIANT' };
  total: { percentage: number; status: 'COMPLIANT' | 'NON_COMPLIANT' };
}

export interface PracticalBlock {
  subjectId: string;
  subjectName: string;
  duration: number; // in hours
  status: 'COMPLIANT' | 'NON_COMPLIANT';
  required: number; // 2 hours minimum
}

export interface CBCCompliance {
  choiceBased: boolean;
  creditTransfer: boolean;
  multipleEntryExit: boolean;
  flexiblePathways: boolean;
  status: 'COMPLIANT' | 'NON_COMPLIANT';
}

export class NEPValidator {
  private readonly NEP_CONSTANTS = {
    CREDIT_DISTRIBUTION: {
      CORE_PERCENTAGE: 60,
      ELECTIVE_PERCENTAGE: 30,
      SKILL_BASED_PERCENTAGE: 10
    },
    CONTACT_HOURS: {
      MAX_PER_DAY: 6,
      MAX_PER_WEEK: 30
    },
    ATTENDANCE: {
      MINIMUM_PERCENTAGE: 75
    },
    ASSESSMENT: {
      CONTINUOUS_PERCENTAGE: 40,
      FINAL_PERCENTAGE: 60
    },
    PRACTICAL: {
      MIN_BLOCK_DURATION: 2 // hours
    }
  };

  /**
   * Validate complete timetable against NEP 2020 requirements
   */
  async validateTimetable(
    timetable: GeneratedTimetable,
    students: StudentProfile[],
    faculty: FacultyProfile[],
    subjects: SubjectDetails[]
  ): Promise<NEPValidationResult> {
    console.log('Starting NEP 2020 compliance validation...');

    const violations: NEPViolation[] = [];
    const warnings: NEPWarning[] = [];
    const recommendations: string[] = [];

    // 1. Validate credit distribution
    const creditDistribution = await this.validateCreditDistribution(students, subjects);
    violations.push(...creditDistribution.violations);
    warnings.push(...creditDistribution.warnings);

    // 2. Validate contact hours
    const contactHoursViolations = await this.validateContactHours(timetable, students);
    violations.push(...contactHoursViolations);

    // 3. Validate attendance capability
    const attendanceCapability = await this.validateAttendanceCapability(timetable, students);
    violations.push(...attendanceCapability.violations);

    // 4. Validate assessment pattern
    const assessmentPattern = await this.validateAssessmentPattern(subjects);
    violations.push(...assessmentPattern.violations);

    // 5. Validate practical blocks
    const practicalBlocks = await this.validatePracticalBlocks(timetable, subjects);
    violations.push(...practicalBlocks.violations);

    // 6. Validate CBC compliance
    const cbcCompliance = await this.validateCBCCompliance(students, subjects);
    violations.push(...cbcCompliance.violations);

    // Calculate compliance score
    const complianceScore = this.calculateComplianceScore(violations, warnings);

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(violations, warnings));

    return {
      isValid: violations.filter(v => v.severity === 'CRITICAL').length === 0,
      complianceScore,
      violations,
      warnings,
      recommendations,
      creditDistribution: creditDistribution.distribution,
      attendanceCapability: attendanceCapability.capability,
      assessmentPattern: assessmentPattern.pattern,
      practicalBlocks: practicalBlocks.blocks,
      cbcCompliance: cbcCompliance.compliance
    };
  }

  /**
   * Validate credit distribution (60% core, 30% elective, 10% skill-based)
   */
  private async validateCreditDistribution(
    students: StudentProfile[],
    subjects: SubjectDetails[]
  ): Promise<{
    distribution: CreditDistribution;
    violations: NEPViolation[];
    warnings: NEPWarning[];
  }> {
    const violations: NEPViolation[] = [];
    const warnings: NEPWarning[] = [];

    // Calculate total credits for each student
    const studentCreditAnalysis = students.map(student => {
      const enrolledSubjects = subjects.filter(subject => 
        student.enrolledSubjects.includes(subject.id)
      );

      const coreCredits = enrolledSubjects
        .filter(subject => subject.category === 'CORE')
        .reduce((sum, subject) => sum + subject.credits, 0);

      const electiveCredits = enrolledSubjects
        .filter(subject => subject.category === 'ELECTIVE')
        .reduce((sum, subject) => sum + subject.credits, 0);

      const skillBasedCredits = enrolledSubjects
        .filter(subject => subject.category === 'SKILL_BASED')
        .reduce((sum, subject) => sum + subject.credits, 0);

      const totalCredits = coreCredits + electiveCredits + skillBasedCredits;

      return {
        studentId: student.id,
        coreCredits,
        electiveCredits,
        skillBasedCredits,
        totalCredits,
        corePercentage: totalCredits > 0 ? (coreCredits / totalCredits) * 100 : 0,
        electivePercentage: totalCredits > 0 ? (electiveCredits / totalCredits) * 100 : 0,
        skillBasedPercentage: totalCredits > 0 ? (skillBasedCredits / totalCredits) * 100 : 0
      };
    });

    // Check compliance for each student
    const nonCompliantStudents = studentCreditAnalysis.filter(analysis => {
      const coreCompliant = analysis.corePercentage >= this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.CORE_PERCENTAGE - 5; // 5% tolerance
      const electiveCompliant = analysis.electivePercentage >= this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.ELECTIVE_PERCENTAGE - 5;
      const skillBasedCompliant = analysis.skillBasedPercentage >= this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.SKILL_BASED_PERCENTAGE - 2; // 2% tolerance

      return !coreCompliant || !electiveCompliant || !skillBasedCompliant;
    });

    // Generate violations for non-compliant students
    nonCompliantStudents.forEach(analysis => {
      if (analysis.corePercentage < this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.CORE_PERCENTAGE - 5) {
        violations.push({
          type: 'CREDIT_DISTRIBUTION',
          severity: 'MAJOR',
          message: `Student ${analysis.studentId} has insufficient core credits: ${analysis.corePercentage.toFixed(1)}% (required: ${this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.CORE_PERCENTAGE}%)`,
          details: {
            studentId: analysis.studentId,
            coreCredits: analysis.coreCredits,
            corePercentage: analysis.corePercentage,
            requiredPercentage: this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.CORE_PERCENTAGE
          },
          affectedEntities: [analysis.studentId],
          suggestedFix: 'Increase core subject enrollment or adjust credit allocation'
        });
      }

      if (analysis.electivePercentage < this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.ELECTIVE_PERCENTAGE - 5) {
        violations.push({
          type: 'CREDIT_DISTRIBUTION',
          severity: 'MAJOR',
          message: `Student ${analysis.studentId} has insufficient elective credits: ${analysis.electivePercentage.toFixed(1)}% (required: ${this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.ELECTIVE_PERCENTAGE}%)`,
          details: {
            studentId: analysis.studentId,
            electiveCredits: analysis.electiveCredits,
            electivePercentage: analysis.electivePercentage,
            requiredPercentage: this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.ELECTIVE_PERCENTAGE
          },
          affectedEntities: [analysis.studentId],
          suggestedFix: 'Increase elective subject enrollment'
        });
      }

      if (analysis.skillBasedPercentage < this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.SKILL_BASED_PERCENTAGE - 2) {
        violations.push({
          type: 'CREDIT_DISTRIBUTION',
          severity: 'MINOR',
          message: `Student ${analysis.studentId} has insufficient skill-based credits: ${analysis.skillBasedPercentage.toFixed(1)}% (required: ${this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.SKILL_BASED_PERCENTAGE}%)`,
          details: {
            studentId: analysis.studentId,
            skillBasedCredits: analysis.skillBasedCredits,
            skillBasedPercentage: analysis.skillBasedPercentage,
            requiredPercentage: this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.SKILL_BASED_PERCENTAGE
          },
          affectedEntities: [analysis.studentId],
          suggestedFix: 'Add skill-based subjects or workshops'
        });
      }
    });

    // Calculate overall distribution
    const totalCoreCredits = studentCreditAnalysis.reduce((sum, analysis) => sum + analysis.coreCredits, 0);
    const totalElectiveCredits = studentCreditAnalysis.reduce((sum, analysis) => sum + analysis.electiveCredits, 0);
    const totalSkillBasedCredits = studentCreditAnalysis.reduce((sum, analysis) => sum + analysis.skillBasedCredits, 0);
    const totalCredits = totalCoreCredits + totalElectiveCredits + totalSkillBasedCredits;

    const distribution: CreditDistribution = {
      core: {
        credits: totalCoreCredits,
        percentage: totalCredits > 0 ? (totalCoreCredits / totalCredits) * 100 : 0,
        required: this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.CORE_PERCENTAGE,
        status: totalCredits > 0 && (totalCoreCredits / totalCredits) * 100 >= this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.CORE_PERCENTAGE - 5 ? 'COMPLIANT' : 'NON_COMPLIANT'
      },
      elective: {
        credits: totalElectiveCredits,
        percentage: totalCredits > 0 ? (totalElectiveCredits / totalCredits) * 100 : 0,
        required: this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.ELECTIVE_PERCENTAGE,
        status: totalCredits > 0 && (totalElectiveCredits / totalCredits) * 100 >= this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.ELECTIVE_PERCENTAGE - 5 ? 'COMPLIANT' : 'NON_COMPLIANT'
      },
      skillBased: {
        credits: totalSkillBasedCredits,
        percentage: totalCredits > 0 ? (totalSkillBasedCredits / totalCredits) * 100 : 0,
        required: this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.SKILL_BASED_PERCENTAGE,
        status: totalCredits > 0 && (totalSkillBasedCredits / totalCredits) * 100 >= this.NEP_CONSTANTS.CREDIT_DISTRIBUTION.SKILL_BASED_PERCENTAGE - 2 ? 'COMPLIANT' : 'NON_COMPLIANT'
      },
      total: {
        credits: totalCredits,
        required: 0, // Will be calculated based on program requirements
        status: 'COMPLIANT' // This would need program-specific validation
      }
    };

    return { distribution, violations, warnings };
  }

  /**
   * Validate contact hours (maximum 6 per day per student)
   */
  private async validateContactHours(
    timetable: GeneratedTimetable,
    students: StudentProfile[]
  ): Promise<NEPViolation[]> {
    const violations: NEPViolation[] = [];

    students.forEach(student => {
      const studentSlots = timetable.schedule.filter(slot => 
        slot.studentIds.includes(student.id)
      );

      // Group by day
      const slotsByDay = this.groupSlotsByDay(studentSlots);

      Object.entries(slotsByDay).forEach(([day, slots]) => {
        const totalHours = this.calculateTotalHours(slots);
        
        if (totalHours > this.NEP_CONSTANTS.CONTACT_HOURS.MAX_PER_DAY) {
          violations.push({
            type: 'CONTACT_HOURS',
            severity: 'CRITICAL',
            message: `Student ${student.id} exceeds maximum contact hours on ${day}: ${totalHours} hours (maximum: ${this.NEP_CONSTANTS.CONTACT_HOURS.MAX_PER_DAY})`,
            details: {
              studentId: student.id,
              day,
              totalHours,
              maxHours: this.NEP_CONSTANTS.CONTACT_HOURS.MAX_PER_DAY,
              slots: slots.map(slot => ({
                timeSlot: slot.timeSlot,
                duration: slot.duration,
                subject: slot.subjectName
              }))
            },
            affectedEntities: [student.id],
            suggestedFix: 'Reduce contact hours or reschedule classes to different days'
          });
        }
      });
    });

    return violations;
  }

  /**
   * Validate attendance capability (minimum 75% tracking capability)
   */
  private async validateAttendanceCapability(
    timetable: GeneratedTimetable,
    students: StudentProfile[]
  ): Promise<{
    capability: AttendanceCapability;
    violations: NEPViolation[];
  }> {
    const violations: NEPViolation[] = [];

    // Check if timetable supports attendance tracking
    const hasAttendanceTracking = timetable.schedule.some(slot => 
      slot.metadata && slot.metadata.attendanceTracking
    );

    const trackingMethod = this.determineTrackingMethod(timetable);
    const currentCapability = this.calculateAttendanceCapability(timetable, students);

    if (currentCapability < this.NEP_CONSTANTS.ATTENDANCE.MINIMUM_PERCENTAGE) {
      violations.push({
        type: 'ATTENDANCE',
        severity: 'MAJOR',
        message: `Attendance tracking capability insufficient: ${currentCapability}% (required: ${this.NEP_CONSTANTS.ATTENDANCE.MINIMUM_PERCENTAGE}%)`,
        details: {
          currentCapability,
          requiredCapability: this.NEP_CONSTANTS.ATTENDANCE.MINIMUM_PERCENTAGE,
          trackingMethod,
          hasAttendanceTracking
        },
        affectedEntities: students.map(s => s.id),
        suggestedFix: 'Implement comprehensive attendance tracking system'
      });
    }

    const capability: AttendanceCapability = {
      canTrack: hasAttendanceTracking,
      trackingMethod,
      minimumRequired: this.NEP_CONSTANTS.ATTENDANCE.MINIMUM_PERCENTAGE,
      currentCapability,
      status: currentCapability >= this.NEP_CONSTANTS.ATTENDANCE.MINIMUM_PERCENTAGE ? 'COMPLIANT' : 'NON_COMPLIANT'
    };

    return { capability, violations };
  }

  /**
   * Validate assessment pattern (40% continuous + 60% final)
   */
  private async validateAssessmentPattern(subjects: SubjectDetails[]): Promise<{
    pattern: AssessmentPattern;
    violations: NEPViolation[];
  }> {
    const violations: NEPViolation[] = [];

    const nonCompliantSubjects = subjects.filter(subject => {
      const continuousPercentage = subject.assessmentPattern.continuousAssessment;
      const finalPercentage = subject.assessmentPattern.finalExam;
      
      return continuousPercentage < this.NEP_CONSTANTS.ASSESSMENT.CONTINUOUS_PERCENTAGE - 5 ||
             finalPercentage < this.NEP_CONSTANTS.ASSESSMENT.FINAL_PERCENTAGE - 5;
    });

    nonCompliantSubjects.forEach(subject => {
      const continuousPercentage = subject.assessmentPattern.continuousAssessment;
      const finalPercentage = subject.assessmentPattern.finalExam;

      if (continuousPercentage < this.NEP_CONSTANTS.ASSESSMENT.CONTINUOUS_PERCENTAGE - 5) {
        violations.push({
          type: 'ASSESSMENT',
          severity: 'MAJOR',
          message: `Subject ${subject.name} has insufficient continuous assessment: ${continuousPercentage}% (required: ${this.NEP_CONSTANTS.ASSESSMENT.CONTINUOUS_PERCENTAGE}%)`,
          details: {
            subjectId: subject.id,
            subjectName: subject.name,
            continuousPercentage,
            requiredPercentage: this.NEP_CONSTANTS.ASSESSMENT.CONTINUOUS_PERCENTAGE
          },
          affectedEntities: [subject.id],
          suggestedFix: 'Increase continuous assessment components'
        });
      }

      if (finalPercentage < this.NEP_CONSTANTS.ASSESSMENT.FINAL_PERCENTAGE - 5) {
        violations.push({
          type: 'ASSESSMENT',
          severity: 'MAJOR',
          message: `Subject ${subject.name} has insufficient final exam weight: ${finalPercentage}% (required: ${this.NEP_CONSTANTS.ASSESSMENT.FINAL_PERCENTAGE}%)`,
          details: {
            subjectId: subject.id,
            subjectName: subject.name,
            finalPercentage,
            requiredPercentage: this.NEP_CONSTANTS.ASSESSMENT.FINAL_PERCENTAGE
          },
          affectedEntities: [subject.id],
          suggestedFix: 'Increase final exam weight'
        });
      }
    });

    const totalContinuous = subjects.reduce((sum, subject) => sum + subject.assessmentPattern.continuousAssessment, 0);
    const totalFinal = subjects.reduce((sum, subject) => sum + subject.assessmentPattern.finalExam, 0);
    const totalSubjects = subjects.length;

    const pattern: AssessmentPattern = {
      continuous: {
        percentage: totalSubjects > 0 ? totalContinuous / totalSubjects : 0,
        required: this.NEP_CONSTANTS.ASSESSMENT.CONTINUOUS_PERCENTAGE,
        status: totalSubjects > 0 && (totalContinuous / totalSubjects) >= this.NEP_CONSTANTS.ASSESSMENT.CONTINUOUS_PERCENTAGE - 5 ? 'COMPLIANT' : 'NON_COMPLIANT'
      },
      final: {
        percentage: totalSubjects > 0 ? totalFinal / totalSubjects : 0,
        required: this.NEP_CONSTANTS.ASSESSMENT.FINAL_PERCENTAGE,
        status: totalSubjects > 0 && (totalFinal / totalSubjects) >= this.NEP_CONSTANTS.ASSESSMENT.FINAL_PERCENTAGE - 5 ? 'COMPLIANT' : 'NON_COMPLIANT'
      },
      total: {
        percentage: totalSubjects > 0 ? (totalContinuous + totalFinal) / totalSubjects : 0,
        status: 'COMPLIANT' // Assuming all subjects have 100% total assessment
      }
    };

    return { pattern, violations };
  }

  /**
   * Validate practical blocks (minimum 2-hour blocks)
   */
  private async validatePracticalBlocks(
    timetable: GeneratedTimetable,
    subjects: SubjectDetails[]
  ): Promise<{
    blocks: PracticalBlock[];
    violations: NEPViolation[];
  }> {
    const violations: NEPViolation[] = [];
    const blocks: PracticalBlock[] = [];

    const practicalSubjects = subjects.filter(subject => 
      subject.type === 'PRACTICAL' || subject.type === 'LABORATORY'
    );

    practicalSubjects.forEach(subject => {
      const subjectSlots = timetable.schedule.filter(slot => 
        slot.subjectId === subject.id
      );

      // Group consecutive slots for the same subject
      const consecutiveBlocks = this.groupConsecutiveSlots(subjectSlots);

      consecutiveBlocks.forEach(block => {
        const totalDuration = block.reduce((sum, slot) => sum + slot.duration, 0);
        
        const practicalBlock: PracticalBlock = {
          subjectId: subject.id,
          subjectName: subject.name,
          duration: totalDuration,
          status: totalDuration >= this.NEP_CONSTANTS.PRACTICAL.MIN_BLOCK_DURATION ? 'COMPLIANT' : 'NON_COMPLIANT',
          required: this.NEP_CONSTANTS.PRACTICAL.MIN_BLOCK_DURATION
        };

        blocks.push(practicalBlock);

        if (totalDuration < this.NEP_CONSTANTS.PRACTICAL.MIN_BLOCK_DURATION) {
          violations.push({
            type: 'PRACTICAL_BLOCKS',
            severity: 'MAJOR',
            message: `Practical subject ${subject.name} has insufficient block duration: ${totalDuration} hours (required: ${this.NEP_CONSTANTS.PRACTICAL.MIN_BLOCK_DURATION} hours)`,
            details: {
              subjectId: subject.id,
              subjectName: subject.name,
              duration: totalDuration,
              requiredDuration: this.NEP_CONSTANTS.PRACTICAL.MIN_BLOCK_DURATION,
              slots: block.map(slot => ({
                timeSlot: slot.timeSlot,
                duration: slot.duration
              }))
            },
            affectedEntities: [subject.id],
            suggestedFix: 'Combine practical sessions into minimum 2-hour blocks'
          });
        }
      });
    });

    return { blocks, violations };
  }

  /**
   * Validate CBC (Choice-Based Credit System) compliance
   */
  private async validateCBCCompliance(
    students: StudentProfile[],
    subjects: SubjectDetails[]
  ): Promise<{
    compliance: CBCCompliance;
    violations: NEPViolation[];
  }> {
    const violations: NEPViolation[] = [];

    // Check if students have choice in subject selection
    const hasChoice = students.some(student => 
      student.enrolledSubjects.length > 0 && 
      student.enrolledSubjects.length < subjects.length
    );

    // Check if credit transfer is possible
    const hasCreditTransfer = subjects.some(subject => 
      subject.creditTransferable === true
    );

    // Check if multiple entry/exit is supported
    const hasMultipleEntryExit = students.some(student => 
      student.entryLevel !== undefined && student.exitLevel !== undefined
    );

    // Check if flexible pathways exist
    const hasFlexiblePathways = subjects.some(subject => 
      subject.prerequisites.length === 0 || 
      subject.prerequisites.some(prereq => prereq.type === 'FLEXIBLE')
    );

    if (!hasChoice) {
      violations.push({
        type: 'CBC_COMPLIANCE',
        severity: 'MAJOR',
        message: 'Students lack choice in subject selection',
        details: { hasChoice },
        affectedEntities: students.map(s => s.id),
        suggestedFix: 'Implement choice-based subject selection system'
      });
    }

    if (!hasCreditTransfer) {
      violations.push({
        type: 'CBC_COMPLIANCE',
        severity: 'MINOR',
        message: 'Credit transfer system not implemented',
        details: { hasCreditTransfer },
        affectedEntities: subjects.map(s => s.id),
        suggestedFix: 'Enable credit transfer for eligible subjects'
      });
    }

    const compliance: CBCCompliance = {
      choiceBased: hasChoice,
      creditTransfer: hasCreditTransfer,
      multipleEntryExit: hasMultipleEntryExit,
      flexiblePathways: hasFlexiblePathways,
      status: hasChoice && hasCreditTransfer ? 'COMPLIANT' : 'NON_COMPLIANT'
    };

    return { compliance, violations };
  }

  /**
   * Calculate compliance score (0-100)
   */
  private calculateComplianceScore(violations: NEPViolation[], warnings: NEPWarning[]): number {
    let score = 100;

    // Deduct points for violations
    violations.forEach(violation => {
      switch (violation.severity) {
        case 'CRITICAL':
          score -= 20;
          break;
        case 'MAJOR':
          score -= 10;
          break;
        case 'MINOR':
          score -= 5;
          break;
      }
    });

    // Deduct points for warnings
    score -= warnings.length * 2;

    return Math.max(0, score);
  }

  /**
   * Generate recommendations based on violations and warnings
   */
  private generateRecommendations(violations: NEPViolation[], warnings: NEPWarning[]): string[] {
    const recommendations: string[] = [];

    const violationTypes = new Set(violations.map(v => v.type));
    const warningTypes = new Set(warnings.map(w => w.type));

    if (violationTypes.has('CREDIT_DISTRIBUTION')) {
      recommendations.push('Review and adjust credit distribution to meet 60-30-10 rule');
    }

    if (violationTypes.has('CONTACT_HOURS')) {
      recommendations.push('Implement contact hour limits and monitoring system');
    }

    if (violationTypes.has('ATTENDANCE')) {
      recommendations.push('Enhance attendance tracking capabilities');
    }

    if (violationTypes.has('ASSESSMENT')) {
      recommendations.push('Standardize assessment patterns across all subjects');
    }

    if (violationTypes.has('PRACTICAL_BLOCKS')) {
      recommendations.push('Reorganize practical sessions into minimum 2-hour blocks');
    }

    if (violationTypes.has('CBC_COMPLIANCE')) {
      recommendations.push('Implement comprehensive choice-based credit system');
    }

    return recommendations;
  }

  // Helper methods
  private groupSlotsByDay(slots: ScheduleSlot[]): Record<string, ScheduleSlot[]> {
    return slots.reduce((groups, slot) => {
      const day = slot.day;
      if (!groups[day]) {
        groups[day] = [];
      }
      groups[day].push(slot);
      return groups;
    }, {} as Record<string, ScheduleSlot[]>);
  }

  private calculateTotalHours(slots: ScheduleSlot[]): number {
    return slots.reduce((total, slot) => total + slot.duration, 0);
  }

  private determineTrackingMethod(timetable: GeneratedTimetable): 'AUTOMATIC' | 'MANUAL' | 'HYBRID' {
    const hasAutomatic = timetable.schedule.some(slot => 
      slot.metadata && slot.metadata.attendanceTracking === 'AUTOMATIC'
    );
    const hasManual = timetable.schedule.some(slot => 
      slot.metadata && slot.metadata.attendanceTracking === 'MANUAL'
    );

    if (hasAutomatic && hasManual) return 'HYBRID';
    if (hasAutomatic) return 'AUTOMATIC';
    if (hasManual) return 'MANUAL';
    return 'MANUAL';
  }

  private calculateAttendanceCapability(timetable: GeneratedTimetable, students: StudentProfile[]): number {
    const totalSlots = timetable.schedule.length;
    const trackableSlots = timetable.schedule.filter(slot => 
      slot.metadata && slot.metadata.attendanceTracking
    ).length;

    return totalSlots > 0 ? (trackableSlots / totalSlots) * 100 : 0;
  }

  private groupConsecutiveSlots(slots: ScheduleSlot[]): ScheduleSlot[][] {
    if (slots.length === 0) return [];

    const sortedSlots = slots.sort((a, b) => {
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayA = dayOrder.indexOf(a.day);
      const dayB = dayOrder.indexOf(b.day);
      
      if (dayA !== dayB) return dayA - dayB;
      
      // Sort by time slot
      return a.timeSlot.localeCompare(b.timeSlot);
    });

    const groups: ScheduleSlot[][] = [];
    let currentGroup: ScheduleSlot[] = [sortedSlots[0]];

    for (let i = 1; i < sortedSlots.length; i++) {
      const currentSlot = sortedSlots[i];
      const previousSlot = sortedSlots[i - 1];

      // Check if slots are consecutive (same day and adjacent time slots)
      if (currentSlot.day === previousSlot.day && 
          this.areConsecutiveTimeSlots(previousSlot.timeSlot, currentSlot.timeSlot)) {
        currentGroup.push(currentSlot);
      } else {
        groups.push(currentGroup);
        currentGroup = [currentSlot];
      }
    }

    groups.push(currentGroup);
    return groups;
  }

  private areConsecutiveTimeSlots(timeSlot1: string, timeSlot2: string): boolean {
    // This would need to be implemented based on your time slot format
    // For now, return true if they're on the same day
    return true;
  }
}

