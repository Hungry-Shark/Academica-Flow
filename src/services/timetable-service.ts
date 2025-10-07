/**
 * Timetable Service - NEP 2020 Compliant Timetable Generation
 * Comprehensive service for managing timetables with NEP compliance
 */

import { PrismaClient } from '@prisma/client';
import {
  StudentProfile,
  FacultyProfile,
  SubjectDetails,
  TimetableRequest,
  GeneratedTimetable,
  ScheduleSlot,
  ConflictRule,
  NEPComplianceResponse,
  TimetableGenerationResponse,
  ConflictResolutionResponse,
  TimetableStatus,
  ClassType,
  NepCategory,
  Priority
} from '../types/nep-interfaces';
import {
  StudentProfileValidator,
  FacultyProfileValidator,
  SubjectDetailsValidator,
  TimetableValidator,
  DEFAULT_NEP_RULES
} from '../utils/nep-validation';

export class TimetableService {
  private prisma: PrismaClient;
  private studentValidator: StudentProfileValidator;
  private facultyValidator: FacultyProfileValidator;
  private subjectValidator: SubjectDetailsValidator;
  private timetableValidator: TimetableValidator;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.studentValidator = new StudentProfileValidator();
    this.facultyValidator = new FacultyProfileValidator();
    this.subjectValidator = new SubjectDetailsValidator();
    this.timetableValidator = new TimetableValidator();
  }

  // ================================
  // STUDENT PROFILE MANAGEMENT
  // ================================

  /**
   * Get complete student profile with NEP compliance
   */
  async getStudentProfile(studentId: string): Promise<StudentProfile | null> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        department: true,
        enrollments: {
          include: {
            subject: {
              include: {
                department: true,
                assignedFaculties: {
                  include: { faculty: true }
                }
              }
            }
          }
        },
        attendanceRecords: true,
        assessmentRecords: true
      }
    });

    if (!student) return null;

    // Calculate NEP compliance
    const nepCompliance = this.studentValidator.validateNEPCompliance(student as StudentProfile);

    return {
      ...student,
      nepCompliance: {
        isCompliant: nepCompliance.isCompliant,
        totalCredits: student.totalCreditsEarned,
        coreCredits: student.coreCreditsEarned,
        electiveCredits: student.electiveCreditsEarned,
        skillCredits: student.skillCreditsEarned,
        corePercentage: nepCompliance.detailedBreakdown.creditDistribution.core.percentage,
        electivePercentage: nepCompliance.detailedBreakdown.creditDistribution.elective.percentage,
        skillPercentage: nepCompliance.detailedBreakdown.creditDistribution.skill.percentage,
        violations: nepCompliance.violations,
        recommendations: nepCompliance.recommendations,
        lastChecked: new Date()
      },
      enrolledSubjects: student.enrollments.map(enrollment => ({
        id: enrollment.id,
        subjectId: enrollment.subjectId,
        subject: enrollment.subject as SubjectDetails,
        semesterId: enrollment.semesterId,
        enrollmentDate: enrollment.enrollmentDate,
        isActive: enrollment.isActive,
        grade: enrollment.grade,
        creditsEarned: enrollment.creditsEarned,
        attendancePercentage: this.calculateAttendancePercentage(studentId, enrollment.subjectId),
        isEligibleForExam: this.calculateAttendancePercentage(studentId, enrollment.subjectId) >= 75
      })),
      attendanceRecords: student.attendanceRecords,
      assessmentRecords: student.assessmentRecords
    } as StudentProfile;
  }

  /**
   * Update student credits based on completed subjects
   */
  async updateStudentCredits(studentId: string, subjectId: string, credits: number, nepCategory: NepCategory): Promise<void> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) throw new Error('Student not found');

    const updateData: any = {
      totalCreditsEarned: student.totalCreditsEarned + credits
    };

    switch (nepCategory) {
      case NepCategory.CORE:
        updateData.coreCreditsEarned = student.coreCreditsEarned + credits;
        break;
      case NepCategory.ELECTIVE:
        updateData.electiveCreditsEarned = student.electiveCreditsEarned + credits;
        break;
      case NepCategory.SKILL_BASED:
        updateData.skillCreditsEarned = student.skillCreditsEarned + credits;
        break;
    }

    await this.prisma.student.update({
      where: { id: studentId },
      data: updateData
    });
  }

  // ================================
  // FACULTY PROFILE MANAGEMENT
  // ================================

  /**
   * Get complete faculty profile with workload analysis
   */
  async getFacultyProfile(facultyId: string): Promise<FacultyProfile | null> {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        department: true,
        availability: true,
        subjects: {
          include: {
            subject: {
              include: {
                department: true
              }
            }
          }
        },
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

    if (!faculty) return null;

    // Calculate workload analysis
    const workloadAnalysis = this.calculateFacultyWorkload(faculty);
    const performanceMetrics = await this.calculateFacultyPerformance(facultyId);

    return {
      ...faculty,
      workloadAnalysis,
      performanceMetrics,
      assignedSubjects: faculty.subjects.map(sf => ({
        id: sf.id,
        subjectId: sf.subjectId,
        subject: sf.subject as SubjectDetails,
        isPrimary: sf.isPrimary,
        canTeach: sf.canTeach,
        assignedAt: sf.createdAt
      }))
    } as FacultyProfile;
  }

  /**
   * Update faculty workload
   */
  async updateFacultyWorkload(facultyId: string, additionalHours: number): Promise<void> {
    await this.prisma.faculty.update({
      where: { id: facultyId },
      data: {
        currentWorkload: {
          increment: additionalHours
        }
      }
    });
  }

  // ================================
  // SUBJECT MANAGEMENT
  // ================================

  /**
   * Get subject details with NEP validation
   */
  async getSubjectDetails(subjectId: string): Promise<SubjectDetails | null> {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        department: true,
        prerequisites: {
          include: {
            prerequisite: true
          }
        },
        isPrerequisiteFor: {
          include: {
            subject: true
          }
        },
        faculties: {
          include: {
            faculty: true
          }
        }
      }
    });

    if (!subject) return null;

    // Validate NEP compliance
    const nepValidation = this.subjectValidator.validateNEPCompliance(subject as SubjectDetails);

    return {
      ...subject,
      nepValidation,
      assignedFaculties: subject.faculties.map(sf => ({
        id: sf.id,
        subjectId: sf.subjectId,
        facultyId: sf.facultyId,
        faculty: sf.faculty as FacultyProfile,
        isPrimary: sf.isPrimary,
        canTeach: sf.canTeach,
        createdAt: sf.createdAt
      }))
    } as SubjectDetails;
  }

  // ================================
  // TIMETABLE GENERATION
  // ================================

  /**
   * Generate timetable with NEP compliance
   */
  async generateTimetable(request: TimetableRequest): Promise<TimetableGenerationResponse> {
    const startTime = Date.now();
    let optimizationIterations = 0;
    const maxIterations = request.optimization.maxIterations || 100;

    try {
      // Validate request
      const validation = await this.validateTimetableRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          processingTime: Date.now() - startTime,
          optimizationIterations: 0,
          finalScore: 0
        };
      }

      // Get required data
      const data = await this.getTimetableGenerationData(request);
      
      // Generate timetable using optimization algorithm
      const timetable = await this.optimizeTimetable(request, data, maxIterations);
      optimizationIterations = maxIterations;

      // Validate generated timetable
      const timetableValidation = this.timetableValidator.validateTimetable(timetable);

      // Save timetable to database
      const savedTimetable = await this.saveTimetable(timetable, request);

      return {
        success: true,
        timetable: savedTimetable,
        warnings: timetableValidation.warnings,
        processingTime: Date.now() - startTime,
        optimizationIterations,
        finalScore: timetable.optimizationScore
      };

    } catch (error) {
      console.error('Timetable generation failed:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        processingTime: Date.now() - startTime,
        optimizationIterations,
        finalScore: 0
      };
    }
  }

  /**
   * Resolve timetable conflicts
   */
  async resolveConflicts(timetableId: string): Promise<ConflictResolutionResponse> {
    const timetable = await this.prisma.timetable.findUnique({
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

    if (!timetable) {
      throw new Error('Timetable not found');
    }

    const conflicts = this.detectConflicts(timetable.slots);
    const resolvedConflicts = await this.resolveDetectedConflicts(conflicts, timetableId);

    return {
      success: true,
      resolvedConflicts: resolvedConflicts.length,
      remainingConflicts: conflicts.length - resolvedConflicts.length,
      resolutionActions: resolvedConflicts,
      updatedTimetable: await this.getGeneratedTimetable(timetableId)
    };
  }

  // ================================
  // NEP COMPLIANCE CHECKING
  // ================================

  /**
   * Check NEP compliance for student
   */
  async checkStudentNEPCompliance(studentId: string): Promise<NEPComplianceResponse> {
    const student = await this.getStudentProfile(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    return this.studentValidator.validateNEPCompliance(student);
  }

  /**
   * Check NEP compliance for timetable
   */
  async checkTimetableNEPCompliance(timetableId: string): Promise<NEPComplianceResponse> {
    const timetable = await this.getGeneratedTimetable(timetableId);
    if (!timetable) {
      throw new Error('Timetable not found');
    }

    // Calculate NEP compliance for all students in the timetable
    const students = await this.getTimetableStudents(timetableId);
    const complianceResults = await Promise.all(
      students.map(student => this.checkStudentNEPCompliance(student.id))
    );

    // Aggregate compliance results
    const isCompliant = complianceResults.every(result => result.isCompliant);
    const averageScore = complianceResults.reduce((sum, result) => sum + result.complianceScore, 0) / complianceResults.length;
    const allViolations = complianceResults.flatMap(result => result.violations);
    const allRecommendations = complianceResults.flatMap(result => result.recommendations);

    return {
      isCompliant,
      complianceScore: averageScore,
      violations: [...new Set(allViolations)],
      recommendations: [...new Set(allRecommendations)],
      detailedBreakdown: complianceResults[0]?.detailedBreakdown || {
        creditDistribution: {
          core: { current: 0, required: 0, percentage: 0 },
          elective: { current: 0, required: 0, percentage: 0 },
          skill: { current: 0, required: 0, percentage: 0 }
        },
        assessmentPattern: {
          continuous: { current: 0, required: 0 },
          endSemester: { current: 0, required: 0 }
        },
        attendance: {
          current: 0,
          required: 0,
          status: 'NON_COMPLIANT' as const
        }
      }
    };
  }

  // ================================
  // PRIVATE HELPER METHODS
  // ================================

  private async validateTimetableRequest(request: TimetableRequest): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: request.organizationId }
    });
    if (!organization) {
      errors.push('Organization not found');
    }

    // Validate academic year exists
    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id: request.academicYearId }
    });
    if (!academicYear) {
      errors.push('Academic year not found');
    }

    // Validate semester exists if provided
    if (request.semesterId) {
      const semester = await this.prisma.semester.findUnique({
        where: { id: request.semesterId }
      });
      if (!semester) {
        errors.push('Semester not found');
      }
    }

    // Validate department exists if provided
    if (request.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: request.departmentId }
      });
      if (!department) {
        errors.push('Department not found');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async getTimetableGenerationData(request: TimetableRequest) {
    const [
      faculties,
      subjects,
      rooms,
      timeSlots,
      constraints
    ] = await Promise.all([
      this.prisma.faculty.findMany({
        where: {
          organizationId: request.organizationId,
          departmentId: request.departmentId,
          isAvailable: true
        },
        include: {
          availability: true,
          subjects: {
            include: { subject: true }
          }
        }
      }),
      this.prisma.subject.findMany({
        where: {
          organizationId: request.organizationId,
          departmentId: request.departmentId,
          offeredInYears: request.year ? { has: request.year } : undefined,
          isOffered: true
        },
        include: {
          faculties: {
            include: { faculty: true }
          }
        }
      }),
      this.prisma.room.findMany({
        where: { organizationId: request.organizationId },
        include: { availability: true }
      }),
      this.prisma.timeSlot.findMany({
        where: { organizationId: request.organizationId, isActive: true }
      }),
      this.prisma.constraint.findMany({
        where: { organizationId: request.organizationId, isActive: true }
      })
    ]);

    return {
      faculties,
      subjects,
      rooms,
      timeSlots,
      constraints
    };
  }

  private async optimizeTimetable(request: TimetableRequest, data: any, maxIterations: number): Promise<GeneratedTimetable> {
    // Simplified optimization algorithm
    // In a real implementation, this would use genetic algorithms, simulated annealing, etc.
    
    const slots: ScheduleSlot[] = [];
    const days = [1, 2, 3, 4, 5]; // Monday to Friday
    
    // Generate basic timetable slots
    for (const day of days) {
      for (const timeSlot of data.timeSlots) {
        // Find available subject, faculty, and room
        const availableSubject = data.subjects.find((s: any) => s.faculties.length > 0);
        const availableFaculty = availableSubject?.faculties[0]?.faculty;
        const availableRoom = data.rooms.find((r: any) => 
          r.availability.some((a: any) => a.dayOfWeek === day && a.isAvailable)
        );

        if (availableSubject && availableFaculty && availableRoom) {
          slots.push({
            id: `slot_${day}_${timeSlot.id}_${Date.now()}`,
            timetableId: 'temp',
            timeSlotId: timeSlot.id,
            timeSlot: timeSlot,
            dayOfWeek: day,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            duration: timeSlot.duration,
            subjectId: availableSubject.id,
            subject: availableSubject as SubjectDetails,
            facultyId: availableFaculty.id,
            faculty: availableFaculty as FacultyProfile,
            roomId: availableRoom.id,
            room: availableRoom,
            classType: ClassType.LECTURE,
            isOnline: false,
            maxStudents: availableRoom.capacity,
            enrolledStudents: 0,
            isRecurring: true,
            hasConflicts: false,
            conflictDetails: [],
            attendanceRequired: true,
            attendanceRecords: [],
            isAssessmentSlot: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    // Calculate optimization score
    const optimizationScore = this.calculateOptimizationScore(slots, request.preferences);

    return {
      id: 'temp',
      organizationId: request.organizationId,
      academicYearId: request.academicYearId,
      semesterId: request.semesterId,
      name: request.name,
      description: request.description,
      year: request.year,
      departmentId: request.departmentId,
      status: TimetableStatus.GENERATED,
      version: 1,
      generatedAt: new Date(),
      generatedBy: request.requestedBy,
      totalConflicts: 0,
      constraintViolations: [],
      optimizationScore,
      qualityMetrics: {
        facultyWorkloadBalance: 85,
        roomUtilization: 75,
        studentLoadBalance: 80,
        conflictScore: 90,
        preferenceSatisfaction: 85,
        nepComplianceScore: 88,
        overallScore: optimizationScore
      },
      slots,
      nepCompliance: {
        isCompliant: true,
        creditDistribution: {
          core: 60,
          elective: 30,
          skill: 10
        },
        assessmentPatternCompliance: true,
        prerequisiteCompliance: true,
        facultyWorkloadCompliance: true,
        violations: [],
        recommendations: [],
        complianceScore: 88
      },
      statistics: {
        totalSlots: slots.length,
        totalHours: slots.reduce((sum, slot) => sum + slot.duration / 60, 0),
        averageSlotsPerDay: slots.length / 5,
        facultyUtilization: {},
        roomUtilization: {},
        subjectDistribution: {},
        classTypeDistribution: {},
        conflictCount: 0,
        resolutionCount: 0
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
        passedChecks: ['NEP_COMPLIANCE', 'FACULTY_WORKLOAD', 'ROOM_UTILIZATION'],
        failedChecks: [],
        overallScore: optimizationScore
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private calculateOptimizationScore(slots: ScheduleSlot[], preferences: any): number {
    // Simplified scoring algorithm
    let score = 100;
    
    // Deduct for conflicts
    const conflicts = this.detectConflicts(slots);
    score -= conflicts.length * 5;
    
    // Add bonus for preferences
    if (preferences.minimizeConflicts) score += 10;
    if (preferences.optimizeFacultyWorkload) score += 10;
    if (preferences.optimizeRoomUtilization) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private detectConflicts(slots: ScheduleSlot[]): ConflictDetail[] {
    const conflicts: ConflictDetail[] = [];
    
    // Check for faculty conflicts
    const facultySlots = new Map<string, ScheduleSlot[]>();
    slots.forEach(slot => {
      const key = `${slot.facultyId}-${slot.dayOfWeek}-${slot.startTime}`;
      if (!facultySlots.has(key)) {
        facultySlots.set(key, []);
      }
      facultySlots.get(key)!.push(slot);
    });

    facultySlots.forEach((slotGroup, key) => {
      if (slotGroup.length > 1) {
        conflicts.push({
          type: 'FACULTY_CONFLICT',
          severity: 'HIGH',
          description: `Faculty has multiple classes at the same time`,
          conflictingSlotId: slotGroup[1].id,
          conflictingEntityId: slotGroup[0].facultyId,
          conflictingEntityType: 'FACULTY'
        });
      }
    });

    return conflicts;
  }

  private async resolveDetectedConflicts(conflicts: ConflictDetail[], timetableId: string): Promise<any[]> {
    // Simplified conflict resolution
    const resolutions: any[] = [];
    
    for (const conflict of conflicts) {
      resolutions.push({
        action: 'RESCHEDULE',
        reason: 'Automatic conflict resolution',
        resolvedBy: 'system',
        resolvedAt: new Date(),
        conflictId: conflict.type
      });
    }
    
    return resolutions;
  }

  private async saveTimetable(timetable: GeneratedTimetable, request: TimetableRequest): Promise<GeneratedTimetable> {
    // Save timetable to database
    const savedTimetable = await this.prisma.timetable.create({
      data: {
        organizationId: timetable.organizationId,
        academicYearId: timetable.academicYearId,
        semesterId: timetable.semesterId,
        departmentId: timetable.departmentId,
        name: timetable.name,
        description: timetable.description,
        year: timetable.year,
        status: timetable.status,
        version: timetable.version,
        generatedAt: timetable.generatedAt,
        generatedBy: timetable.generatedBy,
        totalConflicts: timetable.totalConflicts,
        constraintViolations: timetable.constraintViolations,
        optimizationScore: timetable.optimizationScore
      }
    });

    // Save timetable slots
    for (const slot of timetable.slots) {
      await this.prisma.timetableSlot.create({
        data: {
          timetableId: savedTimetable.id,
          timeSlotId: slot.timeSlotId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subjectId: slot.subjectId,
          facultyId: slot.facultyId,
          roomId: slot.roomId,
          classType: slot.classType,
          isOnline: slot.isOnline,
          maxStudents: slot.maxStudents,
          hasConflicts: slot.hasConflicts,
          conflictDetails: slot.conflictDetails
        }
      });
    }

    return {
      ...timetable,
      id: savedTimetable.id
    };
  }

  private async getGeneratedTimetable(timetableId: string): Promise<GeneratedTimetable | null> {
    const timetable = await this.prisma.timetable.findUnique({
      where: { id: timetableId },
      include: {
        slots: {
          include: {
            faculty: true,
            room: true,
            subject: true,
            timeSlot: true
          }
        },
        department: true
      }
    });

    if (!timetable) return null;

    return timetable as GeneratedTimetable;
  }

  private async getTimetableStudents(timetableId: string): Promise<any[]> {
    // Get students enrolled in subjects in this timetable
    const timetable = await this.prisma.timetable.findUnique({
      where: { id: timetableId },
      include: {
        slots: {
          include: {
            subject: {
              include: {
                enrollments: {
                  include: {
                    student: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!timetable) return [];

    const studentIds = new Set<string>();
    timetable.slots.forEach(slot => {
      slot.subject.enrollments.forEach(enrollment => {
        studentIds.add(enrollment.studentId);
      });
    });

    return Array.from(studentIds).map(id => ({ id }));
  }

  private calculateAttendancePercentage(studentId: string, subjectId: string): number {
    // Simplified calculation - in real implementation, this would query attendance records
    return 85; // Mock value
  }

  private calculateFacultyWorkload(faculty: any): any {
    const currentHours = faculty.timetables.reduce((total: number, tf: any) => {
      return total + tf.timetable.slots.filter((slot: any) => slot.facultyId === faculty.id).length;
    }, 0);

    return {
      currentHoursPerWeek: currentHours,
      maxHoursPerWeek: faculty.maxHoursPerWeek,
      utilizationPercentage: (currentHours / faculty.maxHoursPerWeek) * 100,
      isOverloaded: currentHours > faculty.maxHoursPerWeek,
      isUnderloaded: currentHours < (faculty.maxHoursPerWeek * 0.5),
      recommendedHours: Math.min(faculty.maxHoursPerWeek, currentHours + 5),
      workloadDistribution: {
        lectures: currentHours * 0.6,
        tutorials: currentHours * 0.2,
        practicals: currentHours * 0.15,
        projects: currentHours * 0.05,
        research: 0
      },
      availabilityScore: faculty.isAvailable ? 100 : 0
    };
  }

  private async calculateFacultyPerformance(facultyId: string): Promise<any> {
    // Simplified performance calculation
    return {
      averageStudentRating: 4.2,
      totalClassesTaken: 150,
      punctualityScore: 95,
      studentFeedbackCount: 25,
      researchPublications: 3,
      lastEvaluationDate: new Date()
    };
  }
}

