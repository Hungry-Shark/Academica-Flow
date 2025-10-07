/**
 * Retrieval Strategy Implementation
 * Different approaches for retrieving data based on timetable generation needs
 */

import { RAGService, RAGSearchOptions, RAGSearchResponse } from '../rag/RAGService';
import { DocumentType, ChunkType, SearchResult } from '../rag/DocumentProcessor';
import { QueryAnalyzer, RetrievalPlan, SearchQuery, TimetableRequest } from './QueryAnalyzer';

export interface RetrievalResult {
  data: SearchResult[];
  metadata: {
    strategy: string;
    totalResults: number;
    processingTime: number;
    dataTypes: DocumentType[];
    relevanceScores: Record<string, number>;
    conflicts: string[];
    recommendations: string[];
  };
}

export interface RetrievalOptions {
  maxResults?: number;
  threshold?: number;
  includeMetadata?: boolean;
  prioritizeConflicts?: boolean;
  cacheResults?: boolean;
}

export abstract class RetrievalStrategy {
  protected ragService: RAGService;
  protected queryAnalyzer: QueryAnalyzer;

  constructor(ragService: RAGService, queryAnalyzer: QueryAnalyzer) {
    this.ragService = ragService;
    this.queryAnalyzer = queryAnalyzer;
  }

  abstract retrieve(plan: RetrievalPlan, options?: RetrievalOptions): Promise<RetrievalResult>;
}

/**
 * Hierarchical Retrieval Strategy
 * Start broad (department) → narrow down (specific constraints)
 */
export class HierarchicalRetrievalStrategy extends RetrievalStrategy {
  async retrieve(plan: RetrievalPlan, options: RetrievalOptions = {}): Promise<RetrievalResult> {
    console.log('Using Hierarchical Retrieval Strategy');
    
    const startTime = Date.now();
    const allResults: SearchResult[] = [];
    const relevanceScores: Record<string, number> = {};
    const conflicts: string[] = [];
    const recommendations: string[] = [];

    // Sort queries by priority (ascending - process low priority first)
    const sortedQueries = [...plan.searchQueries].sort((a, b) => a.priority - b.priority);

    for (const query of sortedQueries) {
      try {
        console.log(`Processing query (priority ${query.priority}): ${query.query}`);
        
        const searchOptions: RAGSearchOptions = {
          query: query.query,
          documentTypes: query.documentTypes,
          chunkTypes: query.chunkTypes,
          organizationId: plan.filters.organizationId,
          departmentId: plan.filters.departmentId,
          year: plan.filters.year,
          filters: query.filters,
          limit: Math.min(query.weight * 50, options.maxResults || plan.maxResults),
          threshold: options.threshold || 0.6
        };

        const response = await this.ragService.search(searchOptions);
        
        // Filter and score results
        const filteredResults = this.filterAndScoreResults(
          response.results,
          query,
          allResults,
          options
        );

        allResults.push(...filteredResults);
        
        // Update relevance scores
        filteredResults.forEach(result => {
          const key = `${result.chunk.metadata.documentType}_${result.chunk.id}`;
          relevanceScores[key] = (relevanceScores[key] || 0) + (result.score * query.weight);
        });

        // Detect conflicts at this level
        const levelConflicts = this.detectConflicts(filteredResults, query);
        conflicts.push(...levelConflicts);

        console.log(`Query completed: ${filteredResults.length} results, ${levelConflicts.length} conflicts`);
        
      } catch (error) {
        console.error(`Error processing query: ${query.query}`, error);
        recommendations.push(`Failed to process query: ${query.query}`);
      }
    }

    // Remove duplicates and sort by relevance
    const uniqueResults = this.removeDuplicates(allResults);
    const sortedResults = this.sortByRelevance(uniqueResults, relevanceScores);

    // Generate final recommendations
    recommendations.push(...this.generateRecommendations(sortedResults, conflicts));

    return {
      data: sortedResults,
      metadata: {
        strategy: 'HIERARCHICAL',
        totalResults: sortedResults.length,
        processingTime: Date.now() - startTime,
        dataTypes: plan.dataTypes,
        relevanceScores,
        conflicts,
        recommendations
      }
    };
  }

