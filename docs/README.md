# NEP 2020 Compliant Timetable System - TypeScript Interfaces

## Overview

This package provides comprehensive TypeScript interfaces and services for building NEP 2020 compliant timetable management systems. It includes complete type definitions, validation utilities, and service classes for managing students, faculty, subjects, and timetables with full NEP compliance.

## Features

- ✅ **Complete TypeScript Interfaces** for all entities
- ✅ **NEP 2020 Compliance Validation** with configurable rules
- ✅ **Comprehensive Timetable Generation** with conflict resolution
- ✅ **Multi-tenant Architecture** support
- ✅ **Choice-based Credit System (CBCS)** implementation
- ✅ **Advanced Constraint Management** system
- ✅ **Real-time Conflict Detection** and resolution
- ✅ **Faculty Workload Management** with limits
- ✅ **Room Utilization Optimization**
- ✅ **Attendance and Assessment Tracking**

## Installation

```bash
npm install @prisma/client prisma
npm install typescript @types/node
```

## Quick Start

### 1. Basic Setup

```typescript
import { PrismaClient } from '@prisma/client';
import { TimetableService } from './src/services/timetable-service';
import { StudentProfile, FacultyProfile, TimetableRequest } from './src/types/nep-interfaces';

const prisma = new PrismaClient();
const timetableService = new TimetableService(prisma);
```

### 2. Get Student Profile with NEP Compliance

```typescript
const studentId = 'student_123';
const studentProfile = await timetableService.getStudentProfile(studentId);

if (studentProfile) {
  console.log('Student NEP Compliance:', {
    isCompliant: studentProfile.nepCompliance.isCompliant,
    coreCredits: studentProfile.coreCreditsEarned,
    electiveCredits: studentProfile.electiveCreditsEarned,
    skillCredits: studentProfile.skillCreditsEarned,
    violations: studentProfile.nepCompliance.violations
  });
}
```

### 3. Generate NEP Compliant Timetable

```typescript
const timetableRequest: TimetableRequest = {
  id: 'request_001',
  organizationId: 'org_123',
  academicYearId: 'year_2024_25',
  semesterId: 'sem_odd_2024',
  name: 'CSE 3rd Year Timetable',
  year: 3,
  departmentId: 'dept_cse',
  preferences: {
    enforceNEPCompliance: true,
    strictCreditDistribution: true,
    minimizeConflicts: true,
    optimizeFacultyWorkload: true,
    // ... other preferences
  },
  constraints: [
    // NEP compliance constraints
  ],
  optimization: {
    maxIterations: 1000,
    weights: {
      nepComplianceBonus: 8.0,
      conflictPenalty: 10.0,
      // ... other weights
    }
  },
  requestedBy: 'admin_001',
  requestedAt: new Date(),
  priority: Priority.HIGH,
  status: 'PENDING'
};

const response = await timetableService.generateTimetable(timetableRequest);
console.log('Timetable Generated:', response.success);
```

## Core Interfaces

### StudentProfile

Complete student data with NEP compliance tracking:

```typescript
interface StudentProfile {
  id: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  currentYear: number;
  currentSemester: number;
  
  // NEP 2020 Credit Tracking
  totalCreditsEarned: number;
  coreCreditsEarned: number;
  electiveCreditsEarned: number;
  skillCreditsEarned: number;
  
  // Chosen Subjects
  enrolledSubjects: EnrolledSubject[];
  
  // NEP Compliance Status
  nepCompliance: NEPComplianceStatus;
  
  // Attendance and Assessment
  attendanceRecords: AttendanceRecord[];
  assessmentRecords: AssessmentRecord[];
}
```

### FacultyProfile

Faculty with specializations and workload management:

```typescript
interface FacultyProfile {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  designation: string;
  
  // NEP 2020 Specific
  specializations: string[];
  nepCategories: NepCategory[];
  
  // Workload Management
  maxHoursPerWeek: number;
  currentWorkload: number;
  isAvailable: boolean;
  
  // Availability Windows
  availability: FacultyAvailability[];
  
  // Workload Analysis
  workloadAnalysis: FacultyWorkloadAnalysis;
  performanceMetrics: FacultyPerformanceMetrics;
}
```

### SubjectDetails

