/**
 * Query Analyzer for Timetable Generation
 * Analyzes timetable requests to determine optimal data retrieval strategy
 */

import { DocumentType, ChunkType } from '../rag/DocumentProcessor';
import { RAGService, RAGSearchOptions } from '../rag/RAGService';
import { PrismaClient } from '@prisma/client';

export interface TimetableRequest {
  type: 'FACULTY_SCHEDULE' | 'STUDENT_SCHEDULE' | 'BATCH_SCHEDULE' | 'DEPARTMENT_SCHEDULE';
  facultyId?: string;
  studentId?: string;
  year?: number;
  departmentId?: string;
  semester?: string;
  chosenSubjects?: string[];
  constraints?: string[];
  preferences?: Record<string, any>;
  organizationId: string;
}

export interface RetrievalPlan {
  strategy: 'HIERARCHICAL' | 'MULTIMODAL' | 'CONFLICT_AWARE' | 'OPTIMIZED';
  dataTypes: DocumentType[];
  chunkTypes: ChunkType[];
  searchQueries: SearchQuery[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedTokens: number;
  maxResults: number;
  filters: Record<string, any>;
}

export interface SearchQuery {
  query: string;
  documentTypes: DocumentType[];
  chunkTypes?: ChunkType[];
  filters: Record<string, any>;
  weight: number;
  priority: number;
}

export interface AnalysisResult {
  requestType: TimetableRequest['type'];
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  retrievalPlan: RetrievalPlan;
  estimatedDataSize: number;
  recommendedStrategy: string;
  potentialConflicts: string[];
  optimizationSuggestions: string[];
}

export class QueryAnalyzer {
  private ragService: RAGService;
  private prisma: PrismaClient;

  constructor(ragService: RAGService, prisma: PrismaClient) {
    this.ragService = ragService;
    this.prisma = prisma;
  }

  /**
   * Analyze timetable request and create retrieval plan
   */
  async analyzeRequest(request: TimetableRequest): Promise<AnalysisResult> {
    console.log('Analyzing timetable request:', request);

    const requestType = this.determineRequestType(request);
    const complexity = this.assessComplexity(request);
    const retrievalPlan = await this.createRetrievalPlan(request, requestType, complexity);
    const estimatedDataSize = this.estimateDataSize(retrievalPlan);
    const potentialConflicts = await this.identifyPotentialConflicts(request);
    const optimizationSuggestions = this.generateOptimizationSuggestions(request, complexity);

    return {
      requestType,
      complexity,
      retrievalPlan,
      estimatedDataSize,
      recommendedStrategy: retrievalPlan.strategy,
      potentialConflicts,
      optimizationSuggestions
    };
  }

  /**
   * Determine the type of timetable request
   */
  private determineRequestType(request: TimetableRequest): TimetableRequest['type'] {
    if (request.facultyId) {
      return 'FACULTY_SCHEDULE';
    } else if (request.studentId) {
      return 'STUDENT_SCHEDULE';
    } else if (request.year && request.departmentId) {
      return 'BATCH_SCHEDULE';
    } else if (request.departmentId) {
      return 'DEPARTMENT_SCHEDULE';
    }
    
    throw new Error('Unable to determine request type');
  }

  /**
   * Assess complexity of the request
   */
  private assessComplexity(request: TimetableRequest): 'SIMPLE' | 'MODERATE' | 'COMPLEX' {
    let complexityScore = 0;

    // Base complexity by request type
    switch (request.type) {
      case 'FACULTY_SCHEDULE':
        complexityScore = 2;
        break;
      case 'STUDENT_SCHEDULE':
        complexityScore = 3;
        break;
      case 'BATCH_SCHEDULE':
        complexityScore = 5;
        break;
      case 'DEPARTMENT_SCHEDULE':
        complexityScore = 8;
        break;
    }

    // Additional complexity factors
    if (request.chosenSubjects && request.chosenSubjects.length > 5) {
      complexityScore += 2;
    }
    if (request.constraints && request.constraints.length > 3) {
      complexityScore += 2;
    }
    if (request.preferences && Object.keys(request.preferences).length > 5) {
      complexityScore += 1;
    }

    if (complexityScore <= 3) return 'SIMPLE';
    if (complexityScore <= 6) return 'MODERATE';
    return 'COMPLEX';
  }

