/**
 * MCP Server Implementation
 * Provides secure authentication, rate limiting, caching, and audit logging
 */

import { 
  MCPServerConfig, 
  MCPAuthentication, 
  MCPAuditLog, 
  MCPMetrics, 
  MCPResponse, 
  MCPError,
  RateLimitInfo,
  CacheEntry
} from '../types';

export class MCPServer {
  private config: MCPServerConfig;
  private isRunning: boolean = false;
  private server: any; // Express server instance
  private authentication: Map<string, MCPAuthentication> = new Map();
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  private cache: Map<string, CacheEntry<any>> = new Map();
  private auditLogs: MCPAuditLog[] = [];
  private metrics: MCPMetrics;
  private startTime: Date;

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.startTime = new Date();
    this.metrics = this.initializeMetrics();
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<MCPResponse<boolean>> {
    try {
      if (this.isRunning) {
        throw new Error('Server is already running');
      }

      // Initialize Express server
      const express = await import('express');
      const cors = await import('cors');
      const helmet = await import('helmet');
      const rateLimit = await import('express-rate-limit');

      this.server = express.default();

      // Security middleware
      this.server.use(helmet.default());
      this.server.use(cors.default({
        origin: this.config.corsOrigins,
        credentials: true
      }));

      // Rate limiting
      const limiter = rateLimit.default({
        windowMs: 60 * 1000, // 1 minute
        max: this.config.rateLimitPerMinute,
        message: {
          error: 'Rate limit exceeded',
          retryAfter: 60
        },
        standardHeaders: true,
        legacyHeaders: false
      });
      this.server.use(limiter);

      // Body parsing
      this.server.use(express.json({ limit: '10mb' }));
      this.server.use(express.urlencoded({ extended: true }));

      // Request logging
      this.server.use(this.requestLogger.bind(this));

      // Authentication middleware
      this.server.use(this.authenticateRequest.bind(this));

      // API routes
      this.setupRoutes();

      // Error handling
      this.server.use(this.errorHandler.bind(this));

      // Start server
      await new Promise<void>((resolve, reject) => {
        this.server.listen(this.config.port, this.config.host, (error?: any) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      this.isRunning = true;
      this.metrics.uptime = Date.now() - this.startTime.getTime();

      return {
        success: true,
        data: true,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'MCP_SERVER',
          version: this.config.apiVersion,
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('SERVER_START_FAILED', error as Error);
    }
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<MCPResponse<boolean>> {
    try {
      if (!this.isRunning) {
        throw new Error('Server is not running');
      }

      await new Promise<void>((resolve, reject) => {
        this.server.close((error?: any) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      this.isRunning = false;
      this.cache.clear();
      this.rateLimits.clear();

      return {
        success: true,
        data: true,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'MCP_SERVER',
          version: this.config.apiVersion,
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('SERVER_STOP_FAILED', error as Error);
    }
  }

  /**
   * Register authentication credentials
   */
  registerAuthentication(authId: string, authentication: MCPAuthentication): MCPResponse<boolean> {
    try {
      this.authentication.set(authId, authentication);
      
      return {
        success: true,
        data: true,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'MCP_SERVER',
          version: this.config.apiVersion,
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('AUTH_REGISTRATION_FAILED', error as Error);
    }
  }

  /**
   * Get server metrics
   */
  getMetrics(): MCPResponse<MCPMetrics> {
    try {
      // Update runtime metrics
      this.metrics.uptime = Date.now() - this.startTime.getTime();
      this.metrics.activeConnections = this.rateLimits.size;
      this.metrics.memoryUsage = process.memoryUsage().heapUsed;
      this.metrics.cpuUsage = process.cpuUsage().user;

      return {
        success: true,
        data: this.metrics,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'MCP_SERVER',
          version: this.config.apiVersion,
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('METRICS_FETCH_FAILED', error as Error);
    }
  }

  /**
   * Get audit logs
   */
  getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): MCPResponse<MCPAuditLog[]> {
    try {
      let logs = [...this.auditLogs];

      // Apply filters
      if (filters) {
        if (filters.userId) {
          logs = logs.filter(log => log.userId === filters.userId);
        }
        if (filters.action) {
          logs = logs.filter(log => log.action === filters.action);
        }
        if (filters.startDate) {
          logs = logs.filter(log => log.timestamp >= filters.startDate!);
        }
        if (filters.endDate) {
          logs = logs.filter(log => log.timestamp <= filters.endDate!);
        }
        if (filters.limit) {
          logs = logs.slice(0, filters.limit);
        }
      }

      // Sort by timestamp (newest first)
      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return {
        success: true,
        data: logs,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'MCP_SERVER',
          version: this.config.apiVersion,
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('AUDIT_LOGS_FETCH_FAILED', error as Error);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): MCPResponse<boolean> {
    try {
      this.cache.clear();
      
      return {
        success: true,
        data: true,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'MCP_SERVER',
          version: this.config.apiVersion,
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('CACHE_CLEAR_FAILED', error as Error);
    }
  }

  // Private methods

  private setupRoutes(): void {
    // Health check
    this.server.get('/health', (req: any, res: any) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime.getTime(),
        version: this.config.apiVersion
      });
    });

    // Metrics endpoint
    this.server.get('/metrics', (req: any, res: any) => {
      const metricsResponse = this.getMetrics();
      res.json(metricsResponse);
    });

    // Cache management
    this.server.post('/cache/clear', (req: any, res: any) => {
      const response = this.clearCache();
      res.json(response);
    });

    // Audit logs
    this.server.get('/audit-logs', (req: any, res: any) => {
      const filters = {
        userId: req.query.userId,
        action: req.query.action,
        startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      };
      const response = this.getAuditLogs(filters);
      res.json(response);
    });

    // API version info
    this.server.get('/version', (req: any, res: any) => {
      res.json({
        version: this.config.apiVersion,
        timestamp: new Date().toISOString()
      });
    });
  }

  private requestLogger(req: any, res: any, next: any): void {
    const startTime = Date.now();
    
    // Log request
    const auditLog: MCPAuditLog = {
      id: this.generateRequestId(),
      timestamp: new Date(),
      userId: req.user?.id,
      action: `${req.method} ${req.path}`,
      resource: req.path,
      method: req.method,
      endpoint: req.path,
      statusCode: 0, // Will be updated in response
      responseTime: 0, // Will be updated in response
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown',
      requestBody: req.method !== 'GET' ? req.body : undefined
    };

    // Override res.end to capture response details
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      auditLog.statusCode = res.statusCode;
      auditLog.responseTime = Date.now() - startTime;
      auditLog.responseBody = res.statusCode >= 400 ? chunk : undefined;

      // Add to audit logs
      if (this.config.enableAuditLog) {
        this.auditLogs.push(auditLog);
        
        // Keep only last 10000 logs
        if (this.auditLogs.length > 10000) {
          this.auditLogs = this.auditLogs.slice(-10000);
        }
      }

      // Update metrics
      this.updateMetrics(auditLog);

      originalEnd.call(this, chunk, encoding);
    }.bind(this);

    next();
  }

  private authenticateRequest(req: any, res: any, next: any): void {
    try {
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authorization header is required',
            retryable: false,
            timestamp: new Date()
          }
        });
      }

      // Extract auth token
      const token = authHeader.replace(/^Bearer\s+/i, '');
      
      // Find authentication by token
      let auth: MCPAuthentication | undefined;
      for (const [authId, authData] of this.authentication) {
        if (authData.credentials.token === token || authData.credentials.apiKey === token) {
          auth = authData;
          break;
        }
      }

      if (!auth) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid authentication token',
            retryable: false,
            timestamp: new Date()
          }
        });
      }

      // Check if token is expired
      if (auth.expiresAt && auth.expiresAt < new Date()) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Authentication token has expired',
            retryable: false,
            timestamp: new Date()
          }
        });
      }

      // Check rate limiting
      const rateLimitResult = this.checkRateLimit(auth.rateLimit, req.ip);
      if (!rateLimitResult.allowed) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Rate limit exceeded',
            retryable: true,
            timestamp: new Date()
          },
          metadata: {
            rateLimitRemaining: rateLimitResult.remaining,
            rateLimitReset: rateLimitResult.resetTime
          }
        });
      }

      // Attach user info to request
      req.user = {
        id: auth.credentials.username || 'anonymous',
        permissions: auth.permissions,
        rateLimit: auth.rateLimit
      };

      next();

    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication error occurred',
          retryable: false,
          timestamp: new Date()
        }
      });
    }
  }

  private checkRateLimit(rateLimit: any, clientId: string): {
    allowed: boolean;
    remaining: number;
    resetTime: Date;
  } {
    const now = new Date();
    const key = `rate_limit_${clientId}`;
    
    let rateLimitInfo = this.rateLimits.get(key);
    
    if (!rateLimitInfo || now > rateLimitInfo.windowEnd) {
      // Create new rate limit window
      rateLimitInfo = {
        key,
        requests: 0,
        windowStart: now,
        windowEnd: new Date(now.getTime() + 60000), // 1 minute window
        limit: rateLimit.requestsPerMinute,
        remaining: rateLimit.requestsPerMinute,
        resetTime: new Date(now.getTime() + 60000)
      };
    }

    if (rateLimitInfo.requests >= rateLimitInfo.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: rateLimitInfo.resetTime
      };
    }

    // Increment request count
    rateLimitInfo.requests++;
    rateLimitInfo.remaining = Math.max(0, rateLimitInfo.limit - rateLimitInfo.requests);
    this.rateLimits.set(key, rateLimitInfo);

    return {
      allowed: true,
      remaining: rateLimitInfo.remaining,
      resetTime: rateLimitInfo.resetTime
    };
  }

  private updateMetrics(auditLog: MCPAuditLog): void {
    this.metrics.totalRequests++;
    
    if (auditLog.statusCode >= 200 && auditLog.statusCode < 300) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalResponseTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + auditLog.responseTime;
    this.metrics.averageResponseTime = totalResponseTime / this.metrics.totalRequests;

    // Update cache hit rate (simplified calculation)
    if (auditLog.responseTime < 100) { // Assume fast responses are cache hits
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate * (this.metrics.totalRequests - 1) + 1) / this.metrics.totalRequests;
    } else {
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate * (this.metrics.totalRequests - 1)) / this.metrics.totalRequests;
    }
  }

  private errorHandler(err: any, req: any, res: any, next: any): void {
    console.error('Server error:', err);

    const error: MCPError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Internal server error',
      details: this.config.enableAuditLog ? err.stack : undefined,
      retryable: false,
      statusCode: 500,
      timestamp: new Date()
    };

    res.status(500).json({
      success: false,
      error,
      metadata: {
        requestId: this.generateRequestId(),
        source: 'MCP_SERVER',
        version: this.config.apiVersion,
        cacheHit: false,
        processingTime: 0
      },
      timestamp: new Date()
    });
  }

  private initializeMetrics(): MCPMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      activeConnections: 0,
      dataSyncCount: 0,
      lastSyncTime: new Date(),
      uptime: 0,
      memoryUsage: 0,
      cpuUsage: 0
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createErrorResponse(code: string, error: Error): MCPResponse<any> {
    return {
      success: false,
      error: {
        code,
        message: error.message,
        details: error.stack,
        retryable: false,
        timestamp: new Date()
      },
      metadata: {
        requestId: this.generateRequestId(),
        source: 'MCP_SERVER',
        version: this.config.apiVersion,
        cacheHit: false,
        processingTime: 0
      },
      timestamp: new Date()
    };
  }

  // Public getters

  get isServerRunning(): boolean {
    return this.isRunning;
  }

  get serverConfig(): MCPServerConfig {
    return { ...this.config };
  }

  get activeConnections(): number {
    return this.rateLimits.size;
  }

  get cacheSize(): number {
    return this.cache.size;
  }
}
