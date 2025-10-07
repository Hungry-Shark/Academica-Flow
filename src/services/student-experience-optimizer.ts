import { 
  StudentExperienceOptimizer,
  TravelTimeOptimization,
  WorkloadBalancing,
  BreakTimingOptimization,
  PreferenceConsideration,
  GroupStudyAllocation,
  TimetableData,
  AdministrativeData,
  RoomReassignment,
  TimeSlotAdjustment,
  DailyAdjustment,
  BreakDistribution,
  BreakAdjustment,
  StudentPreference,
  FacultyPreference,
  RoomPreference,
  GroupStudySlot,
  WorkloadDistribution
} from '../types';

export class StudentExperienceOptimizerService {
  private timetableData: TimetableData;
  private administrativeData: AdministrativeData;
  private organizationId: string;
  private semester: string;
  private academicYear: string;
  private studentPreferences: Map<string, any> = new Map();
  private facultyPreferences: Map<string, any> = new Map();
  private roomPreferences: Map<string, any> = new Map();

  constructor(
    timetableData: TimetableData,
    administrativeData: AdministrativeData,
    organizationId: string,
    semester: string,
    academicYear: string
  ) {
    this.timetableData = timetableData;
    this.administrativeData = administrativeData;
    this.organizationId = organizationId;
    this.semester = semester;
    this.academicYear = academicYear;
  }

  /**
   * Generate comprehensive student experience optimization
   */
  async generateStudentExperienceOptimization(): Promise<StudentExperienceOptimizer> {
    const travelTimeOptimization = await this.optimizeTravelTime();
    const workloadBalancing = await this.balanceWorkload();
    const breakTimingOptimization = await this.optimizeBreakTiming();
    const preferenceConsideration = await this.considerPreferences();
    const groupStudyAllocation = await this.allocateGroupStudyTime();

    return {
      travelTimeOptimization,
      workloadBalancing,
      breakTimingOptimization,
      preferenceConsideration,
      groupStudyAllocation,
      generatedAt: new Date(),
      organizationId: this.organizationId,
      semester: this.semester,
      academicYear: this.academicYear
    };
  }

  /**
   * Optimize travel time between classes
   */
  private async optimizeTravelTime(): Promise<TravelTimeOptimization> {
    const currentAverageTravelTime = await this.calculateCurrentAverageTravelTime();
    const roomReassignments = await this.generateRoomReassignments();
    const timeSlotAdjustments = await this.generateTimeSlotAdjustments();
    const optimizedAverageTravelTime = this.calculateOptimizedTravelTime(roomReassignments, timeSlotAdjustments);
    const improvement = currentAverageTravelTime - optimizedAverageTravelTime;
    const recommendations = this.generateTravelTimeRecommendations(improvement, roomReassignments, timeSlotAdjustments);

    return {
      currentAverageTravelTime,
      optimizedAverageTravelTime,
      improvement,
      roomReassignments,
      timeSlotAdjustments,
      recommendations
    };
  }

  /**
   * Balance student workload across days
   */
  private async balanceWorkload(): Promise<WorkloadBalancing> {
    const currentWorkloadDistribution = await this.calculateCurrentWorkloadDistribution();
    const dailyAdjustments = await this.generateDailyAdjustments();
    const optimizedWorkloadDistribution = this.calculateOptimizedWorkloadDistribution(dailyAdjustments);
    const improvement = this.calculateWorkloadImprovement(currentWorkloadDistribution, optimizedWorkloadDistribution);
    const recommendations = this.generateWorkloadRecommendations(improvement, dailyAdjustments);

    return {
      currentWorkloadDistribution,
      optimizedWorkloadDistribution,
      improvement,
      dailyAdjustments,
      recommendations
    };
  }

  /**
   * Optimize break timing for students
   */
  private async optimizeBreakTiming(): Promise<BreakTimingOptimization> {
    const currentBreakDistribution = await this.calculateCurrentBreakDistribution();
    const breakAdjustments = await this.generateBreakAdjustments();
    const optimizedBreakDistribution = this.calculateOptimizedBreakDistribution(breakAdjustments);
    const improvement = this.calculateBreakImprovement(currentBreakDistribution, optimizedBreakDistribution);
    const recommendations = this.generateBreakTimingRecommendations(improvement, breakAdjustments);

    return {
      currentBreakDistribution,
      optimizedBreakDistribution,
      improvement,
      breakAdjustments,
      recommendations
    };
  }

