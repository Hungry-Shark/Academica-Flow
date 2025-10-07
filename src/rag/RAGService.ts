/**
 * RAG Service - Main orchestrator for document processing and retrieval
 * Combines all RAG components for comprehensive administrative data management
 */

import { PrismaClient } from '@prisma/client';
import { DocumentProcessor, SearchQuery, SearchResult, ProcessingOptions } from './DocumentProcessor';
import { EmbeddingService, EmbeddingOptions } from './EmbeddingService';
import { VectorStore, VectorStoreConfig, VectorStoreFactory } from './VectorStore';
import { MetadataExtractor, ExtractionOptions } from './MetadataExtractor';
import { ChunkingStrategy, ChunkingOptions } from './ChunkingStrategy';
import { DocumentType, ChunkType } from './DocumentProcessor';

export interface RAGConfig {
  embedding: EmbeddingOptions;
  vectorStore: VectorStoreConfig;
  chunking: ChunkingOptions;
  extraction: ExtractionOptions;
  processing: ProcessingOptions;
}

export interface RAGSearchOptions {
  query: string;
  documentTypes?: DocumentType[];
  chunkTypes?: ChunkType[];
  organizationId: string;
  departmentId?: string;
  year?: number;
  semester?: string;
  filters?: Record<string, any>;
  limit?: number;
  threshold?: number;
  includeExplanation?: boolean;
}

export interface RAGSearchResponse {
  results: SearchResult[];
  totalResults: number;
  processingTime: number;
  query: string;
  filters: Record<string, any>;
  suggestions?: string[];
}

export class RAGService {
  private prisma: PrismaClient;
  private documentProcessor: DocumentProcessor;
  private embeddingService: EmbeddingService;
  private vectorStore: VectorStore;
  private metadataExtractor: MetadataExtractor;
  private chunkingStrategy: ChunkingStrategy;
  private config: RAGConfig;

  constructor(prisma: PrismaClient, config: RAGConfig) {
    this.prisma = prisma;
    this.config = config;
    
    // Initialize components
    this.embeddingService = new EmbeddingService(config.embedding);
    this.vectorStore = VectorStoreFactory.create(config.vectorStore);
    this.metadataExtractor = new MetadataExtractor(config.extraction);
    this.chunkingStrategy = new ChunkingStrategy(this.metadataExtractor, config.chunking);
    this.documentProcessor = new DocumentProcessor(
      prisma,
      this.embeddingService,
      this.vectorStore,
      this.metadataExtractor,
      this.chunkingStrategy
    );
  }

  // ================================
  // INITIALIZATION
  // ================================

