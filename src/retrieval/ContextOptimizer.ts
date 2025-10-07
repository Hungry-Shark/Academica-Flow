/**
 * Context Optimizer for Timetable Generation
 * Ensures retrieved data fits in context window while maintaining essential information
 */

import { SearchResult } from '../rag/DocumentProcessor';
import { DocumentType, ChunkType } from '../rag/DocumentProcessor';

export interface OptimizationOptions {
  maxTokens: number;
  preserveConstraints: boolean;
  preserveConflicts: boolean;
  compressRedundancy: boolean;
  prioritizeRelevance: boolean;
  maintainRelationships: boolean;
}

export interface OptimizationResult {
  optimizedData: SearchResult[];
  metadata: {
    originalTokens: number;
    optimizedTokens: number;
    compressionRatio: number;
    removedItems: number;
    preservedConstraints: number;
    preservedConflicts: number;
    optimizationTechniques: string[];
  };
}

export interface TokenEstimate {
  content: string;
  tokens: number;
  importance: number;
  type: 'ESSENTIAL' | 'IMPORTANT' | 'NICE_TO_HAVE' | 'REDUNDANT';
}

export class ContextOptimizer {
  private options: OptimizationOptions;

  constructor(options: OptimizationOptions) {
    this.options = options;
  }

  /**
   * Optimize retrieved data to fit within context window
   */
  async optimize(
    data: SearchResult[],
    contextType: 'FACULTY_SCHEDULE' | 'STUDENT_SCHEDULE' | 'BATCH_SCHEDULE' | 'DEPARTMENT_SCHEDULE'
  ): Promise<OptimizationResult> {
    console.log(`Optimizing data for ${contextType} context`);
    
    const startTime = Date.now();
    const originalTokens = this.estimateTotalTokens(data);
    
    console.log(`Original data: ${data.length} items, ~${originalTokens} tokens`);
    
    // Step 1: Analyze and categorize data
    const categorizedData = this.categorizeData(data, contextType);
    
    // Step 2: Apply optimization techniques
    let optimizedData = data;
    
    if (this.options.compressRedundancy) {
      optimizedData = this.removeRedundancy(optimizedData);
    }
    
    if (this.options.prioritizeRelevance) {
      optimizedData = this.prioritizeByRelevance(optimizedData, contextType);
    }
    
    if (this.options.preserveConstraints) {
      optimizedData = this.preserveConstraints(optimizedData);
    }
    
    if (this.options.preserveConflicts) {
      optimizedData = this.preserveConflicts(optimizedData);
    }
    
    // Step 3: Compress content while maintaining essential information
    optimizedData = this.compressContent(optimizedData, contextType);
    
    // Step 4: Final token check and trimming
    optimizedData = this.trimToTokenLimit(optimizedData);
    
    const optimizedTokens = this.estimateTotalTokens(optimizedData);
    const compressionRatio = originalTokens > 0 ? optimizedTokens / originalTokens : 1;
    
    const result: OptimizationResult = {
      optimizedData,
      metadata: {
        originalTokens,
        optimizedTokens,
        compressionRatio,
        removedItems: data.length - optimizedData.length,
        preservedConstraints: this.countPreservedConstraints(optimizedData),
        preservedConflicts: this.countPreservedConflicts(optimizedData),
        optimizationTechniques: this.getAppliedTechniques()
      }
    };
    
    console.log(`Optimization complete: ${optimizedData.length} items, ~${optimizedTokens} tokens (${(compressionRatio * 100).toFixed(1)}% of original)`);
    
    return result;
  }

  /**
   * Categorize data by importance and type
   */
  private categorizeData(
    data: SearchResult[],
    contextType: string
  ): Map<string, SearchResult[]> {
    const categories = new Map<string, SearchResult[]>();
    
    data.forEach(item => {
      const category = this.determineCategory(item, contextType);
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(item);
    });
    
    return categories;
  }

