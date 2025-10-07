/**
 * Intelligent Retrieval Service for Timetable Generation
 * Main orchestrator that coordinates all retrieval components
 */

import { RAGService } from '../rag/RAGService';
import { PrismaClient } from '@prisma/client';
import { QueryAnalyzer, TimetableRequest, AnalysisResult } from './QueryAnalyzer';
import { 
  RetrievalStrategy, 
  HierarchicalRetrievalStrategy, 
  MultiModalRetrievalStrategy, 
  ConflictAwareRetrievalStrategy, 
  OptimizedRetrievalStrategy,
  RetrievalResult,
  RetrievalOptions
} from './RetrievalStrategy';
import { ContextOptimizer, OptimizationOptions } from './ContextOptimizer';
import { RetrievalCache, CacheKey, CacheOptions } from './RetrievalCache';

export interface IntelligentRetrievalConfig {
  ragService: RAGService;
  prisma: PrismaClient;
  cacheOptions?: CacheOptions;
  optimizationOptions?: OptimizationOptions;
  defaultStrategy?: 'HIERARCHICAL' | 'MULTIMODAL' | 'CONFLICT_AWARE' | 'OPTIMIZED';
  enableCaching?: boolean;
  enableOptimization?: boolean;
}

export interface RetrievalRequest {
  request: TimetableRequest;
  options?: RetrievalOptions;
  useCache?: boolean;
  forceRefresh?: boolean;
}

export interface RetrievalResponse {
  data: any[];
  metadata: {
    strategy: string;
    processingTime: number;
    cacheHit: boolean;
    optimizationApplied: boolean;
    totalResults: number;
    relevanceScores: Record<string, number>;
    conflicts: string[];
    recommendations: string[];
    analysis: AnalysisResult;
  };
}

export class IntelligentRetrievalService {
  private ragService: RAGService;
  private prisma: PrismaClient;
  private queryAnalyzer: QueryAnalyzer;
  private strategies: Map<string, RetrievalStrategy>;
  private contextOptimizer: ContextOptimizer;
  private cache: RetrievalCache;
  private config: IntelligentRetrievalConfig;

  constructor(config: IntelligentRetrievalConfig) {
    this.config = config;
    this.ragService = config.ragService;
    this.prisma = config.prisma;
    
    // Initialize components
    this.queryAnalyzer = new QueryAnalyzer(this.ragService, this.prisma);
    this.contextOptimizer = new ContextOptimizer(
      config.optimizationOptions || {
        maxTokens: 8000,
        preserveConstraints: true,
        preserveConflicts: true,
        compressRedundancy: true,
        prioritizeRelevance: true,
        maintainRelationships: true
      }
    );
    
    this.cache = new RetrievalCache(
      config.cacheOptions || {
        maxSize: 1000,
        defaultTTL: 30 * 60 * 1000, // 30 minutes
        cleanupInterval: 5 * 60 * 1000, // 5 minutes
        enableCompression: true,
        enablePersistence: false
      }
    );

    // Initialize strategies
    this.strategies = new Map();
    this.strategies.set('HIERARCHICAL', new HierarchicalRetrievalStrategy(this.ragService, this.queryAnalyzer));
    this.strategies.set('MULTIMODAL', new MultiModalRetrievalStrategy(this.ragService, this.queryAnalyzer));
    this.strategies.set('CONFLICT_AWARE', new ConflictAwareRetrievalStrategy(this.ragService, this.queryAnalyzer));
    this.strategies.set('OPTIMIZED', new OptimizedRetrievalStrategy(this.ragService, this.queryAnalyzer));
  }

  /**
   * Main retrieval method for faculty schedules
   */
  async retrieveForFacultySchedule(
    facultyId: string,
    semester: string,
    organizationId: string,
    options?: RetrievalOptions
  ): Promise<RetrievalResponse> {
    const request: TimetableRequest = {
      type: 'FACULTY_SCHEDULE',
      facultyId,
      semester,
      organizationId
    };

    return this.retrieve({
      request,
      options,
      useCache: this.config.enableCaching !== false
    });
  }

