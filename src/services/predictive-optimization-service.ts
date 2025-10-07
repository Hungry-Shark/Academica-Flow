import { 
  PredictiveOptimization,
  EnrollmentPrediction,
  RoomAllocationSuggestion,
  FacultyWorkloadRecommendation,
  ScheduleTemplate,
  CapacityPlanningInsight,
  TimetableData,
  AdministrativeData,
  PredictionFactor
} from '../types';

export class PredictiveOptimizationService {
  private timetableData: TimetableData;
  private administrativeData: AdministrativeData;
  private organizationId: string;
  private semester: string;
  private academicYear: string;
  private historicalData: any[] = [];

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
   * Generate predictive optimization insights
   */
  async generatePredictiveOptimization(): Promise<PredictiveOptimization> {
    const enrollmentPredictions = await this.predictEnrollmentPatterns();
    const roomAllocationSuggestions = await this.suggestRoomAllocations();
    const facultyWorkloadRecommendations = await this.recommendFacultyWorkloads();
    const scheduleTemplates = await this.generateScheduleTemplates();
    const capacityPlanning = await this.planCapacity();

    return {
      enrollmentPredictions,
      roomAllocationSuggestions,
      facultyWorkloadRecommendations,
      scheduleTemplates,
      capacityPlanning,
      generatedAt: new Date(),
      organizationId: this.organizationId,
      semester: this.semester,
      academicYear: this.academicYear
    };
  }

  /**
   * Predict enrollment patterns for courses
   */
  private async predictEnrollmentPatterns(): Promise<EnrollmentPrediction[]> {
    const predictions: EnrollmentPrediction[] = [];
    
    // Analyze current course enrollments
    const courseEnrollments = this.analyzeCurrentEnrollments();
    
    // Predict future enrollments based on historical trends
    for (const [courseId, currentEnrollment] of courseEnrollments.entries()) {
      const course = this.findCourseById(courseId);
      if (course) {
        const historicalTrend = this.calculateHistoricalTrend(courseId);
        const predictedEnrollment = this.calculatePredictedEnrollment(currentEnrollment, historicalTrend);
        const confidence = this.calculatePredictionConfidence(historicalTrend);
        const factors = this.identifyPredictionFactors(courseId, currentEnrollment, historicalTrend);
        const recommendations = this.generateEnrollmentRecommendations(predictedEnrollment, confidence);

        predictions.push({
          courseId,
          courseName: course.name,
          predictedEnrollment,
          confidence,
          historicalTrend,
          factors,
          recommendations
        });
      }
    }

    return predictions;
  }