  private filterAndScoreResults(
    results: SearchResult[],
    query: SearchQuery,
    existingResults: SearchResult[],
    options: RetrievalOptions
  ): SearchResult[] {
    return results
      .filter(result => {
        // Filter by threshold
        if (result.score < (options.threshold || 0.6)) return false;
        
        // Avoid duplicates
        const isDuplicate = existingResults.some(existing => 
          existing.chunk.id === result.chunk.id
        );
        if (isDuplicate) return false;
        
        return true;
      })
      .map(result => ({
        ...result,
        score: result.score * query.weight // Apply query weight
      }));
  }

  private detectConflicts(results: SearchResult[], query: SearchQuery): string[] {
    const conflicts: string[] = [];
    
    // Detect faculty conflicts
    const facultyResults = results.filter(r => r.chunk.metadata.documentType === DocumentType.FACULTY);
    const facultyIds = new Set(facultyResults.map(r => r.chunk.metadata.facultyId));
    
    if (facultyIds.size < facultyResults.length) {
      conflicts.push('Duplicate faculty found in results');
    }

    // Detect room conflicts
    const roomResults = results.filter(r => r.chunk.metadata.documentType === DocumentType.ROOM);
    const roomIds = new Set(roomResults.map(r => r.chunk.metadata.roomId));
    
    if (roomIds.size < roomResults.length) {
      conflicts.push('Duplicate rooms found in results');
    }

    return conflicts;
  }

  private removeDuplicates(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.chunk.id)) {
        return false;
      }
      seen.add(result.chunk.id);
      return true;
    });
  }

  private sortByRelevance(results: SearchResult[], relevanceScores: Record<string, number>): SearchResult[] {
    return results.sort((a, b) => {
      const scoreA = relevanceScores[`${a.chunk.metadata.documentType}_${a.chunk.id}`] || a.score;
      const scoreB = relevanceScores[`${b.chunk.metadata.documentType}_${b.chunk.id}`] || b.score;
      return scoreB - scoreA;
    });
  }

  private generateRecommendations(results: SearchResult[], conflicts: string[]): string[] {
    const recommendations: string[] = [];
    
    if (conflicts.length > 0) {
      recommendations.push('Resolve conflicts before proceeding with timetable generation');
    }
    
    if (results.length < 10) {
      recommendations.push('Consider expanding search criteria for more options');
    }
    
    if (results.length > 100) {
      recommendations.push('Consider filtering results to improve performance');
    }
    
    return recommendations;
  }
}

/**
 * Multi-Modal Retrieval Strategy
 * Combine different data types (faculty + rooms + policies)
 */
export class MultiModalRetrievalStrategy extends RetrievalStrategy {
  async retrieve(plan: RetrievalPlan, options: RetrievalOptions = {}): Promise<RetrievalResult> {
    console.log('Using Multi-Modal Retrieval Strategy');
    
    const startTime = Date.now();
    const resultsByType: Record<DocumentType, SearchResult[]> = {
      [DocumentType.FACULTY]: [],
      [DocumentType.STUDENT]: [],
      [DocumentType.SUBJECT]: [],
      [DocumentType.ROOM]: [],
      [DocumentType.POLICY]: [],
      [DocumentType.CONSTRAINT]: [],
      [DocumentType.TIMETABLE]: [],
      [DocumentType.ADMINISTRATIVE]: []
    };

    const relevanceScores: Record<string, number> = {};
    const conflicts: string[] = [];
    const recommendations: string[] = [];

    // Process queries in parallel for different data types
    const queryPromises = plan.searchQueries.map(async (query) => {
      try {
        const searchOptions: RAGSearchOptions = {
          query: query.query,
          documentTypes: query.documentTypes,
          chunkTypes: query.chunkTypes,
          organizationId: plan.filters.organizationId,
          departmentId: plan.filters.departmentId,
          year: plan.filters.year,
          filters: query.filters,
          limit: Math.min(query.weight * 40, options.maxResults || plan.maxResults),
          threshold: options.threshold || 0.6
        };

        const response = await this.ragService.search(searchOptions);
        
        // Group results by document type
        response.results.forEach(result => {
          const docType = result.chunk.metadata.documentType;
          if (resultsByType[docType]) {
            resultsByType[docType].push(result);
          }
        });

        // Update relevance scores
        response.results.forEach(result => {
          const key = `${result.chunk.metadata.documentType}_${result.chunk.id}`;
          relevanceScores[key] = (relevanceScores[key] || 0) + (result.score * query.weight);
        });

        return response.results;
      } catch (error) {
        console.error(`Error processing query: ${query.query}`, error);
        return [];
      }
    });

    const allQueryResults = await Promise.all(queryPromises);
    const allResults = allQueryResults.flat();

    // Cross-modal analysis
    const crossModalConflicts = this.analyzeCrossModalConflicts(resultsByType);
    conflicts.push(...crossModalConflicts);

    // Generate cross-modal recommendations
    const crossModalRecommendations = this.generateCrossModalRecommendations(resultsByType);
    recommendations.push(...crossModalRecommendations);

    // Combine and sort results
    const combinedResults = this.combineMultiModalResults(resultsByType, relevanceScores);

    return {
      data: combinedResults,
      metadata: {
        strategy: 'MULTIMODAL',
        totalResults: combinedResults.length,
        processingTime: Date.now() - startTime,
        dataTypes: plan.dataTypes,
        relevanceScores,
        conflicts,
        recommendations
      }
    };
  }

