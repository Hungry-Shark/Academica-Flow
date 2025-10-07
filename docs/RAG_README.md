# RAG Document Processing System for Administrative Data

## Overview

This RAG (Retrieval-Augmented Generation) system provides comprehensive document processing and semantic search capabilities for administrative data in the NEP 2020 compliant timetable system. It handles large enrollment datasets efficiently and provides real-time updates when administrative data changes.

## Features

- ✅ **Intelligent Document Processing** - Handles faculty, student, room, and policy data
- ✅ **Advanced Chunking Strategies** - Context-aware chunking for different document types
- ✅ **Multiple Embedding Providers** - OpenAI, Sentence Transformers, Hugging Face support
- ✅ **Flexible Vector Stores** - Chroma, Pinecone, Weaviate, Qdrant support
- ✅ **Semantic Search** - Natural language queries with relevance scoring
- ✅ **Real-time Updates** - Automatic data synchronization when admin data changes
- ✅ **NEP Compliance Tracking** - Built-in NEP 2020 compliance validation
- ✅ **Category-based Filtering** - Filter by department, year, semester, subject type
- ✅ **Performance Optimization** - Batch processing and efficient indexing
- ✅ **Comprehensive Analytics** - Processing statistics and search analytics

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Document      │    │   Chunking       │    │   Embedding     │
│   Processor     │───▶│   Strategy       │───▶│   Service       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Metadata      │    │   Vector Store   │    │   Search        │
│   Extractor     │    │   (Chroma/Pinecone)│    │   Engine       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Installation

```bash
npm install @prisma/client prisma
npm install chromadb @pinecone-database/pinecone
npm install openai @huggingface/inference
```

### 2. Basic Setup

```typescript
import { PrismaClient } from '@prisma/client';
import { RAGService, RAGConfig } from './src/rag/RAGService';

const prisma = new PrismaClient();

// Configure RAG service
const ragConfig: RAGConfig = {
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
    chunkingStrategy: null as any,
    metadataExtraction: true,
    realTimeUpdates: true
  }
};

const ragService = new RAGService(prisma, ragConfig);
```

### 3. Initialize and Process Data

```typescript
// Initialize RAG service
await ragService.initialize();

// Process all administrative data
const organizationId = 'org_123';
await ragService.processOrganizationData(organizationId);
```

### 4. Perform Semantic Search

```typescript
// Search for faculty with specific expertise
const facultyResults = await ragService.searchFaculty({
  query: 'professor with machine learning expertise available for 3rd year students',
  organizationId: 'org_123',
  departmentId: 'dept_cse',
  limit: 10,
  threshold: 0.7
});

console.log('Found faculty:', facultyResults.results.map(r => r.chunk.metadata.facultyName));
```

## Document Types and Chunking

### Faculty Data
- **Profile Chunks**: Basic information, specializations, NEP categories
- **Availability Chunks**: Time slots, availability windows
- **Specialization Chunks**: Areas of expertise, teaching capabilities

### Student Data
- **Profile Chunks**: Basic information, academic progress
- **Enrollment Chunks**: Subject enrollments by semester
- **Credit Chunks**: NEP compliance tracking, credit distribution

### Subject Data
- **Details Chunks**: Subject information, NEP classification
- **Prerequisite Chunks**: Prerequisite relationships
- **Assessment Chunks**: Assessment patterns, NEP compliance

### Room Data
- **Details Chunks**: Room information, capacity, type
- **Availability Chunks**: Time slots, booking availability
- **Equipment Chunks**: Available equipment, facilities

### Policy Data
- **Constraint Chunks**: Institutional rules and constraints
- **NEP Compliance Chunks**: NEP 2020 compliance rules

## Search Capabilities

### General Semantic Search

```typescript
const results = await ragService.search({
  query: 'faculty with database expertise available for 3rd year students',
  organizationId: 'org_123',
  documentTypes: [DocumentType.FACULTY, DocumentType.SUBJECT],
  limit: 20,
  threshold: 0.6
});
```

### Faculty Search

```typescript
const facultyResults = await ragService.searchFaculty({
  query: 'machine learning professor with research experience',
  organizationId: 'org_123',
  departmentId: 'dept_cse',
  filters: {
    specializations: ['machine learning', 'artificial intelligence'],
    isAvailable: true
  },
  limit: 10,
  threshold: 0.7
});
```

### Student Search

```typescript
const studentResults = await ragService.searchStudents({
  query: '3rd year computer science students enrolled in data structures',
  organizationId: 'org_123',
  year: 3,
  semester: 'odd_2024',
  limit: 50,
  threshold: 0.6
});
```

### Subject Search