  /**
   * Determine category for a data item
   */
  private determineCategory(item: SearchResult, contextType: string): string {
    const docType = item.chunk.metadata.documentType;
    const chunkType = item.chunk.metadata.chunkType;
    const score = item.score;
    
    // Essential data based on context type
    if (contextType === 'FACULTY_SCHEDULE') {
      if (docType === DocumentType.FACULTY && chunkType === ChunkType.FACULTY_AVAILABILITY) {
        return 'ESSENTIAL';
      }
      if (docType === DocumentType.SUBJECT && chunkType === ChunkType.SUBJECT_DETAILS) {
        return 'ESSENTIAL';
      }
      if (docType === DocumentType.ROOM && chunkType === ChunkType.ROOM_AVAILABILITY) {
        return 'IMPORTANT';
      }
    } else if (contextType === 'STUDENT_SCHEDULE') {
      if (docType === DocumentType.STUDENT && chunkType === ChunkType.STUDENT_ENROLLMENT) {
        return 'ESSENTIAL';
      }
      if (docType === DocumentType.SUBJECT && chunkType === ChunkType.SUBJECT_DETAILS) {
        return 'ESSENTIAL';
      }
      if (docType === DocumentType.FACULTY && chunkType === ChunkType.FACULTY_AVAILABILITY) {
        return 'IMPORTANT';
      }
    } else if (contextType === 'BATCH_SCHEDULE') {
      if (docType === DocumentType.STUDENT && chunkType === ChunkType.STUDENT_PROFILE) {
        return 'ESSENTIAL';
      }
      if (docType === DocumentType.SUBJECT && chunkType === ChunkType.SUBJECT_DETAILS) {
        return 'ESSENTIAL';
      }
      if (docType === DocumentType.FACULTY && chunkType === ChunkType.FACULTY_AVAILABILITY) {
        return 'IMPORTANT';
      }
    }
    
    // Constraint and conflict data
    if (docType === DocumentType.POLICY || docType === DocumentType.CONSTRAINT) {
      return 'ESSENTIAL';
    }
    
    // High-scoring items
    if (score > 0.8) {
      return 'IMPORTANT';
    }
    
    // Medium-scoring items
    if (score > 0.6) {
      return 'NICE_TO_HAVE';
    }
    
    return 'REDUNDANT';
  }

  /**
   * Remove redundant data
   */
  private removeRedundancy(data: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    const uniqueData: SearchResult[] = [];
    
    // Group by content similarity
    const contentGroups = new Map<string, SearchResult[]>();
    
    data.forEach(item => {
      const contentHash = this.createContentHash(item.chunk.content);
      if (!contentGroups.has(contentHash)) {
        contentGroups.set(contentHash, []);
      }
      contentGroups.get(contentHash)!.push(item);
    });
    
    // Keep only the best item from each group
    contentGroups.forEach(group => {
      if (group.length > 0) {
        const bestItem = group.reduce((best, current) => 
          current.score > best.score ? current : best
        );
        uniqueData.push(bestItem);
      }
    });
    
    return uniqueData;
  }

  /**
   * Create a hash for content similarity detection
   */
  private createContentHash(content: string): string {
    // Simple hash based on key terms
    const keyTerms = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10)
      .sort()
      .join(' ');
    
