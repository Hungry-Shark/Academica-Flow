/**
 * Conflict Detector for Timetable Generation
 * Detects various types of conflicts in timetable schedules
 */

import { GeneratedTimetable, ScheduleSlot, FacultyProfile, StudentProfile, SubjectDetails } from '../types/nep-interfaces';

export interface ConflictDetectionResult {
  hasConflicts: boolean;
  conflicts: Conflict[];
  summary: ConflictSummary;
  recommendations: string[];
}

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  message: string;
  description: string;
  affectedEntities: AffectedEntity[];
  timeSlot: string;
  day: string;
  details: Record<string, any>;
  suggestedResolution: string;
  priority: number; // 1-10, higher is more critical
}

export interface AffectedEntity {
  type: 'FACULTY' | 'STUDENT' | 'ROOM' | 'SUBJECT';
  id: string;
  name: string;
  role: string;
}

export interface ConflictSummary {
  totalConflicts: number;
  criticalConflicts: number;
  majorConflicts: number;
  minorConflicts: number;
  conflictsByType: Record<ConflictType, number>;
  conflictsByDay: Record<string, number>;
  conflictsByTimeSlot: Record<string, number>;
}

export type ConflictType = 
  | 'FACULTY_DOUBLE_BOOKING'
  | 'ROOM_CAPACITY_EXCEEDED'
  | 'STUDENT_SUBJECT_CONFLICT'
  | 'TIME_SLOT_OVERLAP'
  | 'PREREQUISITES_NOT_MET'
  | 'CREDIT_OVERLOAD'
  | 'ROOM_DOUBLE_BOOKING'
  | 'FACULTY_OVERLOAD'
  | 'STUDENT_OVERLOAD'
  | 'RESOURCE_UNAVAILABLE';

export class ConflictDetector {
  private readonly MAX_FACULTY_HOURS_PER_WEEK = 40;
  private readonly MAX_STUDENT_HOURS_PER_DAY = 6;
  private readonly MAX_STUDENT_CREDITS_PER_SEMESTER = 30;