  /**
   * Suggest optimal room allocations
   */
  private async suggestRoomAllocations(): Promise<RoomAllocationSuggestion[]> {
    const suggestions: RoomAllocationSuggestion[] = [];
    const roomUtilization = await this.calculateRoomUtilization();
    
    for (const room of this.administrativeData.rooms) {
      const currentUtilization = roomUtilization.get(room.id) || 0;
      const suggestedUtilization = this.calculateOptimalUtilization(room);
      const improvement = suggestedUtilization - currentUtilization;
      
      if (improvement > 5) { // Only suggest if improvement is significant
        const suggestedCourses = this.identifyCoursesForRoom(room.id);
        const reasoning = this.generateRoomAllocationReasoning(room, currentUtilization, suggestedUtilization);
        const priority = this.calculateRoomAllocationPriority(improvement, room.capacity);

        suggestions.push({
          roomId: room.id,
          roomName: room.name,
          currentUtilization,
          suggestedUtilization,
          improvement,
          suggestedCourses,
          reasoning,
          priority
        });
      }
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Recommend faculty workload balancing
   */
  private async recommendFacultyWorkloads(): Promise<FacultyWorkloadRecommendation[]> {
    const recommendations: FacultyWorkloadRecommendation[] = [];
    const facultyWorkloads = await this.calculateFacultyWorkloads();
    
    for (const faculty of this.administrativeData.faculties) {
      const currentWorkload = facultyWorkloads.get(faculty.id) || 0;
      const recommendedWorkload = this.calculateOptimalFacultyWorkload(faculty);
      const adjustment = recommendedWorkload - currentWorkload;
      
      if (Math.abs(adjustment) > 5) { // Only recommend if adjustment is significant
        const suggestedCourses = this.identifyCoursesForFaculty(faculty.id);
        const reasoning = this.generateFacultyWorkloadReasoning(faculty, currentWorkload, recommendedWorkload);
        const priority = this.calculateFacultyWorkloadPriority(Math.abs(adjustment), faculty.department);

        recommendations.push({
          facultyId: faculty.id,
          facultyName: faculty.name,
          currentWorkload,
          recommendedWorkload,
          adjustment,
          suggestedCourses,
          reasoning,
          priority
        });
      }
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate schedule templates
   */
  private async generateScheduleTemplates(): Promise<ScheduleTemplate[]> {
    const templates: ScheduleTemplate[] = [];
    
    // Generate templates for different departments and years
    const departments = [...new Set(this.administrativeData.faculties.map(f => f.department))];
    const years = [1, 2, 3, 4];
    
    for (const department of departments) {
      for (const year of years) {
        const template = await this.createScheduleTemplate(department, year);
        if (template) {
          templates.push(template);
        }
      }
    }

    return templates;
  }

  /**
   * Plan capacity requirements
   */
  private async planCapacity(): Promise<CapacityPlanningInsight[]> {
    const insights: CapacityPlanningInsight[] = [];
    
    // Analyze room capacity
    const roomCapacityInsights = await this.analyzeRoomCapacity();
    insights.push(...roomCapacityInsights);
    
    // Analyze faculty capacity
    const facultyCapacityInsights = await this.analyzeFacultyCapacity();
    insights.push(...facultyCapacityInsights);
    
    // Analyze equipment capacity
    const equipmentCapacityInsights = await this.analyzeEquipmentCapacity();
    insights.push(...equipmentCapacityInsights);

    return insights.sort((a, b) => b.priority - a.priority);
  }

  // Helper methods for enrollment prediction
  private analyzeCurrentEnrollments(): Map<string, number> {
    const enrollments = new Map<string, number>();
    
    // Count current enrollments by course
    Object.values(this.timetableData).forEach(dayData => {
      Object.values(dayData).forEach(slot => {
        if (slot && slot.courseName) {
          const courseId = this.findCourseIdByName(slot.courseName);
          if (courseId) {
            const current = enrollments.get(courseId) || 0;
            enrollments.set(courseId, current + 1);
          }
        }
      });
    });

    return enrollments;
  }

  private findCourseById(courseId: string): any {
    // In a real implementation, this would find the course from a database
    return { id: courseId, name: `Course ${courseId}` };
  }

  private findCourseIdByName(courseName: string): string | null {
    // In a real implementation, this would find the course ID from a database
    return courseName;
  }

  private calculateHistoricalTrend(courseId: string): number[] {
    // In a real implementation, this would fetch historical enrollment data
    // For now, return mock data
    return [30, 32, 28, 35, 33];
  }

  private calculatePredictedEnrollment(currentEnrollment: number, historicalTrend: number[]): number {
    if (historicalTrend.length === 0) return currentEnrollment;
    
    // Simple linear regression for prediction
    const avgTrend = historicalTrend.reduce((sum, val) => sum + val, 0) / historicalTrend.length;
    const trendSlope = this.calculateTrendSlope(historicalTrend);
    
    return Math.round(avgTrend + trendSlope);
  }

  private calculateTrendSlope(trend: number[]): number {
    if (trend.length < 2) return 0;
    
    const n = trend.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = trend.reduce((sum, val) => sum + val, 0);
    const sumXY = trend.reduce((sum, val, index) => sum + val * index, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private calculatePredictionConfidence(historicalTrend: number[]): number {
    if (historicalTrend.length < 2) return 0.5;
    
    // Calculate confidence based on trend consistency
    const variance = this.calculateVariance(historicalTrend);
    const avgTrend = historicalTrend.reduce((sum, val) => sum + val, 0) / historicalTrend.length;
    const coefficientOfVariation = Math.sqrt(variance) / avgTrend;
    
    return Math.max(0, Math.min(1, 1 - coefficientOfVariation));
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private identifyPredictionFactors(courseId: string, currentEnrollment: number, historicalTrend: number[]): PredictionFactor[] {
    const factors: PredictionFactor[] = [];
    
    // Historical trend factor
    const trendSlope = this.calculateTrendSlope(historicalTrend);
    factors.push({
      factor: 'Historical Trend',
      impact: Math.abs(trendSlope),
      weight: 0.4,
      description: `Historical enrollment trend shows ${trendSlope > 0 ? 'increasing' : 'decreasing'} pattern`
    });
    
    // Current enrollment factor
    const enrollmentImpact = currentEnrollment > 30 ? 0.8 : 0.6;
    factors.push({
      factor: 'Current Enrollment',
      impact: enrollmentImpact,
      weight: 0.3,
      description: `Current enrollment level: ${currentEnrollment} students`
    });
    
    // Course popularity factor
    const popularityImpact = this.calculateCoursePopularity(courseId);
    factors.push({
      factor: 'Course Popularity',
      impact: popularityImpact,
      weight: 0.3,
      description: `Course popularity index: ${Math.round(popularityImpact * 100)}%`
    });

    return factors;
  }

  private calculateCoursePopularity(courseId: string): number {
    // In a real implementation, this would calculate based on historical data
    return Math.random() * 0.5 + 0.5; // Mock data between 0.5 and 1.0
  }

  private generateEnrollmentRecommendations(predictedEnrollment: number, confidence: number): string[] {
    const recommendations: string[] = [];
    
    if (confidence < 0.6) {
      recommendations.push('Low confidence prediction - consider additional data sources');
    }
    
    if (predictedEnrollment > 40) {
      recommendations.push('High predicted enrollment - ensure adequate room capacity');
    } else if (predictedEnrollment < 20) {
      recommendations.push('Low predicted enrollment - consider course consolidation');
    }
    
    if (confidence > 0.8) {
      recommendations.push('High confidence prediction - suitable for capacity planning');
    }

    return recommendations;
  }

  // Helper methods for room allocation
  private async calculateRoomUtilization(): Promise<Map<string, number>> {
    const utilization = new Map<string, number>();
    
    // Calculate utilization for each room
    for (const room of this.administrativeData.rooms) {
      let hoursUsed = 0;
      const totalPossibleHours = 6 * 5; // 6 hours per day, 5 days per week
      
      Object.values(this.timetableData).forEach(dayData => {
        Object.values(dayData).forEach(slot => {
          if (slot && slot.room === room.name) {
            hoursUsed++;
          }
        });
      });
      
      const utilizationPercentage = (hoursUsed / totalPossibleHours) * 100;
      utilization.set(room.id, utilizationPercentage);
    }

    return utilization;
  }

  private calculateOptimalUtilization(room: any): number {
    // Optimal utilization depends on room type and capacity
    if (room.type === 'Lab') return 70; // Labs need more setup time
    if (room.capacity > 50) return 85; // Large rooms can be more utilized
    return 80; // Standard optimal utilization
  }

  private identifyCoursesForRoom(roomId: string): string[] {
    // In a real implementation, this would identify suitable courses for the room
    return ['Course A', 'Course B', 'Course C'];
  }

  private generateRoomAllocationReasoning(room: any, currentUtilization: number, suggestedUtilization: number): string {
    const improvement = suggestedUtilization - currentUtilization;
    return `Room ${room.name} is currently ${currentUtilization.toFixed(1)}% utilized. Optimal utilization is ${suggestedUtilization}%, representing a ${improvement.toFixed(1)}% improvement opportunity.`;
  }

  private calculateRoomAllocationPriority(improvement: number, capacity: number): number {
    // Priority based on improvement potential and room capacity
    return improvement * (capacity / 100);
  }

  // Helper methods for faculty workload
  private async calculateFacultyWorkloads(): Promise<Map<string, number>> {
    const workloads = new Map<string, number>();
    
    // Calculate workload for each faculty member
    for (const faculty of this.administrativeData.faculties) {
      let hours = 0;
      
      Object.values(this.timetableData).forEach(dayData => {
        Object.values(dayData).forEach(slot => {
          if (slot && slot.facultyName === faculty.name) {
            hours++;
          }
        });
      });
      
      workloads.set(faculty.id, hours);
    }

    return workloads;
  }

  private calculateOptimalFacultyWorkload(faculty: any): number {
    // Optimal workload depends on faculty role and department
    const baseWorkload = 30; // Base hours per week
    const roleMultiplier = this.getRoleMultiplier(faculty.role);
    const departmentMultiplier = this.getDepartmentMultiplier(faculty.department);
    
    return Math.round(baseWorkload * roleMultiplier * departmentMultiplier);
  }

  private getRoleMultiplier(role: string): number {
    const multipliers: { [key: string]: number } = {
      'HOD': 0.8,
      'Professor': 1.0,
      'Associate Professor': 1.1,
      'Assistant Professor': 1.2,
      'Lab Assistant': 0.9,
      'Teaching Assistant': 0.7
    };
    return multipliers[role] || 1.0;
  }

  private getDepartmentMultiplier(department: string): number {
    // Some departments may have different workload requirements
    return 1.0; // Standard multiplier
  }

  private identifyCoursesForFaculty(facultyId: string): string[] {
    // In a real implementation, this would identify suitable courses for the faculty
    return ['Course X', 'Course Y', 'Course Z'];
  }

  private generateFacultyWorkloadReasoning(faculty: any, currentWorkload: number, recommendedWorkload: number): string {
    const adjustment = recommendedWorkload - currentWorkload;
    const direction = adjustment > 0 ? 'increase' : 'decrease';
    return `Faculty ${faculty.name} currently has ${currentWorkload} hours/week. Recommended workload is ${recommendedWorkload} hours/week (${direction} by ${Math.abs(adjustment)} hours).`;
  }

  private calculateFacultyWorkloadPriority(adjustment: number, department: string): number {
    // Priority based on adjustment magnitude and department importance
    return adjustment * 1.2; // Standard priority calculation
  }

  // Helper methods for schedule templates
  private async createScheduleTemplate(department: string, year: number): Promise<ScheduleTemplate | null> {
    // In a real implementation, this would create optimized schedule templates
    const templateId = `${department}-${year}-template`;
    const efficiency = this.calculateTemplateEfficiency(department, year);
    
    if (efficiency < 0.7) return null; // Only create templates with good efficiency
    
    return {
      templateId,
      name: `${department} Year ${year} Template`,
      description: `Optimized schedule template for ${department} department, year ${year}`,
      department,
      year,
      efficiency,
      template: this.timetableData, // Use current timetable as base
      usageCount: 0,
      successRate: efficiency
    };
  }

  private calculateTemplateEfficiency(department: string, year: number): number {
    // Calculate efficiency based on various factors
    return Math.random() * 0.3 + 0.7; // Mock data between 0.7 and 1.0
  }

  // Helper methods for capacity planning
  private async analyzeRoomCapacity(): Promise<CapacityPlanningInsight[]> {
    const insights: CapacityPlanningInsight[] = [];
    const roomUtilization = await this.calculateRoomUtilization();
    
    for (const room of this.administrativeData.rooms) {
      const currentCapacity = room.capacity;
      const currentUtilization = roomUtilization.get(room.id) || 0;
      const projectedDemand = this.projectRoomDemand(room.id);
      const capacityGap = projectedDemand - currentCapacity;
      
      if (Math.abs(capacityGap) > 10) { // Only report significant gaps
        const recommendations = this.generateRoomCapacityRecommendations(capacityGap, room);
        const priority = this.calculateRoomCapacityPriority(Math.abs(capacityGap), room.type);
        
        insights.push({
          resourceType: 'ROOM',
          resourceId: room.id,
          resourceName: room.name,
          currentCapacity,
          projectedDemand,
          capacityGap,
          recommendations,
          priority,
          timeline: this.calculateRoomCapacityTimeline(capacityGap)
        });
      }
    }

    return insights;
  }

  private async analyzeFacultyCapacity(): Promise<CapacityPlanningInsight[]> {
    const insights: CapacityPlanningInsight[] = [];
    const facultyWorkloads = await this.calculateFacultyWorkloads();
    
    for (const faculty of this.administrativeData.faculties) {
      const currentCapacity = 40; // Standard faculty capacity
      const currentWorkload = facultyWorkloads.get(faculty.id) || 0;
      const projectedDemand = this.projectFacultyDemand(faculty.id);
      const capacityGap = projectedDemand - currentCapacity;
      
      if (Math.abs(capacityGap) > 5) { // Only report significant gaps
        const recommendations = this.generateFacultyCapacityRecommendations(capacityGap, faculty);
        const priority = this.calculateFacultyCapacityPriority(Math.abs(capacityGap), faculty.role);
        
        insights.push({
          resourceType: 'FACULTY',
          resourceId: faculty.id,
          resourceName: faculty.name,
          currentCapacity,
          projectedDemand,
          capacityGap,
          recommendations,
          priority,
          timeline: this.calculateFacultyCapacityTimeline(capacityGap)
        });
      }
    }

    return insights;
  }

  private async analyzeEquipmentCapacity(): Promise<CapacityPlanningInsight[]> {
    // In a real implementation, this would analyze equipment capacity
    return [];
  }

  private projectRoomDemand(roomId: string): number {
    // In a real implementation, this would project future room demand
    const room = this.administrativeData.rooms.find(r => r.id === roomId);
    return room ? room.capacity * 1.1 : 50; // 10% growth projection
  }

  private projectFacultyDemand(facultyId: string): number {
    // In a real implementation, this would project future faculty demand
    return 45; // Mock projection
  }

  private generateRoomCapacityRecommendations(capacityGap: number, room: any): string[] {
    const recommendations: string[] = [];
    
    if (capacityGap > 0) {
      recommendations.push(`Room ${room.name} needs ${capacityGap} additional seats`);
      recommendations.push('Consider room expansion or finding alternative spaces');
    } else {
      recommendations.push(`Room ${room.name} has ${Math.abs(capacityGap)} excess capacity`);
      recommendations.push('Consider room consolidation or alternative uses');
    }
    
    return recommendations;
  }

  private generateFacultyCapacityRecommendations(capacityGap: number, faculty: any): string[] {
    const recommendations: string[] = [];
    
    if (capacityGap > 0) {
      recommendations.push(`Faculty ${faculty.name} needs ${capacityGap} additional hours`);
      recommendations.push('Consider hiring additional faculty or redistributing workload');
    } else {
      recommendations.push(`Faculty ${faculty.name} has ${Math.abs(capacityGap)} excess capacity`);
      recommendations.push('Consider additional responsibilities or course assignments');
    }
    
    return recommendations;
  }

  private calculateRoomCapacityPriority(gap: number, roomType: string): number {
    const basePriority = gap;
    const typeMultiplier = roomType === 'Lab' ? 1.5 : 1.0;
    return basePriority * typeMultiplier;
  }

  private calculateFacultyCapacityPriority(gap: number, role: string): number {
    const basePriority = gap;
    const roleMultiplier = role === 'HOD' ? 1.2 : 1.0;
    return basePriority * roleMultiplier;
  }

  private calculateRoomCapacityTimeline(capacityGap: number): string {
    if (Math.abs(capacityGap) > 20) return 'Immediate (1-3 months)';
    if (Math.abs(capacityGap) > 10) return 'Short-term (3-6 months)';
    return 'Long-term (6-12 months)';
  }

  private calculateFacultyCapacityTimeline(capacityGap: number): string {
    if (Math.abs(capacityGap) > 15) return 'Immediate (1-3 months)';
    if (Math.abs(capacityGap) > 8) return 'Short-term (3-6 months)';
    return 'Long-term (6-12 months)';
  }
}