  private analyzeCrossModalConflicts(resultsByType: Record<DocumentType, SearchResult[]>): string[] {
    const conflicts: string[] = [];

    // Check faculty-room compatibility
    const facultyResults = resultsByType[DocumentType.FACULTY];
    const roomResults = resultsByType[DocumentType.ROOM];
    
    if (facultyResults.length > 0 && roomResults.length === 0) {
      conflicts.push('No suitable rooms found for faculty');
    }

    // Check subject-faculty compatibility
    const subjectResults = resultsByType[DocumentType.SUBJECT];
    if (subjectResults.length > 0 && facultyResults.length === 0) {
      conflicts.push('No faculty available for subjects');
    }

    // Check student-subject compatibility
    const studentResults = resultsByType[DocumentType.STUDENT];
    if (studentResults.length > 0 && subjectResults.length === 0) {
      conflicts.push('No subjects available for students');
    }

    return conflicts;
  }

  private generateCrossModalRecommendations(resultsByType: Record<DocumentType, SearchResult[]>): string[] {
    const recommendations: string[] = [];

    const facultyCount = resultsByType[DocumentType.FACULTY].length;
    const roomCount = resultsByType[DocumentType.ROOM].length;
    const subjectCount = resultsByType[DocumentType.SUBJECT].length;
    const studentCount = resultsByType[DocumentType.STUDENT].length;

    if (facultyCount < subjectCount) {
      recommendations.push('Consider adding more faculty or reducing subjects');
    }

    if (roomCount < facultyCount) {
      recommendations.push('Consider adding more rooms or reducing faculty load');
    }

    if (studentCount > roomCount * 50) { // Assuming 50 students per room
      recommendations.push('Consider adding more rooms for student capacity');
    }

    return recommendations;
  }

  private combineMultiModalResults(
    resultsByType: Record<DocumentType, SearchResult[]>,
    relevanceScores: Record<string, number>
  ): SearchResult[] {
    const allResults: SearchResult[] = [];
    
    // Combine results from all types
    Object.values(resultsByType).forEach(results => {
      allResults.push(...results);
    });

    // Sort by relevance score
    return allResults.sort((a, b) => {
      const scoreA = relevanceScores[`${a.chunk.metadata.documentType}_${a.chunk.id}`] || a.score;
      const scoreB = relevanceScores[`${b.chunk.metadata.documentType}_${b.chunk.id}`] || b.score;
      return scoreB - scoreA;
    });
  }
}

/**
 * Conflict-Aware Retrieval Strategy
 * Prioritize conflict prevention data
 */