NEP-compliant subject with credit categories and prerequisites:

```typescript
interface SubjectDetails {
  id: string;
  code: string;
  name: string;
  
  // NEP 2020 Classification
  nepCategory: NepCategory;
  credits: number;
  lectureHours: number;
  tutorialHours: number;
  practicalHours: number;
  
  // Prerequisites
  prerequisites: SubjectPrerequisite[];
  
  // Assessment Configuration
  continuousAssessmentWeight: number; // 40%
  endSemesterExamWeight: number; // 60%
  assessmentPattern: AssessmentPattern;
  
  // NEP Validation
  nepValidation: SubjectNEPValidation;
}
```

### GeneratedTimetable

Final schedule with conflict resolution data:

```typescript
interface GeneratedTimetable {
  id: string;
  name: string;
  status: TimetableStatus;
  
  // Optimization Results
  totalConflicts: number;
  optimizationScore: number;
  qualityMetrics: TimetableQualityMetrics;
  
  // Schedule Data
  slots: ScheduleSlot[];
  
  // NEP Compliance
  nepCompliance: TimetableNEPCompliance;
  
  // Statistics
  statistics: TimetableStatistics;
  validation: TimetableValidation;
}
```

## NEP 2020 Compliance Features

### Credit Distribution Validation

```typescript
// Check if student meets NEP credit distribution
const compliance = await timetableService.checkStudentNEPCompliance(studentId);

console.log('NEP Compliance:', {
  isCompliant: compliance.isCompliant,
  corePercentage: compliance.detailedBreakdown.creditDistribution.core.percentage,
  electivePercentage: compliance.detailedBreakdown.creditDistribution.elective.percentage,
  skillPercentage: compliance.detailedBreakdown.creditDistribution.skill.percentage,
  violations: compliance.violations
});
```

### Assessment Pattern Validation

```typescript
// Validate subject assessment pattern
const subjectValidator = new SubjectDetailsValidator();
const validation = subjectValidator.validateNEPCompliance(subject);

console.log('Assessment Validation:', {
  continuousWeight: subject.continuousAssessmentWeight, // Should be 40%
  endSemesterWeight: subject.endSemesterExamWeight,    // Should be 60%
  isValid: validation.isValid
});
```

### Faculty Workload Management

```typescript
// Check faculty workload compliance
const facultyValidator = new FacultyProfileValidator();
const workloadValidation = facultyValidator.validateWorkload(faculty);

console.log('Workload Validation:', {
  currentHours: faculty.currentWorkload,
  maxHours: faculty.maxHoursPerWeek,
  utilizationPercentage: faculty.workloadAnalysis.utilizationPercentage,
  isOverloaded: faculty.workloadAnalysis.isOverloaded
});
```

## Validation Rules

### NEP Validation Rules

```typescript
const nepRules = {
  // Credit Distribution (NEP 2020)
  corePercentage: 60,        // 60% core subjects
  electivePercentage: 30,    // 30% elective subjects
  skillPercentage: 10,       // 10% skill-based subjects
  
  // Credit Limits
  minCreditsPerSemester: 20,
  maxCreditsPerSemester: 30,
  totalCreditsForDegree: 160,
  
  // Daily Limits
  maxHoursPerDay: 6,         // Maximum 6 hours per day
  minBreakBetweenClasses: 15, // 15 minutes break
  
  // Practical Requirements
  minPracticalBlockDuration: 120, // 2 hours minimum
  practicalSessionGap: 30,        // 30 minutes gap
  
  // Attendance Requirements
  minAttendancePercentage: 75,    // 75% attendance required
  attendanceTrackingRequired: true,
  
  // Assessment Pattern
  continuousAssessmentWeight: 40, // 40% continuous assessment
  endSemesterExamWeight: 60,      // 60% end semester exam
  
  // Faculty Constraints
  maxFacultyHoursPerWeek: 40,
  minFacultyHoursPerWeek: 20,
  facultyLunchBreakRequired: true,
  facultyLunchBreakDuration: 60   // 1 hour lunch break
};
```

### Custom Validation Rules