  /**
   * Consider student, faculty, and room preferences
   */
  private async considerPreferences(): Promise<PreferenceConsideration> {
    const studentPreferences = await this.analyzeStudentPreferences();
    const facultyPreferences = await this.analyzeFacultyPreferences();
    const roomPreferences = await this.analyzeRoomPreferences();
    const satisfactionScore = this.calculateSatisfactionScore(studentPreferences, facultyPreferences, roomPreferences);
    const recommendations = this.generatePreferenceRecommendations(studentPreferences, facultyPreferences, roomPreferences);

    return {
      studentPreferences,
      facultyPreferences,
      roomPreferences,
      satisfactionScore,
      recommendations
    };
  }

  /**
   * Allocate group study time optimally
   */
  private async allocateGroupStudyTime(): Promise<GroupStudyAllocation> {
    const currentGroupStudyTime = await this.calculateCurrentGroupStudyTime();
    const groupStudySlots = await this.generateGroupStudySlots();
    const optimizedGroupStudyTime = this.calculateOptimizedGroupStudyTime(groupStudySlots);
    const improvement = optimizedGroupStudyTime - currentGroupStudyTime;
    const recommendations = this.generateGroupStudyRecommendations(improvement, groupStudySlots);

    return {
      currentGroupStudyTime,
      optimizedGroupStudyTime,
      improvement,
      groupStudySlots,
      recommendations
    };
  }

  // Helper methods for travel time optimization
  private async calculateCurrentAverageTravelTime(): Promise<number> {
    const travelTimes: number[] = [];
    
    // Calculate travel time between consecutive classes
    Object.entries(this.timetableData).forEach(([day, dayData]) => {
      const slots = Object.entries(dayData).sort((a, b) => this.compareTimeSlots(a[0], b[0]));
      
      for (let i = 0; i < slots.length - 1; i++) {
        const [timeSlot1, slot1] = slots[i];
        const [timeSlot2, slot2] = slots[i + 1];
        
        if (slot1 && slot2 && slot1.room && slot2.room) {
          const travelTime = this.calculateTravelTimeBetweenRooms(slot1.room, slot2.room);
          travelTimes.push(travelTime);
        }
      }
    });

    return travelTimes.length > 0 ? travelTimes.reduce((sum, time) => sum + time, 0) / travelTimes.length : 0;
  }

  private async generateRoomReassignments(): Promise<RoomReassignment[]> {
    const reassignments: RoomReassignment[] = [];
    const roomDistances = this.calculateRoomDistances();
    
    // Find opportunities for room reassignment
    Object.entries(this.timetableData).forEach(([day, dayData]) => {
      const slots = Object.entries(dayData).sort((a, b) => this.compareTimeSlots(a[0], b[0]));
      
      for (let i = 0; i < slots.length - 1; i++) {
        const [timeSlot1, slot1] = slots[i];
        const [timeSlot2, slot2] = slots[i + 1];
        
        if (slot1 && slot2 && slot1.room && slot2.room) {
          const currentTravelTime = this.calculateTravelTimeBetweenRooms(slot1.room, slot2.room);
          
          // Find better room assignment
          const betterRoom = this.findBetterRoomAssignment(slot2, roomDistances, slot1.room);
          if (betterRoom) {
            const newTravelTime = this.calculateTravelTimeBetweenRooms(slot1.room, betterRoom);
            const travelTimeReduction = currentTravelTime - newTravelTime;
            
            if (travelTimeReduction > 2) { // Only suggest if reduction is significant
              reassignments.push({
                courseId: slot2.courseName,
                courseName: slot2.courseName,
                currentRoom: slot2.room,
                suggestedRoom: betterRoom,
                travelTimeReduction,
                reasoning: `Reduces travel time by ${travelTimeReduction} minutes between consecutive classes`
              });
            }
          }
        }
      }
    });

    return reassignments;
  }

