/**
 * NEP 2020 Compliance Engine
 * Main export file for all NEP compliance components
 */

// Core components
export { NEPValidator } from './NEPValidator';
export { ConflictDetector } from './ConflictDetector';
export { ConstraintSolver } from './ConstraintSolver';
export { ComplianceReporter } from './ComplianceReporter';
export { NEPComplianceEngine } from './NEPComplianceEngine';

// Types and interfaces
export type { 
  NEPValidationResult, 
  NEPViolation, 
  NEPWarning, 
  CreditDistribution, 
  AttendanceCapability, 
  AssessmentPattern, 
  PracticalBlock, 
  CBCCompliance 
} from './NEPValidator';

export type { 
  ConflictDetectionResult, 
  Conflict, 
  AffectedEntity, 
  ConflictSummary, 
  ConflictType 
} from './ConflictDetector';

export type { 
  ConstraintSolverResult, 
  ResolvedConflict, 
  ConflictResolution, 
  OptimizationMetrics, 
  ResolutionType 
} from './ConstraintSolver';

export type { 
  ComplianceReport, 
  NEPComplianceSection, 
  CreditDistributionReport, 
  ContactHoursReport, 
  AttendanceReport, 
  AssessmentReport, 
  PracticalBlocksReport, 
  CBCComplianceReport, 
  NEPViolationReport, 
  ConflictResolutionSection, 
  ConflictTypeReport, 
  ResolutionStrategyReport, 
  OptimizationSection, 
  OptimizationImprovement, 
  RecommendationSection, 
  RecommendationCategory, 
  Recommendation, 
  ExecutiveSummary, 
  RiskAssessment, 
  Risk, 
  DetailedAnalysis, 
  ValidationResult, 
  ActionItem 
} from './ComplianceReporter';

export type { 
  NEPComplianceEngineConfig, 
  NEPComplianceResult, 
  NEPComplianceOptions 
} from './NEPComplianceEngine';

