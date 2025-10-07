# NEP 2020 Compliance Engine

A comprehensive compliance engine for validating and ensuring adherence to NEP 2020 (National Education Policy 2020) requirements in timetable generation and academic scheduling.

## Overview

The NEP 2020 Compliance Engine provides a complete solution for validating academic timetables against NEP 2020 guidelines, detecting conflicts, resolving constraints, and generating detailed compliance reports. It ensures that educational institutions meet the standards set forth in the National Education Policy 2020.

## Features

- **NEP 2020 Validation**: Comprehensive validation against all NEP 2020 requirements
- **Conflict Detection**: Advanced conflict detection across multiple dimensions
- **Constraint Solving**: Intelligent resolution of scheduling conflicts
- **Compliance Reporting**: Detailed reports with actionable recommendations
- **Real-time Monitoring**: Continuous compliance monitoring and validation
- **Automated Resolution**: AI-powered conflict resolution strategies

## Quick Start

```typescript
import { NEPComplianceEngine } from './src/nep';

// Initialize the compliance engine
const engine = new NEPComplianceEngine({
  enableValidation: true,
  enableConflictDetection: true,
  enableConstraintSolving: true,
  enableReporting: true,
  validationThreshold: 70,
  conflictResolutionTimeout: 30000,
  maxRetryAttempts: 3,
  enableCaching: true,
  enableLogging: true
});

// Run complete compliance analysis
const result = await engine.runComplianceAnalysis(
  timetable,
  students,
  faculty,
  subjects,
  {
    organizationId: 'org-123',
    departmentId: 'dept-456',
    semester: 'Fall 2024',
    academicYear: '2024-25',
    generateReport: true,
    resolveConflicts: true,
    optimizeSchedule: true,
    includeRecommendations: true
  }
);

console.log(`Compliance Score: ${result.complianceReport.overallComplianceScore}`);
console.log(`Conflicts Resolved: ${result.constraintSolver.resolvedConflicts.length}`);
```

## Components

### 1. NEPValidator

Validates timetables against NEP 2020 requirements.

```typescript
import { NEPValidator } from './src/nep';

const validator = new NEPValidator();
const result = await validator.validateTimetable(timetable, students, faculty, subjects);

console.log(`Compliance Score: ${result.complianceScore}`);
console.log(`Violations: ${result.violations.length}`);
console.log(`Recommendations: ${result.recommendations.length}`);
```

**Validation Rules:**
- Credit distribution: 60% core, 30% elective, 10% skill-based
- Maximum 6 contact hours per day per student
- Minimum 75% attendance capability
- Continuous assessment (40%) + Final exam (60%) pattern
- Practical sessions in minimum 2-hour blocks
- Choice-based credit system compliance

### 2. ConflictDetector

Detects various types of conflicts in timetable schedules.

```typescript
import { ConflictDetector } from './src/nep';

const detector = new ConflictDetector();
const result = await detector.detectConflicts(timetable, faculty, students, subjects);

console.log(`Total Conflicts: ${result.conflicts.length}`);
console.log(`Critical Conflicts: ${result.summary.criticalConflicts}`);
console.log(`Major Conflicts: ${result.summary.majorConflicts}`);
```

**Conflict Types:**
- Faculty double-booking detection
- Room capacity vs enrollment conflicts
- Student subject choice conflicts
- Time slot overlaps
- Prerequisites not met
- Credit overload detection
- Room double-booking
- Faculty overload
- Student overload
- Resource unavailable

### 3. ConstraintSolver

Resolves conflicts and optimizes timetable schedules.

```typescript
import { ConstraintSolver } from './src/nep';

const solver = new ConstraintSolver();
const result = await solver.solveConflicts(timetable, conflicts, faculty, students, subjects);

console.log(`Resolved Conflicts: ${result.resolvedConflicts.length}`);
console.log(`Resolution Rate: ${result.optimizationMetrics.resolutionRate}%`);
console.log(`Overall Score: ${result.optimizationMetrics.overallScore}`);
```

**Resolution Strategies:**
- Priority-based conflict resolution
- Alternative slot suggestions
- Faculty workload balancing
- Room utilization optimization
- Automatic rescheduling
- Resource reassignment

