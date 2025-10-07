/**
 * RAG Document Processing System - Comprehensive Usage Examples
 * Demonstrates how to use the RAG system for administrative data management
 */

import { PrismaClient } from '@prisma/client';
import { RAGService, RAGConfig, RAGSearchOptions } from '../src/rag/RAGService';
import { DocumentType, ChunkType } from '../src/rag/DocumentProcessor';

// ================================
// INITIALIZATION
// ================================

const prisma = new PrismaClient();

// Custom RAG configuration for production
const ragConfig: RAGConfig = {
  embedding: {
    provider: 'openai',
    model: 'text-embedding-3-small',
    batchSize: 50,
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
    chunkingStrategy: null as any,
    metadataExtraction: true,
    realTimeUpdates: true
  }
};

const ragService = new RAGService(prisma, ragConfig);

// ================================
// INITIALIZATION EXAMPLES
// ================================

async function initializationExamples() {
  console.log('=== RAG INITIALIZATION EXAMPLES ===');

  try {
    // Initialize RAG service
    await ragService.initialize();
    console.log('✅ RAG service initialized successfully');

    // Process all administrative data for an organization
    const organizationId = 'org_123';
    await ragService.processOrganizationData(organizationId);
    console.log('✅ Organization data processed successfully');

  } catch (error) {
    console.error('❌ Initialization failed:', error);
  }
}

// ================================
// DOCUMENT PROCESSING EXAMPLES
// ================================

async function documentProcessingExamples() {
  console.log('=== DOCUMENT PROCESSING EXAMPLES ===');

  const organizationId = 'org_123';

  try {
    // Process specific data types
    await ragService.processDataByType(organizationId, [
      DocumentType.FACULTY,
      DocumentType.STUDENT,
      DocumentType.SUBJECT
    ]);
    console.log('✅ Specific data types processed');

    // Process all data types
    await ragService.processOrganizationData(organizationId);
    console.log('✅ All organization data processed');

  } catch (error) {
    console.error('❌ Document processing failed:', error);
  }
}

// ================================
// SEARCH EXAMPLES
// ================================

async function searchExamples() {
  console.log('=== SEARCH EXAMPLES ===');

  const organizationId = 'org_123';

  try {
    // 1. General semantic search
    console.log('\n--- General Semantic Search ---');
    const generalSearch = await ragService.search({
      query: 'faculty with machine learning expertise available for 3rd year students',
      organizationId,
      limit: 10,
      threshold: 0.6,
      includeExplanation: true
    });

    console.log('General Search Results:', {
      totalResults: generalSearch.totalResults,
      processingTime: generalSearch.processingTime,
      suggestions: generalSearch.suggestions
    });

    generalSearch.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.chunk.metadata.facultyName || result.chunk.metadata.subjectName} (Score: ${result.score.toFixed(3)})`);
      console.log(`   Relevance: ${result.relevance}`);
      console.log(`   Matched Fields: ${result.matchedFields.join(', ')}`);
      if (result.explanation) {
        console.log(`   Explanation: ${result.explanation}`);
      }
    });

    // 2. Faculty-specific search
    console.log('\n--- Faculty Search ---');
    const facultySearch = await ragService.searchFaculty({
      query: 'professor available for database systems and has research experience',
      organizationId,
      departmentId: 'dept_cse',
      limit: 5,
      threshold: 0.7
    });

    console.log('Faculty Search Results:', {
      totalResults: facultySearch.totalResults,
      processingTime: facultySearch.processingTime
    });

    facultySearch.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.chunk.metadata.facultyName} - ${result.chunk.metadata.designation}`);
      console.log(`   Specializations: ${result.chunk.metadata.specializations?.join(', ')}`);
      console.log(`   Score: ${result.score.toFixed(3)}`);
    });

    // 3. Student search by year and subjects
    console.log('\n--- Student Search ---');
    const studentSearch = await ragService.searchStudents({
      query: '3rd year computer science students enrolled in data structures',
      organizationId,
      year: 3,
      limit: 20,
      threshold: 0.6
    });

    console.log('Student Search Results:', {
      totalResults: studentSearch.totalResults,
      processingTime: studentSearch.processingTime
    });

    studentSearch.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.chunk.metadata.studentName} - ${result.chunk.metadata.rollNumber}`);
      console.log(`   Year: ${result.chunk.metadata.currentYear}, Semester: ${result.chunk.metadata.currentSemester}`);
      console.log(`   Score: ${result.score.toFixed(3)}`);
    });

    // 4. Subject search by NEP category
    console.log('\n--- Subject Search ---');
    const subjectSearch = await ragService.searchSubjects({
      query: 'core subjects for 2nd year with practical components',
      organizationId,
      departmentId: 'dept_cse',
      limit: 15,
      threshold: 0.6
    });

    console.log('Subject Search Results:', {
      totalResults: subjectSearch.totalResults,
      processingTime: subjectSearch.processingTime
    });

    subjectSearch.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.chunk.metadata.subjectName} (${result.chunk.metadata.subjectCode})`);
      console.log(`   NEP Category: ${result.chunk.metadata.nepCategory}`);
      console.log(`   Credits: ${result.chunk.metadata.credits}`);
      console.log(`   Score: ${result.score.toFixed(3)}`);
    });

    // 5. Room search by capacity and equipment
    console.log('\n--- Room Search ---');
    const roomSearch = await ragService.searchRooms({
      query: 'lecture hall with capacity 60+ students and projector equipment',
      organizationId,
      limit: 10,
      threshold: 0.6
    });

    console.log('Room Search Results:', {
      totalResults: roomSearch.totalResults,
      processingTime: roomSearch.processingTime
    });

    roomSearch.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.chunk.metadata.roomName} (${result.chunk.metadata.roomCode})`);
      console.log(`   Type: ${result.chunk.metadata.roomType}, Capacity: ${result.chunk.metadata.capacity}`);
      console.log(`   Equipment: ${result.chunk.metadata.equipment?.join(', ')}`);
      console.log(`   Score: ${result.score.toFixed(3)}`);
    });

    // 6. Policy search for NEP compliance
    console.log('\n--- Policy Search ---');
    const policySearch = await ragService.searchPolicies({
      query: 'NEP 2020 credit distribution rules and faculty workload limits',
      organizationId,
      limit: 10,
      threshold: 0.7
    });

    console.log('Policy Search Results:', {
      totalResults: policySearch.totalResults,
      processingTime: policySearch.processingTime
    });

    policySearch.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.chunk.metadata.constraintType || 'Policy'}`);
      console.log(`   Priority: ${result.chunk.metadata.priority}, Weight: ${result.chunk.metadata.weight}`);
      console.log(`   Score: ${result.score.toFixed(3)}`);
    });

  } catch (error) {
    console.error('❌ Search failed:', error);
  }
}

