/**
 * Intelligent Retrieval System - Usage Examples
 * Comprehensive examples demonstrating how to use the retrieval system
 */

import { 
  IntelligentRetrievalService,
  IntelligentRetrievalConfig,
  RetrievalOptions,
  TimetableRequest
} from '../src/retrieval';
import { RAGService } from '../src/rag/RAGService';
import { PrismaClient } from '@prisma/client';

// Example 1: Basic Setup and Configuration
async function setupRetrievalService() {
  console.log('=== Setting up Intelligent Retrieval Service ===');
  
  // Initialize dependencies
  const ragService = new RAGService({
    embeddingService: 'openai',
    vectorStore: 'chroma',
    organizationId: 'org-123'
  });
  
  const prisma = new PrismaClient();
  
  // Configure retrieval service
  const config: IntelligentRetrievalConfig = {
    ragService,
    prisma,
    cacheOptions: {
      maxSize: 1000,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      enableCompression: true,
      enablePersistence: false
    },
    optimizationOptions: {
      maxTokens: 8000,
      preserveConstraints: true,
      preserveConflicts: true,
      compressRedundancy: true,
      prioritizeRelevance: true,
      maintainRelationships: true
    },
    defaultStrategy: 'HIERARCHICAL',
    enableCaching: true,
    enableOptimization: true
  };
  
  const retrievalService = new IntelligentRetrievalService(config);
  
  console.log('Retrieval service initialized successfully');
  return retrievalService;
}

// Example 2: Faculty Schedule Retrieval
async function retrieveFacultySchedule() {
  console.log('\n=== Faculty Schedule Retrieval ===');
  
  const retrievalService = await setupRetrievalService();
  
  try {
    // Retrieve data for faculty schedule
    const facultyData = await retrievalService.retrieveForFacultySchedule(
      'faculty-123',
      'Fall 2024',
      'org-456',
      {
        maxResults: 100,
        threshold: 0.7,
        prioritizeConflicts: true,
        includeMetadata: true
      }
    );
    
    console.log(`Retrieved ${facultyData.data.length} items for faculty schedule`);
    console.log(`Strategy used: ${facultyData.metadata.strategy}`);
    console.log(`Processing time: ${facultyData.metadata.processingTime}ms`);
    console.log(`Cache hit: ${facultyData.metadata.cacheHit}`);
    console.log(`Optimization applied: ${facultyData.metadata.optimizationApplied}`);
    
    // Display conflicts and recommendations
    if (facultyData.metadata.conflicts.length > 0) {
      console.log('\nConflicts detected:');
      facultyData.metadata.conflicts.forEach(conflict => {
        console.log(`- ${conflict}`);
      });
    }
    
    if (facultyData.metadata.recommendations.length > 0) {
      console.log('\nRecommendations:');
      facultyData.metadata.recommendations.forEach(rec => {
        console.log(`- ${rec}`);
      });
    }
    
    // Display sample data
    console.log('\nSample retrieved data:');
    facultyData.data.slice(0, 3).forEach((item, index) => {
      console.log(`${index + 1}. ${item.documentType}: ${item.content.substring(0, 100)}...`);
    });
    
  } catch (error) {
    console.error('Error retrieving faculty schedule:', error);
  }
}