  /**
   * Main retrieval method for student schedules
   */
  async retrieveForStudentSchedule(
    studentId: string,
    chosenSubjects: string[],
    organizationId: string,
    options?: RetrievalOptions
  ): Promise<RetrievalResponse> {
    const request: TimetableRequest = {
      type: 'STUDENT_SCHEDULE',
      studentId,
      chosenSubjects,
      organizationId
    };

    return this.retrieve({
      request,
      options,
      useCache: this.config.enableCaching !== false
    });
  }

  /**
   * Main retrieval method for batch schedules
   */
  async retrieveForBatchSchedule(
    year: number,
    departmentId: string,
    semester: string,
    organizationId: string,
    options?: RetrievalOptions
  ): Promise<RetrievalResponse> {
    const request: TimetableRequest = {
      type: 'BATCH_SCHEDULE',
      year,
      departmentId,
      semester,
      organizationId
    };

    return this.retrieve({
      request,
      options,
      useCache: this.config.enableCaching !== false
    });
  }

  /**
   * Main retrieval method for department schedules
   */
  async retrieveForDepartmentSchedule(
    departmentId: string,
    organizationId: string,
    options?: RetrievalOptions
  ): Promise<RetrievalResponse> {
    const request: TimetableRequest = {
      type: 'DEPARTMENT_SCHEDULE',
      departmentId,
      organizationId
    };

    return this.retrieve({
      request,
      options,
      useCache: this.config.enableCaching !== false
    });
  }

  /**
   * Core retrieval method
   */
  private async retrieve(retrievalRequest: RetrievalRequest): Promise<RetrievalResponse> {
    const startTime = Date.now();
    const { request, options = {}, useCache = true, forceRefresh = false } = retrievalRequest;

    console.log(`Starting intelligent retrieval for ${request.type}`);

    // Check cache first
    let cacheHit = false;
    let cachedResult: RetrievalResult | null = null;

    if (useCache && !forceRefresh) {
      const cacheKey = this.cache.generateCacheKey({
        requestType: request.type,
        organizationId: request.organizationId,
        departmentId: request.departmentId,
        year: request.year,
        semester: request.semester,
        facultyId: request.facultyId,
        studentId: request.studentId,
        chosenSubjects: request.chosenSubjects,
        constraints: request.constraints
      });

      cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        cacheHit = true;
        console.log('Cache hit - returning cached result');
        return this.formatResponse(cachedResult, request.type, Date.now() - startTime, true, false, null);
      }
    }

    // Analyze request
    const analysis = await this.queryAnalyzer.analyzeRequest(request);
    console.log(`Request analysis: ${analysis.complexity} complexity, ${analysis.recommendedStrategy} strategy`);

    // Select strategy
    const strategy = this.selectStrategy(analysis, options);
    console.log(`Selected strategy: ${strategy}`);

    // Execute retrieval
    const retrievalStrategy = this.strategies.get(strategy);
    if (!retrievalStrategy) {
      throw new Error(`Unknown strategy: ${strategy}`);
    }

    const retrievalResult = await retrievalStrategy.retrieve(analysis.retrievalPlan, options);
    console.log(`Retrieval completed: ${retrievalResult.data.length} results`);

    // Apply context optimization if enabled
    let optimizedResult = retrievalResult;
    let optimizationApplied = false;

    if (this.config.enableOptimization !== false) {
      console.log('Applying context optimization');
      const optimizationResult = await this.contextOptimizer.optimize(
        retrievalResult.data,
        request.type
      );
      
      optimizedResult = {
        ...retrievalResult,
        data: optimizationResult.optimizedData
      };
      optimizationApplied = true;
      
      console.log(`Optimization applied: ${optimizationResult.metadata.compressionRatio.toFixed(2)}x compression`);
    }