// ================================
// ADVANCED SEARCH EXAMPLES
// ================================

async function advancedSearchExamples() {
  console.log('=== ADVANCED SEARCH EXAMPLES ===');

  const organizationId = 'org_123';

  try {
    // 1. Search with multiple filters
    console.log('\n--- Multi-Filter Search ---');
    const multiFilterSearch = await ragService.search({
      query: 'available faculty for 3rd year computer science students',
      organizationId,
      documentTypes: [DocumentType.FACULTY, DocumentType.SUBJECT],
      chunkTypes: [ChunkType.FACULTY_AVAILABILITY, ChunkType.SUBJECT_DETAILS],
      departmentId: 'dept_cse',
      year: 3,
      filters: {
        isAvailable: true,
        nepCategories: ['CORE', 'ELECTIVE']
      },
      limit: 15,
      threshold: 0.6
    });

    console.log('Multi-Filter Search Results:', {
      totalResults: multiFilterSearch.totalResults,
      processingTime: multiFilterSearch.processingTime
    });

    // 2. Search for NEP compliance issues
    console.log('\n--- NEP Compliance Search ---');
    const nepComplianceSearch = await ragService.search({
      query: 'students with insufficient core credits or elective credits',
      organizationId,
      documentTypes: [DocumentType.STUDENT],
      chunkTypes: [ChunkType.STUDENT_CREDITS],
      filters: {
        tags: ['nep_non_compliant', 'nep_core_deficient', 'nep_elective_deficient']
      },
      limit: 20,
      threshold: 0.7
    });

    console.log('NEP Compliance Search Results:', {
      totalResults: nepComplianceSearch.totalResults,
      processingTime: nepComplianceSearch.processingTime
    });

    nepComplianceSearch.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.chunk.metadata.studentName} - ${result.chunk.metadata.rollNumber}`);
      console.log(`   Core Credits: ${result.chunk.metadata.coreCredits || 'N/A'}`);
      console.log(`   Elective Credits: ${result.chunk.metadata.electiveCredits || 'N/A'}`);
      console.log(`   Score: ${result.score.toFixed(3)}`);
    });

    // 3. Search for timetable conflicts
    console.log('\n--- Timetable Conflict Search ---');
    const conflictSearch = await ragService.search({
      query: 'timetable slots with faculty conflicts or room double booking',
      organizationId,
      documentTypes: [DocumentType.TIMETABLE],
      chunkTypes: [ChunkType.TIMETABLE_CONSTRAINTS],
      filters: {
        tags: ['high_conflicts', 'conflict_free']
      },
      limit: 10,
      threshold: 0.6
    });

    console.log('Timetable Conflict Search Results:', {
      totalResults: conflictSearch.totalResults,
      processingTime: conflictSearch.processingTime
    });

  } catch (error) {
    console.error('❌ Advanced search failed:', error);
  }
}

// ================================
// REAL-TIME UPDATE EXAMPLES
// ================================

async function realTimeUpdateExamples() {
  console.log('=== REAL-TIME UPDATE EXAMPLES ===');

  const organizationId = 'org_123';

  try {
    // 1. Update faculty data when availability changes
    console.log('\n--- Faculty Update ---');
    const facultyId = 'faculty_123';
    await ragService.updateFacultyData(facultyId, organizationId);
    console.log('✅ Faculty data updated successfully');

    // 2. Update student data when enrollment changes
    console.log('\n--- Student Update ---');
    const studentId = 'student_456';
    await ragService.updateStudentData(studentId, organizationId);
    console.log('✅ Student data updated successfully');

    // 3. Update subject data when curriculum changes
    console.log('\n--- Subject Update ---');
    const subjectId = 'subject_789';
    await ragService.updateSubjectData(subjectId, organizationId);
    console.log('✅ Subject data updated successfully');

  } catch (error) {
    console.error('❌ Real-time update failed:', error);
  }
}

// ================================
// ANALYTICS EXAMPLES
// ================================

async function analyticsExamples() {
  console.log('=== ANALYTICS EXAMPLES ===');

  const organizationId = 'org_123';

  try {
    // 1. Get processing statistics
    console.log('\n--- Processing Statistics ---');
    const processingStats = await ragService.getProcessingStats(organizationId);
    console.log('Processing Statistics:', {
      totalChunks: processingStats.totalChunks,
      chunksByType: processingStats.chunksByType,
      chunksByDocumentType: processingStats.chunksByDocumentType,
      lastProcessed: processingStats.lastProcessed
    });

    // 2. Get search analytics
    console.log('\n--- Search Analytics ---');
    const searchAnalytics = await ragService.getSearchAnalytics(organizationId);
    console.log('Search Analytics:', {
      totalDocuments: searchAnalytics.totalDocuments,
      documentsByType: searchAnalytics.documentsByType,
      documentsByChunkType: searchAnalytics.documentsByChunkType,
      collectionSize: searchAnalytics.collectionSize
    });

  } catch (error) {
    console.error('❌ Analytics failed:', error);
  }
}

// ================================
// MAINTENANCE EXAMPLES
// ================================

async function maintenanceExamples() {
  console.log('=== MAINTENANCE EXAMPLES ===');

  const organizationId = 'org_123';

  try {
    // 1. Clear organization data
    console.log('\n--- Clear Organization Data ---');
    await ragService.clearOrganizationData(organizationId);
    console.log('✅ Organization data cleared successfully');

    // 2. Rebuild index
    console.log('\n--- Rebuild Index ---');
    await ragService.rebuildIndex(organizationId);
    console.log('✅ Index rebuilt successfully');

  } catch (error) {
    console.error('❌ Maintenance failed:', error);
  }
}

// ================================
// TIMETABLE GENERATION INTEGRATION
// ================================

async function timetableGenerationIntegration() {
  console.log('=== TIMETABLE GENERATION INTEGRATION ===');

  const organizationId = 'org_123';

  try {
    // 1. Search for available faculty for a specific subject
    console.log('\n--- Faculty Assignment Search ---');
    const facultyAssignmentSearch = await ragService.searchFaculty({
      query: 'database systems professor available for 3rd year students',
      organizationId,
      departmentId: 'dept_cse',
      filters: {
        specializations: ['database', 'data management'],
        isAvailable: true
      },
      limit: 5,
      threshold: 0.7
    });

    console.log('Available Faculty for Database Systems:', {
      totalResults: facultyAssignmentSearch.totalResults,
      faculty: facultyAssignmentSearch.results.map(result => ({
        name: result.chunk.metadata.facultyName,
        specializations: result.chunk.metadata.specializations,
        score: result.score
      }))
    });

    // 2. Search for suitable rooms
    console.log('\n--- Room Assignment Search ---');
    const roomAssignmentSearch = await ragService.searchRooms({
      query: 'lecture hall with capacity 40+ students for database systems class',
      organizationId,
      filters: {
        roomType: 'LECTURE_HALL',
        capacity: { $gte: 40 }
      },
      limit: 5,
      threshold: 0.6
    });

    console.log('Available Rooms for Database Systems:', {
      totalResults: roomAssignmentSearch.totalResults,
      rooms: roomAssignmentSearch.results.map(result => ({
        name: result.chunk.metadata.roomName,
        capacity: result.chunk.metadata.capacity,
        equipment: result.chunk.metadata.equipment,
        score: result.score
      }))
    });

    // 3. Search for NEP compliance constraints
    console.log('\n--- NEP Compliance Constraints ---');
    const nepConstraintsSearch = await ragService.searchPolicies({
      query: 'NEP 2020 credit distribution and assessment pattern requirements',
      organizationId,
      filters: {
        constraintType: 'NEP_CREDIT_DISTRIBUTION'
      },
      limit: 10,
      threshold: 0.8
    });

    console.log('NEP Compliance Constraints:', {
      totalResults: nepConstraintsSearch.totalResults,
      constraints: nepConstraintsSearch.results.map(result => ({
        type: result.chunk.metadata.constraintType,
        priority: result.chunk.metadata.priority,
        score: result.score
      }))
    });

  } catch (error) {
    console.error('❌ Timetable generation integration failed:', error);
  }
}

// ================================
// ERROR HANDLING EXAMPLES
// ================================

async function errorHandlingExamples() {
  console.log('=== ERROR HANDLING EXAMPLES ===');

  try {
    // 1. Handle invalid search query
    try {
      await ragService.search({
        query: '', // Empty query
        organizationId: 'org_123'
      });
    } catch (error) {
      console.log('✅ Empty query error handled:', error instanceof Error ? error.message : 'Unknown error');
    }

    // 2. Handle invalid organization ID
    try {
      await ragService.search({
        query: 'test query',
        organizationId: '' // Empty organization ID
      });
    } catch (error) {
      console.log('✅ Empty organization ID error handled:', error instanceof Error ? error.message : 'Unknown error');
    }

    // 3. Handle invalid limit
    try {
      await ragService.search({
        query: 'test query',
        organizationId: 'org_123',
        limit: 150 // Invalid limit (> 100)
      });
    } catch (error) {
      console.log('✅ Invalid limit error handled:', error instanceof Error ? error.message : 'Unknown error');
    }

    // 4. Handle invalid threshold
    try {
      await ragService.search({
        query: 'test query',
        organizationId: 'org_123',
        threshold: 1.5 // Invalid threshold (> 1)
      });
    } catch (error) {
      console.log('✅ Invalid threshold error handled:', error instanceof Error ? error.message : 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Error handling failed:', error);
  }
}

// ================================
// PERFORMANCE TESTING
// ================================

async function performanceTesting() {
  console.log('=== PERFORMANCE TESTING ===');

  const organizationId = 'org_123';
  const testQueries = [
    'faculty with machine learning expertise',
    '3rd year computer science students',
    'database systems subjects',
    'lecture halls with projector equipment',
    'NEP 2020 compliance rules'
  ];

  try {
    console.log('\n--- Search Performance Test ---');
    
    for (const query of testQueries) {
      const startTime = Date.now();
      
      const searchResults = await ragService.search({
        query,
        organizationId,
        limit: 10,
        threshold: 0.6
      });
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      console.log(`Query: "${query}"`);
      console.log(`  Results: ${searchResults.totalResults}`);
      console.log(`  Processing Time: ${processingTime}ms`);
      console.log(`  Average Time per Result: ${searchResults.totalResults > 0 ? (processingTime / searchResults.totalResults).toFixed(2) : 0}ms`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Performance testing failed:', error);
  }
}

// ================================
// MAIN EXECUTION
// ================================

async function main() {
  try {
    console.log('🚀 Starting RAG Document Processing System Examples...\n');

    await initializationExamples();
    console.log('\n' + '='.repeat(50) + '\n');

    await documentProcessingExamples();
    console.log('\n' + '='.repeat(50) + '\n');

    await searchExamples();
    console.log('\n' + '='.repeat(50) + '\n');

    await advancedSearchExamples();
    console.log('\n' + '='.repeat(50) + '\n');

    await realTimeUpdateExamples();
    console.log('\n' + '='.repeat(50) + '\n');

    await analyticsExamples();
    console.log('\n' + '='.repeat(50) + '\n');

    await timetableGenerationIntegration();
    console.log('\n' + '='.repeat(50) + '\n');

    await errorHandlingExamples();
    console.log('\n' + '='.repeat(50) + '\n');

    await performanceTesting();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('✅ All RAG examples completed successfully!');

  } catch (error) {
    console.error('❌ Error in main execution:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  initializationExamples,
  documentProcessingExamples,
  searchExamples,
  advancedSearchExamples,
  realTimeUpdateExamples,
  analyticsExamples,
  maintenanceExamples,
  timetableGenerationIntegration,
  errorHandlingExamples,
  performanceTesting
};