export class ConflictAwareRetrievalStrategy extends RetrievalStrategy {
  async retrieve(plan: RetrievalPlan, options: RetrievalOptions = {}): Promise<RetrievalResult> {
    console.log('Using Conflict-Aware Retrieval Strategy');
    
    const startTime = Date.now();
    const allResults: SearchResult[] = [];
    const relevanceScores: Record<string, number> = {};
    const conflicts: string[] = [];
    const recommendations: string[] = [];

    // Prioritize conflict-related queries
    const conflictQueries = plan.searchQueries.filter(q => 
      q.query.toLowerCase().includes('conflict') ||
      q.query.toLowerCase().includes('constraint') ||
      q.query.toLowerCase().includes('rule') ||
      q.query.toLowerCase().includes('policy')
    );

    const regularQueries = plan.searchQueries.filter(q => 
      !conflictQueries.includes(q)
    );

    // Process conflict queries first
    for (const query of conflictQueries) {
      try {
        const response = await this.processQuery(query, plan, options);
        allResults.push(...response.results);
        
        // Update scores with higher weight for conflict data
        response.results.forEach(result => {
          const key = `${result.chunk.metadata.documentType}_${result.chunk.id}`;
          relevanceScores[key] = (relevanceScores[key] || 0) + (result.score * query.weight * 1.5);
        });

        // Detect conflicts
        const detectedConflicts = this.detectAdvancedConflicts(response.results, query);
        conflicts.push(...detectedConflicts);

      } catch (error) {
        console.error(`Error processing conflict query: ${query.query}`, error);
      }
    }

    // Process regular queries
    for (const query of regularQueries) {
      try {
        const response = await this.processQuery(query, plan, options);
        allResults.push(...response.results);
        
        response.results.forEach(result => {
          const key = `${result.chunk.metadata.documentType}_${result.chunk.id}`;
          relevanceScores[key] = (relevanceScores[key] || 0) + (result.score * query.weight);
        });

      } catch (error) {
        console.error(`Error processing regular query: ${query.query}`, error);
      }
    }

    // Advanced conflict analysis
    const advancedConflicts = this.performAdvancedConflictAnalysis(allResults);
    conflicts.push(...advancedConflicts);

    // Generate conflict-aware recommendations
    const conflictRecommendations = this.generateConflictRecommendations(conflicts, allResults);
    recommendations.push(...conflictRecommendations);

    // Remove duplicates and sort
    const uniqueResults = this.removeDuplicates(allResults);
    const sortedResults = this.sortByConflictAwareness(uniqueResults, relevanceScores, conflicts);

    return {
      data: sortedResults,
      metadata: {
        strategy: 'CONFLICT_AWARE',
        totalResults: sortedResults.length,
        processingTime: Date.now() - startTime,
        dataTypes: plan.dataTypes,
        relevanceScores,
        conflicts,
        recommendations
      }
    };
  }

  private async processQuery(
    query: SearchQuery,
    plan: RetrievalPlan,
    options: RetrievalOptions
  ): Promise<RAGSearchResponse> {
    const searchOptions: RAGSearchOptions = {
      query: query.query,
      documentTypes: query.documentTypes,
      chunkTypes: query.chunkTypes,
      organizationId: plan.filters.organizationId,
      departmentId: plan.filters.departmentId,
      year: plan.filters.year,
      filters: query.filters,
      limit: Math.min(query.weight * 60, options.maxResults || plan.maxResults),
      threshold: (options.threshold || 0.6) - 0.1 // Lower threshold for conflict detection
    };

    return await this.ragService.search(searchOptions);
  }

  private detectAdvancedConflicts(results: SearchResult[], query: SearchQuery): string[] {
    const conflicts: string[] = [];

    // Time-based conflicts
    const timeConflicts = this.detectTimeConflicts(results);
    conflicts.push(...timeConflicts);

    // Resource conflicts
    const resourceConflicts = this.detectResourceConflicts(results);
    conflicts.push(...resourceConflicts);

    // Policy conflicts
    const policyConflicts = this.detectPolicyConflicts(results, query);
    conflicts.push(...policyConflicts);

    return conflicts;
  }

  private detectTimeConflicts(results: SearchResult[]): string[] {
    const conflicts: string[] = [];
    
    // Group by faculty and check for overlapping time slots
    const facultyTimeSlots = new Map<string, string[]>();
    
    results.forEach(result => {
      if (result.chunk.metadata.documentType === DocumentType.FACULTY) {
        const facultyId = result.chunk.metadata.facultyId;
        if (facultyId) {
          // Extract time information from content
          const timeMatches = result.chunk.content.match(/\d{1,2}:\d{2}/g);
          if (timeMatches) {
            if (!facultyTimeSlots.has(facultyId)) {
              facultyTimeSlots.set(facultyId, []);
            }
            facultyTimeSlots.get(facultyId)!.push(...timeMatches);
          }
        }
      }
    });

    // Check for overlapping times
    facultyTimeSlots.forEach((times, facultyId) => {
      const uniqueTimes = new Set(times);
      if (uniqueTimes.size < times.length) {
        conflicts.push(`Faculty ${facultyId} has overlapping time slots`);
      }
    });

    return conflicts;
  }