### 4. ComplianceReporter

Generates comprehensive compliance reports.

```typescript
import { ComplianceReporter } from './src/nep';

const reporter = new ComplianceReporter();
const report = await reporter.generateComplianceReport(
  validation,
  conflictDetection,
  constraintSolver,
  organizationId,
  departmentId,
  semester,
  academicYear
);

console.log(`Report ID: ${report.reportId}`);
console.log(`Overall Score: ${report.overallComplianceScore}`);
console.log(`Action Items: ${report.actionItems.length}`);
```

**Report Sections:**
- Executive Summary
- NEP Compliance Analysis
- Conflict Resolution Status
- Optimization Metrics
- Detailed Recommendations
- Action Items
- Risk Assessment

## Usage Examples

### Basic Validation

```typescript
// Validate a timetable
const isCompliant = await engine.isNEPCompliant(timetable, students, faculty, subjects);
console.log(`Is NEP Compliant: ${isCompliant}`);

// Get compliance score
const score = await engine.getComplianceScore(timetable, students, faculty, subjects);
console.log(`Compliance Score: ${score}`);

// Get recommendations
const recommendations = await engine.getComplianceRecommendations(timetable, students, faculty, subjects);
recommendations.forEach(rec => console.log(`- ${rec}`));
```

### Conflict Detection and Resolution

```typescript
// Detect conflicts
const conflictResult = await engine.detectConflicts(timetable, faculty, students, subjects);
console.log(`Found ${conflictResult.conflicts.length} conflicts`);

// Solve conflicts
const solverResult = await engine.solveConflicts(
  timetable,
  conflictResult.conflicts,
  faculty,
  students,
  subjects
);
console.log(`Resolved ${solverResult.resolvedConflicts.length} conflicts`);
```

### Comprehensive Analysis

```typescript
// Run complete analysis
const analysis = await engine.runComplianceAnalysis(
  timetable,
  students,
  faculty,
  subjects,
  {
    organizationId: 'org-123',
    departmentId: 'dept-456',
    semester: 'Fall 2024',
    academicYear: '2024-25',
    generateReport: true,
    resolveConflicts: true,
    optimizeSchedule: true,
    includeRecommendations: true
  }
);

// Access results
console.log(`Success: ${analysis.success}`);
console.log(`Processing Time: ${analysis.processingTime}ms`);
console.log(`Overall Score: ${analysis.complianceReport.overallComplianceScore}`);
console.log(`Violations: ${analysis.validation.violations.length}`);
console.log(`Conflicts: ${analysis.conflictDetection.conflicts.length}`);
console.log(`Resolved: ${analysis.constraintSolver.resolvedConflicts.length}`);
```

## Configuration

### NEPComplianceEngineConfig

```typescript
interface NEPComplianceEngineConfig {
  enableValidation: boolean;           // Enable NEP validation
  enableConflictDetection: boolean;   // Enable conflict detection
  enableConstraintSolving: boolean;   // Enable constraint solving
  enableReporting: boolean;           // Enable compliance reporting
  validationThreshold: number;        // Minimum compliance score (0-100)
  conflictResolutionTimeout: number;  // Timeout for conflict resolution (ms)
  maxRetryAttempts: number;          // Maximum retry attempts
  enableCaching: boolean;            // Enable result caching
  enableLogging: boolean;            // Enable detailed logging
}
```

### Example Configuration

```typescript
const config: NEPComplianceEngineConfig = {
  enableValidation: true,
  enableConflictDetection: true,
  enableConstraintSolving: true,
  enableReporting: true,
  validationThreshold: 80,           // Require 80% compliance
  conflictResolutionTimeout: 60000,  // 60 second timeout
  maxRetryAttempts: 5,              // 5 retry attempts
  enableCaching: true,              // Enable caching
  enableLogging: true               // Enable logging
};

const engine = new NEPComplianceEngine(config);
```

## NEP 2020 Compliance Rules

### Credit Distribution
- **Core Subjects**: 60% of total credits
- **Elective Subjects**: 30% of total credits
- **Skill-based Subjects**: 10% of total credits