  private async generateTimeSlotAdjustments(): Promise<TimeSlotAdjustment[]> {
    const adjustments: TimeSlotAdjustment[] = [];
    
    // Find opportunities for time slot adjustment
    Object.entries(this.timetableData).forEach(([day, dayData]) => {
      const slots = Object.entries(dayData).sort((a, b) => this.compareTimeSlots(a[0], b[0]));
      
      for (let i = 0; i < slots.length - 1; i++) {
        const [timeSlot1, slot1] = slots[i];
        const [timeSlot2, slot2] = slots[i + 1];
        
        if (slot1 && slot2 && slot1.room && slot2.room) {
          const currentTravelTime = this.calculateTravelTimeBetweenRooms(slot1.room, slot2.room);
          
          // Find better time slot
          const betterTimeSlot = this.findBetterTimeSlot(slot2, dayData, slot1.room);
          if (betterTimeSlot) {
            const newTravelTime = this.calculateTravelTimeBetweenRooms(slot1.room, slot2.room);
            const travelTimeReduction = currentTravelTime - newTravelTime;
            
            if (travelTimeReduction > 1) { // Only suggest if reduction is significant
              adjustments.push({
                courseId: slot2.courseName,
                courseName: slot2.courseName,
                currentTimeSlot: timeSlot2,
                suggestedTimeSlot: betterTimeSlot,
                travelTimeReduction,
                reasoning: `Reduces travel time by ${travelTimeReduction} minutes with better scheduling`
              });
            }
          }
        }
      }
    });

    return adjustments;
  }

  private calculateOptimizedTravelTime(roomReassignments: RoomReassignment[], timeSlotAdjustments: TimeSlotAdjustment[]): number {
    const currentAverage = this.calculateCurrentAverageTravelTime();
    const roomReduction = roomReassignments.reduce((sum, r) => sum + r.travelTimeReduction, 0);
    const timeReduction = timeSlotAdjustments.reduce((sum, t) => sum + t.travelTimeReduction, 0);
    
    return Math.max(0, currentAverage - (roomReduction + timeReduction) / 10); // Average reduction
  }

