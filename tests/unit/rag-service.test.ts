/**
 * RAG Service Unit Tests
 * Tests for RAG service functionality
 */

import { PrismaClient } from '@prisma/client';
import { RAGService } from '../../src/rag/RAGService';
import { testUtils } from '../setup';

describe('RAG Service', () => {
  let prisma: PrismaClient;
  let ragService: RAGService;
  let testOrganization: any;
  let testDepartment: any;

  beforeAll(async () => {
    prisma = global.prisma;
    
    // Create test data
    testOrganization = await testUtils.createTestOrganization(prisma);
    testDepartment = await testUtils.createTestDepartment(prisma, testOrganization.id);
    
    // Initialize RAG service
    ragService = new RAGService(prisma, RAGService.getDefaultConfig());
    await ragService.initialize();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      expect(ragService).toBeDefined();
      expect(ragService).toBeInstanceOf(RAGService);
    });

    it('should have default configuration', () => {
      const config = RAGService.getDefaultConfig();
      expect(config).toBeDefined();
      expect(config.embedding.provider).toBe('openai');
      expect(config.vectorStore.provider).toBe('chroma');
      expect(config.chunking.maxChunkSize).toBe(1000);
    });
  });

  describe('Document Processing', () => {
    it('should process organization data', async () => {
      await expect(
        ragService.processOrganizationData(testOrganization.id)
      ).resolves.not.toThrow();
    });

    it('should process specific data types', async () => {
      await expect(
        ragService.processDataByType(testOrganization.id, ['FACULTY', 'STUDENT'])
      ).resolves.not.toThrow();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      // Process some test data before searching
      await ragService.processOrganizationData(testOrganization.id);
    });

    it('should perform semantic search', async () => {
      const searchResults = await ragService.search({
        query: 'computer science',
        organizationId: testOrganization.id,
        limit: 10
      });

      expect(searchResults).toBeDefined();
      expect(searchResults.results).toBeDefined();
      expect(Array.isArray(searchResults.results)).toBe(true);
      expect(searchResults.totalResults).toBeGreaterThanOrEqual(0);
      expect(searchResults.processingTime).toBeGreaterThan(0);
    });

    it('should search faculty', async () => {
      const facultyResults = await ragService.searchFaculty({
        query: 'professor',
        organizationId: testOrganization.id,
        limit: 5
      });

      expect(facultyResults).toBeDefined();
      expect(facultyResults.results).toBeDefined();
      expect(Array.isArray(facultyResults.results)).toBe(true);
    });

    it('should search students', async () => {
      const studentResults = await ragService.searchStudents({
        query: 'student',
        organizationId: testOrganization.id,
        limit: 5
      });

      expect(studentResults).toBeDefined();
      expect(studentResults.results).toBeDefined();
      expect(Array.isArray(studentResults.results)).toBe(true);
    });

    it('should search subjects', async () => {
      const subjectResults = await ragService.searchSubjects({
        query: 'computer science',
        organizationId: testOrganization.id,
        limit: 5
      });

      expect(subjectResults).toBeDefined();
      expect(subjectResults.results).toBeDefined();
      expect(Array.isArray(subjectResults.results)).toBe(true);
    });

    it('should search rooms', async () => {
      const roomResults = await ragService.searchRooms({
        query: 'lecture hall',
        organizationId: testOrganization.id,
        limit: 5
      });

      expect(roomResults).toBeDefined();
      expect(roomResults.results).toBeDefined();
      expect(Array.isArray(roomResults.results)).toBe(true);
    });

    it('should search policies', async () => {
      const policyResults = await ragService.searchPolicies({
        query: 'NEP 2020',
        organizationId: testOrganization.id,
        limit: 5
      });

      expect(policyResults).toBeDefined();
      expect(policyResults.results).toBeDefined();
      expect(Array.isArray(policyResults.results)).toBe(true);
    });
  });

  describe('Real-time Updates', () => {
    it('should update faculty data', async () => {
      const faculty = await testUtils.createTestFaculty(prisma, testOrganization.id, testDepartment.id);
      
      await expect(
        ragService.updateFacultyData(faculty.id, testOrganization.id)
      ).resolves.not.toThrow();
    });

    it('should update student data', async () => {
      const student = await testUtils.createTestStudent(prisma, testOrganization.id, testDepartment.id);
      
      await expect(
        ragService.updateStudentData(student.id, testOrganization.id)
      ).resolves.not.toThrow();
    });

    it('should update subject data', async () => {
      const subject = await testUtils.createTestSubject(prisma, testOrganization.id, testDepartment.id);
      
      await expect(
        ragService.updateSubjectData(subject.id, testOrganization.id)
      ).resolves.not.toThrow();
    });
  });

  describe('Analytics and Monitoring', () => {
    it('should get processing statistics', async () => {
      const stats = await ragService.getProcessingStats(testOrganization.id);
      
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });

    it('should get search analytics', async () => {
      const analytics = await ragService.getSearchAnalytics(testOrganization.id);
      
      expect(analytics).toBeDefined();
      expect(analytics.totalDocuments).toBeDefined();
      expect(analytics.documentsByType).toBeDefined();
    });
  });

  describe('Maintenance Operations', () => {
    it('should clear organization data', async () => {
      await expect(
        ragService.clearOrganizationData(testOrganization.id)
      ).resolves.not.toThrow();
    });

    it('should rebuild index', async () => {
      await expect(
        ragService.rebuildIndex(testOrganization.id)
      ).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid organization ID', async () => {
      await expect(
        ragService.search({
          query: 'test',
          organizationId: 'invalid-id',
          limit: 10
        })
      ).rejects.toThrow();
    });

    it('should handle empty query', async () => {
      await expect(
        ragService.search({
          query: '',
          organizationId: testOrganization.id,
          limit: 10
        })
      ).rejects.toThrow();
    });

    it('should handle invalid limit', async () => {
      await expect(
        ragService.search({
          query: 'test',
          organizationId: testOrganization.id,
          limit: 0
        })
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete search within reasonable time', async () => {
      const startTime = Date.now();
      
      await ragService.search({
        query: 'computer science',
        organizationId: testOrganization.id,
        limit: 10
      });
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent searches', async () => {
      const searchPromises = Array(5).fill(null).map(() =>
        ragService.search({
          query: 'test query',
          organizationId: testOrganization.id,
          limit: 5
        })
      );

      const results = await Promise.all(searchPromises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.results).toBeDefined();
      });
    });
  });
});