  /**
   * Initialize the RAG service
   */
  async initialize(): Promise<void> {
    console.log('Initializing RAG service...');
    
    try {
      await this.vectorStore.initialize();
      console.log('RAG service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RAG service:', error);
      throw new Error(`RAG initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ================================
  // DOCUMENT PROCESSING
  // ================================

  /**
   * Process all administrative data for an organization
   */
  async processOrganizationData(organizationId: string): Promise<void> {
    console.log(`Processing administrative data for organization: ${organizationId}`);
    
    try {
      await this.documentProcessor.processAllData(organizationId, this.config.processing);
      console.log(`Successfully processed data for organization: ${organizationId}`);
    } catch (error) {
      console.error('Failed to process organization data:', error);
      throw new Error(`Data processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process specific data types for an organization
   */
  async processDataByType(
    organizationId: string,
    dataTypes: DocumentType[]
  ): Promise<void> {
    console.log(`Processing data types ${dataTypes.join(', ')} for organization: ${organizationId}`);
    
    try {
      const processingPromises = dataTypes.map(async (dataType) => {
        switch (dataType) {
          case DocumentType.FACULTY:
            await this.documentProcessor.processFacultyData(organizationId, this.config.processing);
            break;
          case DocumentType.STUDENT:
            await this.documentProcessor.processStudentData(organizationId, this.config.processing);
            break;
          case DocumentType.SUBJECT:
            await this.documentProcessor.processSubjectData(organizationId, this.config.processing);
            break;
          case DocumentType.ROOM:
            await this.documentProcessor.processRoomData(organizationId, this.config.processing);
            break;
          case DocumentType.POLICY:
          case DocumentType.CONSTRAINT:
            await this.documentProcessor.processPolicyData(organizationId, this.config.processing);
            break;
          case DocumentType.TIMETABLE:
            await this.documentProcessor.processTimetableData(organizationId, this.config.processing);
            break;
          default:
            console.warn(`Unknown data type: ${dataType}`);
        }
      });

      await Promise.all(processingPromises);
      console.log(`Successfully processed data types for organization: ${organizationId}`);
    } catch (error) {
      console.error('Failed to process data by type:', error);
      throw new Error(`Data processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ================================
  // SEARCH AND RETRIEVAL
  // ================================

  /**
   * Perform semantic search across all document types
   */
  async search(options: RAGSearchOptions): Promise<RAGSearchResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`Performing semantic search: "${options.query}"`);
      
      const searchQuery: SearchQuery = {
        query: options.query,
        documentTypes: options.documentTypes,
        chunkTypes: options.chunkTypes,
        organizationId: options.organizationId,
        departmentId: options.departmentId,
        year: options.year,
        semester: options.semester,
        filters: options.filters,
        limit: options.limit || 25,
        threshold: options.threshold || 0.5
      };

      const results = await this.documentProcessor.semanticSearch(searchQuery);
      
      const response: RAGSearchResponse = {
        results,
        totalResults: results.length,
        processingTime: Date.now() - startTime,
        query: options.query,
        filters: options.filters || {},
        suggestions: options.includeExplanation ? this.generateSearchSuggestions(options.query, results) : undefined
      };

      console.log(`Search completed in ${response.processingTime}ms, found ${response.totalResults} results`);
      return response;
    } catch (error) {
      console.error('Search failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for faculty with specific criteria
   */
  async searchFaculty(options: RAGSearchOptions): Promise<RAGSearchResponse> {
    const startTime = Date.now();
    
    try {
      const searchQuery: SearchQuery = {
        query: options.query,
        documentTypes: [DocumentType.FACULTY],
        organizationId: options.organizationId,
        departmentId: options.departmentId,
        filters: options.filters,
        limit: options.limit || 20,
        threshold: options.threshold || 0.6
      };

      const results = await this.documentProcessor.searchFaculty(searchQuery);
      
      return {
        results,
        totalResults: results.length,
        processingTime: Date.now() - startTime,
        query: options.query,
        filters: options.filters || {}
      };
    } catch (error) {
      console.error('Faculty search failed:', error);
      throw new Error(`Faculty search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for students with specific criteria
   */
  async searchStudents(options: RAGSearchOptions): Promise<RAGSearchResponse> {
    const startTime = Date.now();
    
    try {
      const searchQuery: SearchQuery = {
        query: options.query,
        documentTypes: [DocumentType.STUDENT],
        organizationId: options.organizationId,
        departmentId: options.departmentId,
        year: options.year,
        semester: options.semester,
        filters: options.filters,
        limit: options.limit || 50,
        threshold: options.threshold || 0.6
      };

      const results = await this.documentProcessor.searchStudents(searchQuery);
      
      return {
        results,
        totalResults: results.length,
        processingTime: Date.now() - startTime,
        query: options.query,
        filters: options.filters || {}
      };
    } catch (error) {
      console.error('Student search failed:', error);
      throw new Error(`Student search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for subjects with specific criteria
   */
  async searchSubjects(options: RAGSearchOptions): Promise<RAGSearchResponse> {
    const startTime = Date.now();
    
    try {
      const searchQuery: SearchQuery = {
        query: options.query,
        documentTypes: [DocumentType.SUBJECT],
        organizationId: options.organizationId,
        departmentId: options.departmentId,
        filters: options.filters,
        limit: options.limit || 30,
        threshold: options.threshold || 0.6
      };

      const results = await this.documentProcessor.searchSubjects(searchQuery);
      
      return {
        results,
        totalResults: results.length,
        processingTime: Date.now() - startTime,
        query: options.query,
        filters: options.filters || {}
      };
    } catch (error) {
      console.error('Subject search failed:', error);
      throw new Error(`Subject search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for rooms with specific criteria
   */
  async searchRooms(options: RAGSearchOptions): Promise<RAGSearchResponse> {
    const startTime = Date.now();
    
    try {
      const searchQuery: SearchQuery = {
        query: options.query,
        documentTypes: [DocumentType.ROOM],
        organizationId: options.organizationId,
        filters: options.filters,
        limit: options.limit || 20,
        threshold: options.threshold || 0.6
      };

      const results = await this.documentProcessor.searchRooms(searchQuery);
      
      return {
        results,
        totalResults: results.length,
        processingTime: Date.now() - startTime,
        query: options.query,
        filters: options.filters || {}
      };
    } catch (error) {
      console.error('Room search failed:', error);
      throw new Error(`Room search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for policies and constraints
   */
  async searchPolicies(options: RAGSearchOptions): Promise<RAGSearchResponse> {
    const startTime = Date.now();
    
    try {
      const searchQuery: SearchQuery = {
        query: options.query,
        documentTypes: [DocumentType.POLICY, DocumentType.CONSTRAINT],
        organizationId: options.organizationId,
        filters: options.filters,
        limit: options.limit || 15,
        threshold: options.threshold || 0.7
      };

      const results = await this.documentProcessor.searchPolicies(searchQuery);
      
      return {
        results,
        totalResults: results.length,
        processingTime: Date.now() - startTime,
        query: options.query,
        filters: options.filters || {}
      };
    } catch (error) {
      console.error('Policy search failed:', error);
      throw new Error(`Policy search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ================================
  // REAL-TIME UPDATES
  // ================================

  /**
   * Update faculty data in real-time
   */
  async updateFacultyData(facultyId: string, organizationId: string): Promise<void> {
    try {
      console.log(`Updating faculty data: ${facultyId}`);
      await this.documentProcessor.updateFacultyData(facultyId, organizationId, this.config.processing);
      console.log(`Successfully updated faculty data: ${facultyId}`);
    } catch (error) {
      console.error('Failed to update faculty data:', error);
      throw new Error(`Faculty update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update student data in real-time
   */
  async updateStudentData(studentId: string, organizationId: string): Promise<void> {
    try {
      console.log(`Updating student data: ${studentId}`);
      await this.documentProcessor.updateStudentData(studentId, organizationId, this.config.processing);
      console.log(`Successfully updated student data: ${studentId}`);
    } catch (error) {
      console.error('Failed to update student data:', error);
      throw new Error(`Student update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update subject data in real-time
   */
  async updateSubjectData(subjectId: string, organizationId: string): Promise<void> {
    try {
      console.log(`Updating subject data: ${subjectId}`);
      await this.documentProcessor.updateSubjectData(subjectId, organizationId, this.config.processing);
      console.log(`Successfully updated subject data: ${subjectId}`);
    } catch (error) {
      console.error('Failed to update subject data:', error);
      throw new Error(`Subject update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ================================
  // ANALYTICS AND MONITORING
  // ================================

  /**
   * Get processing statistics for an organization
   */
  async getProcessingStats(organizationId: string): Promise<any> {
    try {
      return await this.documentProcessor.getProcessingStats(organizationId);
    } catch (error) {
      console.error('Failed to get processing stats:', error);
      throw new Error(`Stats retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(organizationId: string): Promise<any> {
    try {
      const stats = await this.documentProcessor.getProcessingStats(organizationId);
      
      return {
        totalDocuments: stats.totalChunks,
        documentsByType: stats.chunksByDocumentType,
        documentsByChunkType: stats.chunksByType,
        lastProcessed: stats.lastProcessed,
        collectionSize: stats.collectionSize
      };
    } catch (error) {
      console.error('Failed to get search analytics:', error);
      throw new Error(`Analytics retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ================================
  // MAINTENANCE OPERATIONS
  // ================================

  /**
   * Clear all data for an organization
   */
  async clearOrganizationData(organizationId: string): Promise<void> {
    try {
      console.log(`Clearing data for organization: ${organizationId}`);
      await this.documentProcessor.clearOrganizationData(organizationId);
      console.log(`Successfully cleared data for organization: ${organizationId}`);
    } catch (error) {
      console.error('Failed to clear organization data:', error);
      throw new Error(`Data clearing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rebuild vector index for an organization
   */
  async rebuildIndex(organizationId: string): Promise<void> {
    try {
      console.log(`Rebuilding index for organization: ${organizationId}`);
      
      // Clear existing data
      await this.clearOrganizationData(organizationId);
      
      // Reprocess all data
      await this.processOrganizationData(organizationId);
      
      console.log(`Successfully rebuilt index for organization: ${organizationId}`);
    } catch (error) {
      console.error('Failed to rebuild index:', error);
      throw new Error(`Index rebuild failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  /**
   * Generate search suggestions based on query and results
   */
  private generateSearchSuggestions(query: string, results: SearchResult[]): string[] {
    const suggestions: string[] = [];
    
    // Extract common terms from results
    const commonTerms = new Map<string, number>();
    
    results.forEach(result => {
      if (result.chunk.metadata.keywords) {
        result.chunk.metadata.keywords.forEach(keyword => {
          commonTerms.set(keyword, (commonTerms.get(keyword) || 0) + 1);
        });
      }
    });
    
    // Get top 5 most common terms
    const sortedTerms = Array.from(commonTerms.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term]) => term);
    
    suggestions.push(...sortedTerms);
    
    // Add query variations
    const queryWords = query.toLowerCase().split(/\s+/);
    if (queryWords.length > 1) {
      suggestions.push(queryWords.join(' '));
      suggestions.push(queryWords[0]); // First word
    }
    
    return [...new Set(suggestions)].slice(0, 10);
  }

  /**
   * Validate search options
   */
  private validateSearchOptions(options: RAGSearchOptions): void {
    if (!options.query || options.query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }
    
    if (!options.organizationId) {
      throw new Error('Organization ID is required');
    }
    
    if (options.limit && (options.limit < 1 || options.limit > 100)) {
      throw new Error('Limit must be between 1 and 100');
    }
    
    if (options.threshold && (options.threshold < 0 || options.threshold > 1)) {
      throw new Error('Threshold must be between 0 and 1');
    }
  }

  /**
   * Get default RAG configuration
   */
  static getDefaultConfig(): RAGConfig {
    return {
      embedding: {
        provider: 'openai',
        model: 'text-embedding-3-small',
        batchSize: 100,
        maxRetries: 3,
        timeout: 30000
      },
      vectorStore: {
        provider: 'chroma',
        collectionName: 'nep_timetable_documents',
        dimensions: 1536,
        distanceMetric: 'cosine',
        host: 'http://localhost:8000'
      },
      chunking: {
        maxChunkSize: 1000,
        overlapSize: 100,
        preserveContext: true,
        includeMetadata: true,
        chunkByEntity: true
      },
      extraction: {
        includeKeywords: true,
        includeTags: true,
        includeNEPCompliance: true,
        includeTemporalData: true,
        includeRelationships: true
      },
      processing: {
        batchSize: 100,
        updateExisting: true,
        includeEmbeddings: true,
        chunkingStrategy: null as any, // Will be set by constructor
        metadataExtraction: true,
        realTimeUpdates: true
      }
    };
  }
}

