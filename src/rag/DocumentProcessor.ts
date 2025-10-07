/**
 * RAG Document Processing System for Administrative Data
 * Handles faculty, student, room, and policy data with intelligent chunking
 */

import { PrismaClient } from '@prisma/client';
import { EmbeddingService } from './EmbeddingService';
import { VectorStore } from './VectorStore';
import { MetadataExtractor } from './MetadataExtractor';
import { ChunkingStrategy } from './ChunkingStrategy';
import {
  FacultyProfile,
  StudentProfile,
  SubjectDetails,
  GeneratedTimetable,
  ConflictRule,
  Room,
  AdministrativeData
} from '../types/nep-interfaces';

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  embedding?: number[];
  chunkType: ChunkType;
  sourceId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentMetadata {
  // Core identifiers
  organizationId: string;
  departmentId?: string;
  documentType: DocumentType;
  chunkType: ChunkType;
  
  // Faculty metadata
  facultyId?: string;
  employeeId?: string;
  facultyName?: string;
  designation?: string;
  specializations?: string[];
  nepCategories?: string[];
  
  // Student metadata
  studentId?: string;
  rollNumber?: string;
  studentName?: string;
  currentYear?: number;
  currentSemester?: number;
  admissionYear?: number;
  
  // Subject metadata
  subjectId?: string;
  subjectCode?: string;
  subjectName?: string;
  nepCategory?: string;
  credits?: number;
  offeredInYears?: number[];
  
  // Room metadata
  roomId?: string;
  roomCode?: string;
  roomName?: string;
  roomType?: string;
  capacity?: number;
  equipment?: string[];
  
  // Policy metadata
  policyType?: string;
  ruleCategory?: string;
  constraintType?: string;
  priority?: number;
  
  // Academic metadata
  academicYear?: string;
  semester?: string;
  year?: number;
  
  // Searchable tags
  tags: string[];
  keywords: string[];
  
  // Timestamps
  lastModified: Date;
  version: number;
}

export enum DocumentType {
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT',
  SUBJECT = 'SUBJECT',
  ROOM = 'ROOM',
  POLICY = 'POLICY',
  CONSTRAINT = 'CONSTRAINT',
  TIMETABLE = 'TIMETABLE',
  ADMINISTRATIVE = 'ADMINISTRATIVE'
}

export enum ChunkType {
  FACULTY_PROFILE = 'FACULTY_PROFILE',
  FACULTY_AVAILABILITY = 'FACULTY_AVAILABILITY',
  FACULTY_SPECIALIZATIONS = 'FACULTY_SPECIALIZATIONS',
  STUDENT_PROFILE = 'STUDENT_PROFILE',
  STUDENT_ENROLLMENT = 'STUDENT_ENROLLMENT',
  STUDENT_CREDITS = 'STUDENT_CREDITS',
  SUBJECT_DETAILS = 'SUBJECT_DETAILS',
  SUBJECT_PREREQUISITES = 'SUBJECT_PREREQUISITES',
  SUBJECT_ASSESSMENT = 'SUBJECT_ASSESSMENT',
  ROOM_DETAILS = 'ROOM_DETAILS',
  ROOM_AVAILABILITY = 'ROOM_AVAILABILITY',
  ROOM_EQUIPMENT = 'ROOM_EQUIPMENT',
  POLICY_RULE = 'POLICY_RULE',
  CONSTRAINT_RULE = 'CONSTRAINT_RULE',
  NEP_COMPLIANCE = 'NEP_COMPLIANCE',
  TIMETABLE_SLOT = 'TIMETABLE_SLOT',
  TIMETABLE_CONSTRAINTS = 'TIMETABLE_CONSTRAINTS'
}

export interface ProcessingOptions {
  batchSize: number;
  updateExisting: boolean;
  includeEmbeddings: boolean;
  chunkingStrategy: ChunkingStrategy;
  metadataExtraction: boolean;
  realTimeUpdates: boolean;
}

export interface SearchQuery {
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
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  relevance: 'HIGH' | 'MEDIUM' | 'LOW';
  matchedFields: string[];
  explanation?: string;
}

export class DocumentProcessor {
  private prisma: PrismaClient;
  private embeddingService: EmbeddingService;
  private vectorStore: VectorStore;
  private metadataExtractor: MetadataExtractor;
  private chunkingStrategy: ChunkingStrategy;

