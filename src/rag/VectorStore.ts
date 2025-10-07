/**
 * Vector Store Interface and Implementations
 * Supports Chroma, Pinecone, and other vector databases
 */

import { DocumentChunk, DocumentMetadata, DocumentType, ChunkType } from './DocumentProcessor';

export interface VectorStoreConfig {
  provider: 'chroma' | 'pinecone' | 'weaviate' | 'qdrant' | 'memory';
  collectionName: string;
  dimensions: number;
  distanceMetric: 'cosine' | 'euclidean' | 'dot_product';
  host?: string;
  port?: number;
  apiKey?: string;
  environment?: string;
}

export interface SearchOptions {
  query: string;
  filters?: Record<string, any>;
  limit?: number;
  threshold?: number;
  includeMetadata?: boolean;
  includeEmbeddings?: boolean;
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  id: string;
}

export interface VectorStoreStats {
  totalChunks: number;
  chunksByType: Record<ChunkType, number>;
  chunksByDocumentType: Record<DocumentType, number>;
  lastProcessed: Date;
  collectionSize: number;
}

export abstract class VectorStore {
  protected config: VectorStoreConfig;

  constructor(config: VectorStoreConfig) {
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract upsertChunks(chunks: DocumentChunk[]): Promise<void>;
  abstract search(options: SearchOptions): Promise<SearchResult[]>;
  abstract deleteChunks(filters: Record<string, any>): Promise<void>;
  abstract getStats(organizationId: string): Promise<VectorStoreStats>;
  abstract clear(): Promise<void>;
}

// ================================
// CHROMA VECTOR STORE
// ================================

export class ChromaVectorStore extends VectorStore {
  private client: any;