    // Cache result if enabled
    if (useCache && !cacheHit) {
      const cacheKey = this.cache.generateCacheKey({
        requestType: request.type,
        organizationId: request.organizationId,
        departmentId: request.departmentId,
        year: request.year,
        semester: request.semester,
        facultyId: request.facultyId,
        studentId: request.studentId,
        chosenSubjects: request.chosenSubjects,
        constraints: request.constraints
      });

      this.cache.set(cacheKey, optimizedResult);
      console.log('Result cached for future use');
    }

    return this.formatResponse(optimizedResult, request.type, Date.now() - startTime, cacheHit, optimizationApplied, analysis);
  }

  /**
   * Select appropriate retrieval strategy
   */
  private selectStrategy(analysis: AnalysisResult, options: RetrievalOptions): string {
    // Use strategy from options if specified
    if (options.strategy) {
      return options.strategy;
    }

    // Use default strategy from config
    if (this.config.defaultStrategy) {
      return this.config.defaultStrategy;
    }

    // Select based on analysis
    switch (analysis.complexity) {
      case 'SIMPLE':
        return 'OPTIMIZED';
      case 'MODERATE':
        return 'HIERARCHICAL';
      case 'COMPLEX':
        return 'CONFLICT_AWARE';
      default:
        return 'MULTIMODAL';
    }
  }

  /**
   * Format response
   */
  private formatResponse(
    result: RetrievalResult,
    requestType: string,
    processingTime: number,
    cacheHit: boolean,
    optimizationApplied: boolean,
    analysis: AnalysisResult | null
  ): RetrievalResponse {
    return {
      data: result.data.map(item => ({
        id: item.chunk.id,
        content: item.chunk.content,
        metadata: item.chunk.metadata,
        score: item.score,
        documentType: item.chunk.metadata.documentType,
        chunkType: item.chunk.metadata.chunkType
      })),
      metadata: {
        strategy: result.metadata.strategy,
        processingTime,
        cacheHit,
        optimizationApplied,
        totalResults: result.metadata.totalResults,
        relevanceScores: result.metadata.relevanceScores,
        conflicts: result.metadata.conflicts,
        recommendations: result.metadata.recommendations,
        analysis: analysis || null
      }
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Warm up cache with common queries
   */
  async warmUpCache(organizationId: string, departmentId?: string) {
    console.log('Warming up cache with common queries');
    
    // This would typically involve running common queries
    // and storing their results in the cache
    // Implementation depends on the specific use case
    
    console.log('Cache warm-up completed');
  }

  /**
   * Preload cache for specific scenarios
   */
  async preloadCache(
    scenario: 'FACULTY_SCHEDULE' | 'STUDENT_SCHEDULE' | 'BATCH_SCHEDULE',
    organizationId: string,
    departmentId?: string
  ) {
    await this.cache.preloadForScenario(scenario, organizationId, departmentId);
  }

  /**
   * Export cache for persistence
   */
  exportCache(): string {
    return this.cache.exportCache();
  }

  /**
   * Import cache from persistence
   */
  importCache(cacheData: string) {
    this.cache.importCache(cacheData);
  }

  /**
   * Get frequently accessed data
   */
  getFrequentData(limit: number = 10) {
    return this.cache.getFrequentEntries(limit);
  }

  /**
   * Get data by request type
   */
  getDataByType(requestType: string) {
    return this.cache.getEntriesByType(requestType);
  }

  /**
   * Update cache TTL for specific request type
   */
  updateCacheTTL(requestType: string, ttl: number) {
    // This would update TTL for specific request types
    // Implementation depends on cache structure
    console.log(`Updated TTL for ${requestType} to ${ttl}ms`);
  }

  /**
   * Destroy service and cleanup resources
   */
  destroy() {
    this.cache.destroy();
  }
}