    return keyTerms;
  }

  /**
   * Prioritize data by relevance to context
   */
  private prioritizeByRelevance(
    data: SearchResult[],
    contextType: string
  ): SearchResult[] {
    return data.sort((a, b) => {
      const relevanceA = this.calculateRelevance(a, contextType);
      const relevanceB = this.calculateRelevance(b, contextType);
      
      return relevanceB - relevanceA;
    });
  }

  /**
   * Calculate relevance score for context type
   */
  private calculateRelevance(item: SearchResult, contextType: string): number {
    let relevance = item.score;
    
    const docType = item.chunk.metadata.documentType;
    const chunkType = item.chunk.metadata.chunkType;
    
    // Boost relevance based on context type
    if (contextType === 'FACULTY_SCHEDULE') {
      if (docType === DocumentType.FACULTY) relevance += 0.3;
      if (chunkType === ChunkType.FACULTY_AVAILABILITY) relevance += 0.2;
    } else if (contextType === 'STUDENT_SCHEDULE') {
      if (docType === DocumentType.STUDENT) relevance += 0.3;
      if (chunkType === ChunkType.STUDENT_ENROLLMENT) relevance += 0.2;
    } else if (contextType === 'BATCH_SCHEDULE') {
      if (docType === DocumentType.STUDENT) relevance += 0.2;
      if (docType === DocumentType.SUBJECT) relevance += 0.2;
    }
    
    // Boost constraint and conflict data
    if (docType === DocumentType.POLICY || docType === DocumentType.CONSTRAINT) {
      relevance += 0.4;
    }
    
    // Boost high-quality content
    if (item.chunk.content.length > 100) {
      relevance += 0.1;
    }
    
    return Math.min(relevance, 1.0);
  }

  /**
   * Preserve constraint-related data
   */
  private preserveConstraints(data: SearchResult[]): SearchResult[] {
    if (!this.options.preserveConstraints) return data;
    
    const constraintData = data.filter(item => 
      item.chunk.metadata.documentType === DocumentType.POLICY ||
      item.chunk.metadata.documentType === DocumentType.CONSTRAINT ||
      item.chunk.content.toLowerCase().includes('constraint') ||
      item.chunk.content.toLowerCase().includes('rule') ||
      item.chunk.content.toLowerCase().includes('policy')
    );
    
    const otherData = data.filter(item => !constraintData.includes(item));
    
    // Sort other data by score and take top items
    const sortedOtherData = otherData.sort((a, b) => b.score - a.score);
    const maxOtherItems = Math.max(0, this.options.maxTokens / 1000 - constraintData.length);
    
    return [...constraintData, ...sortedOtherData.slice(0, maxOtherItems)];
  }

  /**
   * Preserve conflict-related data
   */
  private preserveConflicts(data: SearchResult[]): SearchResult[] {
    if (!this.options.preserveConflicts) return data;
    
    const conflictData = data.filter(item => 
      item.chunk.content.toLowerCase().includes('conflict') ||
      item.chunk.content.toLowerCase().includes('violation') ||
      item.chunk.content.toLowerCase().includes('error') ||
      item.chunk.content.toLowerCase().includes('problem')
    );
    
    const otherData = data.filter(item => !conflictData.includes(item));
    
    // Sort other data by score and take top items
    const sortedOtherData = otherData.sort((a, b) => b.score - a.score);
    const maxOtherItems = Math.max(0, this.options.maxTokens / 1000 - conflictData.length);
    
    return [...conflictData, ...sortedOtherData.slice(0, maxOtherItems)];
  }

  /**
   * Compress content while maintaining essential information
   */
  private compressContent(
    data: SearchResult[],
    contextType: string
  ): SearchResult[] {
    return data.map(item => {
      const compressedContent = this.compressItemContent(item.chunk.content, contextType);
      
      return {
        ...item,
        chunk: {
          ...item.chunk,
          content: compressedContent
        }
      };
    });
  }

  /**
   * Compress individual item content
   */
  private compressItemContent(content: string, contextType: string): string {
    // Extract key information based on context type
    const keyInfo = this.extractKeyInformation(content, contextType);
    
    // If compressed content is significantly shorter, use it
    if (keyInfo.length < content.length * 0.7) {
      return keyInfo;
    }
    
    // Otherwise, truncate intelligently
    return this.intelligentTruncate(content, this.options.maxTokens / data.length);
  }

  /**
   * Extract key information from content
   */
  private extractKeyInformation(content: string, contextType: string): string {
    const lines = content.split('\n');
    const keyLines: string[] = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (this.isKeyInformation(trimmedLine, contextType)) {
        keyLines.push(trimmedLine);
      }
    });
    
    return keyLines.join('\n');
  }

  /**
   * Determine if a line contains key information
   */
  private isKeyInformation(line: string, contextType: string): boolean {
    if (line.length < 10) return false;
    
    // Always keep constraint and conflict information
    if (line.toLowerCase().includes('constraint') ||
        line.toLowerCase().includes('conflict') ||
        line.toLowerCase().includes('rule') ||
        line.toLowerCase().includes('policy') ||
        line.toLowerCase().includes('violation')) {
      return true;
    }
    
    // Keep time and schedule information
    if (line.match(/\d{1,2}:\d{2}/) || line.toLowerCase().includes('time')) {
      return true;
    }
    
    // Keep availability information
    if (line.toLowerCase().includes('available') ||
        line.toLowerCase().includes('unavailable')) {
      return true;
    }
    
    // Keep capacity and room information
    if (line.toLowerCase().includes('capacity') ||
        line.toLowerCase().includes('room') ||
        line.toLowerCase().includes('students')) {
      return true;
    }
    
    // Keep subject and faculty information
    if (line.toLowerCase().includes('subject') ||
        line.toLowerCase().includes('faculty') ||
        line.toLowerCase().includes('professor')) {
      return true;
    }
    
    return false;
  }

  /**
   * Intelligently truncate content
   */
  private intelligentTruncate(content: string, maxTokens: number): string {
    const maxLength = maxTokens * 4; // Rough character to token ratio
    
    if (content.length <= maxLength) return content;
    
    // Find the last complete sentence before the limit
    const truncated = content.substring(0, maxLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('\n'),
      truncated.lastIndexOf(';')
    );
    
    if (lastSentenceEnd > maxLength * 0.8) {
      return content.substring(0, lastSentenceEnd + 1) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Trim data to fit within token limit
   */
  private trimToTokenLimit(data: SearchResult[]): SearchResult[] {
    let currentTokens = 0;
    const trimmedData: SearchResult[] = [];
    
    for (const item of data) {
      const itemTokens = this.estimateItemTokens(item);
      
      if (currentTokens + itemTokens <= this.options.maxTokens) {
        trimmedData.push(item);
        currentTokens += itemTokens;
      } else {
        break;
      }
    }
    
    return trimmedData;
  }

  /**
   * Estimate total tokens for all data
   */
  private estimateTotalTokens(data: SearchResult[]): number {
    return data.reduce((total, item) => total + this.estimateItemTokens(item), 0);
  }

  /**
   * Estimate tokens for a single item
   */
  private estimateItemTokens(item: SearchResult): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(item.chunk.content.length / 4);
  }

  /**
   * Count preserved constraints
   */
  private countPreservedConstraints(data: SearchResult[]): number {
    return data.filter(item => 
      item.chunk.metadata.documentType === DocumentType.POLICY ||
      item.chunk.metadata.documentType === DocumentType.CONSTRAINT
    ).length;
  }

  /**
   * Count preserved conflicts
   */
  private countPreservedConflicts(data: SearchResult[]): number {
    return data.filter(item => 
      item.chunk.content.toLowerCase().includes('conflict') ||
      item.chunk.content.toLowerCase().includes('violation')
    ).length;
  }

  /**
   * Get list of applied optimization techniques
   */
  private getAppliedTechniques(): string[] {
    const techniques: string[] = [];
    
    if (this.options.compressRedundancy) {
      techniques.push('Redundancy Removal');
    }
    
    if (this.options.prioritizeRelevance) {
      techniques.push('Relevance Prioritization');
    }
    
    if (this.options.preserveConstraints) {
      techniques.push('Constraint Preservation');
    }
    
    if (this.options.preserveConflicts) {
      techniques.push('Conflict Preservation');
    }
    
    techniques.push('Content Compression');
    techniques.push('Token Limit Trimming');
    
    return techniques;
  }
}

