/**
 * Embedding Service for RAG Document Processing
 * Supports multiple embedding providers (OpenAI, Sentence Transformers, etc.)
 */

export interface EmbeddingProvider {
  name: string;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  getEmbeddingDimensions(): number;
  getMaxTokens(): number;
}

export interface EmbeddingOptions {
  provider: 'openai' | 'sentence-transformers' | 'huggingface';
  model: string;
  batchSize: number;
  maxRetries: number;
  timeout: number;
}

export class EmbeddingService {
  private provider: EmbeddingProvider;
  private options: EmbeddingOptions;

  constructor(options: EmbeddingOptions) {
    this.options = options;
    this.provider = this.createProvider(options);
  }

  /**
   * Generate embeddings for a batch of texts
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    console.log(`Generating embeddings for ${texts.length} texts using ${this.provider.name}`);

    try {
      // Split into batches if necessary
      const batches = this.splitIntoBatches(texts, this.options.batchSize);
      const allEmbeddings: number[][] = [];

      for (let i = 0; i < batches.length; i++) {
        console.log(`Processing batch ${i + 1}/${batches.length}`);
        const batchEmbeddings = await this.generateBatchEmbeddings(batches[i]);
        allEmbeddings.push(...batchEmbeddings);
      }

      return allEmbeddings;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0] || [];
  }

  /**
   * Get embedding dimensions for the current model
   */
  getEmbeddingDimensions(): number {
    return this.provider.getEmbeddingDimensions();
  }

  /**
   * Get maximum tokens supported by the current model
   */
  getMaxTokens(): number {
    return this.provider.getMaxTokens();
  }

  /**
   * Check if text exceeds token limit
   */
  isTextTooLong(text: string): boolean {
    // Simple approximation: 1 token ≈ 4 characters
    const estimatedTokens = text.length / 4;
    return estimatedTokens > this.getMaxTokens();
  }

  /**
   * Truncate text to fit within token limit
   */
  truncateText(text: string, maxTokens?: number): string {
    const limit = maxTokens || this.getMaxTokens();
    const maxLength = limit * 4; // 4 characters per token approximation
    
    if (text.length <= maxLength) return text;
    
    // Truncate and add ellipsis
    return text.substring(0, maxLength - 3) + '...';
  }

  private async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    let retries = 0;
    
    while (retries < this.options.maxRetries) {
      try {
        // Truncate texts that are too long
        const processedTexts = texts.map(text => 
          this.isTextTooLong(text) ? this.truncateText(text) : text
        );

        const embeddings = await this.provider.generateEmbeddings(processedTexts);
        return embeddings;
      } catch (error) {
        retries++;
        console.warn(`Embedding generation failed, retry ${retries}/${this.options.maxRetries}:`, error);
        
        if (retries >= this.options.maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await this.delay(Math.pow(2, retries) * 1000);
      }
    }
    
    throw new Error('Max retries exceeded for embedding generation');
  }

  private splitIntoBatches(texts: string[], batchSize: number): string[][] {
    const batches: string[][] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }
    