  /**
   * Create retrieval plan based on request analysis
   */
  private async createRetrievalPlan(
    request: TimetableRequest,
    requestType: TimetableRequest['type'],
    complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX'
  ): Promise<RetrievalPlan> {
    switch (requestType) {
      case 'FACULTY_SCHEDULE':
        return this.createFacultySchedulePlan(request, complexity);
      case 'STUDENT_SCHEDULE':
        return this.createStudentSchedulePlan(request, complexity);
      case 'BATCH_SCHEDULE':
        return this.createBatchSchedulePlan(request, complexity);
      case 'DEPARTMENT_SCHEDULE':
        return this.createDepartmentSchedulePlan(request, complexity);
      default:
        throw new Error('Unknown request type');
    }
  }

  /**
   * Create retrieval plan for faculty schedule
   */
  private async createFacultySchedulePlan(
    request: TimetableRequest,
    complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX'
  ): Promise<RetrievalPlan> {
    const facultyId = request.facultyId!;
    
    // Get faculty details
    const faculty = await this.prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { department: true }
    });

    if (!faculty) {
      throw new Error('Faculty not found');
    }

    const searchQueries: SearchQuery[] = [
      {
        query: `faculty ${faculty.firstName} ${faculty.lastName} availability and specializations`,
        documentTypes: [DocumentType.FACULTY],
        chunkTypes: [ChunkType.FACULTY_AVAILABILITY, ChunkType.FACULTY_SPECIALIZATIONS],
        filters: { facultyId, organizationId: request.organizationId },
        weight: 1.0,
        priority: 1
      },
      {
        query: `subjects taught by ${faculty.firstName} ${faculty.lastName}`,
        documentTypes: [DocumentType.SUBJECT],
        chunkTypes: [ChunkType.SUBJECT_DETAILS],
        filters: { 
          facultyId, 
          organizationId: request.organizationId,
          departmentId: faculty.departmentId
        },
        weight: 0.9,
        priority: 2
      },
      {
        query: `students enrolled in subjects taught by ${faculty.firstName} ${faculty.lastName}`,
        documentTypes: [DocumentType.STUDENT],
        chunkTypes: [ChunkType.STUDENT_ENROLLMENT],
        filters: { 
          organizationId: request.organizationId,
          departmentId: faculty.departmentId
        },
        weight: 0.8,
        priority: 3
      },
      {
        query: `rooms suitable for ${faculty.department.name} classes`,
        documentTypes: [DocumentType.ROOM],
        chunkTypes: [ChunkType.ROOM_DETAILS, ChunkType.ROOM_AVAILABILITY],
        filters: { 
          organizationId: request.organizationId,
          roomType: 'LECTURE_HALL'
        },
        weight: 0.7,
        priority: 4
      }
    ];

    // Add constraint queries for complex requests
    if (complexity === 'COMPLEX') {
      searchQueries.push({
        query: `NEP compliance rules and faculty workload constraints`,
        documentTypes: [DocumentType.POLICY, DocumentType.CONSTRAINT],
        chunkTypes: [ChunkType.CONSTRAINT_RULE, ChunkType.NEP_COMPLIANCE],
        filters: { 
          organizationId: request.organizationId,
          constraintType: 'FACULTY_MAX_HOURS_PER_WEEK'
        },
        weight: 0.6,
        priority: 5
      });
    }

