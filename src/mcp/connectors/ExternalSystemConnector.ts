/**
 * External System Connector
 * Integrates with ERP, HR, facility management, and academic calendar systems
 */

import { 
  MCPConnection, 
  MCPResponse, 
  MCPError, 
  ERPStudentData,
  HRFacultyData,
  FacilityRoomData,
  AcademicCalendarData,
  ExaminationScheduleData,
  CacheEntry,
  RetryConfig,
  MCPConnectionStatus,
  DataSource
} from '../types';

export class ExternalSystemConnector {
  private connections: Map<DataSource, MCPConnection> = new Map();
  private caches: Map<DataSource, Map<string, CacheEntry<any>>> = new Map();
  private retryConfig: RetryConfig;
  private status: Map<DataSource, MCPConnectionStatus> = new Map();
  private lastSyncTimes: Map<DataSource, Date> = new Map();
  private syncIntervals: Map<DataSource, NodeJS.Timeout> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: true,
      retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMITED', 'SERVER_ERROR'],
      ...retryConfig
    };

    // Initialize caches for each data source
    Object.values(DataSource).forEach(source => {
      this.caches.set(source, new Map());
      this.status.set(source, 'DISCONNECTED');
    });
  }

  /**
   * Add a connection for a specific data source
   */
  addConnection(source: DataSource, connection: MCPConnection): void {
    this.connections.set(source, connection);
    this.status.set(source, 'DISCONNECTED');
  }

  /**
   * Connect to all configured external systems
   */
  async connectAll(): Promise<MCPResponse<Record<DataSource, boolean>>> {
    const results: Record<DataSource, boolean> = {} as any;

    for (const [source, connection] of this.connections) {
      try {
        const result = await this.connect(source);
        results[source] = result.success;
      } catch (error) {
        console.error(`Failed to connect to ${source}:`, error);
        results[source] = false;
      }
    }

    return {
      success: Object.values(results).some(success => success),
      data: results,
      metadata: {
        requestId: this.generateRequestId(),
        source: 'EXTERNAL_SYSTEM_CONNECTOR',
        version: '1.0.0',
        cacheHit: false,
        processingTime: 0
      },
      timestamp: new Date()
    };
  }

  /**
   * Connect to a specific external system
   */
  async connect(source: DataSource): Promise<MCPResponse<boolean>> {
    try {
      const connection = this.connections.get(source);
      if (!connection) {
        throw new Error(`No connection configured for ${source}`);
      }

      this.status.set(source, 'CONNECTING');

      // Validate connection
      const validationResult = this.validateConnection(connection);
      if (!validationResult.isValid) {
        throw new Error(`Connection validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Test connection
      const testResponse = await this.makeRequest(source, 'GET', '/health');
      if (!testResponse.success) {
        throw new Error(`Failed to establish connection to ${source}`);
      }

      this.status.set(source, 'CONNECTED');
      this.lastSyncTimes.set(source, new Date());

      // Start periodic sync
      this.startPeriodicSync(source);

      return {
        success: true,
        data: true,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'EXTERNAL_SYSTEM_CONNECTOR',
          version: connection.version,
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      this.status.set(source, 'ERROR');
      return this.createErrorResponse('CONNECTION_FAILED', error as Error);
    }
  }

  /**
   * Disconnect from all external systems
   */
  async disconnectAll(): Promise<MCPResponse<boolean>> {
    try {
      for (const source of this.connections.keys()) {
        await this.disconnect(source);
      }

      return {
        success: true,
        data: true,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'EXTERNAL_SYSTEM_CONNECTOR',
          version: '1.0.0',
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
   * Disconnect from a specific external system
   */
  async disconnect(source: DataSource): Promise<MCPResponse<boolean>> {
    try {
      const interval = this.syncIntervals.get(source);
      if (interval) {
        clearInterval(interval);
        this.syncIntervals.delete(source);
      }

      this.status.set(source, 'DISCONNECTED');
      this.caches.get(source)?.clear();

      return {
        success: true,
        data: true,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'EXTERNAL_SYSTEM_CONNECTOR',
          version: '1.0.0',
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('DISCONNECTION_FAILED', error as Error);
    }
  }

  // ERP System Methods

  /**
   * Fetch student data from ERP system
   */
  async fetchStudents(filters?: Record<string, any>): Promise<MCPResponse<ERPStudentData[]>> {
    return this.fetchData(DataSource.ERP_SYSTEM, '/students', filters);
  }

  /**
   * Fetch specific student by ID
   */
  async fetchStudent(studentId: string): Promise<MCPResponse<ERPStudentData>> {
    return this.fetchData(DataSource.ERP_SYSTEM, `/students/${studentId}`);
  }

  /**
   * Update student data in ERP system
   */
  async updateStudent(studentId: string, data: Partial<ERPStudentData>): Promise<MCPResponse<ERPStudentData>> {
    return this.updateData(DataSource.ERP_SYSTEM, `/students/${studentId}`, data);
  }

  // HR System Methods

  /**
   * Fetch faculty data from HR system
   */
  async fetchFaculty(filters?: Record<string, any>): Promise<MCPResponse<HRFacultyData[]>> {
    return this.fetchData(DataSource.HR_SYSTEM, '/faculty', filters);
  }

  /**
   * Fetch specific faculty by ID
   */
  async fetchFacultyMember(facultyId: string): Promise<MCPResponse<HRFacultyData>> {
    return this.fetchData(DataSource.HR_SYSTEM, `/faculty/${facultyId}`);
  }

  /**
   * Update faculty data in HR system
   */
  async updateFaculty(facultyId: string, data: Partial<HRFacultyData>): Promise<MCPResponse<HRFacultyData>> {
    return this.updateData(DataSource.HR_SYSTEM, `/faculty/${facultyId}`, data);
  }

  // Facility Management Methods

  /**
   * Fetch room data from facility management system
   */
  async fetchRooms(filters?: Record<string, any>): Promise<MCPResponse<FacilityRoomData[]>> {
    return this.fetchData(DataSource.FACILITY_MANAGEMENT, '/rooms', filters);
  }

  /**
   * Fetch specific room by ID
   */
  async fetchRoom(roomId: string): Promise<MCPResponse<FacilityRoomData>> {
    return this.fetchData(DataSource.FACILITY_MANAGEMENT, `/rooms/${roomId}`);
  }

  /**
   * Check room availability
   */
  async checkRoomAvailability(roomId: string, startTime: Date, endTime: Date): Promise<MCPResponse<boolean>> {
    return this.fetchData(DataSource.FACILITY_MANAGEMENT, `/rooms/${roomId}/availability`, {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    });
  }

  /**
   * Book room
   */
  async bookRoom(roomId: string, bookingData: any): Promise<MCPResponse<any>> {
    return this.createData(DataSource.FACILITY_MANAGEMENT, `/rooms/${roomId}/bookings`, bookingData);
  }

  // Academic Calendar Methods

  /**
   * Fetch academic calendar events
   */
  async fetchCalendarEvents(filters?: Record<string, any>): Promise<MCPResponse<AcademicCalendarData[]>> {
    return this.fetchData(DataSource.ACADEMIC_CALENDAR, '/events', filters);
  }

  /**
   * Fetch events for specific date range
   */
  async fetchEventsByDateRange(startDate: Date, endDate: Date): Promise<MCPResponse<AcademicCalendarData[]>> {
    return this.fetchData(DataSource.ACADEMIC_CALENDAR, '/events', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
  }

  /**
   * Create new calendar event
   */
  async createCalendarEvent(eventData: Omit<AcademicCalendarData, 'eventId' | 'lastUpdated'>): Promise<MCPResponse<AcademicCalendarData>> {
    return this.createData(DataSource.ACADEMIC_CALENDAR, '/events', eventData);
  }

  // Examination System Methods

  /**
   * Fetch examination schedules
   */
  async fetchExamSchedules(filters?: Record<string, any>): Promise<MCPResponse<ExaminationScheduleData[]>> {
    return this.fetchData(DataSource.EXAMINATION_SYSTEM, '/schedules', filters);
  }

  /**
   * Fetch exam schedule by ID
   */
  async fetchExamSchedule(examId: string): Promise<MCPResponse<ExaminationScheduleData>> {
    return this.fetchData(DataSource.EXAMINATION_SYSTEM, `/schedules/${examId}`);
  }

  /**
   * Create examination schedule
   */
  async createExamSchedule(scheduleData: Omit<ExaminationScheduleData, 'examId' | 'lastUpdated'>): Promise<MCPResponse<ExaminationScheduleData>> {
    return this.createData(DataSource.EXAMINATION_SYSTEM, '/schedules', scheduleData);
  }

  // Generic data methods

  private async fetchData<T>(source: DataSource, endpoint: string, filters?: Record<string, any>): Promise<MCPResponse<T>> {
    try {
      const startTime = Date.now();
      
      // Check cache first
      const cacheKey = `${endpoint}_${JSON.stringify(filters || {})}`;
      const cached = this.caches.get(source)?.get(cacheKey);
      
      if (cached && cached.expiry > new Date()) {
        return {
          success: true,
          data: cached.data as T,
          metadata: {
            requestId: this.generateRequestId(),
            source: 'EXTERNAL_SYSTEM_CONNECTOR',
            version: '1.0.0',
            cacheHit: true,
            processingTime: Date.now() - startTime
          },
          timestamp: new Date()
        };
      }

      // Fetch from API
      const response = await this.makeRequest(source, 'GET', endpoint, filters);
      if (!response.success) {
        throw new Error(`Failed to fetch data from ${source}`);
      }

      const data = response.data as T;
      
      // Update cache
      const cache = this.caches.get(source);
      if (cache) {
        const connection = this.connections.get(source);
        cache.set(cacheKey, {
          key: cacheKey,
          data,
          timestamp: new Date(),
          expiry: new Date(Date.now() + (connection?.cacheExpiry || 300000)),
          version: connection?.version || '1.0.0',
          source: source,
          accessCount: 1,
          lastAccessed: new Date()
        });
      }

      return {
        success: true,
        data,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'EXTERNAL_SYSTEM_CONNECTOR',
          version: '1.0.0',
          cacheHit: false,
          processingTime: Date.now() - startTime
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('FETCH_DATA_FAILED', error as Error);
    }
  }

  private async updateData<T>(source: DataSource, endpoint: string, data: any): Promise<MCPResponse<T>> {
    try {
      const response = await this.makeRequest(source, 'PUT', endpoint, data);
      if (!response.success) {
        throw new Error(`Failed to update data in ${source}`);
      }

      // Clear related cache entries
      this.clearCacheByPattern(source, endpoint);

      return {
        success: true,
        data: response.data as T,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'EXTERNAL_SYSTEM_CONNECTOR',
          version: '1.0.0',
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('UPDATE_DATA_FAILED', error as Error);
    }
  }

  private async createData<T>(source: DataSource, endpoint: string, data: any): Promise<MCPResponse<T>> {
    try {
      const response = await this.makeRequest(source, 'POST', endpoint, data);
      if (!response.success) {
        throw new Error(`Failed to create data in ${source}`);
      }

      // Clear related cache entries
      this.clearCacheByPattern(source, endpoint);

      return {
        success: true,
        data: response.data as T,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'EXTERNAL_SYSTEM_CONNECTOR',
          version: '1.0.0',
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('CREATE_DATA_FAILED', error as Error);
    }
  }

  private async makeRequest(source: DataSource, method: string, endpoint: string, data?: any): Promise<MCPResponse<any>> {
    const connection = this.connections.get(source);
    if (!connection) {
      throw new Error(`No connection configured for ${source}`);
    }

    const url = `${connection.endpoint}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'External-System-Connector/1.0',
      'X-API-Version': connection.version
    };

    if (connection.apiKey) {
      headers['Authorization'] = `Bearer ${connection.apiKey}`;
    }

    const config: RequestInit = {
      method,
      headers,
      timeout: connection.timeout
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
            source: 'EXTERNAL_SYSTEM_CONNECTOR',
            version: connection.version,
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

  private startPeriodicSync(source: DataSource): void {
    const interval = setInterval(async () => {
      try {
        // Sync data based on source type
        switch (source) {
          case DataSource.ERP_SYSTEM:
            await this.fetchStudents();
            break;
          case DataSource.HR_SYSTEM:
            await this.fetchFaculty();
            break;
          case DataSource.FACILITY_MANAGEMENT:
            await this.fetchRooms();
            break;
          case DataSource.ACADEMIC_CALENDAR:
            await this.fetchCalendarEvents();
            break;
          case DataSource.EXAMINATION_SYSTEM:
            await this.fetchExamSchedules();
            break;
        }
        
        this.lastSyncTimes.set(source, new Date());
        this.emit('sync_success', { source, timestamp: new Date() });
      } catch (error) {
        console.error(`Periodic sync failed for ${source}:`, error);
        this.emit('sync_error', { source, error });
      }
    }, 300000); // 5 minutes

    this.syncIntervals.set(source, interval);
  }

  private clearCacheByPattern(source: DataSource, pattern: string): void {
    const cache = this.caches.get(source);
    if (cache) {
      for (const [key] of cache) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    }
  }

  private validateConnection(connection: MCPConnection): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!connection.endpoint) {
      errors.push('Endpoint is required');
    }

    if (!connection.apiKey && !connection.credentials) {
      errors.push('API key or credentials are required');
    }

    if (connection.timeout <= 0) {
      errors.push('Timeout must be positive');
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
      return delay + Math.random() * 1000;
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
        source: 'EXTERNAL_SYSTEM_CONNECTOR',
        version: '1.0.0',
        cacheHit: false,
        processingTime: 0
      },
      timestamp: new Date()
    };
  }

  // Public utility methods

  /**
   * Get status of all connections
   */
  getConnectionStatuses(): Record<DataSource, MCPConnectionStatus> {
    const statuses: Record<DataSource, MCPConnectionStatus> = {} as any;
    for (const [source, status] of this.status) {
      statuses[source] = status;
    }
    return statuses;
  }

  /**
   * Get cache statistics for all sources
   */
  getCacheStats(): Record<DataSource, { size: number; hitRate: number; lastSync: Date | null }> {
    const stats: Record<DataSource, { size: number; hitRate: number; lastSync: Date | null }> = {} as any;
    
    for (const source of Object.values(DataSource)) {
      const cache = this.caches.get(source);
      const totalAccesses = cache ? Array.from(cache.values()).reduce((sum, entry) => sum + entry.accessCount, 0) : 0;
      const cacheHits = cache ? Array.from(cache.values()).reduce((sum, entry) => sum + Math.max(0, entry.accessCount - 1), 0) : 0;
      const hitRate = totalAccesses > 0 ? (cacheHits / totalAccesses) * 100 : 0;

      stats[source] = {
        size: cache?.size || 0,
        hitRate,
        lastSync: this.lastSyncTimes.get(source) || null
      };
    }

    return stats;
  }

  /**
   * Subscribe to events
   */
  subscribe(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Unsubscribe from events
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
}