  private detectResourceConflicts(results: SearchResult[]): string[] {
    const conflicts: string[] = [];
    
    // Check room capacity vs student count
    const roomCapacity = new Map<string, number>();
    const studentCount = new Map<string, number>();
    
    results.forEach(result => {
      if (result.chunk.metadata.documentType === DocumentType.ROOM) {
        const roomId = result.chunk.metadata.roomId;
        const capacity = result.chunk.metadata.capacity;
        if (roomId && capacity) {
          roomCapacity.set(roomId, capacity);
        }
      }
      
      if (result.chunk.metadata.documentType === DocumentType.STUDENT) {
        const departmentId = result.chunk.metadata.departmentId;
        if (departmentId) {
          studentCount.set(departmentId, (studentCount.get(departmentId) || 0) + 1);
        }
      }
    });

    // Check if any room is overbooked
    roomCapacity.forEach((capacity, roomId) => {
      const totalStudents = Array.from(studentCount.values()).reduce((sum, count) => sum + count, 0);
      if (totalStudents > capacity) {
        conflicts.push(`Room ${roomId} capacity (${capacity}) exceeded by student count (${totalStudents})`);
      }
    });

    return conflicts;
  }

  private detectPolicyConflicts(results: SearchResult[], query: SearchQuery): string[] {
    const conflicts: string[] = [];
    
    // Check NEP compliance conflicts
    const nepResults = results.filter(r => 
      r.chunk.metadata.documentType === DocumentType.POLICY &&
      r.chunk.metadata.policyType === 'NEP_COMPLIANCE'
    );

    if (nepResults.length > 0) {
      // Check if any results violate NEP rules
      const hasViolations = results.some(r => 
        r.chunk.content.toLowerCase().includes('violation') ||
        r.chunk.content.toLowerCase().includes('non-compliant')
      );

      if (hasViolations) {
        conflicts.push('NEP 2020 compliance violations detected');
      }
    }

    return conflicts;
  }

  private performAdvancedConflictAnalysis(results: SearchResult[]): string[] {
    const conflicts: string[] = [];

    // Cross-reference different data types for conflicts
    const facultyIds = new Set(
      results
        .filter(r => r.chunk.metadata.documentType === DocumentType.FACULTY)
        .map(r => r.chunk.metadata.facultyId)
        .filter(Boolean)
    );

    const roomIds = new Set(
      results
        .filter(r => r.chunk.metadata.documentType === DocumentType.ROOM)
        .map(r => r.chunk.metadata.roomId)
        .filter(Boolean)
    );

    const subjectIds = new Set(
      results
        .filter(r => r.chunk.metadata.documentType === DocumentType.SUBJECT)
        .map(r => r.chunk.metadata.subjectId)
        .filter(Boolean)
    );

    // Check for missing relationships
    if (facultyIds.size > 0 && roomIds.size === 0) {
      conflicts.push('No rooms available for faculty assignments');
    }

    if (subjectIds.size > 0 && facultyIds.size === 0) {
      conflicts.push('No faculty available for subject assignments');
    }

    return conflicts;
  }

  private generateConflictRecommendations(conflicts: string[], results: SearchResult[]): string[] {
    const recommendations: string[] = [];

    if (conflicts.length > 0) {
      recommendations.push('Address conflicts before generating timetable');
      recommendations.push('Consider alternative faculty or room assignments');
    }

    if (results.length < 20) {
      recommendations.push('Expand search criteria to find more options');
    }

    recommendations.push('Use constraint-based optimization for conflict resolution');

    return recommendations;
  }

  private sortByConflictAwareness(
    results: SearchResult[],
    relevanceScores: Record<string, number>,
    conflicts: string[]
  ): SearchResult[] {
    return results.sort((a, b) => {
      // Prioritize conflict-related data
      const aIsConflictRelated = a.chunk.content.toLowerCase().includes('conflict') ||
                                a.chunk.content.toLowerCase().includes('constraint');
      const bIsConflictRelated = b.chunk.content.toLowerCase().includes('conflict') ||
                                b.chunk.content.toLowerCase().includes('constraint');

      if (aIsConflictRelated && !bIsConflictRelated) return -1;
      if (!aIsConflictRelated && bIsConflictRelated) return 1;

      // Then sort by relevance score
      const scoreA = relevanceScores[`${a.chunk.metadata.documentType}_${a.chunk.id}`] || a.score;
      const scoreB = relevanceScores[`${b.chunk.metadata.documentType}_${b.chunk.id}`] || b.score;
      return scoreB - scoreA;
    });
  }