```typescript
const subjectResults = await ragService.searchSubjects({
  query: 'core subjects for 2nd year with practical components',
  organizationId: 'org_123',
  departmentId: 'dept_cse',
  filters: {
    nepCategory: 'CORE',
    credits: { $gte: 3 }
  },
  limit: 30,
  threshold: 0.6
});
```

### Room Search

```typescript
const roomResults = await ragService.searchRooms({
  query: 'lecture hall with capacity 60+ students and projector equipment',
  organizationId: 'org_123',
  filters: {
    roomType: 'LECTURE_HALL',
    capacity: { $gte: 60 },
    equipment: { $in: ['projector', 'whiteboard'] }
  },
  limit: 10,
  threshold: 0.6
});
```

### Policy Search

```typescript
const policyResults = await ragService.searchPolicies({
  query: 'NEP 2020 credit distribution rules and faculty workload limits',
  organizationId: 'org_123',
  filters: {
    constraintType: 'NEP_CREDIT_DISTRIBUTION'
  },
  limit: 15,
  threshold: 0.7
});
```

## Real-time Updates

### Update Faculty Data

```typescript
// Update faculty when availability changes
await ragService.updateFacultyData('faculty_123', 'org_123');
```

### Update Student Data

```typescript
// Update student when enrollment changes
await ragService.updateStudentData('student_456', 'org_123');
```

### Update Subject Data

```typescript
// Update subject when curriculum changes
await ragService.updateSubjectData('subject_789', 'org_123');
```

## Advanced Features

### NEP Compliance Search

```typescript
// Search for students with NEP compliance issues
const complianceResults = await ragService.search({
  query: 'students with insufficient core credits or elective credits',
  organizationId: 'org_123',
  documentTypes: [DocumentType.STUDENT],
  chunkTypes: [ChunkType.STUDENT_CREDITS],
  filters: {
    tags: ['nep_non_compliant', 'nep_core_deficient']
  },
  limit: 20,
  threshold: 0.7
});
```

### Timetable Conflict Search

```typescript
// Search for timetable conflicts
const conflictResults = await ragService.search({
  query: 'timetable slots with faculty conflicts or room double booking',
  organizationId: 'org_123',
  documentTypes: [DocumentType.TIMETABLE],
  chunkTypes: [ChunkType.TIMETABLE_CONSTRAINTS],
  filters: {
    tags: ['high_conflicts']
  },
  limit: 10,
  threshold: 0.6
});
```

### Multi-Filter Search

```typescript
// Complex search with multiple filters
const multiFilterResults = await ragService.search({
  query: 'available faculty for 3rd year computer science students',
  organizationId: 'org_123',
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
```

## Configuration Options

### Embedding Configuration

```typescript
const embeddingConfig = {
  provider: 'openai', // 'openai' | 'sentence-transformers' | 'huggingface'
  model: 'text-embedding-3-small',
  batchSize: 100,
  maxRetries: 3,
  timeout: 30000
};
```

### Vector Store Configuration

```typescript
const vectorStoreConfig = {
  provider: 'chroma', // 'chroma' | 'pinecone' | 'weaviate' | 'qdrant'
  collectionName: 'nep_timetable_documents',
  dimensions: 1536,
  distanceMetric: 'cosine', // 'cosine' | 'euclidean' | 'dot_product'
  host: 'http://localhost:8000',
  apiKey: 'your-api-key',
  environment: 'your-environment'
};
```

### Chunking Configuration

```typescript
const chunkingConfig = {
  maxChunkSize: 1000,
  overlapSize: 100,
  preserveContext: true,
  includeMetadata: true,
  chunkByEntity: true
};
```

## Performance Optimization

### Batch Processing

```typescript
// Process data in batches to avoid memory issues
const ragConfig = {
  processing: {
    batchSize: 100, // Process 100 documents at a time
    updateExisting: true,
    includeEmbeddings: true,
    metadataExtraction: true,
    realTimeUpdates: true
  }
};
```

### Caching

```typescript
// Enable caching for frequently accessed data
const ragConfig = {
  vectorStore: {
    provider: 'chroma',
    collectionName: 'nep_timetable_documents',
    dimensions: 1536,
    distanceMetric: 'cosine',
    host: 'http://localhost:8000',
    cache: true, // Enable caching
    cacheSize: 1000 // Cache size
  }
};
```

## Analytics and Monitoring

### Processing Statistics

```typescript
const stats = await ragService.getProcessingStats('org_123');
console.log('Processing Statistics:', {
  totalChunks: stats.totalChunks,
  chunksByType: stats.chunksByType,
  chunksByDocumentType: stats.chunksByDocumentType,
  lastProcessed: stats.lastProcessed
});
```

### Search Analytics