  constructor(
    prisma: PrismaClient,
    embeddingService: EmbeddingService,
    vectorStore: VectorStore,
    metadataExtractor: MetadataExtractor,
    chunkingStrategy: ChunkingStrategy
  ) {
    this.prisma = prisma;
    this.embeddingService = embeddingService;
    this.vectorStore = vectorStore;
    this.metadataExtractor = metadataExtractor;
    this.chunkingStrategy = chunkingStrategy;
  }

  // ================================
  // DOCUMENT PROCESSING METHODS
  // ================================

  /**
   * Process faculty data with intelligent chunking
   */
  async processFacultyData(
    organizationId: string,
    options: ProcessingOptions = this.getDefaultOptions()
  ): Promise<DocumentChunk[]> {
    console.log('Processing faculty data...');
    
    const facultyData = await this.prisma.faculty.findMany({
      where: { organizationId },
      include: {
        department: true,
        availability: true,
        subjects: {
          include: { subject: true }
        }
      }
    });

    const chunks: DocumentChunk[] = [];

    for (const faculty of facultyData) {
      // Process faculty profile
      const profileChunks = await this.chunkingStrategy.chunkFacultyProfile(faculty, organizationId);
      chunks.push(...profileChunks);

      // Process faculty availability
      const availabilityChunks = await this.chunkingStrategy.chunkFacultyAvailability(faculty, organizationId);
      chunks.push(...availabilityChunks);

      // Process faculty specializations
      const specializationChunks = await this.chunkingStrategy.chunkFacultySpecializations(faculty, organizationId);
      chunks.push(...specializationChunks);
    }

    // Process embeddings if requested
    if (options.includeEmbeddings) {
      await this.processEmbeddings(chunks);
    }

    // Store in vector database
    await this.vectorStore.upsertChunks(chunks);

    console.log(`Processed ${chunks.length} faculty chunks`);
    return chunks;
  }

  /**
   * Process student data with batch processing
   */
  async processStudentData(
    organizationId: string,
    options: ProcessingOptions = this.getDefaultOptions()
  ): Promise<DocumentChunk[]> {
    console.log('Processing student data...');
    
    const chunks: DocumentChunk[] = [];
    let offset = 0;
    const batchSize = options.batchSize;

    while (true) {
      const students = await this.prisma.student.findMany({
        where: { organizationId },
        include: {
          department: true,
          enrollments: {
            include: {
              subject: {
                include: { department: true }
              }
            }
          },
          attendanceRecords: true,
          assessmentRecords: true
        },
        skip: offset,
        take: batchSize
      });

      if (students.length === 0) break;

      for (const student of students) {
        // Process student profile
        const profileChunks = await this.chunkingStrategy.chunkStudentProfile(student, organizationId);
        chunks.push(...profileChunks);

        // Process student enrollments
        const enrollmentChunks = await this.chunkingStrategy.chunkStudentEnrollments(student, organizationId);
        chunks.push(...enrollmentChunks);

        // Process student credits
        const creditChunks = await this.chunkingStrategy.chunkStudentCredits(student, organizationId);
        chunks.push(...creditChunks);
      }

      offset += batchSize;

      // Process embeddings for this batch
      if (options.includeEmbeddings) {
        const batchChunks = chunks.slice(-students.length * 3); // Approximate chunks per student
        await this.processEmbeddings(batchChunks);
      }
    }

    // Store in vector database
    await this.vectorStore.upsertChunks(chunks);

    console.log(`Processed ${chunks.length} student chunks`);
    return chunks;
  }