```typescript
import { createCustomNEPRules } from './src/utils/nep-validation';

// Create custom NEP rules for specific institution
const customRules = createCustomNEPRules({
  corePercentage: 65,        // 65% core instead of 60%
  electivePercentage: 25,    // 25% elective instead of 30%
  skillPercentage: 10,       // 10% skill-based (same)
  maxHoursPerDay: 7,         // 7 hours instead of 6
  continuousAssessmentWeight: 45, // 45% instead of 40%
  endSemesterExamWeight: 55,      // 55% instead of 60%
});

// Use custom rules for validation
const validator = new StudentProfileValidator(customRules);
const validation = validator.validateNEPCompliance(student);
```

## Advanced Features

### Conflict Detection and Resolution

```typescript
// Detect conflicts in timetable
const conflicts = await timetableService.resolveConflicts(timetableId);

console.log('Conflict Resolution:', {
  resolvedConflicts: conflicts.resolvedConflicts,
  remainingConflicts: conflicts.remainingConflicts,
  resolutionActions: conflicts.resolutionActions
});
```

### Timetable Optimization

```typescript
const optimizationParams = {
  maxIterations: 1000,
  convergenceThreshold: 0.01,
  populationSize: 50,
  mutationRate: 0.1,
  crossoverRate: 0.8,
  weights: {
    conflictPenalty: 10.0,
    workloadPenalty: 5.0,
    utilizationPenalty: 3.0,
    preferenceBonus: 2.0,
    nepComplianceBonus: 8.0  // High weight for NEP compliance
  }
};
```

### Batch Timetable Generation

```typescript
// Generate timetables for multiple years/departments
const batchRequest: TimetableRequest = {
  // ... basic request data
  name: 'Batch Timetable - All Years',
  departmentId: 'dept_cse',
  preferences: {
    enforceNEPCompliance: true,
    strictCreditDistribution: true,
    // ... other preferences
  },
  optimization: {
    maxIterations: 2000,  // More iterations for complex timetables
    populationSize: 100,  // Larger population
    // ... other parameters
  }
};
```

## Error Handling

### Comprehensive Error Handling

```typescript
try {
  const response = await timetableService.generateTimetable(request);
  
  if (!response.success) {
    console.error('Generation failed:', response.errors);
    return;
  }
  
  // Validate generated timetable
  const validator = new TimetableValidator();
  const validation = validator.validateTimetable(response.timetable);
  
  if (!validation.isValid) {
    console.warn('Validation issues:', validation.errors);
    console.log('Recommendations:', validation.recommendations);
  }
  
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## Performance Considerations

### Optimization Tips

1. **Use Indexing**: Ensure proper database indexing for frequently queried fields
2. **Batch Operations**: Use batch operations for multiple timetable generations
3. **Caching**: Cache frequently accessed data like faculty availability
4. **Pagination**: Implement pagination for large datasets
5. **Background Processing**: Use background jobs for complex timetable generation

### Memory Management

```typescript
// Process large datasets in chunks
const processLargeDataset = async (items: any[], chunkSize: number = 100) => {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await processChunk(chunk);
    
    // Allow garbage collection
    if (i % (chunkSize * 10) === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }
};
```

## Testing

### Unit Testing

```typescript
import { StudentProfileValidator } from './src/utils/nep-validation';

describe('StudentProfileValidator', () => {
  test('should validate NEP compliance correctly', () => {
    const validator = new StudentProfileValidator();
    const student = createMockStudent();
    
    const result = validator.validateNEPCompliance(student);
    
    expect(result.isCompliant).toBe(true);
    expect(result.complianceScore).toBeGreaterThan(80);
  });
});
```

### Integration Testing

```typescript
describe('TimetableService', () => {
  test('should generate NEP compliant timetable', async () => {
    const service = new TimetableService(prisma);
    const request = createMockTimetableRequest();
    
    const response = await service.generateTimetable(request);
    
    expect(response.success).toBe(true);
    expect(response.timetable.nepCompliance.isCompliant).toBe(true);
  });
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions and support:
- Create an issue in the repository
- Check the documentation
- Review the examples in `/docs/Usage_Examples.ts`

## Changelog

### v1.0.0
- Initial release with complete NEP 2020 compliance
- Comprehensive TypeScript interfaces
- Advanced validation utilities
- Timetable generation service
- Conflict detection and resolution
- Multi-tenant architecture support