```typescript
const analytics = await ragService.getSearchAnalytics('org_123');
console.log('Search Analytics:', {
  totalDocuments: analytics.totalDocuments,
  documentsByType: analytics.documentsByType,
  documentsByChunkType: analytics.documentsByChunkType,
  collectionSize: analytics.collectionSize
});
```

## Error Handling

### Comprehensive Error Handling

```typescript
try {
  const results = await ragService.search({
    query: 'test query',
    organizationId: 'org_123',
    limit: 10,
    threshold: 0.6
  });
  
  console.log('Search results:', results);
} catch (error) {
  if (error.message.includes('Search query cannot be empty')) {
    console.error('Please provide a valid search query');
  } else if (error.message.includes('Organization ID is required')) {
    console.error('Please provide a valid organization ID');
  } else {
    console.error('Search failed:', error.message);
  }
}
```

## Maintenance Operations

### Clear Organization Data

```typescript
// Clear all data for an organization
await ragService.clearOrganizationData('org_123');
```

### Rebuild Index

```typescript
// Rebuild the entire index
await ragService.rebuildIndex('org_123');
```

### Update Specific Data Types

```typescript
// Update only specific data types
await ragService.processDataByType('org_123', [
  DocumentType.FACULTY,
  DocumentType.STUDENT
]);
```

## Integration with Timetable Generation

### Faculty Assignment

```typescript
// Search for available faculty for a specific subject
const facultyResults = await ragService.searchFaculty({
  query: 'database systems professor available for 3rd year students',
  organizationId: 'org_123',
  departmentId: 'dept_cse',
  filters: {
    specializations: ['database', 'data management'],
    isAvailable: true
  },
  limit: 5,
  threshold: 0.7
});

// Use results for timetable generation
const availableFaculty = facultyResults.results.map(result => ({
  id: result.chunk.metadata.facultyId,
  name: result.chunk.metadata.facultyName,
  specializations: result.chunk.metadata.specializations,
  score: result.score
}));
```

### Room Assignment

```typescript
// Search for suitable rooms
const roomResults = await ragService.searchRooms({
  query: 'lecture hall with capacity 40+ students for database systems class',
  organizationId: 'org_123',
  filters: {
    roomType: 'LECTURE_HALL',
    capacity: { $gte: 40 }
  },
  limit: 5,
  threshold: 0.6
});

// Use results for room assignment
const availableRooms = roomResults.results.map(result => ({
  id: result.chunk.metadata.roomId,
  name: result.chunk.metadata.roomName,
  capacity: result.chunk.metadata.capacity,
  equipment: result.chunk.metadata.equipment,
  score: result.score
}));
```

### NEP Compliance Validation

```typescript
// Search for NEP compliance constraints
const nepConstraints = await ragService.searchPolicies({
  query: 'NEP 2020 credit distribution and assessment pattern requirements',
  organizationId: 'org_123',
  filters: {
    constraintType: 'NEP_CREDIT_DISTRIBUTION'
  },
  limit: 10,
  threshold: 0.8
});

// Use constraints for timetable validation
const complianceRules = nepConstraints.results.map(result => ({
  type: result.chunk.metadata.constraintType,
  priority: result.chunk.metadata.priority,
  weight: result.chunk.metadata.weight,
  score: result.score
}));
```

## Best Practices

### 1. Query Optimization
- Use specific, descriptive queries
- Include relevant filters to narrow results
- Set appropriate thresholds (0.6-0.8 for most use cases)
- Limit results to avoid overwhelming responses

### 2. Performance
- Process data in batches
- Use real-time updates for frequently changing data
- Monitor processing statistics
- Clear old data periodically

### 3. Error Handling
- Always wrap search calls in try-catch blocks
- Validate input parameters
- Provide meaningful error messages
- Log errors for debugging

### 4. Data Quality
- Ensure consistent metadata across documents
- Use meaningful tags and keywords
- Keep data up-to-date with real-time updates
- Validate NEP compliance regularly

## Troubleshooting

### Common Issues

1. **Empty Search Results**
   - Check if data has been processed
   - Verify organization ID
   - Lower the threshold value
   - Check query specificity

2. **Slow Search Performance**
   - Reduce batch size
   - Use more specific filters
   - Check vector store performance
   - Monitor memory usage

3. **Embedding Generation Failures**
   - Check API keys and quotas
   - Verify network connectivity
   - Reduce batch size
   - Check text length limits

4. **Vector Store Connection Issues**
   - Verify vector store is running
   - Check connection parameters
   - Verify API keys
   - Check network connectivity

### Debug Mode

```typescript
// Enable debug logging
const ragConfig = {
  // ... other config
  debug: true,
  logLevel: 'verbose'
};
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions and support:
- Create an issue in the repository
- Check the documentation
- Review the examples in `/docs/RAG_Usage_Examples.ts`