  /**
   * Process subject data with NEP compliance information
   */
  async processSubjectData(
    organizationId: string,
    options: ProcessingOptions = this.getDefaultOptions()
  ): Promise<DocumentChunk[]> {
    console.log('Processing subject data...');
    
    const subjects = await this.prisma.subject.findMany({
      where: { organizationId },
      include: {
        department: true,
        prerequisites: {
          include: { prerequisite: true }
        },
        faculties: {
          include: { faculty: true }
        }
      }
    });

    const chunks: DocumentChunk[] = [];

    for (const subject of subjects) {
      // Process subject details
      const detailChunks = await this.chunkingStrategy.chunkSubjectDetails(subject, organizationId);
      chunks.push(...detailChunks);

      // Process subject prerequisites
      const prerequisiteChunks = await this.chunkingStrategy.chunkSubjectPrerequisites(subject, organizationId);
      chunks.push(...prerequisiteChunks);

      // Process subject assessment pattern
      const assessmentChunks = await this.chunkingStrategy.chunkSubjectAssessment(subject, organizationId);
      chunks.push(...assessmentChunks);
    }

    if (options.includeEmbeddings) {
      await this.processEmbeddings(chunks);
    }

    await this.vectorStore.upsertChunks(chunks);

    console.log(`Processed ${chunks.length} subject chunks`);
    return chunks;
  }

  /**
   * Process room data with equipment and availability
   */
  async processRoomData(
    organizationId: string,
    options: ProcessingOptions = this.getDefaultOptions()
  ): Promise<DocumentChunk[]> {
    console.log('Processing room data...');
    
    const rooms = await this.prisma.room.findMany({
      where: { organizationId },
      include: { availability: true }
    });

    const chunks: DocumentChunk[] = [];

    for (const room of rooms) {
      // Process room details
      const detailChunks = await this.chunkingStrategy.chunkRoomDetails(room, organizationId);
      chunks.push(...detailChunks);

      // Process room availability
      const availabilityChunks = await this.chunkingStrategy.chunkRoomAvailability(room, organizationId);
      chunks.push(...availabilityChunks);

      // Process room equipment
      const equipmentChunks = await this.chunkingStrategy.chunkRoomEquipment(room, organizationId);
      chunks.push(...equipmentChunks);
    }

    if (options.includeEmbeddings) {
      await this.processEmbeddings(chunks);
    }

    await this.vectorStore.upsertChunks(chunks);

    console.log(`Processed ${chunks.length} room chunks`);
    return chunks;
  }

  /**
   * Process policy and constraint documents
   */
  async processPolicyData(
    organizationId: string,
    options: ProcessingOptions = this.getDefaultOptions()
  ): Promise<DocumentChunk[]> {
    console.log('Processing policy data...');
    
    const constraints = await this.prisma.constraint.findMany({
      where: { organizationId, isActive: true }
    });

    const chunks: DocumentChunk[] = [];

    for (const constraint of constraints) {
      // Process constraint rules
      const ruleChunks = await this.chunkingStrategy.chunkConstraintRule(constraint, organizationId);
      chunks.push(...ruleChunks);

      // Process NEP compliance rules
      if (constraint.type === 'NEP_CREDIT_DISTRIBUTION') {
        const nepChunks = await this.chunkingStrategy.chunkNEPCompliance(constraint, organizationId);
        chunks.push(...nepChunks);
      }
    }

    if (options.includeEmbeddings) {
      await this.processEmbeddings(chunks);
    }

    await this.vectorStore.upsertChunks(chunks);

    console.log(`Processed ${chunks.length} policy chunks`);
    return chunks;
  }

  /**
   * Process timetable data for historical analysis
   */
  async processTimetableData(
    organizationId: string,
    options: ProcessingOptions = this.getDefaultOptions()
  ): Promise<DocumentChunk[]> {
    console.log('Processing timetable data...');
    
    const timetables = await this.prisma.timetable.findMany({
      where: { organizationId },
      include: {
        slots: {
          include: {
            faculty: true,
            room: true,
            subject: true,
            timeSlot: true
          }
        }
      },
      orderBy: { generatedAt: 'desc' },
      take: 100 // Limit to recent timetables
    });

    const chunks: DocumentChunk[] = [];

    for (const timetable of timetables) {
      // Process timetable slots
      const slotChunks = await this.chunkingStrategy.chunkTimetableSlots(timetable, organizationId);
      chunks.push(...slotChunks);

      // Process timetable constraints
      const constraintChunks = await this.chunkingStrategy.chunkTimetableConstraints(timetable, organizationId);
      chunks.push(...constraintChunks);
    }

    if (options.includeEmbeddings) {
      await this.processEmbeddings(chunks);
    }

    await this.vectorStore.upsertChunks(chunks);

    console.log(`Processed ${chunks.length} timetable chunks`);
    return chunks;
  }