  private removeDuplicates(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.chunk.id)) {
        return false;
      }
      seen.add(result.chunk.id);
      return true;
    });
  }
}

/**
 * Optimized Retrieval Strategy
 * Balance between performance and completeness
 */
export class OptimizedRetrievalStrategy extends RetrievalStrategy {
  async retrieve(plan: RetrievalPlan, options: RetrievalOptions = {}): Promise<RetrievalResult> {
    console.log('Using Optimized Retrieval Strategy');
    
    const startTime = Date.now();
    const allResults: SearchResult[] = [];
    const relevanceScores: Record<string, number> = {};
    const conflicts: string[] = [];
    const recommendations: string[] = [];

    // Process queries in parallel with optimized limits
    const queryPromises = plan.searchQueries.map(async (query, index) => {
      try {
        // Stagger queries to avoid overwhelming the system
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, index * 100));
        }

        const searchOptions: RAGSearchOptions = {
          query: query.query,
          documentTypes: query.documentTypes,
          chunkTypes: query.chunkTypes,
          organizationId: plan.filters.organizationId,
          departmentId: plan.filters.departmentId,
          year: plan.filters.year,
          filters: query.filters,
          limit: Math.min(query.weight * 30, options.maxResults || plan.maxResults),
          threshold: options.threshold || 0.7 // Higher threshold for optimization
        };

        const response = await this.ragService.search(searchOptions);
        
        // Apply optimization filters
        const optimizedResults = this.optimizeResults(response.results, query, options);
        allResults.push(...optimizedResults);
        
        // Update scores
        optimizedResults.forEach(result => {
          const key = `${result.chunk.metadata.documentType}_${result.chunk.id}`;
          relevanceScores[key] = (relevanceScores[key] || 0) + (result.score * query.weight);
        });

        return optimizedResults;
      } catch (error) {
        console.error(`Error processing query: ${query.query}`, error);
        return [];
      }
    });

    const allQueryResults = await Promise.all(queryPromises);
    const combinedResults = allQueryResults.flat();

    // Final optimization
    const finalResults = this.performFinalOptimization(combinedResults, relevanceScores, options);

    return {
      data: finalResults,
      metadata: {
        strategy: 'OPTIMIZED',
        totalResults: finalResults.length,
        processingTime: Date.now() - startTime,
        dataTypes: plan.dataTypes,
        relevanceScores,
        conflicts,
        recommendations
      }
    };
  }

  private optimizeResults(
    results: SearchResult[],
    query: SearchQuery,
    options: RetrievalOptions
  ): SearchResult[] {
    return results
      .filter(result => {
        // Apply strict filtering for optimization
        if (result.score < (options.threshold || 0.7)) return false;
        
        // Filter by relevance to query
        const contentRelevance = this.calculateContentRelevance(result.chunk.content, query.query);
        if (contentRelevance < 0.5) return false;
        
        return true;
      })
      .slice(0, Math.min(query.weight * 20, 50)); // Limit results per query
  }

  private calculateContentRelevance(content: string, query: string): number {
    const contentWords = content.toLowerCase().split(/\s+/);
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const matches = queryWords.filter(word => 
      contentWords.some(contentWord => contentWord.includes(word))
    ).length;
    
    return matches / queryWords.length;
  }

  private performFinalOptimization(
    results: SearchResult[],
    relevanceScores: Record<string, number>,
    options: RetrievalOptions
  ): SearchResult[] {
    // Remove duplicates
    const uniqueResults = this.removeDuplicates(results);
    
    // Sort by relevance
    const sortedResults = uniqueResults.sort((a, b) => {
      const scoreA = relevanceScores[`${a.chunk.metadata.documentType}_${a.chunk.id}`] || a.score;
      const scoreB = relevanceScores[`${b.chunk.metadata.documentType}_${b.chunk.id}`] || b.score;
      return scoreB - scoreA;
    });
    
    // Apply final limit
    return sortedResults.slice(0, options.maxResults || 200);
  }

  private removeDuplicates(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.chunk.id)) {
        return false;
      }
      seen.add(result.chunk.id);
      return true;
    });
  }
}

