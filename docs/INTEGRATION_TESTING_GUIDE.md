# Academica Flow - Integration and Testing System Guide

## Overview

This guide provides comprehensive documentation for the Academica Flow integration and testing system, including RAG-MCP-LangChain integration, automated testing, and deployment procedures.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [RAG-MCP-LangChain Integration](#rag-mcp-langchain-integration)
3. [Test Data Generation](#test-data-generation)
4. [Automated Testing Suite](#automated-testing-suite)
5. [Deployment Pipeline](#deployment-pipeline)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Backup and Recovery](#backup-and-recovery)
8. [Troubleshooting](#troubleshooting)

## System Architecture

### Component Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RAG Service   │    │   MCP Server    │    │  LangChain      │
│                 │    │                 │    │  Orchestrator   │
│ - Document      │    │ - NEP Policy    │    │                 │
│   Processing    │◄───┤   Connector     │◄───┤ - Data Flow     │
│ - Vector Store  │    │ - External      │    │   Management    │
│ - Embeddings    │    │   System        │    │ - Fallback      │
│                 │    │   Connector     │    │   Mechanisms    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   NEP Compliance│
                    │   Engine        │
                    │                 │
                    │ - Validation    │
                    │ - Conflict      │
                    │   Detection     │
                    │ - Constraint    │
                    │   Solving       │
                    └─────────────────┘
```

### Data Flow

1. **Query Input** → User submits query through API
2. **RAG Retrieval** → Intelligent retrieval service processes query
3. **MCP Enrichment** → External data sources enrich the context
4. **NEP Compliance** → Compliance engine validates against NEP 2020
5. **LLM Generation** → Language model generates final response
6. **Response Output** → Structured response returned to user

## RAG-MCP-LangChain Integration

### LangChain Orchestrator

The `LangChainOrchestrator` serves as the central coordination point for all system components.

#### Key Features

- **Data Flow Management**: Coordinates data flow between RAG, MCP, and LLM components
- **Fallback Mechanisms**: Implements multiple fallback strategies for service failures
- **Performance Optimization**: Caches results and optimizes query processing
- **Error Handling**: Comprehensive error handling and recovery

#### Usage Example

```typescript
import { LangChainOrchestrator } from './src/integration/LangChainOrchestrator';

const orchestrator = new LangChainOrchestrator({
  ragService,
  mcpServer,
  nepConnector,
  externalConnector,
  dataSynchronizer,
  retrievalService,
  complianceEngine,
  prisma,
  enableCaching: true,
  enableFallback: true,
  enableOptimization: true,
  maxRetries: 3,
  timeout: 30000,
  batchSize: 100
});

const response = await orchestrator.orchestrate({
  query: "Generate faculty schedule for Computer Science department",
  context: {
    organizationId: "org-123",
    departmentId: "dept-cs",
    semester: "Fall 2024",
    year: 2024,
    userId: "user-456",
    userType: "FACULTY"
  },
  options: {
    includeNEPCompliance: true,
    includeExternalData: true,
    includeRealTimeSync: true,
    maxResults: 50,
    threshold: 0.7,
    strategy: "COMPREHENSIVE"
  }
});
```

#### Fallback Strategies

1. **RAG_ONLY**: Falls back to RAG service only if MCP fails
2. **CACHED_RESPONSE**: Uses cached responses for timeout/network errors
3. **BASIC_RESPONSE**: Returns basic response as last resort

### MCP Integration

#### NEP Policy Connector

```typescript
import { NEPPolicyConnector } from './src/mcp/connectors/NEPPolicyConnector';

const nepConnector = new NEPPolicyConnector({
  endpoint: 'https://nep-policy-api.example.com',
  apiKey: process.env.NEP_API_KEY,
  timeout: 30000
});

const policyData = await nepConnector.getPolicyData({
  organizationId: 'org-123',
  departmentId: 'dept-cs',
  semester: 'Fall 2024'
});
```

#### External System Connector

```typescript
import { ExternalSystemConnector } from './src/mcp/connectors/ExternalSystemConnector';

const externalConnector = new ExternalSystemConnector({
  erpEndpoint: 'https://erp.example.com/api',
  hrEndpoint: 'https://hr.example.com/api',
  facilityEndpoint: 'https://facility.example.com/api'
});

const studentData = await externalConnector.getData({
  type: 'ERP_SYSTEM',
  organizationId: 'org-123',
  filters: {
    departmentId: 'dept-cs',
    semester: 'Fall 2024'
  }
});
```

## Test Data Generation

### TestDataGenerator

The `TestDataGenerator` creates realistic test data for comprehensive testing.

#### Configuration

```typescript
const config: TestDataConfig = {
  students: 1000,
  faculty: 50,
  departments: 10,
  subjects: 100,
  rooms: 50,
  timeSlots: 10,
  organizations: 2,
  academicYears: 2,
  semesters: 4,
  constraints: 20,
  timetables: 10,
  enableNEPCompliance: true,
  enableConflictScenarios: true,
  enablePerformanceLoad: false
};

const generator = new TestDataGenerator(prisma, config);
const testData = await generator.generateTestData();
```

#### Generated Data Types

- **Organizations**: Multi-tenant university/college data
- **Departments**: Academic departments with NEP categories
- **Faculties**: Faculty members with specializations and availability
- **Students**: Student profiles with credit tracking
- **Subjects**: Course data with prerequisites and NEP compliance
- **Rooms**: Infrastructure with equipment and availability
- **Constraints**: NEP 2020 compliance rules and constraints
- **Timetables**: Generated schedules with conflict scenarios

#### NEP Compliance Test Scenarios

```typescript
const scenarios = await generator.generateNEPComplianceScenarios();
// Generates test cases for:
// - Credit distribution compliance (60% core, 30% elective, 10% skill-based)
// - Assessment pattern compliance (40% continuous, 60% final)
// - Faculty workload compliance (max 40 hours/week)
// - CBC compliance (choice-based credit system)
// - Practical blocks compliance
```

#### Conflict Resolution Test Scenarios

```typescript
const conflictScenarios = await generator.generateConflictResolutionScenarios();
// Generates test cases for:
// - Faculty double booking conflicts
// - Room double booking conflicts
// - Student schedule conflicts
// - Constraint violation conflicts
```

## Automated Testing Suite

### Test Configuration

```typescript
const testConfig: TestConfig = {
  enableUnitTests: true,
  enableIntegrationTests: true,
  enableNEPComplianceTests: true,
  enableConflictDetectionTests: true,
  enablePerformanceTests: true,
  enableE2ETests: true,
  testDataSize: 'MEDIUM',
  maxRetries: 3,
  timeout: 30000,
  parallelExecution: true,
  generateReport: true
};

const testSuite = new AutomatedTestingSuite(prisma, testConfig);
const results = await testSuite.runAllTests();
```

### Test Categories

#### 1. Unit Tests

- **RAG Service Tests**: Initialization, search, document processing
- **NEP Compliance Tests**: Validation, conflict detection, constraint solving
- **Intelligent Retrieval Tests**: Strategies, caching, optimization
- **Database Operations Tests**: CRUD operations, transactions

#### 2. Integration Tests

- **RAG-MCP Integration**: Data flow between RAG and MCP services
- **LangChain Orchestration**: End-to-end orchestration testing
- **Data Flow Tests**: Data consistency across components
- **Fallback Mechanism Tests**: Service failure recovery

#### 3. NEP Compliance Tests

- **Credit Distribution**: 60% core, 30% elective, 10% skill-based
- **Assessment Pattern**: 40% continuous, 60% final assessment
- **Faculty Workload**: Maximum 40 hours per week
- **CBC Compliance**: Choice-based credit system features
- **Practical Blocks**: Minimum 2 practical blocks per semester

#### 4. Conflict Detection Tests

- **Faculty Conflicts**: Double booking, availability violations
- **Room Conflicts**: Capacity, equipment, double booking
- **Student Conflicts**: Schedule overlaps, prerequisite violations
- **Constraint Violations**: NEP rule violations, institutional constraints

#### 5. Performance Tests

- **RAG Performance**: Query response times, vector search performance
- **MCP Performance**: External API response times, data synchronization
- **Database Performance**: Query execution times, connection pooling
- **Memory Usage**: Memory consumption patterns, garbage collection
- **Concurrent Operations**: Load testing, concurrent user scenarios

#### 6. End-to-End Tests

- **Complete Workflow**: Full timetable generation process
- **Faculty Schedule Generation**: Individual faculty schedule creation
- **Student Schedule Generation**: Student timetable generation
- **Batch Schedule Generation**: Department-wide schedule generation
- **Conflict Resolution Workflow**: Automated conflict resolution

### Running Tests

```bash
# Run all tests
npm run test:all

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:nep-compliance
npm run test:conflict-detection
npm run test:performance
npm run test:e2e

# Run tests with specific configuration
npm run test:load -- --testDataSize=LARGE
npm run test:performance -- --enableMonitoring=true
```

### Test Reports

The testing suite generates comprehensive reports including:

- **Test Results**: Pass/fail status for each test
- **Performance Metrics**: Response times, memory usage, throughput
- **Coverage Reports**: Code coverage analysis
- **NEP Compliance Scores**: Compliance validation results
- **Conflict Resolution Metrics**: Conflict detection and resolution rates

## Deployment Pipeline

### Docker Containerization

#### Application Container

```dockerfile
# Multi-stage build for optimized production image
FROM node:18-alpine AS base
FROM base AS deps
# Install dependencies
FROM base AS builder
# Build application
FROM base AS runner
# Production runtime
```

#### MCP Server Container

```dockerfile
# Dedicated container for MCP server
FROM node:18-alpine AS base
# Build and run MCP server
```

### Docker Compose Configuration

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    # Database configuration
    
  redis:
    image: redis:7-alpine
    # Caching configuration
    
  chroma:
    image: chromadb/chroma:latest
    # Vector store configuration
    
  mcp-server:
    build: ./deployment/Dockerfile.mcp
    # MCP server configuration
    
  app:
    build: ./deployment/Dockerfile.app
    # Main application configuration
```

### Deployment Scripts

#### Main Deployment Script

```bash
# Deploy to production
./deployment/scripts/deploy.sh production true true info

# Deploy to development
./deployment/scripts/deploy.sh development false false debug
```

#### Backup and Recovery Script

```bash
# Create backup
./deployment/scripts/backup.sh backup

# List available backups
./deployment/scripts/backup.sh list

# Recover from backup
./deployment/scripts/backup.sh recover backups/20241201_120000.tar.gz
```

### Database Migrations

```bash
# Run Prisma migrations
npx prisma migrate deploy

# Seed database with test data
npx prisma db seed

# Reset database
npx prisma migrate reset
```

### Vector Store Initialization

```bash
# Initialize Chroma collections
node -e "
const { ChromaClient } = require('chromadb');
const client = new ChromaClient('http://localhost:8000');
await client.createCollection({
  name: 'nep_timetable_documents',
  metadata: { description: 'NEP 2020 compliant timetable documents' }
});
"
```

## Monitoring and Logging

### Prometheus Metrics

- **Application Metrics**: Request count, response time, error rate
- **Database Metrics**: Connection pool, query performance
- **RAG Metrics**: Vector search performance, embedding generation
- **MCP Metrics**: External API calls, synchronization status
- **NEP Compliance Metrics**: Compliance scores, violation counts

### Grafana Dashboards

- **System Overview**: Overall system health and performance
- **RAG Performance**: Vector search and retrieval metrics
- **MCP Integration**: External system connectivity and sync status
- **NEP Compliance**: Compliance scores and violation trends
- **Database Performance**: Query performance and connection metrics

### ELK Stack Logging

- **Elasticsearch**: Centralized log storage and indexing
- **Logstash**: Log processing and enrichment
- **Kibana**: Log visualization and analysis

### Health Checks

```bash
# Check application health
curl http://localhost:3000/health

# Check MCP server health
curl http://localhost:3001/health

# Check database health
docker exec academica-flow-db pg_isready -U academica_user -d academica_flow

# Check Redis health
docker exec academica-flow-redis redis-cli ping

# Check Chroma health
curl http://localhost:8000/api/v1/heartbeat
```

## Backup and Recovery

### Backup Strategy

1. **Database Backup**: PostgreSQL dumps with schema and data
2. **Vector Store Backup**: Chroma collection data
3. **Redis Backup**: Redis data persistence
4. **Application Data**: Configuration files and deployment scripts
5. **Logs Backup**: Application and system logs

### Recovery Procedures

1. **Full System Recovery**: Complete system restoration from backup
2. **Database Recovery**: Database-only restoration
3. **Vector Store Recovery**: Vector store data restoration
4. **Configuration Recovery**: Application configuration restoration

### Backup Retention

- **Daily Backups**: 30 days retention
- **Weekly Backups**: 12 weeks retention
- **Monthly Backups**: 12 months retention
- **Yearly Backups**: 7 years retention

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check database status
docker exec academica-flow-db pg_isready -U academica_user -d academica_flow

# Check database logs
docker logs academica-flow-db

# Restart database
docker-compose restart postgres
```

#### 2. Vector Store Issues

```bash
# Check Chroma status
curl http://localhost:8000/api/v1/heartbeat

# Check Chroma logs
docker logs academica-flow-chroma

# Restart Chroma
docker-compose restart chroma
```

#### 3. MCP Server Issues

```bash
# Check MCP server status
curl http://localhost:3001/health

# Check MCP logs
docker logs academica-flow-mcp

# Restart MCP server
docker-compose restart mcp-server
```

#### 4. Performance Issues

```bash
# Check system resources
docker stats

# Check application logs
docker logs academica-flow-app

# Check monitoring dashboards
# Grafana: http://localhost:3001
# Kibana: http://localhost:5601
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
docker-compose up

# Run tests in debug mode
npm run test:all -- --debug

# Enable verbose output
npm run test:integration -- --verbose
```

### Performance Optimization

1. **Database Optimization**: Index optimization, query tuning
2. **Caching Strategy**: Redis caching, application-level caching
3. **Vector Store Optimization**: Index optimization, batch operations
4. **MCP Optimization**: Connection pooling, request batching
5. **Application Optimization**: Code optimization, memory management

## Conclusion

This comprehensive integration and testing system provides:

- **Robust Integration**: Seamless integration between RAG, MCP, and LangChain components
- **Comprehensive Testing**: Full test coverage from unit tests to end-to-end scenarios
- **Production-Ready Deployment**: Docker containerization with monitoring and logging
- **Reliable Backup/Recovery**: Comprehensive backup and recovery procedures
- **NEP 2020 Compliance**: Built-in compliance validation and testing

The system is designed to handle large-scale academic institutions with thousands of students and faculty members while maintaining NEP 2020 compliance and providing excellent performance.