    return batches;
  }

  private createProvider(options: EmbeddingOptions): EmbeddingProvider {
    switch (options.provider) {
      case 'openai':
        return new OpenAIEmbeddingProvider(options.model);
      case 'sentence-transformers':
        return new SentenceTransformersProvider(options.model);
      case 'huggingface':
        return new HuggingFaceProvider(options.model);
      default:
        throw new Error(`Unsupported embedding provider: ${options.provider}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ================================
// OPENAI EMBEDDING PROVIDER
// ================================

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  name = 'OpenAI';
  private apiKey: string;
  private model: string;

  constructor(model: string) {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = model;
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key not found. Set OPENAI_API_KEY environment variable.');
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  }

  getEmbeddingDimensions(): number {
    // OpenAI embedding dimensions based on model
    const dimensions: Record<string, number> = {
      'text-embedding-ada-002': 1536,
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072,
    };
    
    return dimensions[this.model] || 1536;
  }

  getMaxTokens(): number {
    // OpenAI token limits
    const maxTokens: Record<string, number> = {
      'text-embedding-ada-002': 8191,
      'text-embedding-3-small': 8191,
      'text-embedding-3-large': 8191,
    };
    
    return maxTokens[this.model] || 8191;
  }
}

// ================================
// SENTENCE TRANSFORMERS PROVIDER
// ================================

export class SentenceTransformersProvider implements EmbeddingProvider {
  name = 'Sentence Transformers';
  private model: string;
  private apiUrl: string;

  constructor(model: string) {
    this.model = model;
    this.apiUrl = process.env.SENTENCE_TRANSFORMERS_API_URL || 'http://localhost:8000';
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.apiUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        texts: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sentence Transformers API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.embeddings;
  }

  getEmbeddingDimensions(): number {
    // Common sentence transformer model dimensions
    const dimensions: Record<string, number> = {
      'all-MiniLM-L6-v2': 384,
      'all-mpnet-base-v2': 768,
      'all-distilroberta-v1': 768,
      'paraphrase-multilingual-MiniLM-L12-v2': 384,
      'paraphrase-multilingual-mpnet-base-v2': 768,
    };
    
    return dimensions[this.model] || 768;
  }

  getMaxTokens(): number {
    // Most sentence transformer models support up to 512 tokens
    return 512;
  }
}

// ================================
// HUGGING FACE PROVIDER
// ================================

export class HuggingFaceProvider implements EmbeddingProvider {
  name = 'Hugging Face';
  private apiKey: string;
  private model: string;

  constructor(model: string) {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || '';
    this.model = model;
    
    if (!this.apiKey) {
      throw new Error('Hugging Face API key not found. Set HUGGINGFACE_API_KEY environment variable.');
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await fetch(`https://api-inference.huggingface.co/models/${this.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: texts,
        options: {
          wait_for_model: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data;
    } else if (Array.isArray(data) && typeof data[0] === 'object' && 'embedding' in data[0]) {
      return data.map((item: any) => item.embedding);
    } else {
      throw new Error('Unexpected response format from Hugging Face API');
    }
  }

  getEmbeddingDimensions(): number {
    // Common Hugging Face model dimensions
    const dimensions: Record<string, number> = {
      'sentence-transformers/all-MiniLM-L6-v2': 384,
      'sentence-transformers/all-mpnet-base-v2': 768,
      'sentence-transformers/all-distilroberta-v1': 768,
      'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2': 384,
      'sentence-transformers/paraphrase-multilingual-mpnet-base-v2': 768,
    };
    
    return dimensions[this.model] || 768;
  }

  getMaxTokens(): number {
    // Most Hugging Face models support up to 512 tokens
    return 512;
  }
}

// ================================
// LOCAL EMBEDDING PROVIDER (for development)
// ================================

export class LocalEmbeddingProvider implements EmbeddingProvider {
  name = 'Local';
  private model: string;

  constructor(model: string) {
    this.model = model;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Mock implementation for development
    // In production, this would use a local embedding model
    console.warn('Using mock embeddings for development');
    
    const dimensions = this.getEmbeddingDimensions();
    return texts.map(() => 
      Array.from({ length: dimensions }, () => Math.random() * 2 - 1)
    );
  }

  getEmbeddingDimensions(): number {
    return 384; // Default for all-MiniLM-L6-v2
  }

  getMaxTokens(): number {
    return 512;
  }
}

// ================================
// EMBEDDING UTILITIES
// ================================

export class EmbeddingUtils {
  /**
   * Calculate cosine similarity between two embeddings
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Calculate Euclidean distance between two embeddings
   */
  static euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same length');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Normalize embedding vector
   */
  static normalize(embedding: number[]): number[] {
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude === 0) {
      return embedding;
    }
    
    return embedding.map(val => val / magnitude);
  }

  /**
   * Calculate average embedding from multiple embeddings
   */
  static average(embeddings: number[][]): number[] {
    if (embeddings.length === 0) {
      return [];
    }

    const dimensions = embeddings[0].length;
    const average = new Array(dimensions).fill(0);

    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        average[i] += embedding[i];
      }
    }

    return average.map(val => val / embeddings.length);
  }
}