    return {
      strategy: complexity === 'COMPLEX' ? 'CONFLICT_AWARE' : 'HIERARCHICAL',
      dataTypes: [DocumentType.FACULTY, DocumentType.SUBJECT, DocumentType.STUDENT, DocumentType.ROOM],
      chunkTypes: [
        ChunkType.FACULTY_AVAILABILITY,
        ChunkType.FACULTY_SPECIALIZATIONS,
        ChunkType.SUBJECT_DETAILS,
        ChunkType.STUDENT_ENROLLMENT,
        ChunkType.ROOM_DETAILS,
        ChunkType.ROOM_AVAILABILITY
      ],
      searchQueries,
      priority: 'HIGH',
      estimatedTokens: this.estimateTokens(searchQueries, complexity),
      maxResults: complexity === 'SIMPLE' ? 50 : complexity === 'MODERATE' ? 100 : 200,
      filters: {
        facultyId,
        organizationId: request.organizationId,
        departmentId: faculty.departmentId
      }
    };
  }

  /**
   * Create retrieval plan for student schedule
   */
  private async createStudentSchedulePlan(
    request: TimetableRequest,
    complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX'
  ): Promise<RetrievalPlan> {
    const studentId = request.studentId!;
    
    // Get student details
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { 
        department: true,
        enrollments: {
          include: { subject: true }
        }
      }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const chosenSubjects = request.chosenSubjects || 
      student.enrollments.map(e => e.subject.code);

    const searchQueries: SearchQuery[] = [
      {
        query: `student ${student.firstName} ${student.lastName} enrollment and credit tracking`,
        documentTypes: [DocumentType.STUDENT],
        chunkTypes: [ChunkType.STUDENT_PROFILE, ChunkType.STUDENT_ENROLLMENT, ChunkType.STUDENT_CREDITS],
        filters: { 
          studentId, 
          organizationId: request.organizationId 
        },
        weight: 1.0,
        priority: 1
      },
      {
        query: `subjects ${chosenSubjects.join(' ')} details and prerequisites`,
        documentTypes: [DocumentType.SUBJECT],
        chunkTypes: [ChunkType.SUBJECT_DETAILS, ChunkType.SUBJECT_PREREQUISITES],
        filters: { 
          organizationId: request.organizationId,
          subjectCodes: chosenSubjects
        },
        weight: 0.9,
        priority: 2
      },
      {
        query: `faculty available to teach ${chosenSubjects.join(' ')} subjects`,
        documentTypes: [DocumentType.FACULTY],
        chunkTypes: [ChunkType.FACULTY_AVAILABILITY, ChunkType.FACULTY_SPECIALIZATIONS],
        filters: { 
          organizationId: request.organizationId,
          departmentId: student.departmentId,
          isAvailable: true
        },
        weight: 0.8,
        priority: 3
      },
      {
        query: `rooms suitable for ${student.department.name} classes`,
        documentTypes: [DocumentType.ROOM],
        chunkTypes: [ChunkType.ROOM_DETAILS, ChunkType.ROOM_AVAILABILITY],
        filters: { 
          organizationId: request.organizationId,
          roomType: 'LECTURE_HALL'
        },
        weight: 0.7,
        priority: 4
      }
    ];

    // Add NEP compliance queries
    searchQueries.push({
      query: `NEP 2020 compliance rules for student credit distribution`,
      documentTypes: [DocumentType.POLICY],
      chunkTypes: [ChunkType.NEP_COMPLIANCE],
      filters: { 
        organizationId: request.organizationId,
        policyType: 'NEP_COMPLIANCE'
      },
      weight: 0.6,
      priority: 5
    });

    return {
      strategy: 'MULTIMODAL',
      dataTypes: [DocumentType.STUDENT, DocumentType.SUBJECT, DocumentType.FACULTY, DocumentType.ROOM, DocumentType.POLICY],
      chunkTypes: [
        ChunkType.STUDENT_PROFILE,
        ChunkType.STUDENT_ENROLLMENT,
        ChunkType.STUDENT_CREDITS,
        ChunkType.SUBJECT_DETAILS,
        ChunkType.SUBJECT_PREREQUISITES,
        ChunkType.FACULTY_AVAILABILITY,
        ChunkType.ROOM_DETAILS,
        ChunkType.NEP_COMPLIANCE
      ],
      searchQueries,
      priority: 'HIGH',
      estimatedTokens: this.estimateTokens(searchQueries, complexity),
      maxResults: complexity === 'SIMPLE' ? 75 : complexity === 'MODERATE' ? 150 : 300,
      filters: {
        studentId,
        organizationId: request.organizationId,
        departmentId: student.departmentId,
        chosenSubjects
      }
    };
  }

  /**
   * Create retrieval plan for batch schedule
   */
  private async createBatchSchedulePlan(
    request: TimetableRequest,
    complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX'
  ): Promise<RetrievalPlan> {
    const year = request.year!;
    const departmentId = request.departmentId!;

    // Get department details
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId }
    });

    if (!department) {
      throw new Error('Department not found');
    }

    const searchQueries: SearchQuery[] = [
      {
        query: `students in ${department.name} year ${year} batch`,
        documentTypes: [DocumentType.STUDENT],
        chunkTypes: [ChunkType.STUDENT_PROFILE, ChunkType.STUDENT_ENROLLMENT],
        filters: { 
          organizationId: request.organizationId,
          departmentId,
          year
        },
        weight: 1.0,
        priority: 1
      },
      {
        query: `subjects offered for ${department.name} year ${year}`,
        documentTypes: [DocumentType.SUBJECT],
        chunkTypes: [ChunkType.SUBJECT_DETAILS, ChunkType.SUBJECT_PREREQUISITES],
        filters: { 
          organizationId: request.organizationId,
          departmentId,
          offeredInYears: year
        },
        weight: 0.9,
        priority: 2
      },
      {
        query: `faculty available to teach ${department.name} year ${year} subjects`,
        documentTypes: [DocumentType.FACULTY],
        chunkTypes: [ChunkType.FACULTY_AVAILABILITY, ChunkType.FACULTY_SPECIALIZATIONS],
        filters: { 
          organizationId: request.organizationId,
          departmentId,
          isAvailable: true
        },
        weight: 0.8,
        priority: 3
      },
      {
        query: `rooms available for ${department.name} classes`,
        documentTypes: [DocumentType.ROOM],
        chunkTypes: [ChunkType.ROOM_DETAILS, ChunkType.ROOM_AVAILABILITY],
        filters: { 
          organizationId: request.organizationId,
          roomType: 'LECTURE_HALL'
        },
        weight: 0.7,
        priority: 4
      },
      {
        query: `NEP 2020 compliance and scheduling constraints`,
        documentTypes: [DocumentType.POLICY, DocumentType.CONSTRAINT],
        chunkTypes: [ChunkType.CONSTRAINT_RULE, ChunkType.NEP_COMPLIANCE],
        filters: { 
          organizationId: request.organizationId,
          constraintType: 'NEP_CREDIT_DISTRIBUTION'
        },
        weight: 0.6,
        priority: 5
      }
    ];

    return {
      strategy: 'CONFLICT_AWARE',
      dataTypes: [DocumentType.STUDENT, DocumentType.SUBJECT, DocumentType.FACULTY, DocumentType.ROOM, DocumentType.POLICY],
      chunkTypes: [
        ChunkType.STUDENT_PROFILE,
        ChunkType.STUDENT_ENROLLMENT,
        ChunkType.SUBJECT_DETAILS,
        ChunkType.FACULTY_AVAILABILITY,
        ChunkType.ROOM_DETAILS,
        ChunkType.CONSTRAINT_RULE,
        ChunkType.NEP_COMPLIANCE
      ],
      searchQueries,
      priority: 'HIGH',
      estimatedTokens: this.estimateTokens(searchQueries, complexity),
      maxResults: complexity === 'SIMPLE' ? 200 : complexity === 'MODERATE' ? 400 : 800,
      filters: {
        organizationId: request.organizationId,
        departmentId,
        year
      }
    };
  }

  /**
   * Create retrieval plan for department schedule
   */
  private async createDepartmentSchedulePlan(
    request: TimetableRequest,
    complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX'
  ): Promise<RetrievalPlan> {
    const departmentId = request.departmentId!;

    const searchQueries: SearchQuery[] = [
      {
        query: `all students in department`,
        documentTypes: [DocumentType.STUDENT],
        chunkTypes: [ChunkType.STUDENT_PROFILE, ChunkType.STUDENT_ENROLLMENT],
        filters: { 
          organizationId: request.organizationId,
          departmentId
        },
        weight: 1.0,
        priority: 1
      },
      {
        query: `all subjects offered by department`,
        documentTypes: [DocumentType.SUBJECT],
        chunkTypes: [ChunkType.SUBJECT_DETAILS],
        filters: { 
          organizationId: request.organizationId,
          departmentId
        },
        weight: 0.9,
        priority: 2
      },
      {
        query: `all faculty in department`,
        documentTypes: [DocumentType.FACULTY],
        chunkTypes: [ChunkType.FACULTY_AVAILABILITY, ChunkType.FACULTY_SPECIALIZATIONS],
        filters: { 
          organizationId: request.organizationId,
          departmentId
        },
        weight: 0.8,
        priority: 3
      },
      {
        query: `all available rooms`,
        documentTypes: [DocumentType.ROOM],
        chunkTypes: [ChunkType.ROOM_DETAILS, ChunkType.ROOM_AVAILABILITY],
        filters: { 
          organizationId: request.organizationId
        },
        weight: 0.7,
        priority: 4
      }
    ];

    return {
      strategy: 'OPTIMIZED',
      dataTypes: [DocumentType.STUDENT, DocumentType.SUBJECT, DocumentType.FACULTY, DocumentType.ROOM],
      chunkTypes: [
        ChunkType.STUDENT_PROFILE,
        ChunkType.STUDENT_ENROLLMENT,
        ChunkType.SUBJECT_DETAILS,
        ChunkType.FACULTY_AVAILABILITY,
        ChunkType.ROOM_DETAILS
      ],
      searchQueries,
      priority: 'MEDIUM',
      estimatedTokens: this.estimateTokens(searchQueries, complexity),
      maxResults: complexity === 'SIMPLE' ? 500 : complexity === 'MODERATE' ? 1000 : 2000,
      filters: {
        organizationId: request.organizationId,
        departmentId
      }
    };
  }

  /**
   * Estimate data size for retrieval plan
   */
  private estimateDataSize(plan: RetrievalPlan): number {
    return plan.searchQueries.reduce((total, query) => {
      return total + (query.weight * 100); // Base estimate per query
    }, 0);
  }

  /**
   * Estimate token count for search queries
   */
  private estimateTokens(queries: SearchQuery[], complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX'): number {
    const baseTokens = queries.reduce((total, query) => {
      return total + (query.query.length / 4); // Rough token estimation
    }, 0);

    const complexityMultiplier = complexity === 'SIMPLE' ? 1 : complexity === 'MODERATE' ? 1.5 : 2;
    return Math.ceil(baseTokens * complexityMultiplier);
  }

  /**
   * Identify potential conflicts in the request
   */
  private async identifyPotentialConflicts(request: TimetableRequest): Promise<string[]> {
    const conflicts: string[] = [];

    // Check for common conflict patterns
    if (request.chosenSubjects && request.chosenSubjects.length > 8) {
      conflicts.push('Too many subjects may cause scheduling conflicts');
    }

    if (request.constraints && request.constraints.length > 5) {
      conflicts.push('Many constraints may make scheduling difficult');
    }

    // Add more conflict detection logic based on request type
    return conflicts;
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(
    request: TimetableRequest,
    complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX'
  ): string[] {
    const suggestions: string[] = [];

    if (complexity === 'COMPLEX') {
      suggestions.push('Consider breaking down into smaller batches');
      suggestions.push('Use hierarchical retrieval strategy');
      suggestions.push('Prioritize high-impact constraints');
    }

    if (request.chosenSubjects && request.chosenSubjects.length > 5) {
      suggestions.push('Group related subjects together');
      suggestions.push('Consider prerequisite dependencies');
    }

    suggestions.push('Use caching for frequently accessed data');
    suggestions.push('Implement incremental updates');

    return suggestions;
  }
}