  constructor(config: VectorStoreConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    try {
      // Dynamic import for Chroma client
      const { ChromaClient } = await import('chromadb');
      
      this.client = new ChromaClient({
        path: this.config.host || 'http://localhost:8000'
      });

      // Create or get collection
      try {
        await this.client.getCollection({ name: this.config.collectionName });
      } catch (error) {
        await this.client.createCollection({
          name: this.config.collectionName,
          metadata: {
            description: 'NEP 2020 Timetable System Document Chunks'
          }
        });
      }

      console.log('Chroma vector store initialized');
    } catch (error) {
      console.error('Failed to initialize Chroma vector store:', error);
      throw new Error(`Chroma initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async upsertChunks(chunks: DocumentChunk[]): Promise<void> {
    if (chunks.length === 0) return;

    try {
      const collection = await this.client.getCollection({ name: this.config.collectionName });
      
      const ids = chunks.map(chunk => chunk.id);
      const embeddings = chunks.map(chunk => chunk.embedding || []);
      const metadatas = chunks.map(chunk => this.serializeMetadata(chunk.metadata));
      const documents = chunks.map(chunk => chunk.content);

      await collection.upsert({
        ids,
        embeddings,
        metadatas,
        documents
      });

      console.log(`Upserted ${chunks.length} chunks to Chroma`);
    } catch (error) {
      console.error('Failed to upsert chunks to Chroma:', error);
      throw new Error(`Chroma upsert failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    try {
      const collection = await this.client.getCollection({ name: this.config.collectionName });
      
      // Generate query embedding (this would typically be done by the embedding service)
      const queryEmbedding = await this.generateQueryEmbedding(options.query);
      
      const searchResults = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: options.limit || 10,
        where: this.buildWhereClause(options.filters),
        include: ['metadatas', 'documents', 'distances']
      });

      const results: SearchResult[] = [];
      
      if (searchResults.ids && searchResults.ids[0]) {
        for (let i = 0; i < searchResults.ids[0].length; i++) {
          const score = 1 - (searchResults.distances[0][i] || 0); // Convert distance to similarity
          
          if (score >= (options.threshold || 0)) {
            results.push({
              id: searchResults.ids[0][i],
              chunk: {
                id: searchResults.ids[0][i],
                content: searchResults.documents[0][i],
                metadata: this.deserializeMetadata(searchResults.metadatas[0][i]),
                chunkType: searchResults.metadatas[0][i].chunkType,
                sourceId: searchResults.metadatas[0][i].sourceId,
                organizationId: searchResults.metadatas[0][i].organizationId,
                createdAt: new Date(searchResults.metadatas[0][i].createdAt),
                updatedAt: new Date(searchResults.metadatas[0][i].updatedAt)
              },
              score
            });
          }
        }
      }

      return results.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Failed to search Chroma:', error);
      throw new Error(`Chroma search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteChunks(filters: Record<string, any>): Promise<void> {
    try {
      const collection = await this.client.getCollection({ name: this.config.collectionName });
      
      // Chroma doesn't support complex filtering for deletion, so we need to query first
      const searchResults = await collection.query({
        queryEmbeddings: [[0]], // Dummy embedding
        nResults: 10000, // Large number to get all results
        where: this.buildWhereClause(filters)
      });

      if (searchResults.ids && searchResults.ids[0] && searchResults.ids[0].length > 0) {
        await collection.delete({
          ids: searchResults.ids[0]
        });
        
        console.log(`Deleted ${searchResults.ids[0].length} chunks from Chroma`);
      }
    } catch (error) {
      console.error('Failed to delete chunks from Chroma:', error);
      throw new Error(`Chroma deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getStats(organizationId: string): Promise<VectorStoreStats> {
    try {
      const collection = await this.client.getCollection({ name: this.config.collectionName });
      
      // Get all chunks for the organization
      const searchResults = await collection.query({
        queryEmbeddings: [[0]], // Dummy embedding
        nResults: 10000,
        where: { organizationId }
      });

      const chunks = searchResults.ids?.[0] || [];
      const metadatas = searchResults.metadatas?.[0] || [];
      
      const stats: VectorStoreStats = {
        totalChunks: chunks.length,
        chunksByType: {} as Record<ChunkType, number>,
        chunksByDocumentType: {} as Record<DocumentType, number>,
        lastProcessed: new Date(),
        collectionSize: chunks.length
      };

      // Count by type and document type
      for (const metadata of metadatas) {
        const chunkType = metadata.chunkType as ChunkType;
        const documentType = metadata.documentType as DocumentType;
        
        stats.chunksByType[chunkType] = (stats.chunksByType[chunkType] || 0) + 1;
        stats.chunksByDocumentType[documentType] = (stats.chunksByDocumentType[documentType] || 0) + 1;
      }

      return stats;
    } catch (error) {
      console.error('Failed to get stats from Chroma:', error);
      throw new Error(`Chroma stats failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.client.deleteCollection({ name: this.config.collectionName });
      await this.initialize();
      console.log('Chroma collection cleared');
    } catch (error) {
      console.error('Failed to clear Chroma collection:', error);
      throw new Error(`Chroma clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateQueryEmbedding(query: string): Promise<number[]> {
    // This is a simplified implementation
    // In production, you would use the actual embedding service
    return Array.from({ length: this.config.dimensions }, () => Math.random() * 2 - 1);
  }

  private buildWhereClause(filters?: Record<string, any>): Record<string, any> {
    if (!filters) return {};
    
    const where: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        where[key] = value;
      }
    }
    
    return where;
  }

  private serializeMetadata(metadata: DocumentMetadata): Record<string, any> {
    return {
      ...metadata,
      createdAt: metadata.lastModified.toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private deserializeMetadata(metadata: Record<string, any>): DocumentMetadata {
    return {
      ...metadata,
      lastModified: new Date(metadata.createdAt || metadata.lastModified),
      version: metadata.version || 1
    };
  }
}

// ================================
// PINECONE VECTOR STORE
// ================================

export class PineconeVectorStore extends VectorStore {
  private client: any;

  constructor(config: VectorStoreConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    try {
      const { Pinecone } = await import('@pinecone-database/pinecone');
      
      this.client = new Pinecone({
        apiKey: this.config.apiKey || process.env.PINECONE_API_KEY || '',
        environment: this.config.environment || process.env.PINECONE_ENVIRONMENT || ''
      });

      // Check if index exists
      const indexList = await this.client.listIndexes();
      const indexExists = indexList.indexes?.some((index: any) => index.name === this.config.collectionName);

      if (!indexExists) {
        await this.client.createIndex({
          name: this.config.collectionName,
          dimension: this.config.dimensions,
          metric: this.config.distanceMetric,
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
      }

      console.log('Pinecone vector store initialized');
    } catch (error) {
      console.error('Failed to initialize Pinecone vector store:', error);
      throw new Error(`Pinecone initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async upsertChunks(chunks: DocumentChunk[]): Promise<void> {
    if (chunks.length === 0) return;

    try {
      const index = this.client.index(this.config.collectionName);
      
      const vectors = chunks.map(chunk => ({
        id: chunk.id,
        values: chunk.embedding || [],
        metadata: this.serializeMetadata(chunk.metadata)
      }));

      await index.upsert(vectors);
      console.log(`Upserted ${chunks.length} chunks to Pinecone`);
    } catch (error) {
      console.error('Failed to upsert chunks to Pinecone:', error);
      throw new Error(`Pinecone upsert failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    try {
      const index = this.client.index(this.config.collectionName);
      
      // Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(options.query);
      
      const searchResponse = await index.query({
        vector: queryEmbedding,
        topK: options.limit || 10,
        filter: this.buildFilter(options.filters),
        includeMetadata: true,
        includeValues: options.includeEmbeddings || false
      });

      const results: SearchResult[] = [];
      
      for (const match of searchResponse.matches || []) {
        const score = match.score || 0;
        
        if (score >= (options.threshold || 0)) {
          results.push({
            id: match.id,
            chunk: {
              id: match.id,
              content: match.metadata?.content || '',
              metadata: this.deserializeMetadata(match.metadata || {}),
              chunkType: match.metadata?.chunkType,
              sourceId: match.metadata?.sourceId,
              organizationId: match.metadata?.organizationId,
              createdAt: new Date(match.metadata?.createdAt),
              updatedAt: new Date(match.metadata?.updatedAt)
            },
            score
          });
        }
      }

      return results.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Failed to search Pinecone:', error);
      throw new Error(`Pinecone search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteChunks(filters: Record<string, any>): Promise<void> {
    try {
      const index = this.client.index(this.config.collectionName);
      
      // Pinecone doesn't support complex filtering for deletion
      // We would need to query first and then delete by IDs
      console.warn('Pinecone delete with filters not implemented - would need to query first');
    } catch (error) {
      console.error('Failed to delete chunks from Pinecone:', error);
      throw new Error(`Pinecone deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getStats(organizationId: string): Promise<VectorStoreStats> {
    try {
      const index = this.client.index(this.config.collectionName);
      const stats = await index.describeIndexStats();
      
      return {
        totalChunks: stats.totalVectorCount || 0,
        chunksByType: {} as Record<ChunkType, number>,
        chunksByDocumentType: {} as Record<DocumentType, number>,
        lastProcessed: new Date(),
        collectionSize: stats.totalVectorCount || 0
      };
    } catch (error) {
      console.error('Failed to get stats from Pinecone:', error);
      throw new Error(`Pinecone stats failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clear(): Promise<void> {
    try {
      const index = this.client.index(this.config.collectionName);
      await index.deleteAll();
      console.log('Pinecone index cleared');
    } catch (error) {
      console.error('Failed to clear Pinecone index:', error);
      throw new Error(`Pinecone clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateQueryEmbedding(query: string): Promise<number[]> {
    // This is a simplified implementation
    // In production, you would use the actual embedding service
    return Array.from({ length: this.config.dimensions }, () => Math.random() * 2 - 1);
  }

  private buildFilter(filters?: Record<string, any>): Record<string, any> {
    if (!filters) return {};
    
    const filter: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        filter[key] = { $eq: value };
      }
    }
    
    return filter;
  }

  private serializeMetadata(metadata: DocumentMetadata): Record<string, any> {
    return {
      ...metadata,
      createdAt: metadata.lastModified.toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private deserializeMetadata(metadata: Record<string, any>): DocumentMetadata {
    return {
      ...metadata,
      lastModified: new Date(metadata.createdAt || metadata.lastModified),
      version: metadata.version || 1
    };
  }
}

// ================================
// MEMORY VECTOR STORE (for development/testing)
// ================================

export class MemoryVectorStore extends VectorStore {
  private chunks: Map<string, DocumentChunk> = new Map();

  constructor(config: VectorStoreConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    console.log('Memory vector store initialized');
  }

  async upsertChunks(chunks: DocumentChunk[]): Promise<void> {
    for (const chunk of chunks) {
      this.chunks.set(chunk.id, chunk);
    }
    console.log(`Upserted ${chunks.length} chunks to memory store`);
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    for (const [id, chunk] of this.chunks) {
      // Simple text matching for memory store
      const contentMatch = chunk.content.toLowerCase().includes(options.query.toLowerCase());
      const metadataMatch = this.matchesFilters(chunk.metadata, options.filters);
      
      if (contentMatch && metadataMatch) {
        // Calculate simple similarity score
        const score = this.calculateSimpleSimilarity(options.query, chunk.content);
        
        if (score >= (options.threshold || 0)) {
          results.push({
            id,
            chunk,
            score
          });
        }
      }
    }
    
    return results.sort((a, b) => b.score - a.score).slice(0, options.limit || 10);
  }

  async deleteChunks(filters: Record<string, any>): Promise<void> {
    const toDelete: string[] = [];
    
    for (const [id, chunk] of this.chunks) {
      if (this.matchesFilters(chunk.metadata, filters)) {
        toDelete.push(id);
      }
    }
    
    for (const id of toDelete) {
      this.chunks.delete(id);
    }
    
    console.log(`Deleted ${toDelete.length} chunks from memory store`);
  }

  async getStats(organizationId: string): Promise<VectorStoreStats> {
    const chunks = Array.from(this.chunks.values()).filter(
      chunk => chunk.metadata.organizationId === organizationId
    );
    
    const stats: VectorStoreStats = {
      totalChunks: chunks.length,
      chunksByType: {} as Record<ChunkType, number>,
      chunksByDocumentType: {} as Record<DocumentType, number>,
      lastProcessed: new Date(),
      collectionSize: chunks.length
    };

    for (const chunk of chunks) {
      const chunkType = chunk.metadata.chunkType;
      const documentType = chunk.metadata.documentType;
      
      stats.chunksByType[chunkType] = (stats.chunksByType[chunkType] || 0) + 1;
      stats.chunksByDocumentType[documentType] = (stats.chunksByDocumentType[documentType] || 0) + 1;
    }

    return stats;
  }

  async clear(): Promise<void> {
    this.chunks.clear();
    console.log('Memory vector store cleared');
  }

  private matchesFilters(metadata: DocumentMetadata, filters?: Record<string, any>): boolean {
    if (!filters) return true;
    
    for (const [key, value] of Object.entries(filters)) {
      if (metadata[key as keyof DocumentMetadata] !== value) {
        return false;
      }
    }
    
    return true;
  }

  private calculateSimpleSimilarity(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const word of queryWords) {
      if (contentWords.includes(word)) {
        matches++;
      }
    }
    
    return matches / queryWords.length;
  }
}

// ================================
// VECTOR STORE FACTORY
// ================================

export class VectorStoreFactory {
  static create(config: VectorStoreConfig): VectorStore {
    switch (config.provider) {
      case 'chroma':
        return new ChromaVectorStore(config);
      case 'pinecone':
        return new PineconeVectorStore(config);
      case 'memory':
        return new MemoryVectorStore(config);
      default:
        throw new Error(`Unsupported vector store provider: ${config.provider}`);
    }
  }
}