// Example 3: Student Schedule Retrieval
async function retrieveStudentSchedule() {
  console.log('\n=== Student Schedule Retrieval ===');
  
  const retrievalService = await setupRetrievalService();
  
  try {
    // Retrieve data for student schedule
    const studentData = await retrievalService.retrieveForStudentSchedule(
      'student-789',
      ['BCS201', 'BCS202', 'BCS203', 'BCS204', 'BCS205'],
      'org-456',
      {
        maxResults: 150,
        threshold: 0.6,
        includeMetadata: true,
        cacheResults: true
      }
    );
    
    console.log(`Retrieved ${studentData.data.length} items for student schedule`);
    console.log(`Strategy used: ${studentData.metadata.strategy}`);
    console.log(`Processing time: ${studentData.metadata.processingTime}ms`);
    console.log(`Cache hit: ${studentData.metadata.cacheHit}`);
    
    // Display analysis results
    if (studentData.metadata.analysis) {
      console.log(`\nRequest complexity: ${studentData.metadata.analysis.complexity}`);
      console.log(`Estimated data size: ${studentData.metadata.analysis.estimatedDataSize}`);
      console.log(`Potential conflicts: ${studentData.metadata.analysis.potentialConflicts.length}`);
    }
    
    // Display relevance scores
    console.log('\nTop relevance scores:');
    const topScores = Object.entries(studentData.metadata.relevanceScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    topScores.forEach(([key, score]) => {
      console.log(`${key}: ${score.toFixed(3)}`);
    });
    
  } catch (error) {
    console.error('Error retrieving student schedule:', error);
  }
}

// Example 4: Batch Schedule Retrieval
async function retrieveBatchSchedule() {
  console.log('\n=== Batch Schedule Retrieval ===');
  
  const retrievalService = await setupRetrievalService();
  
  try {
    // Retrieve data for batch schedule
    const batchData = await retrievalService.retrieveForBatchSchedule(
      2024,
      'dept-101',
      'Fall 2024',
      'org-456',
      {
        maxResults: 500,
        threshold: 0.5,
        prioritizeConflicts: true,
        includeMetadata: true
      }
    );
    
    console.log(`Retrieved ${batchData.data.length} items for batch schedule`);
    console.log(`Strategy used: ${batchData.metadata.strategy}`);
    console.log(`Processing time: ${batchData.metadata.processingTime}ms`);
    
    // Display data distribution by type
    const dataByType = batchData.data.reduce((acc, item) => {
      acc[item.documentType] = (acc[item.documentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\nData distribution by type:');
    Object.entries(dataByType).forEach(([type, count]) => {
      console.log(`${type}: ${count} items`);
    });
    
    // Display recommendations
    if (batchData.metadata.recommendations.length > 0) {
      console.log('\nRecommendations:');
      batchData.metadata.recommendations.forEach(rec => {
        console.log(`- ${rec}`);
      });
    }
    
  } catch (error) {
    console.error('Error retrieving batch schedule:', error);
  }
}

// Example 5: Department Schedule Retrieval
async function retrieveDepartmentSchedule() {
  console.log('\n=== Department Schedule Retrieval ===');
  
  const retrievalService = await setupRetrievalService();
  
  try {
    // Retrieve data for department schedule
    const deptData = await retrievalService.retrieveForDepartmentSchedule(
      'dept-101',
      'org-456',
      {
        maxResults: 1000,
        threshold: 0.4,
        includeMetadata: true
      }
    );
    
    console.log(`Retrieved ${deptData.data.length} items for department schedule`);
    console.log(`Strategy used: ${deptData.metadata.strategy}`);
    console.log(`Processing time: ${deptData.metadata.processingTime}ms`);
    
    // Display top scoring items
    console.log('\nTop scoring items:');
    deptData.data
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .forEach((item, index) => {
        console.log(`${index + 1}. Score: ${item.score.toFixed(3)} - ${item.documentType}: ${item.content.substring(0, 80)}...`);
      });
    
  } catch (error) {
    console.error('Error retrieving department schedule:', error);
  }
}

// Example 6: Cache Management
async function demonstrateCacheManagement() {
  console.log('\n=== Cache Management ===');
  
  const retrievalService = await setupRetrievalService();
  
  try {
    // Get cache statistics
    const stats = retrievalService.getCacheStats();
    console.log('Cache statistics:');
    console.log(`Total entries: ${stats.totalEntries}`);
    console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
    console.log(`Miss rate: ${(stats.missRate * 100).toFixed(1)}%`);
    console.log(`Total requests: ${stats.totalRequests}`);
    console.log(`Memory usage: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
    
    // Warm up cache
    console.log('\nWarming up cache...');
    await retrievalService.warmUpCache('org-456', 'dept-101');
    
    // Preload for specific scenario
    console.log('Preloading cache for faculty schedule scenario...');
    await retrievalService.preloadCache('FACULTY_SCHEDULE', 'org-456', 'dept-101');
    
    // Get frequent data
    const frequentData = retrievalService.getFrequentData(5);
    console.log('\nMost frequently accessed data:');
    frequentData.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.key.requestType} - Accessed ${entry.accessCount} times`);
    });
    
    // Export cache
    const cacheData = retrievalService.exportCache();
    console.log(`\nExported cache data: ${(cacheData.length / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('Error managing cache:', error);
  }
}

// Example 7: Custom Request Analysis
async function demonstrateCustomRequestAnalysis() {
  console.log('\n=== Custom Request Analysis ===');
  
  const retrievalService = await setupRetrievalService();
  
  try {
    // Create custom request
    const customRequest: TimetableRequest = {
      type: 'STUDENT_SCHEDULE',
      studentId: 'student-123',
      chosenSubjects: ['BCS301', 'BCS302', 'BCS303', 'BCS304'],
      constraints: ['NEP_COMPLIANCE', 'FACULTY_AVAILABILITY', 'ROOM_CAPACITY'],
      preferences: {
        preferredTimeSlots: ['9:00-10:00', '10:00-11:00'],
        avoidTimeSlots: ['14:00-15:00'],
        maxHoursPerDay: 6
      },
      organizationId: 'org-456'
    };
    
    // Analyze request
    const analysis = await retrievalService['queryAnalyzer'].analyzeRequest(customRequest);
    
    console.log('Request analysis results:');
    console.log(`Request type: ${analysis.requestType}`);
    console.log(`Complexity: ${analysis.complexity}`);
    console.log(`Recommended strategy: ${analysis.recommendedStrategy}`);
    console.log(`Estimated data size: ${analysis.estimatedDataSize}`);
    
    console.log('\nRetrieval plan:');
    console.log(`Strategy: ${analysis.retrievalPlan.strategy}`);
    console.log(`Data types: ${analysis.retrievalPlan.dataTypes.join(', ')}`);
    console.log(`Max results: ${analysis.retrievalPlan.maxResults}`);
    console.log(`Estimated tokens: ${analysis.retrievalPlan.estimatedTokens}`);
    
    console.log('\nSearch queries:');
    analysis.retrievalPlan.searchQueries.forEach((query, index) => {
      console.log(`${index + 1}. ${query.query} (weight: ${query.weight}, priority: ${query.priority})`);
    });
    
    console.log('\nPotential conflicts:');
    analysis.potentialConflicts.forEach(conflict => {
      console.log(`- ${conflict}`);
    });
    
    console.log('\nOptimization suggestions:');
    analysis.optimizationSuggestions.forEach(suggestion => {
      console.log(`- ${suggestion}`);
    });
    
  } catch (error) {
    console.error('Error analyzing custom request:', error);
  }
}

// Example 8: Performance Testing
async function demonstratePerformanceTesting() {
  console.log('\n=== Performance Testing ===');
  
  const retrievalService = await setupRetrievalService();
  
  try {
    const testCases = [
      { type: 'FACULTY_SCHEDULE', facultyId: 'faculty-1', semester: 'Fall 2024' },
      { type: 'STUDENT_SCHEDULE', studentId: 'student-1', chosenSubjects: ['BCS201', 'BCS202'] },
      { type: 'BATCH_SCHEDULE', year: 2024, departmentId: 'dept-1', semester: 'Fall 2024' },
      { type: 'DEPARTMENT_SCHEDULE', departmentId: 'dept-1' }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      const startTime = Date.now();
      
      let result;
      if (testCase.type === 'FACULTY_SCHEDULE') {
        result = await retrievalService.retrieveForFacultySchedule(
          testCase.facultyId!,
          testCase.semester!,
          'org-456'
        );
      } else if (testCase.type === 'STUDENT_SCHEDULE') {
        result = await retrievalService.retrieveForStudentSchedule(
          testCase.studentId!,
          testCase.chosenSubjects!,
          'org-456'
        );
      } else if (testCase.type === 'BATCH_SCHEDULE') {
        result = await retrievalService.retrieveForBatchSchedule(
          testCase.year!,
          testCase.departmentId!,
          testCase.semester!,
          'org-456'
        );
      } else {
        result = await retrievalService.retrieveForDepartmentSchedule(
          testCase.departmentId!,
          'org-456'
        );
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      results.push({
        type: testCase.type,
        processingTime,
        resultCount: result.data.length,
        cacheHit: result.metadata.cacheHit,
        optimizationApplied: result.metadata.optimizationApplied
      });
    }
    
    console.log('Performance test results:');
    results.forEach(result => {
      console.log(`${result.type}: ${result.processingTime}ms, ${result.resultCount} items, cache: ${result.cacheHit}, optimized: ${result.optimizationApplied}`);
    });
    
    const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    console.log(`\nAverage processing time: ${avgProcessingTime.toFixed(2)}ms`);
    
  } catch (error) {
    console.error('Error in performance testing:', error);
  }
}

// Example 9: Error Handling and Recovery
async function demonstrateErrorHandling() {
  console.log('\n=== Error Handling and Recovery ===');
  
  const retrievalService = await setupRetrievalService();
  
  try {
    // Test with invalid faculty ID
    console.log('Testing with invalid faculty ID...');
    try {
      await retrievalService.retrieveForFacultySchedule(
        'invalid-faculty-id',
        'Fall 2024',
        'org-456'
      );
    } catch (error) {
      console.log('Expected error caught:', error.message);
    }
    
    // Test with invalid organization ID
    console.log('\nTesting with invalid organization ID...');
    try {
      await retrievalService.retrieveForStudentSchedule(
        'student-123',
        ['BCS201'],
        'invalid-org-id'
      );
    } catch (error) {
      console.log('Expected error caught:', error.message);
    }
    
    // Test with empty subject list
    console.log('\nTesting with empty subject list...');
    try {
      await retrievalService.retrieveForStudentSchedule(
        'student-123',
        [],
        'org-456'
      );
    } catch (error) {
      console.log('Expected error caught:', error.message);
    }
    
    // Test recovery with valid data
    console.log('\nTesting recovery with valid data...');
    const validResult = await retrievalService.retrieveForFacultySchedule(
      'faculty-123',
      'Fall 2024',
      'org-456'
    );
    console.log('Recovery successful:', validResult.data.length > 0);
    
  } catch (error) {
    console.error('Error in error handling demonstration:', error);
  }
}

// Example 10: Integration with Timetable Generation
async function demonstrateTimetableIntegration() {
  console.log('\n=== Integration with Timetable Generation ===');
  
  const retrievalService = await setupRetrievalService();
  
  try {
    // Retrieve data for timetable generation
    const batchData = await retrievalService.retrieveForBatchSchedule(
      2024,
      'dept-101',
      'Fall 2024',
      'org-456',
      {
        maxResults: 300,
        threshold: 0.6,
        prioritizeConflicts: true
      }
    );
    
    console.log(`Retrieved ${batchData.data.length} items for timetable generation`);
    
    // Simulate timetable generation process
    const timetableData = {
      students: batchData.data.filter(item => item.documentType === 'STUDENT'),
      subjects: batchData.data.filter(item => item.documentType === 'SUBJECT'),
      faculty: batchData.data.filter(item => item.documentType === 'FACULTY'),
      rooms: batchData.data.filter(item => item.documentType === 'ROOM'),
      constraints: batchData.data.filter(item => item.documentType === 'CONSTRAINT'),
      policies: batchData.data.filter(item => item.documentType === 'POLICY')
    };
    
    console.log('\nTimetable data breakdown:');
    Object.entries(timetableData).forEach(([type, items]) => {
      console.log(`${type}: ${items.length} items`);
    });
    
    // Display conflicts that need to be resolved
    if (batchData.metadata.conflicts.length > 0) {
      console.log('\nConflicts to resolve before timetable generation:');
      batchData.metadata.conflicts.forEach(conflict => {
        console.log(`- ${conflict}`);
      });
    }
    
    // Display recommendations for timetable generation
    if (batchData.metadata.recommendations.length > 0) {
      console.log('\nRecommendations for timetable generation:');
      batchData.metadata.recommendations.forEach(rec => {
        console.log(`- ${rec}`);
      });
    }
    
    // Simulate successful timetable generation
    console.log('\nTimetable generation completed successfully!');
    console.log('Generated timetable includes:');
    console.log('- Student schedules');
    console.log('- Faculty assignments');
    console.log('- Room bookings');
    console.log('- Conflict resolution');
    console.log('- NEP compliance validation');
    
  } catch (error) {
    console.error('Error in timetable integration:', error);
  }
}

// Main execution function
async function runAllExamples() {
  console.log('Intelligent Retrieval System - Usage Examples');
  console.log('============================================');
  
  try {
    await retrieveFacultySchedule();
    await retrieveStudentSchedule();
    await retrieveBatchSchedule();
    await retrieveDepartmentSchedule();
    await demonstrateCacheManagement();
    await demonstrateCustomRequestAnalysis();
    await demonstratePerformanceTesting();
    await demonstrateErrorHandling();
    await demonstrateTimetableIntegration();
    
    console.log('\n=== All Examples Completed Successfully ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export for use in other modules
export {
  setupRetrievalService,
  retrieveFacultySchedule,
  retrieveStudentSchedule,
  retrieveBatchSchedule,
  retrieveDepartmentSchedule,
  demonstrateCacheManagement,
  demonstrateCustomRequestAnalysis,
  demonstratePerformanceTesting,
  demonstrateErrorHandling,
  demonstrateTimetableIntegration,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