### Contact Hours
- **Maximum Daily Hours**: 6 hours per student per day
- **Maximum Weekly Hours**: 30 hours per student per week
- **Break Requirements**: Minimum 30 minutes between classes

### Attendance
- **Minimum Attendance**: 75% attendance required
- **Tracking Capability**: Must be able to track attendance
- **Documentation**: Attendance records must be maintained

### Assessment Pattern
- **Continuous Assessment**: 40% of total marks
- **Final Examination**: 60% of total marks
- **Assessment Components**: Assignments, quizzes, projects, exams

### Practical Sessions
- **Minimum Duration**: 2 hours per practical session
- **Block Scheduling**: Practicals must be scheduled in blocks
- **Equipment Requirements**: Adequate equipment and facilities

### Choice-Based Credit System (CBCS)
- **Student Choice**: Students must have choice in subject selection
- **Credit Transfer**: Credits must be transferable
- **Multiple Entry/Exit**: Support for multiple entry and exit points
- **Flexible Pathways**: Flexible learning pathways

## Error Handling

```typescript
try {
  const result = await engine.runComplianceAnalysis(timetable, students, faculty, subjects, options);
  
  if (result.success) {
    console.log('Analysis completed successfully');
    console.log(`Compliance Score: ${result.complianceReport.overallComplianceScore}`);
  } else {
    console.error('Analysis failed');
    result.errors.forEach(error => console.error(`Error: ${error}`));
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## Performance Considerations

### Caching
- Enable caching for repeated analyses
- Cache validation results for similar timetables
- Cache conflict detection results

### Timeout Settings
- Set appropriate timeouts for conflict resolution
- Use retry mechanisms for transient failures
- Monitor processing times

### Memory Usage
- Process large datasets in batches
- Use streaming for large timetables
- Monitor memory usage during analysis

## Testing

Run the test suite:

```bash
npm test
```

### Test Coverage
- Unit tests for all components
- Integration tests for complete workflows
- Edge case testing
- Performance testing
- Error handling testing

### Test Data
- Mock timetables with various scenarios
- Test data for different NEP compliance levels
- Conflict scenarios for testing resolution
- Edge cases and error conditions

## Best Practices

### 1. Regular Validation
- Validate timetables before deployment
- Run compliance checks after changes
- Monitor compliance scores over time

### 2. Conflict Resolution
- Address conflicts promptly
- Use automated resolution when possible
- Document resolution strategies

### 3. Reporting
- Generate regular compliance reports
- Track compliance trends
- Use reports for decision making

### 4. Configuration
- Set appropriate thresholds
- Enable relevant features
- Monitor performance metrics

## Integration

### With Timetable Generation
```typescript
// Generate timetable
const timetable = await generateTimetable(requirements);

// Validate compliance
const isCompliant = await engine.isNEPCompliant(timetable, students, faculty, subjects);

if (!isCompliant) {
  // Resolve conflicts
  const conflicts = await engine.detectConflicts(timetable, faculty, students, subjects);
  const resolved = await engine.solveConflicts(timetable, conflicts, faculty, students, subjects);
  
  // Use resolved timetable
  timetable = resolved.optimizedTimetable;
}
```

### With Academic Management Systems
```typescript
// Integrate with existing systems
const complianceData = await engine.runComplianceAnalysis(timetable, students, faculty, subjects, options);

// Update system records
await updateComplianceRecords(complianceData.complianceReport);
await notifyStakeholders(complianceData.complianceReport);
```

## Troubleshooting

### Common Issues

1. **Low Compliance Scores**
   - Check credit distribution
   - Verify contact hours
   - Review assessment patterns

2. **High Conflict Counts**
   - Check faculty availability
   - Verify room capacities
   - Review student enrollments

3. **Resolution Failures**
   - Increase timeout settings
   - Check resource availability
   - Review constraint priorities

4. **Performance Issues**
   - Enable caching
   - Reduce data size
   - Optimize queries

### Debug Mode

```typescript
const engine = new NEPComplianceEngine({
  enableLogging: true,
  enableCaching: false,
  validationThreshold: 50
});

// Enable detailed logging
console.log('Engine Status:', engine.getStatus());
```

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the test cases
- Contact the development team