  /**
   * Process all administrative data
   */
  async processAllData(
    organizationId: string,
    options: ProcessingOptions = this.getDefaultOptions()
  ): Promise<DocumentChunk[]> {
    console.log('Processing all administrative data...');
    
    const allChunks: DocumentChunk[] = [];

    // Process all data types
    const [facultyChunks, studentChunks, subjectChunks, roomChunks, policyChunks, timetableChunks] = await Promise.all([
      this.processFacultyData(organizationId, options),
      this.processStudentData(organizationId, options),
      this.processSubjectData(organizationId, options),
      this.processRoomData(organizationId, options),
      this.processPolicyData(organizationId, options),
      this.processTimetableData(organizationId, options)
    ]);

    allChunks.push(
      ...facultyChunks,
      ...studentChunks,
      ...subjectChunks,
      ...roomChunks,
      ...policyChunks,
      ...timetableChunks
    );

    console.log(`Processed total ${allChunks.length} chunks`);
    return allChunks;
  }

  // ================================
  // SEARCH AND RETRIEVAL METHODS
  // ================================

  /**
   * Semantic search for relevant scheduling constraints
   */
  async searchConstraints(
    query: SearchQuery
  ): Promise<SearchResult[]> {
    console.log('Searching for constraints:', query.query);
    
    const searchResults = await this.vectorStore.search({
      query: query.query,
      filters: {
        organizationId: query.organizationId,
        documentType: DocumentType.CONSTRAINT,
        ...query.filters
      },
      limit: query.limit || 10,
      threshold: query.threshold || 0.7
    });

    return this.rankSearchResults(searchResults, query);
  }

  /**
   * Search for faculty with specific specializations
   */
  async searchFaculty(
    query: SearchQuery
  ): Promise<SearchResult[]> {
    console.log('Searching for faculty:', query.query);
    
    const searchResults = await this.vectorStore.search({
      query: query.query,
      filters: {
        organizationId: query.organizationId,
        documentType: DocumentType.FACULTY,
        departmentId: query.departmentId,
        ...query.filters
      },
      limit: query.limit || 20,
      threshold: query.threshold || 0.6
    });

    return this.rankSearchResults(searchResults, query);
  }

  /**
   * Search for students by year, semester, or subjects
   */
  async searchStudents(
    query: SearchQuery
  ): Promise<SearchResult[]> {
    console.log('Searching for students:', query.query);
    
    const searchResults = await this.vectorStore.search({
      query: query.query,
      filters: {
        organizationId: query.organizationId,
        documentType: DocumentType.STUDENT,
        departmentId: query.departmentId,
        year: query.year,
        semester: query.semester,
        ...query.filters
      },
      limit: query.limit || 50,
      threshold: query.threshold || 0.6
    });

    return this.rankSearchResults(searchResults, query);
  }

  /**
   * Search for subjects by NEP category or prerequisites
   */
  async searchSubjects(
    query: SearchQuery
  ): Promise<SearchResult[]> {
    console.log('Searching for subjects:', query.query);
    
    const searchResults = await this.vectorStore.search({
      query: query.query,
      filters: {
        organizationId: query.organizationId,
        documentType: DocumentType.SUBJECT,
        departmentId: query.departmentId,
        ...query.filters
      },
      limit: query.limit || 30,
      threshold: query.threshold || 0.6
    });

    return this.rankSearchResults(searchResults, query);
  }

  /**
   * Search for rooms by capacity, equipment, or availability
   */
  async searchRooms(
    query: SearchQuery
  ): Promise<SearchResult[]> {
    console.log('Searching for rooms:', query.query);
    
    const searchResults = await this.vectorStore.search({
      query: query.query,
      filters: {
        organizationId: query.organizationId,
        documentType: DocumentType.ROOM,
        ...query.filters
      },
      limit: query.limit || 20,
      threshold: query.threshold || 0.6
    });

    return this.rankSearchResults(searchResults, query);
  }

  /**
   * Search for NEP policy documents
   */
  async searchPolicies(
    query: SearchQuery
  ): Promise<SearchResult[]> {
    console.log('Searching for policies:', query.query);
    
    const searchResults = await this.vectorStore.search({
      query: query.query,
      filters: {
        organizationId: query.organizationId,
        documentType: DocumentType.POLICY,
        ...query.filters
      },
      limit: query.limit || 15,
      threshold: query.threshold || 0.7
    });

    return this.rankSearchResults(searchResults, query);
  }