  private generateTravelTimeRecommendations(
    improvement: number,
    roomReassignments: RoomReassignment[],
    timeSlotAdjustments: TimeSlotAdjustment[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (improvement > 5) {
      recommendations.push(`Significant travel time reduction possible: ${improvement.toFixed(1)} minutes average`);
    }
    
    if (roomReassignments.length > 0) {
      recommendations.push(`Consider ${roomReassignments.length} room reassignments for better proximity`);
    }
    
    if (timeSlotAdjustments.length > 0) {
      recommendations.push(`Consider ${timeSlotAdjustments.length} time slot adjustments for optimal scheduling`);
    }
    
    if (improvement < 2) {
      recommendations.push('Current travel time is already well optimized');
    }

    return recommendations;
  }

  // Helper methods for workload balancing
  private async calculateCurrentWorkloadDistribution(): Promise<WorkloadDistribution> {
    const dailyHours = new Map<string, number>();
    
    Object.entries(this.timetableData).forEach(([day, dayData]) => {
      const hours = Object.keys(dayData).length;
      dailyHours.set(day, hours);
    });

    const hours = Array.from(dailyHours.values());
    const light = hours.filter(h => h < 4).length;
    const moderate = hours.filter(h => h >= 4 && h <= 6).length;
    const heavy = hours.filter(h => h > 6 && h <= 8).length;
    const excessive = hours.filter(h => h > 8).length;

    return { light, moderate, heavy, excessive };
  }

  private async generateDailyAdjustments(): Promise<DailyAdjustment[]> {
    const adjustments: DailyAdjustment[] = [];
    const dailyHours = new Map<string, number>();
    
    Object.entries(this.timetableData).forEach(([day, dayData]) => {
      const hours = Object.keys(dayData).length;
      dailyHours.set(day, hours);
    });

    const averageHours = Array.from(dailyHours.values()).reduce((sum, h) => sum + h, 0) / dailyHours.size;
    
    Object.entries(dailyHours).forEach(([day, hours]) => {
      const adjustment = averageHours - hours;
      
      if (Math.abs(adjustment) > 1) { // Only suggest if adjustment is significant
        adjustments.push({
          day,
          currentHours: hours,
          suggestedHours: Math.round(averageHours),
          adjustment: Math.round(adjustment),
          reasoning: `Balance workload by ${adjustment > 0 ? 'adding' : 'reducing'} ${Math.abs(adjustment)} hours`
        });
      }
    });

    return adjustments;
  }

  private calculateOptimizedWorkloadDistribution(dailyAdjustments: DailyAdjustment[]): WorkloadDistribution {
    // Calculate what the distribution would be after adjustments
    const adjustedHours = dailyAdjustments.map(adj => adj.suggestedHours);
    const light = adjustedHours.filter(h => h < 4).length;
    const moderate = adjustedHours.filter(h => h >= 4 && h <= 6).length;
    const heavy = adjustedHours.filter(h => h > 6 && h <= 8).length;
    const excessive = adjustedHours.filter(h => h > 8).length;

    return { light, moderate, heavy, excessive };
  }

  private calculateWorkloadImprovement(current: WorkloadDistribution, optimized: WorkloadDistribution): number {
    // Calculate improvement based on reduced variance
    const currentVariance = this.calculateWorkloadVariance(current);
    const optimizedVariance = this.calculateWorkloadVariance(optimized);
    return Math.max(0, currentVariance - optimizedVariance);
  }

  private calculateWorkloadVariance(distribution: WorkloadDistribution): number {
    const total = distribution.light + distribution.moderate + distribution.heavy + distribution.excessive;
    if (total === 0) return 0;
    
    const lightPct = distribution.light / total;
    const moderatePct = distribution.moderate / total;
    const heavyPct = distribution.heavy / total;
    const excessivePct = distribution.excessive / total;
    
    const mean = (lightPct + moderatePct + heavyPct + excessivePct) / 4;
    const variance = Math.pow(lightPct - mean, 2) + Math.pow(moderatePct - mean, 2) + 
                    Math.pow(heavyPct - mean, 2) + Math.pow(excessivePct - mean, 2);
    
    return variance;
  }

  private generateWorkloadRecommendations(improvement: number, dailyAdjustments: DailyAdjustment[]): string[] {
    const recommendations: string[] = [];
    
    if (improvement > 0.1) {
      recommendations.push(`Workload balancing can improve by ${improvement.toFixed(2)} points`);
    }
    
    if (dailyAdjustments.length > 0) {
      recommendations.push(`Consider ${dailyAdjustments.length} daily adjustments for better balance`);
    }
    
    if (improvement < 0.05) {
      recommendations.push('Current workload distribution is already well balanced');
    }

    return recommendations;
  }

  // Helper methods for break timing optimization
  private async calculateCurrentBreakDistribution(): Promise<BreakDistribution> {
    const breakTimes = this.calculateBreakTimes();
    const morning = breakTimes.filter(time => time < 12).length;
    const afternoon = breakTimes.filter(time => time >= 12 && time < 17).length;
    const evening = breakTimes.filter(time => time >= 17).length;
    const total = breakTimes.length;

    return { morning, afternoon, evening, total };
  }

  private async generateBreakAdjustments(): Promise<BreakAdjustment[]> {
    const adjustments: BreakAdjustment[] = [];
    const breakTimes = this.calculateBreakTimes();
    const optimalBreakTime = 15; // 15 minutes is optimal
    
    Object.entries(this.timetableData).forEach(([day, dayData]) => {
      const slots = Object.entries(dayData).sort((a, b) => this.compareTimeSlots(a[0], b[0]));
      
      for (let i = 0; i < slots.length - 1; i++) {
        const [timeSlot1, slot1] = slots[i];
        const [timeSlot2, slot2] = slots[i + 1];
        
        if (slot1 && slot2) {
          const currentBreak = this.calculateBreakTime(timeSlot1, timeSlot2);
          const suggestedBreak = optimalBreakTime;
          
          if (Math.abs(currentBreak - suggestedBreak) > 5) { // Only suggest if difference is significant
            adjustments.push({
              day,
              timeSlot: timeSlot2,
              currentBreak,
              suggestedBreak,
              reasoning: `Optimize break time to ${suggestedBreak} minutes for better student experience`
            });
          }
        }
      }
    });

    return adjustments;
  }

  private calculateOptimizedBreakDistribution(breakAdjustments: BreakAdjustment[]): BreakDistribution {
    // Calculate what the distribution would be after adjustments
    const adjustedBreaks = breakAdjustments.map(adj => adj.suggestedBreak);
    const morning = adjustedBreaks.filter(time => time < 12).length;
    const afternoon = adjustedBreaks.filter(time => time >= 12 && time < 17).length;
    const evening = adjustedBreaks.filter(time => time >= 17).length;
    const total = adjustedBreaks.length;

    return { morning, afternoon, evening, total };
  }

  private calculateBreakImprovement(current: BreakDistribution, optimized: BreakDistribution): number {
    // Calculate improvement based on better distribution
    const currentVariance = this.calculateBreakVariance(current);
    const optimizedVariance = this.calculateBreakVariance(optimized);
    return Math.max(0, currentVariance - optimizedVariance);
  }

  private calculateBreakVariance(distribution: BreakDistribution): number {
    const total = distribution.total;
    if (total === 0) return 0;
    
    const morningPct = distribution.morning / total;
    const afternoonPct = distribution.afternoon / total;
    const eveningPct = distribution.evening / total;
    
    const mean = (morningPct + afternoonPct + eveningPct) / 3;
    const variance = Math.pow(morningPct - mean, 2) + Math.pow(afternoonPct - mean, 2) + Math.pow(eveningPct - mean, 2);
    
    return variance;
  }

  private generateBreakTimingRecommendations(improvement: number, breakAdjustments: BreakAdjustment[]): string[] {
    const recommendations: string[] = [];
    
    if (improvement > 0.1) {
      recommendations.push(`Break timing can improve by ${improvement.toFixed(2)} points`);
    }
    
    if (breakAdjustments.length > 0) {
      recommendations.push(`Consider ${breakAdjustments.length} break adjustments for optimal timing`);
    }
    
    if (improvement < 0.05) {
      recommendations.push('Current break timing is already well optimized');
    }

    return recommendations;
  }

  // Helper methods for preference consideration
  private async analyzeStudentPreferences(): Promise<StudentPreference[]> {
    const preferences: StudentPreference[] = [];
    
    // Analyze common student preferences
    const morningPreference = this.analyzeMorningPreference();
    const afternoonPreference = this.analyzeAfternoonPreference();
    const breakPreference = this.analyzeBreakPreference();
    
    preferences.push(morningPreference);
    preferences.push(afternoonPreference);
    preferences.push(breakPreference);
    
    return preferences;
  }

  private async analyzeFacultyPreferences(): Promise<FacultyPreference[]> {
    const preferences: FacultyPreference[] = [];
    
    // Analyze faculty preferences
    const workloadPreference = this.analyzeFacultyWorkloadPreference();
    const timePreference = this.analyzeFacultyTimePreference();
    
    preferences.push(workloadPreference);
    preferences.push(timePreference);
    
    return preferences;
  }

  private async analyzeRoomPreferences(): Promise<RoomPreference[]> {
    const preferences: RoomPreference[] = [];
    
    // Analyze room preferences
    const capacityPreference = this.analyzeRoomCapacityPreference();
    const locationPreference = this.analyzeRoomLocationPreference();
    
    preferences.push(capacityPreference);
    preferences.push(locationPreference);
    
    return preferences;
  }

  private calculateSatisfactionScore(
    studentPreferences: StudentPreference[],
    facultyPreferences: FacultyPreference[],
    roomPreferences: RoomPreference[]
  ): number {
    const studentScore = studentPreferences.reduce((sum, pref) => sum + pref.satisfaction, 0) / studentPreferences.length;
    const facultyScore = facultyPreferences.reduce((sum, pref) => sum + pref.satisfaction, 0) / facultyPreferences.length;
    const roomScore = roomPreferences.reduce((sum, pref) => sum + pref.satisfaction, 0) / roomPreferences.length;
    
    return (studentScore + facultyScore + roomScore) / 3;
  }

  private generatePreferenceRecommendations(
    studentPreferences: StudentPreference[],
    facultyPreferences: FacultyPreference[],
    roomPreferences: RoomPreference[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Student preference recommendations
    studentPreferences.forEach(pref => {
      if (pref.satisfaction < 0.7) {
        recommendations.push(`Improve student satisfaction for ${pref.preference}: ${pref.recommendations.join(', ')}`);
      }
    });
    
    // Faculty preference recommendations
    facultyPreferences.forEach(pref => {
      if (pref.satisfaction < 0.7) {
        recommendations.push(`Improve faculty satisfaction for ${pref.preference}: ${pref.recommendations.join(', ')}`);
      }
    });
    
    // Room preference recommendations
    roomPreferences.forEach(pref => {
      if (pref.satisfaction < 0.7) {
        recommendations.push(`Improve room satisfaction for ${pref.preference}: ${pref.recommendations.join(', ')}`);
      }
    });

    return recommendations;
  }

  // Helper methods for group study allocation
  private async calculateCurrentGroupStudyTime(): Promise<number> {
    // Calculate current group study time allocation
    return 0; // Mock implementation
  }

  private async generateGroupStudySlots(): Promise<GroupStudySlot[]> {
    const slots: GroupStudySlot[] = [];
    
    // Generate optimal group study slots
    const timeSlots = [
      '9:30 am-10:20 am',
      '10:20 am-11:10 am',
      '11:10 am-12:00 pm',
      '12:00 pm-12:50 pm',
      '12:50 pm-2:20 pm',
      '2:20 pm-3:10 pm',
      '3:10 pm-4:00 pm',
      '4:00 pm-4:50 pm'
    ];
    
    timeSlots.forEach(slot => {
      slots.push({
        day: 'Monday',
        timeSlot: slot,
        duration: 50,
        capacity: 30,
        utilization: 0.7,
        efficiency: 0.8
      });
    });

    return slots;
  }

  private calculateOptimizedGroupStudyTime(groupStudySlots: GroupStudySlot[]): number {
    return groupStudySlots.reduce((sum, slot) => sum + slot.duration, 0);
  }

  private generateGroupStudyRecommendations(improvement: number, groupStudySlots: GroupStudySlot[]): string[] {
    const recommendations: string[] = [];
    
    if (improvement > 0) {
      recommendations.push(`Group study time can be increased by ${improvement} minutes`);
    }
    
    if (groupStudySlots.length > 0) {
      recommendations.push(`Consider ${groupStudySlots.length} group study slots for better collaboration`);
    }

    return recommendations;
  }

  // Utility methods
  private compareTimeSlots(slot1: string, slot2: string): number {
    const time1 = this.parseTimeSlot(slot1);
    const time2 = this.parseTimeSlot(slot2);
    return time1 - time2;
  }

  private parseTimeSlot(slot: string): number {
    const match = slot.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (!match) return 0;
    
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const meridiem = match[3].toLowerCase();
    
    if (meridiem === 'pm' && hour !== 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    
    return hour * 60 + minute;
  }

  private calculateTravelTimeBetweenRooms(room1: string, room2: string): number {
    // Mock implementation - in real system, this would calculate actual travel time
    if (room1 === room2) return 0;
    return Math.random() * 10 + 5; // 5-15 minutes
  }

  private calculateRoomDistances(): Map<string, Map<string, number>> {
    const distances = new Map<string, Map<string, number>>();
    
    this.administrativeData.rooms.forEach(room1 => {
      const roomDistances = new Map<string, number>();
      this.administrativeData.rooms.forEach(room2 => {
        if (room1.id !== room2.id) {
          roomDistances.set(room2.id, this.calculateTravelTimeBetweenRooms(room1.name, room2.name));
        }
      });
      distances.set(room1.id, roomDistances);
    });

    return distances;
  }

  private findBetterRoomAssignment(slot: any, roomDistances: Map<string, Map<string, number>>, previousRoom: string): string | null {
    // Find a room that's closer to the previous room
    const currentRoom = slot.room;
    const currentDistance = this.calculateTravelTimeBetweenRooms(previousRoom, currentRoom);
    
    // Find a better room (simplified logic)
    for (const [roomId, distances] of roomDistances) {
      const room = this.administrativeData.rooms.find(r => r.id === roomId);
      if (room && room.capacity >= 30) { // Ensure adequate capacity
        const distance = distances.get(this.findRoomIdByName(previousRoom) || '') || 0;
        if (distance < currentDistance) {
          return room.name;
        }
      }
    }

    return null;
  }

  private findBetterTimeSlot(slot: any, dayData: any, previousRoom: string): string | null {
    // Find a better time slot for the course
    const timeSlots = [
      '9:30 am-10:20 am',
      '10:20 am-11:10 am',
      '11:10 am-12:00 pm',
      '12:00 pm-12:50 pm',
      '12:50 pm-2:20 pm',
      '2:20 pm-3:10 pm',
      '3:10 pm-4:00 pm',
      '4:00 pm-4:50 pm'
    ];
    
    for (const timeSlot of timeSlots) {
      if (!dayData[timeSlot]) {
        return timeSlot;
      }
    }

    return null;
  }

  private calculateBreakTime(timeSlot1: string, timeSlot2: string): number {
    const time1 = this.parseTimeSlot(timeSlot1);
    const time2 = this.parseTimeSlot(timeSlot2);
    return time2 - time1;
  }

  private calculateBreakTimes(): number[] {
    const breakTimes: number[] = [];
    
    Object.entries(this.timetableData).forEach(([day, dayData]) => {
      const slots = Object.entries(dayData).sort((a, b) => this.compareTimeSlots(a[0], b[0]));
      
      for (let i = 0; i < slots.length - 1; i++) {
        const [timeSlot1, slot1] = slots[i];
        const [timeSlot2, slot2] = slots[i + 1];
        
        if (slot1 && slot2) {
          const breakTime = this.calculateBreakTime(timeSlot1, timeSlot2);
          breakTimes.push(breakTime);
        }
      }
    });

    return breakTimes;
  }

  private findRoomIdByName(roomName: string): string | null {
    const room = this.administrativeData.rooms.find(r => r.name === roomName);
    return room ? room.id : null;
  }

  // Mock preference analysis methods
  private analyzeMorningPreference(): StudentPreference {
    return {
      preference: 'Morning Classes',
      weight: 0.8,
      satisfaction: 0.7,
      impact: 0.6,
      recommendations: ['Schedule more morning classes', 'Reduce afternoon workload']
    };
  }

  private analyzeAfternoonPreference(): StudentPreference {
    return {
      preference: 'Afternoon Classes',
      weight: 0.6,
      satisfaction: 0.8,
      impact: 0.5,
      recommendations: ['Maintain current afternoon schedule', 'Balance morning and afternoon classes']
    };
  }

  private analyzeBreakPreference(): StudentPreference {
    return {
      preference: 'Adequate Break Time',
      weight: 0.9,
      satisfaction: 0.6,
      impact: 0.8,
      recommendations: ['Increase break time between classes', 'Optimize break distribution']
    };
  }

  private analyzeFacultyWorkloadPreference(): FacultyPreference {
    return {
      preference: 'Balanced Workload',
      weight: 0.9,
      satisfaction: 0.7,
      impact: 0.8,
      recommendations: ['Distribute workload evenly', 'Consider faculty capacity']
    };
  }

  private analyzeFacultyTimePreference(): FacultyPreference {
    return {
      preference: 'Preferred Time Slots',
      weight: 0.7,
      satisfaction: 0.8,
      impact: 0.6,
      recommendations: ['Respect faculty time preferences', 'Minimize schedule conflicts']
    };
  }

  private analyzeRoomCapacityPreference(): RoomPreference {
    return {
      preference: 'Adequate Room Capacity',
      weight: 0.8,
      satisfaction: 0.9,
      impact: 0.7,
      recommendations: ['Ensure room capacity matches class size', 'Optimize room allocation']
    };
  }

  private analyzeRoomLocationPreference(): RoomPreference {
    return {
      preference: 'Convenient Room Location',
      weight: 0.6,
      satisfaction: 0.7,
      impact: 0.5,
      recommendations: ['Minimize travel time between classes', 'Group related classes nearby']
    };
  }
}
