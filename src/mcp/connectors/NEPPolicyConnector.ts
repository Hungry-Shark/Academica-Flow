/**
 * NEP Policy Connector
 * Connects to official NEP database/API for real-time policy updates
 */

import { 
  MCPConnection, 
  MCPResponse, 
  MCPError, 
  NEPPolicyData, 
  NEPComplianceCheck, 
  NEPViolation,
  CacheEntry,
  RetryConfig,
  MCPConnectionStatus
} from '../types';

export class NEPPolicyConnector {
  private connection: MCPConnection;
  private cache: Map<string, CacheEntry<NEPPolicyData>> = new Map();
  private policyVersions: Map<string, string> = new Map();
  private retryConfig: RetryConfig;
  private status: MCPConnectionStatus = 'DISCONNECTED';
  private lastSyncTime: Date | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(connection: MCPConnection, retryConfig?: Partial<RetryConfig>) {
    this.connection = connection;
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: true,
      retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMITED', 'SERVER_ERROR'],
      ...retryConfig
    };
  }

  /**
   * Initialize connection to NEP policy database
   */
  async connect(): Promise<MCPResponse<boolean>> {
    try {
      this.status = 'CONNECTING';
      
      // Validate connection configuration
      const validationResult = this.validateConnection();
      if (!validationResult.isValid) {
        throw new Error(`Connection validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Test connection with a simple API call
      const testResponse = await this.makeRequest('GET', '/health');
      if (!testResponse.success) {
        throw new Error('Failed to establish connection to NEP policy database');
      }

      this.status = 'CONNECTED';
      this.lastSyncTime = new Date();
      
      // Start periodic sync
      this.startPeriodicSync();

      return {
        success: true,
        data: true,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'NEP_POLICY_CONNECTOR',
          version: this.connection.version,
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      this.status = 'ERROR';
      return this.createErrorResponse('CONNECTION_FAILED', error as Error);
    }
  }

  /**
   * Disconnect from NEP policy database
   */
  async disconnect(): Promise<MCPResponse<boolean>> {
    try {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      this.status = 'DISCONNECTED';
      this.cache.clear();
      this.policyVersions.clear();

      return {
        success: true,
        data: true,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'NEP_POLICY_CONNECTOR',
          version: this.connection.version,
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('DISCONNECTION_FAILED', error as Error);
    }
  }

  /**
   * Fetch latest policy updates
   */
  async fetchLatestPolicies(): Promise<MCPResponse<NEPPolicyData[]>> {
    try {
      const startTime = Date.now();
      
      // Check cache first
      const cacheKey = 'latest_policies';
      const cached = this.cache.get(cacheKey);
      
      if (cached && cached.expiry > new Date()) {
        return {
          success: true,
          data: cached.data as NEPPolicyData[],
          metadata: {
            requestId: this.generateRequestId(),
            source: 'NEP_POLICY_CONNECTOR',
            version: this.connection.version,
            cacheHit: true,
            processingTime: Date.now() - startTime
          },
          timestamp: new Date()
        };
      }

      // Fetch from API
      const response = await this.makeRequest('GET', '/policies/latest');
      if (!response.success) {
        throw new Error('Failed to fetch latest policies');
      }

      const policies = response.data as NEPPolicyData[];
      
      // Update cache
      this.cache.set(cacheKey, {
        key: cacheKey,
        data: policies,
        timestamp: new Date(),
        expiry: new Date(Date.now() + this.connection.cacheExpiry),
        version: this.connection.version,
        source: 'NEP_POLICY_API',
        accessCount: 1,
        lastAccessed: new Date()
      });

      // Check for policy updates
      await this.checkForPolicyUpdates(policies);

      return {
        success: true,
        data: policies,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'NEP_POLICY_CONNECTOR',
          version: this.connection.version,
          cacheHit: false,
          processingTime: Date.now() - startTime
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('FETCH_POLICIES_FAILED', error as Error);
    }
  }

  /**
   * Get specific policy by ID
   */
  async getPolicy(policyId: string): Promise<MCPResponse<NEPPolicyData>> {
    try {
      const startTime = Date.now();
      
      // Check cache first
      const cacheKey = `policy_${policyId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && cached.expiry > new Date()) {
        return {
          success: true,
          data: cached.data as NEPPolicyData,
          metadata: {
            requestId: this.generateRequestId(),
            source: 'NEP_POLICY_CONNECTOR',
            version: this.connection.version,
            cacheHit: true,
            processingTime: Date.now() - startTime
          },
          timestamp: new Date()
        };
      }

      // Fetch from API
      const response = await this.makeRequest('GET', `/policies/${policyId}`);
      if (!response.success) {
        throw new Error(`Failed to fetch policy ${policyId}`);
      }

      const policy = response.data as NEPPolicyData;
      
      // Update cache
      this.cache.set(cacheKey, {
        key: cacheKey,
        data: policy,
        timestamp: new Date(),
        expiry: new Date(Date.now() + this.connection.cacheExpiry),
        version: this.connection.version,
        source: 'NEP_POLICY_API',
        accessCount: 1,
        lastAccessed: new Date()
      });

      return {
        success: true,
        data: policy,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'NEP_POLICY_CONNECTOR',
          version: this.connection.version,
          cacheHit: false,
          processingTime: Date.now() - startTime
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('FETCH_POLICY_FAILED', error as Error);
    }
  }

  /**
   * Validate compliance against latest policies
   */
  async validateCompliance(data: any, context: Record<string, any> = {}): Promise<MCPResponse<NEPComplianceCheck[]>> {
    try {
      const startTime = Date.now();
      
      // Get latest policies
      const policiesResponse = await this.fetchLatestPolicies();
      if (!policiesResponse.success || !policiesResponse.data) {
        throw new Error('Failed to fetch policies for compliance validation');
      }

      const policies = policiesResponse.data;
      const complianceChecks: NEPComplianceCheck[] = [];

      // Validate against each policy
      for (const policy of policies) {
        if (policy.status !== 'ACTIVE') continue;

        const complianceCheck = await this.validatePolicyCompliance(policy, data, context);
        complianceChecks.push(complianceCheck);
      }

      return {
        success: true,
        data: complianceChecks,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'NEP_POLICY_CONNECTOR',
          version: this.connection.version,
          cacheHit: false,
          processingTime: Date.now() - startTime
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('COMPLIANCE_VALIDATION_FAILED', error as Error);
    }
  }

  /**
   * Subscribe to policy change notifications
   */
  subscribe(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Unsubscribe from policy change notifications
   */
  unsubscribe(eventType: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Get connection status
   */
  getStatus(): MCPConnectionStatus {
    return this.status;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number; lastSync: Date | null } {
    const totalAccesses = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.accessCount, 0);
    const cacheHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + Math.max(0, entry.accessCount - 1), 0);
    const hitRate = totalAccesses > 0 ? (cacheHits / totalAccesses) * 100 : 0;

    return {
      size: this.cache.size,
      hitRate,
      lastSync: this.lastSyncTime
    };
  }

  // Private methods

  private async makeRequest(method: string, endpoint: string, data?: any): Promise<MCPResponse<any>> {
    const url = `${this.connection.endpoint}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'NEP-Policy-Connector/1.0',
      'X-API-Version': this.connection.version
    };

    if (this.connection.apiKey) {
      headers['Authorization'] = `Bearer ${this.connection.apiKey}`;
    }

    const config: RequestInit = {
      method,
      headers,
      timeout: this.connection.timeout
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
        }

        const responseData = await response.json();
        
        return {
          success: true,
          data: responseData,
          metadata: {
            requestId: this.generateRequestId(),
            source: 'NEP_POLICY_CONNECTOR',
            version: this.connection.version,
            cacheHit: false,
            processingTime: 0
          },
          timestamp: new Date()
        };

      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.retryConfig.maxAttempts && this.isRetryableError(error as Error)) {
          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);
        } else {
          break;
        }
      }
    }

    return this.createErrorResponse('REQUEST_FAILED', lastError!);
  }

  private async validatePolicyCompliance(policy: NEPPolicyData, data: any, context: Record<string, any>): Promise<NEPComplianceCheck> {
    const violations: NEPViolation[] = [];
    const recommendations: string[] = [];
    let totalScore = 100;

    // Validate each requirement
    for (const requirement of policy.requirements) {
      const requirementResult = this.validateRequirement(requirement, data, context);
      
      if (!requirementResult.isValid) {
        violations.push(...requirementResult.violations);
        totalScore -= requirement.weight;
      }
      
      if (requirementResult.recommendations.length > 0) {
        recommendations.push(...requirementResult.recommendations);
      }
    }

    return {
      policyId: policy.id,
      requirementId: '', // Will be set by individual requirement validation
      isCompliant: violations.length === 0,
      score: Math.max(0, totalScore),
      violations,
      recommendations,
      checkedAt: new Date(),
      context
    };
  }

  private validateRequirement(requirement: any, data: any, context: Record<string, any>): {
    isValid: boolean;
    violations: NEPViolation[];
    recommendations: string[];
  } {
    const violations: NEPViolation[] = [];
    const recommendations: string[] = [];

    // Implementation of requirement validation logic
    // This would be specific to each requirement type
    
    return {
      isValid: violations.length === 0,
      violations,
      recommendations
    };
  }

  private async checkForPolicyUpdates(policies: NEPPolicyData[]): Promise<void> {
    for (const policy of policies) {
      const cachedVersion = this.policyVersions.get(policy.id);
      
      if (!cachedVersion || cachedVersion !== policy.version) {
        // Policy has been updated
        this.policyVersions.set(policy.id, policy.version);
        this.emit('policy_updated', { policy, previousVersion: cachedVersion });
      }
    }
  }

  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.fetchLatestPolicies();
      } catch (error) {
        console.error('Periodic sync failed:', error);
        this.emit('sync_error', { error });
      }
    }, 300000); // 5 minutes
  }

  private validateConnection(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.connection.endpoint) {
      errors.push('Endpoint is required');
    }

    if (!this.connection.apiKey && !this.connection.credentials) {
      errors.push('API key or credentials are required');
    }

    if (this.connection.timeout <= 0) {
      errors.push('Timeout must be positive');
    }

    if (this.connection.cacheExpiry <= 0) {
      errors.push('Cache expiry must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isRetryableError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return this.retryConfig.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  private calculateRetryDelay(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
      this.retryConfig.maxDelay
    );

    if (this.retryConfig.jitter) {
      return delay + Math.random() * 1000; // Add jitter
    }

    return delay;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private emit(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  private createErrorResponse(code: string, error: Error): MCPResponse<any> {
    return {
      success: false,
      error: {
        code,
        message: error.message,
        details: error.stack,
        retryable: this.isRetryableError(error),
        timestamp: new Date()
      },
      metadata: {
        requestId: this.generateRequestId(),
        source: 'NEP_POLICY_CONNECTOR',
        version: this.connection.version,
        cacheHit: false,
        processingTime: 0
      },
      timestamp: new Date()
    };
  }
}