  /**
   * Detect all conflicts in a timetable
   */
  async detectConflicts(
    timetable: GeneratedTimetable,
    faculty: FacultyProfile[],
    students: StudentProfile[],
    subjects: SubjectDetails[]
  ): Promise<ConflictDetectionResult> {
    console.log('Starting conflict detection...');

    const conflicts: Conflict[] = [];

    // 1. Faculty double-booking detection
    const facultyConflicts = await this.detectFacultyDoubleBooking(timetable, faculty);
    conflicts.push(...facultyConflicts);

    // 2. Room capacity vs enrollment conflicts
    const roomConflicts = await this.detectRoomCapacityConflicts(timetable, students);
    conflicts.push(...roomConflicts);

    // 3. Student subject choice conflicts
    const studentConflicts = await this.detectStudentSubjectConflicts(timetable, students, subjects);
    conflicts.push(...studentConflicts);

    // 4. Time slot overlaps
    const timeSlotConflicts = await this.detectTimeSlotOverlaps(timetable);
    conflicts.push(...timeSlotConflicts);

    // 5. Prerequisites not met
    const prerequisiteConflicts = await this.detectPrerequisiteConflicts(timetable, students, subjects);
    conflicts.push(...prerequisiteConflicts);

    // 6. Credit overload detection
    const creditConflicts = await this.detectCreditOverload(timetable, students, subjects);
    conflicts.push(...creditConflicts);

    // 7. Room double-booking
    const roomDoubleBookingConflicts = await this.detectRoomDoubleBooking(timetable);
    conflicts.push(...roomDoubleBookingConflicts);

    // 8. Faculty overload
    const facultyOverloadConflicts = await this.detectFacultyOverload(timetable, faculty);
    conflicts.push(...facultyOverloadConflicts);

    // 9. Student overload
    const studentOverloadConflicts = await this.detectStudentOverload(timetable, students);
    conflicts.push(...studentOverloadConflicts);

    // 10. Resource unavailable
    const resourceConflicts = await this.detectResourceUnavailable(timetable, faculty, students);
    conflicts.push(...resourceConflicts);

    // Generate summary and recommendations
    const summary = this.generateConflictSummary(conflicts);
    const recommendations = this.generateRecommendations(conflicts);

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      summary,
      recommendations
    };
  }

  /**
   * Detect faculty double-booking conflicts
   */
  private async detectFacultyDoubleBooking(
    timetable: GeneratedTimetable,
    faculty: FacultyProfile[]
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];
    const facultySlots = new Map<string, ScheduleSlot[]>();

    // Group slots by faculty
    timetable.schedule.forEach(slot => {
      if (slot.facultyId) {
        if (!facultySlots.has(slot.facultyId)) {
          facultySlots.set(slot.facultyId, []);
        }
        facultySlots.get(slot.facultyId)!.push(slot);
      }
    });

    // Check for double-booking
    facultySlots.forEach((slots, facultyId) => {
      const faculty = faculty.find(f => f.id === facultyId);
      if (!faculty) return;

      // Group by day and time slot
      const slotsByDayAndTime = new Map<string, ScheduleSlot[]>();
      
      slots.forEach(slot => {
        const key = `${slot.day}-${slot.timeSlot}`;
        if (!slotsByDayAndTime.has(key)) {
          slotsByDayAndTime.set(key, []);
        }
        slotsByDayAndTime.get(key)!.push(slot);
      });

      // Check for conflicts
      slotsByDayAndTime.forEach((conflictingSlots, key) => {
        if (conflictingSlots.length > 1) {
          const [day, timeSlot] = key.split('-');
          
          conflicts.push({
            id: `faculty-double-booking-${facultyId}-${key}`,
            type: 'FACULTY_DOUBLE_BOOKING',
            severity: 'CRITICAL',
            message: `Faculty ${faculty.firstName} ${faculty.lastName} is double-booked`,
            description: `Faculty is scheduled for multiple classes at the same time on ${day}`,
            affectedEntities: [
              {
                type: 'FACULTY',
                id: facultyId,
                name: `${faculty.firstName} ${faculty.lastName}`,
                role: 'Instructor'
              }
            ],
            timeSlot,
            day,
            details: {
              facultyId,
              conflictingSlots: conflictingSlots.map(slot => ({
                subjectId: slot.subjectId,
                subjectName: slot.subjectName,
                roomId: slot.roomId,
                studentCount: slot.studentIds.length
              }))
            },
            suggestedResolution: 'Reschedule one of the conflicting classes to a different time slot',
            priority: 10
          });
        }
      });
    });

    return conflicts;
  }

  /**
   * Detect room capacity vs enrollment conflicts
   */
  private async detectRoomCapacityConflicts(
    timetable: GeneratedTimetable,
    students: StudentProfile[]
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];
    const roomSlots = new Map<string, ScheduleSlot[]>();

    // Group slots by room
    timetable.schedule.forEach(slot => {
      if (slot.roomId) {
        if (!roomSlots.has(slot.roomId)) {
          roomSlots.set(slot.roomId, []);
        }
        roomSlots.get(slot.roomId)!.push(slot);
      }
    });

    // Check capacity for each room
    roomSlots.forEach((slots, roomId) => {
      slots.forEach(slot => {
        const enrollment = slot.studentIds.length;
        const capacity = slot.roomCapacity || 0;

        if (capacity > 0 && enrollment > capacity) {
          conflicts.push({
            id: `room-capacity-${roomId}-${slot.day}-${slot.timeSlot}`,
            type: 'ROOM_CAPACITY_EXCEEDED',
            severity: 'MAJOR',
            message: `Room capacity exceeded for ${slot.subjectName}`,
            description: `Enrollment (${enrollment}) exceeds room capacity (${capacity})`,
            affectedEntities: [
              {
                type: 'ROOM',
                id: roomId,
                name: slot.roomName || `Room ${roomId}`,
                role: 'Classroom'
              }
            ],
            timeSlot: slot.timeSlot,
            day: slot.day,
            details: {
              roomId,
              subjectId: slot.subjectId,
              subjectName: slot.subjectName,
              enrollment,
              capacity,
              excessStudents: enrollment - capacity
            },
            suggestedResolution: 'Move to a larger room or reduce enrollment',
            priority: 8
          });
        }
      });
    });

    return conflicts;
  }

  /**
   * Detect student subject choice conflicts
   */
  private async detectStudentSubjectConflicts(
    timetable: GeneratedTimetable,
    students: StudentProfile[],
    subjects: SubjectDetails[]
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    students.forEach(student => {
      const studentSlots = timetable.schedule.filter(slot => 
        slot.studentIds.includes(student.id)
      );

      // Check for time conflicts
      const slotsByDayAndTime = new Map<string, ScheduleSlot[]>();
      
      studentSlots.forEach(slot => {
        const key = `${slot.day}-${slot.timeSlot}`;
        if (!slotsByDayAndTime.has(key)) {
          slotsByDayAndTime.set(key, []);
        }
        slotsByDayAndTime.get(key)!.push(slot);
      });

      // Check for conflicts
      slotsByDayAndTime.forEach((conflictingSlots, key) => {
        if (conflictingSlots.length > 1) {
          const [day, timeSlot] = key.split('-');
          
          conflicts.push({
            id: `student-subject-conflict-${student.id}-${key}`,
            type: 'STUDENT_SUBJECT_CONFLICT',
            severity: 'MAJOR',
            message: `Student ${student.firstName} ${student.lastName} has conflicting subjects`,
            description: `Student is enrolled in multiple subjects at the same time on ${day}`,
            affectedEntities: [
              {
                type: 'STUDENT',
                id: student.id,
                name: `${student.firstName} ${student.lastName}`,
                role: 'Student'
              }
            ],
            timeSlot,
            day,
            details: {
              studentId: student.id,
              conflictingSubjects: conflictingSlots.map(slot => ({
                subjectId: slot.subjectId,
                subjectName: slot.subjectName,
                facultyId: slot.facultyId
              }))
            },
            suggestedResolution: 'Student must choose between conflicting subjects or reschedule',
            priority: 7
          });
        }
      });
    });

    return conflicts;
  }

  /**
   * Detect time slot overlaps
   */
  private async detectTimeSlotOverlaps(timetable: GeneratedTimetable): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];
    const slotsByDay = new Map<string, ScheduleSlot[]>();

    // Group slots by day
    timetable.schedule.forEach(slot => {
      if (!slotsByDay.has(slot.day)) {
        slotsByDay.set(slot.day, []);
      }
      slotsByDay.get(slot.day)!.push(slot);
    });

    // Check for overlaps within each day
    slotsByDay.forEach((slots, day) => {
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const slot1 = slots[i];
          const slot2 = slots[j];

          if (this.timeSlotsOverlap(slot1.timeSlot, slot2.timeSlot)) {
            conflicts.push({
              id: `time-overlap-${day}-${slot1.timeSlot}-${slot2.timeSlot}`,
              type: 'TIME_SLOT_OVERLAP',
              severity: 'CRITICAL',
              message: `Time slot overlap detected on ${day}`,
              description: `Two classes are scheduled during overlapping time slots`,
              affectedEntities: [
                {
                  type: 'SUBJECT',
                  id: slot1.subjectId,
                  name: slot1.subjectName,
                  role: 'Class 1'
                },
                {
                  type: 'SUBJECT',
                  id: slot2.subjectId,
                  name: slot2.subjectName,
                  role: 'Class 2'
                }
              ],
              timeSlot: slot1.timeSlot,
              day,
              details: {
                slot1: {
                  subjectId: slot1.subjectId,
                  subjectName: slot1.subjectName,
                  facultyId: slot1.facultyId,
                  roomId: slot1.roomId
                },
                slot2: {
                  subjectId: slot2.subjectId,
                  subjectName: slot2.subjectName,
                  facultyId: slot2.facultyId,
                  roomId: slot2.roomId
                }
              },
              suggestedResolution: 'Reschedule one of the classes to a different time slot',
              priority: 9
            });
          }
        }
      }
    });

    return conflicts;
  }

  /**
   * Detect prerequisites not met
   */
  private async detectPrerequisiteConflicts(
    timetable: GeneratedTimetable,
    students: StudentProfile[],
    subjects: SubjectDetails[]
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    students.forEach(student => {
      const studentSlots = timetable.schedule.filter(slot => 
        slot.studentIds.includes(student.id)
      );

      // Get subjects the student is enrolled in
      const enrolledSubjectIds = new Set(
        studentSlots.map(slot => slot.subjectId)
      );

      // Check prerequisites for each enrolled subject
      subjects.forEach(subject => {
        if (enrolledSubjectIds.has(subject.id)) {
          subject.prerequisites.forEach(prerequisite => {
            if (!enrolledSubjectIds.has(prerequisite.subjectId)) {
              conflicts.push({
                id: `prerequisite-${student.id}-${subject.id}-${prerequisite.subjectId}`,
                type: 'PREREQUISITES_NOT_MET',
                severity: 'MAJOR',
                message: `Prerequisite not met for ${subject.name}`,
                description: `Student is missing prerequisite: ${prerequisite.subjectName}`,
                affectedEntities: [
                  {
                    type: 'STUDENT',
                    id: student.id,
                    name: `${student.firstName} ${student.lastName}`,
                    role: 'Student'
                  },
                  {
                    type: 'SUBJECT',
                    id: subject.id,
                    name: subject.name,
                    role: 'Enrolled Subject'
                  },
                  {
                    type: 'SUBJECT',
                    id: prerequisite.subjectId,
                    name: prerequisite.subjectName,
                    role: 'Prerequisite'
                  }
                ],
                timeSlot: 'N/A',
                day: 'N/A',
                details: {
                  studentId: student.id,
                  subjectId: subject.id,
                  subjectName: subject.name,
                  prerequisiteId: prerequisite.subjectId,
                  prerequisiteName: prerequisite.subjectName,
                  prerequisiteType: prerequisite.type
                },
                suggestedResolution: 'Student must complete prerequisite before enrolling in this subject',
                priority: 6
              });
            }
          });
        }
      });
    });

    return conflicts;
  }

  /**
   * Detect credit overload
   */
  private async detectCreditOverload(
    timetable: GeneratedTimetable,
    students: StudentProfile[],
    subjects: SubjectDetails[]
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    students.forEach(student => {
      const studentSlots = timetable.schedule.filter(slot => 
        slot.studentIds.includes(student.id)
      );

      // Calculate total credits
      const enrolledSubjectIds = new Set(
        studentSlots.map(slot => slot.subjectId)
      );

      const totalCredits = subjects
        .filter(subject => enrolledSubjectIds.has(subject.id))
        .reduce((sum, subject) => sum + subject.credits, 0);

      if (totalCredits > this.MAX_STUDENT_CREDITS_PER_SEMESTER) {
        conflicts.push({
          id: `credit-overload-${student.id}`,
          type: 'CREDIT_OVERLOAD',
          severity: 'MAJOR',
          message: `Student ${student.firstName} ${student.lastName} has credit overload`,
          description: `Total credits (${totalCredits}) exceed maximum allowed (${this.MAX_STUDENT_CREDITS_PER_SEMESTER})`,
          affectedEntities: [
            {
              type: 'STUDENT',
              id: student.id,
              name: `${student.firstName} ${student.lastName}`,
              role: 'Student'
            }
          ],
          timeSlot: 'N/A',
          day: 'N/A',
          details: {
            studentId: student.id,
            totalCredits,
            maxCredits: this.MAX_STUDENT_CREDITS_PER_SEMESTER,
            excessCredits: totalCredits - this.MAX_STUDENT_CREDITS_PER_SEMESTER,
            enrolledSubjects: Array.from(enrolledSubjectIds)
          },
          suggestedResolution: 'Reduce number of enrolled subjects or credits per subject',
          priority: 5
        });
      }
    });

    return conflicts;
  }

  /**
   * Detect room double-booking
   */
  private async detectRoomDoubleBooking(timetable: GeneratedTimetable): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];
    const roomSlots = new Map<string, ScheduleSlot[]>();

    // Group slots by room
    timetable.schedule.forEach(slot => {
      if (slot.roomId) {
        if (!roomSlots.has(slot.roomId)) {
          roomSlots.set(slot.roomId, []);
        }
        roomSlots.get(slot.roomId)!.push(slot);
      }
    });

    // Check for double-booking
    roomSlots.forEach((slots, roomId) => {
      const slotsByDayAndTime = new Map<string, ScheduleSlot[]>();
      
      slots.forEach(slot => {
        const key = `${slot.day}-${slot.timeSlot}`;
        if (!slotsByDayAndTime.has(key)) {
          slotsByDayAndTime.set(key, []);
        }
        slotsByDayAndTime.get(key)!.push(slot);
      });

      // Check for conflicts
      slotsByDayAndTime.forEach((conflictingSlots, key) => {
        if (conflictingSlots.length > 1) {
          const [day, timeSlot] = key.split('-');
          
          conflicts.push({
            id: `room-double-booking-${roomId}-${key}`,
            type: 'ROOM_DOUBLE_BOOKING',
            severity: 'CRITICAL',
            message: `Room ${roomId} is double-booked`,
            description: `Multiple classes are scheduled in the same room at the same time`,
            affectedEntities: [
              {
                type: 'ROOM',
                id: roomId,
                name: `Room ${roomId}`,
                role: 'Classroom'
              }
            ],
            timeSlot,
            day,
            details: {
              roomId,
              conflictingSlots: conflictingSlots.map(slot => ({
                subjectId: slot.subjectId,
                subjectName: slot.subjectName,
                facultyId: slot.facultyId,
                studentCount: slot.studentIds.length
              }))
            },
            suggestedResolution: 'Reschedule one of the conflicting classes to a different room or time',
            priority: 10
          });
        }
      });
    });

    return conflicts;
  }

  /**
   * Detect faculty overload
   */
  private async detectFacultyOverload(
    timetable: GeneratedTimetable,
    faculty: FacultyProfile[]
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];
    const facultySlots = new Map<string, ScheduleSlot[]>();

    // Group slots by faculty
    timetable.schedule.forEach(slot => {
      if (slot.facultyId) {
        if (!facultySlots.has(slot.facultyId)) {
          facultySlots.set(slot.facultyId, []);
        }
        facultySlots.get(slot.facultyId)!.push(slot);
      }
    });

    // Check for overload
    facultySlots.forEach((slots, facultyId) => {
      const faculty = faculty.find(f => f.id === facultyId);
      if (!faculty) return;

      const totalHours = slots.reduce((sum, slot) => sum + slot.duration, 0);
      
      if (totalHours > this.MAX_FACULTY_HOURS_PER_WEEK) {
        conflicts.push({
          id: `faculty-overload-${facultyId}`,
          type: 'FACULTY_OVERLOAD',
          severity: 'MAJOR',
          message: `Faculty ${faculty.firstName} ${faculty.lastName} is overloaded`,
          description: `Total hours (${totalHours}) exceed maximum allowed (${this.MAX_FACULTY_HOURS_PER_WEEK})`,
          affectedEntities: [
            {
              type: 'FACULTY',
              id: facultyId,
              name: `${faculty.firstName} ${faculty.lastName}`,
              role: 'Instructor'
            }
          ],
          timeSlot: 'N/A',
          day: 'N/A',
          details: {
            facultyId,
            totalHours,
            maxHours: this.MAX_FACULTY_HOURS_PER_WEEK,
            excessHours: totalHours - this.MAX_FACULTY_HOURS_PER_WEEK,
            slots: slots.map(slot => ({
              subjectId: slot.subjectId,
              subjectName: slot.subjectName,
              day: slot.day,
              timeSlot: slot.timeSlot,
              duration: slot.duration
            }))
          },
          suggestedResolution: 'Reduce faculty workload or redistribute classes',
          priority: 6
        });
      }
    });

    return conflicts;
  }

  /**
   * Detect student overload
   */
  private async detectStudentOverload(
    timetable: GeneratedTimetable,
    students: StudentProfile[]
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    students.forEach(student => {
      const studentSlots = timetable.schedule.filter(slot => 
        slot.studentIds.includes(student.id)
      );

      // Group by day
      const slotsByDay = new Map<string, ScheduleSlot[]>();
      
      studentSlots.forEach(slot => {
        if (!slotsByDay.has(slot.day)) {
          slotsByDay.set(slot.day, []);
        }
        slotsByDay.get(slot.day)!.push(slot);
      });

      // Check daily overload
      slotsByDay.forEach((slots, day) => {
        const totalHours = slots.reduce((sum, slot) => sum + slot.duration, 0);
        
        if (totalHours > this.MAX_STUDENT_HOURS_PER_DAY) {
          conflicts.push({
            id: `student-overload-${student.id}-${day}`,
            type: 'STUDENT_OVERLOAD',
            severity: 'MAJOR',
            message: `Student ${student.firstName} ${student.lastName} is overloaded on ${day}`,
            description: `Daily hours (${totalHours}) exceed maximum allowed (${this.MAX_STUDENT_HOURS_PER_DAY})`,
            affectedEntities: [
              {
                type: 'STUDENT',
                id: student.id,
                name: `${student.firstName} ${student.lastName}`,
                role: 'Student'
              }
            ],
            timeSlot: 'N/A',
            day,
            details: {
              studentId: student.id,
              day,
              totalHours,
              maxHours: this.MAX_STUDENT_HOURS_PER_DAY,
              excessHours: totalHours - this.MAX_STUDENT_HOURS_PER_DAY,
              slots: slots.map(slot => ({
                subjectId: slot.subjectId,
                subjectName: slot.subjectName,
                timeSlot: slot.timeSlot,
                duration: slot.duration
              }))
            },
            suggestedResolution: 'Reduce daily class load or reschedule classes',
            priority: 7
          });
        }
      });
    });

    return conflicts;
  }

  /**
   * Detect resource unavailable conflicts
   */
  private async detectResourceUnavailable(
    timetable: GeneratedTimetable,
    faculty: FacultyProfile[],
    students: StudentProfile[]
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Check for unavailable faculty
    timetable.schedule.forEach(slot => {
      if (slot.facultyId) {
        const facultyMember = faculty.find(f => f.id === slot.facultyId);
        if (facultyMember && !facultyMember.isAvailable) {
          conflicts.push({
            id: `faculty-unavailable-${slot.facultyId}-${slot.day}-${slot.timeSlot}`,
            type: 'RESOURCE_UNAVAILABLE',
            severity: 'CRITICAL',
            message: `Faculty ${facultyMember.firstName} ${facultyMember.lastName} is unavailable`,
            description: `Faculty is marked as unavailable but is scheduled for class`,
            affectedEntities: [
              {
                type: 'FACULTY',
                id: slot.facultyId,
                name: `${facultyMember.firstName} ${facultyMember.lastName}`,
                role: 'Instructor'
              }
            ],
            timeSlot: slot.timeSlot,
            day: slot.day,
            details: {
              facultyId: slot.facultyId,
              subjectId: slot.subjectId,
              subjectName: slot.subjectName,
              isAvailable: facultyMember.isAvailable
            },
            suggestedResolution: 'Assign available faculty or reschedule class',
            priority: 9
          });
        }
      }
    });

    return conflicts;
  }

  /**
   * Generate conflict summary
   */
  private generateConflictSummary(conflicts: Conflict[]): ConflictSummary {
    const summary: ConflictSummary = {
      totalConflicts: conflicts.length,
      criticalConflicts: conflicts.filter(c => c.severity === 'CRITICAL').length,
      majorConflicts: conflicts.filter(c => c.severity === 'MAJOR').length,
      minorConflicts: conflicts.filter(c => c.severity === 'MINOR').length,
      conflictsByType: {} as Record<ConflictType, number>,
      conflictsByDay: {},
      conflictsByTimeSlot: {}
    };

    // Count by type
    conflicts.forEach(conflict => {
      summary.conflictsByType[conflict.type] = (summary.conflictsByType[conflict.type] || 0) + 1;
    });

    // Count by day
    conflicts.forEach(conflict => {
      summary.conflictsByDay[conflict.day] = (summary.conflictsByDay[conflict.day] || 0) + 1;
    });

    // Count by time slot
    conflicts.forEach(conflict => {
      summary.conflictsByTimeSlot[conflict.timeSlot] = (summary.conflictsByTimeSlot[conflict.timeSlot] || 0) + 1;
    });

    return summary;
  }

  /**
   * Generate recommendations based on conflicts
   */
  private generateRecommendations(conflicts: Conflict[]): string[] {
    const recommendations: string[] = [];
    const conflictTypes = new Set(conflicts.map(c => c.type));

    if (conflictTypes.has('FACULTY_DOUBLE_BOOKING')) {
      recommendations.push('Implement faculty availability checking before scheduling');
    }

    if (conflictTypes.has('ROOM_CAPACITY_EXCEEDED')) {
      recommendations.push('Verify room capacity against enrollment before assignment');
    }

    if (conflictTypes.has('STUDENT_SUBJECT_CONFLICT')) {
      recommendations.push('Implement student schedule validation during enrollment');
    }

    if (conflictTypes.has('TIME_SLOT_OVERLAP')) {
      recommendations.push('Add time slot overlap detection to scheduling algorithm');
    }

    if (conflictTypes.has('PREREQUISITES_NOT_MET')) {
      recommendations.push('Enforce prerequisite checking during enrollment');
    }

    if (conflictTypes.has('CREDIT_OVERLOAD')) {
      recommendations.push('Implement credit limit validation for students');
    }

    if (conflictTypes.has('ROOM_DOUBLE_BOOKING')) {
      recommendations.push('Add room availability checking to scheduling system');
    }

    if (conflictTypes.has('FACULTY_OVERLOAD')) {
      recommendations.push('Implement faculty workload monitoring and limits');
    }

    if (conflictTypes.has('STUDENT_OVERLOAD')) {
      recommendations.push('Add daily hour limits for student schedules');
    }

    if (conflictTypes.has('RESOURCE_UNAVAILABLE')) {
      recommendations.push('Verify resource availability before scheduling');
    }

    return recommendations;
  }

  /**
   * Check if two time slots overlap
   */
  private timeSlotsOverlap(timeSlot1: string, timeSlot2: string): boolean {
    // This would need to be implemented based on your time slot format
    // For now, return true if they're identical
    return timeSlot1 === timeSlot2;
  }
}