  /**
   * General semantic search across all document types
   */
  async semanticSearch(
    query: SearchQuery
  ): Promise<SearchResult[]> {
    console.log('Performing semantic search:', query.query);
    
    const searchResults = await this.vectorStore.search({
      query: query.query,
      filters: {
        organizationId: query.organizationId,
        documentType: query.documentTypes,
        chunkType: query.chunkTypes,
        departmentId: query.departmentId,
        year: query.year,
        semester: query.semester,
        ...query.filters
      },
      limit: query.limit || 25,
      threshold: query.threshold || 0.5
    });

    return this.rankSearchResults(searchResults, query);
  }

  // ================================
  // REAL-TIME UPDATE METHODS
  // ================================

  /**
   * Update faculty data in real-time
   */
  async updateFacultyData(
    facultyId: string,
    organizationId: string,
    options: ProcessingOptions = this.getDefaultOptions()
  ): Promise<DocumentChunk[]> {
    console.log('Updating faculty data:', facultyId);
    
    const faculty = await this.prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        department: true,
        availability: true,
        subjects: {
          include: { subject: true }
        }
      }
    });

    if (!faculty) {
      throw new Error('Faculty not found');
    }

    // Delete existing chunks
    await this.vectorStore.deleteChunks({
      organizationId,
      facultyId,
      documentType: DocumentType.FACULTY
    });

    // Process new chunks
    const chunks: DocumentChunk[] = [];
    
    const profileChunks = await this.chunkingStrategy.chunkFacultyProfile(faculty, organizationId);
    const availabilityChunks = await this.chunkingStrategy.chunkFacultyAvailability(faculty, organizationId);
    const specializationChunks = await this.chunkingStrategy.chunkFacultySpecializations(faculty, organizationId);
    
    chunks.push(...profileChunks, ...availabilityChunks, ...specializationChunks);

    if (options.includeEmbeddings) {
      await this.processEmbeddings(chunks);
    }

    await this.vectorStore.upsertChunks(chunks);

    console.log(`Updated ${chunks.length} faculty chunks`);
    return chunks;
  }

  /**
   * Update student data in real-time
   */
  async updateStudentData(
    studentId: string,
    organizationId: string,
    options: ProcessingOptions = this.getDefaultOptions()
  ): Promise<DocumentChunk[]> {
    console.log('Updating student data:', studentId);
    
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        department: true,
        enrollments: {
          include: {
            subject: {
              include: { department: true }
            }
          }
        },
        attendanceRecords: true,
        assessmentRecords: true
      }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Delete existing chunks
    await this.vectorStore.deleteChunks({
      organizationId,
      studentId,
      documentType: DocumentType.STUDENT
    });

    // Process new chunks
    const chunks: DocumentChunk[] = [];
    
    const profileChunks = await this.chunkingStrategy.chunkStudentProfile(student, organizationId);
    const enrollmentChunks = await this.chunkingStrategy.chunkStudentEnrollments(student, organizationId);
    const creditChunks = await this.chunkingStrategy.chunkStudentCredits(student, organizationId);
    
    chunks.push(...profileChunks, ...enrollmentChunks, ...creditChunks);

    if (options.includeEmbeddings) {
      await this.processEmbeddings(chunks);
    }

    await this.vectorStore.upsertChunks(chunks);

    console.log(`Updated ${chunks.length} student chunks`);
    return chunks;
  }

  /**
   * Update subject data in real-time
   */
  async updateSubjectData(
    subjectId: string,
    organizationId: string,
    options: ProcessingOptions = this.getDefaultOptions()
  ): Promise<DocumentChunk[]> {
    console.log('Updating subject data:', subjectId);
    
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        department: true,
        prerequisites: {
          include: { prerequisite: true }
        },
        faculties: {
          include: { faculty: true }
        }
      }
    });

    if (!subject) {
      throw new Error('Subject not found');
    }

    // Delete existing chunks
    await this.vectorStore.deleteChunks({
      organizationId,
      subjectId,
      documentType: DocumentType.SUBJECT
    });

    // Process new chunks
    const chunks: DocumentChunk[] = [];
    
    const detailChunks = await this.chunkingStrategy.chunkSubjectDetails(subject, organizationId);
    const prerequisiteChunks = await this.chunkingStrategy.chunkSubjectPrerequisites(subject, organizationId);
    const assessmentChunks = await this.chunkingStrategy.chunkSubjectAssessment(subject, organizationId);
    
    chunks.push(...detailChunks, ...prerequisiteChunks, ...assessmentChunks);

    if (options.includeEmbeddings) {
      await this.processEmbeddings(chunks);
    }

    await this.vectorStore.upsertChunks(chunks);

    console.log(`Updated ${chunks.length} subject chunks`);
    return chunks;
  }

  // ================================
  // UTILITY METHODS
  // ================================

  /**
   * Process embeddings for chunks
   */
  private async processEmbeddings(chunks: DocumentChunk[]): Promise<void> {
    console.log('Processing embeddings for', chunks.length, 'chunks');
    
    const texts = chunks.map(chunk => chunk.content);
    const embeddings = await this.embeddingService.generateEmbeddings(texts);
    
    chunks.forEach((chunk, index) => {
      chunk.embedding = embeddings[index];
    });
  }

  /**
   * Rank search results by relevance
   */
  private rankSearchResults(
    searchResults: any[],
    query: SearchQuery
  ): SearchResult[] {
    return searchResults.map(result => {
      const score = result.score || 0;
      let relevance: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      
      if (score >= 0.8) relevance = 'HIGH';
      else if (score >= 0.6) relevance = 'MEDIUM';
      
      return {
        chunk: result.chunk,
        score,
        relevance,
        matchedFields: this.getMatchedFields(result.chunk, query.query),
        explanation: this.generateExplanation(result.chunk, query.query, score)
      };
    });
  }

  /**
   * Get matched fields for search result
   */
  private getMatchedFields(chunk: DocumentChunk, query: string): string[] {
    const matchedFields: string[] = [];
    const queryLower = query.toLowerCase();
    
    if (chunk.metadata.facultyName?.toLowerCase().includes(queryLower)) {
      matchedFields.push('facultyName');
    }
    if (chunk.metadata.studentName?.toLowerCase().includes(queryLower)) {
      matchedFields.push('studentName');
    }
    if (chunk.metadata.subjectName?.toLowerCase().includes(queryLower)) {
      matchedFields.push('subjectName');
    }
    if (chunk.metadata.roomName?.toLowerCase().includes(queryLower)) {
      matchedFields.push('roomName');
    }
    if (chunk.content.toLowerCase().includes(queryLower)) {
      matchedFields.push('content');
    }
    
    return matchedFields;
  }

  /**
   * Generate explanation for search result
   */
  private generateExplanation(
    chunk: DocumentChunk,
    query: string,
    score: number
  ): string {
    const explanations: string[] = [];
    
    if (score >= 0.8) {
      explanations.push('High semantic similarity');
    } else if (score >= 0.6) {
      explanations.push('Good semantic match');
    } else {
      explanations.push('Partial match');
    }
    
    if (chunk.metadata.facultyName) {
      explanations.push(`Faculty: ${chunk.metadata.facultyName}`);
    }
    if (chunk.metadata.subjectName) {
      explanations.push(`Subject: ${chunk.metadata.subjectName}`);
    }
    if (chunk.metadata.roomName) {
      explanations.push(`Room: ${chunk.metadata.roomName}`);
    }
    
    return explanations.join(' | ');
  }

  /**
   * Get default processing options
   */
  private getDefaultOptions(): ProcessingOptions {
    return {
      batchSize: 100,
      updateExisting: true,
      includeEmbeddings: true,
      chunkingStrategy: this.chunkingStrategy,
      metadataExtraction: true,
      realTimeUpdates: true
    };
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(organizationId: string): Promise<{
    totalChunks: number;
    chunksByType: Record<ChunkType, number>;
    chunksByDocumentType: Record<DocumentType, number>;
    lastProcessed: Date;
  }> {
    const stats = await this.vectorStore.getStats(organizationId);
    return stats;
  }

  /**
   * Clear all data for organization
   */
  async clearOrganizationData(organizationId: string): Promise<void> {
    console.log('Clearing all data for organization:', organizationId);
    await this.vectorStore.deleteChunks({ organizationId });
  }
}

