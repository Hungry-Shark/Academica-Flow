/**
 * Live Data Synchronizer
 * Detects changes in external systems and updates RAG vector store automatically
 */

import { 
  SyncEvent, 
  SyncConfiguration, 
  DataValidationResult, 
  ValidationError, 
  ValidationWarning,
  MCPResponse,
  MCPError,
  DataSource,
  ResourceType,
  EventType
} from '../types';
import { NEPPolicyConnector } from '../connectors/NEPPolicyConnector';
import { ExternalSystemConnector } from '../connectors/ExternalSystemConnector';

export class LiveDataSynchronizer {
  private config: SyncConfiguration;
  private nepConnector: NEPPolicyConnector;
  private externalConnector: ExternalSystemConnector;
  private syncQueue: SyncEvent[] = [];
  private isRunning: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private processingQueue: boolean = false;
  private eventListeners: Map<string, Function[]> = new Map();
  private syncStats: {
    totalEvents: number;
    processedEvents: number;
    failedEvents: number;
    lastSyncTime: Date | null;
    averageProcessingTime: number;
  } = {
    totalEvents: 0,
    processedEvents: 0,
    failedEvents: 0,
    lastSyncTime: null,
    averageProcessingTime: 0
  };

  constructor(
    config: SyncConfiguration,
    nepConnector: NEPPolicyConnector,
    externalConnector: ExternalSystemConnector
  ) {
    this.config = config;
    this.nepConnector = nepConnector;
    this.externalConnector = externalConnector;
  }

  /**
   * Start the live data synchronizer
   */
  async start(): Promise<MCPResponse<boolean>> {
    try {
      if (this.isRunning) {
        throw new Error('Live data synchronizer is already running');
      }

      // Validate configuration
      const validationResult = this.validateConfiguration();
      if (!validationResult.isValid) {
        throw new Error(`Configuration validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Set up event listeners
      this.setupEventListeners();

      // Start sync interval
      if (this.config.enabled) {
        this.syncInterval = setInterval(() => {
          this.processSyncQueue();
        }, this.config.interval);
      }

      this.isRunning = true;
      this.syncStats.lastSyncTime = new Date();

      return {
        success: true,
        data: true,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'LIVE_DATA_SYNCHRONIZER',
          version: '1.0.0',
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('SYNC_START_FAILED', error as Error);
    }
  }

  /**
   * Stop the live data synchronizer
   */
  async stop(): Promise<MCPResponse<boolean>> {
    try {
      if (!this.isRunning) {
        throw new Error('Live data synchronizer is not running');
      }

      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      this.isRunning = false;
      this.syncQueue = [];

      return {
        success: true,
        data: true,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'LIVE_DATA_SYNCHRONIZER',
          version: '1.0.0',
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('SYNC_STOP_FAILED', error as Error);
    }
  }

  /**
   * Add a sync event to the queue
   */
  addSyncEvent(event: Omit<SyncEvent, 'id' | 'timestamp' | 'retryCount' | 'processed'>): MCPResponse<string> {
    try {
      const syncEvent: SyncEvent = {
        id: this.generateEventId(),
        timestamp: new Date(),
        retryCount: 0,
        processed: false,
        ...event
      };

      this.syncQueue.push(syncEvent);
      this.syncStats.totalEvents++;

      // Process immediately if not already processing
      if (!this.processingQueue) {
        setImmediate(() => this.processSyncQueue());
      }

      return {
        success: true,
        data: syncEvent.id,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'LIVE_DATA_SYNCHRONIZER',
          version: '1.0.0',
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('ADD_SYNC_EVENT_FAILED', error as Error);
    }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue(): Promise<void> {
    if (this.processingQueue || this.syncQueue.length === 0) {
      return;
    }

    this.processingQueue = true;
    const startTime = Date.now();

    try {
      // Get events to process (respect batch size)
      const eventsToProcess = this.syncQueue
        .filter(event => !event.processed)
        .slice(0, this.config.batchSize);

      if (eventsToProcess.length === 0) {
        return;
      }

      // Process events
      if (this.config.parallelSync) {
        await this.processEventsInParallel(eventsToProcess);
      } else {
        await this.processEventsSequentially(eventsToProcess);
      }

      // Update stats
      const processingTime = Date.now() - startTime;
      this.updateSyncStats(processingTime);

      // Send notification if enabled
      if (this.config.notificationEnabled && this.config.webhookUrl) {
        await this.sendNotification({
          type: 'SYNC_SUCCESS',
          title: 'Data Sync Completed',
          message: `Processed ${eventsToProcess.length} events successfully`,
          data: { processedCount: eventsToProcess.length, processingTime }
        });
      }

    } catch (error) {
      console.error('Error processing sync queue:', error);
      this.syncStats.failedEvents += this.syncQueue.filter(e => !e.processed).length;
      
      if (this.config.notificationEnabled && this.config.webhookUrl) {
        await this.sendNotification({
          type: 'SYNC_FAILURE',
          title: 'Data Sync Failed',
          message: `Failed to process sync queue: ${(error as Error).message}`,
          data: { error: (error as Error).message }
        });
      }
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Validate data before processing
   */
  async validateData(data: any, resourceType: ResourceType): Promise<DataValidationResult> {
    try {
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      let score = 100;

      // Basic validation
      if (!data || typeof data !== 'object') {
        errors.push({
          field: 'data',
          code: 'INVALID_DATA_TYPE',
          message: 'Data must be a valid object',
          severity: 'CRITICAL'
        });
        score = 0;
      }

      // Resource-specific validation
      switch (resourceType) {
        case 'STUDENT':
          score = this.validateStudentData(data, errors, warnings, score);
          break;
        case 'FACULTY':
          score = this.validateFacultyData(data, errors, warnings, score);
          break;
        case 'ROOM':
          score = this.validateRoomData(data, errors, warnings, score);
          break;
        case 'SUBJECT':
          score = this.validateSubjectData(data, errors, warnings, score);
          break;
        case 'POLICY':
          score = this.validatePolicyData(data, errors, warnings, score);
          break;
        case 'CALENDAR':
          score = this.validateCalendarData(data, errors, warnings, score);
          break;
        case 'EXAMINATION':
          score = this.validateExaminationData(data, errors, warnings, score);
          break;
      }

      // Generate recommendations
      const recommendations = this.generateRecommendations(errors, warnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        score: Math.max(0, score),
        recommendations
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'validation',
          code: 'VALIDATION_ERROR',
          message: `Validation error: ${(error as Error).message}`,
          severity: 'CRITICAL'
        }],
        warnings: [],
        score: 0,
        recommendations: ['Fix validation error and retry']
      };
    }
  }

  /**
   * Update RAG vector store with new data
   */
  async updateRAGVectorStore(event: SyncEvent): Promise<MCPResponse<boolean>> {
    try {
      // This would integrate with your RAG system
      // For now, we'll simulate the update
      
      const ragUpdate = {
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        data: event.data,
        timestamp: event.timestamp,
        source: event.source
      };

      // Simulate RAG update
      await this.simulateRAGUpdate(ragUpdate);

      return {
        success: true,
        data: true,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'LIVE_DATA_SYNCHRONIZER',
          version: '1.0.0',
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('RAG_UPDATE_FAILED', error as Error);
    }
  }

  /**
   * Trigger timetable regeneration if needed
   */
  async triggerTimetableRegeneration(event: SyncEvent): Promise<MCPResponse<boolean>> {
    try {
      // Check if this event requires timetable regeneration
      const requiresRegeneration = this.shouldTriggerTimetableRegeneration(event);
      
      if (!requiresRegeneration) {
        return {
          success: true,
          data: false,
          metadata: {
            requestId: this.generateRequestId(),
            source: 'LIVE_DATA_SYNCHRONIZER',
            version: '1.0.0',
            cacheHit: false,
            processingTime: 0
          },
          timestamp: new Date()
        };
      }

      // Trigger regeneration
      await this.simulateTimetableRegeneration(event);

      return {
        success: true,
        data: true,
        metadata: {
          requestId: this.generateRequestId(),
          source: 'LIVE_DATA_SYNCHRONIZER',
          version: '1.0.0',
          cacheHit: false,
          processingTime: 0
        },
        timestamp: new Date()
      };

    } catch (error) {
      return this.createErrorResponse('TIMETABLE_REGENERATION_FAILED', error as Error);
    }
  }

  /**
   * Get sync statistics
   */
  getSyncStats(): MCPResponse<typeof this.syncStats> {
    return {
      success: true,
      data: { ...this.syncStats },
      metadata: {
        requestId: this.generateRequestId(),
        source: 'LIVE_DATA_SYNCHRONIZER',
        version: '1.0.0',
        cacheHit: false,
        processingTime: 0
      },
      timestamp: new Date()
    };
  }

  /**
   * Get pending sync events
   */
  getPendingEvents(): MCPResponse<SyncEvent[]> {
    const pendingEvents = this.syncQueue.filter(event => !event.processed);
    
    return {
      success: true,
      data: pendingEvents,
      metadata: {
        requestId: this.generateRequestId(),
        source: 'LIVE_DATA_SYNCHRONIZER',
        version: '1.0.0',
        cacheHit: false,
        processingTime: 0
      },
      timestamp: new Date()
    };
  }

  // Private methods

  private setupEventListeners(): void {
    // Listen to NEP policy updates
    this.nepConnector.subscribe('policy_updated', (data: any) => {
      this.addSyncEvent({
        type: 'UPDATE',
        source: 'NEP_POLICY',
        resourceType: 'POLICY',
        resourceId: data.policy.id,
        data: data.policy,
        priority: 'HIGH'
      });
    });

    // Listen to external system changes
    this.externalConnector.subscribe('sync_success', (data: any) => {
      // This would be triggered when external systems detect changes
      // Implementation depends on your external system setup
    });

    this.externalConnector.subscribe('sync_error', (data: any) => {
      console.error(`External system sync error: ${data.source}`, data.error);
    });
  }

  private async processEventsInParallel(events: SyncEvent[]): Promise<void> {
    const promises = events.map(event => this.processEvent(event));
    await Promise.allSettled(promises);
  }

  private async processEventsSequentially(events: SyncEvent[]): Promise<void> {
    for (const event of events) {
      await this.processEvent(event);
    }
  }

  private async processEvent(event: SyncEvent): Promise<void> {
    try {
      // Validate data
      const validationResult = await this.validateData(event.data, event.resourceType);
      if (!validationResult.isValid && this.config.dataValidation) {
        throw new Error(`Data validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      }

      // Update RAG vector store
      await this.updateRAGVectorStore(event);

      // Trigger timetable regeneration if needed
      await this.triggerTimetableRegeneration(event);

      // Mark as processed
      event.processed = true;
      this.syncStats.processedEvents++;

      this.emit('event_processed', { event, validationResult });

    } catch (error) {
      console.error(`Error processing event ${event.id}:`, error);
      
      event.retryCount++;
      event.error = {
        code: 'PROCESSING_FAILED',
        message: (error as Error).message,
        details: (error as Error).stack,
        retryable: event.retryCount < event.maxRetries,
        timestamp: new Date()
      };

      if (event.retryCount >= event.maxRetries) {
        event.processed = true;
        this.syncStats.failedEvents++;
        this.emit('event_failed', { event, error });
      } else {
        // Retry later
        setTimeout(() => {
          this.syncQueue.push(event);
        }, this.config.retryDelay);
      }
    }
  }

  private validateStudentData(data: any, errors: ValidationError[], warnings: ValidationWarning[], score: number): number {
    if (!data.studentId) {
      errors.push({ field: 'studentId', code: 'MISSING_FIELD', message: 'Student ID is required', severity: 'CRITICAL' });
      score -= 20;
    }
    if (!data.email) {
      errors.push({ field: 'email', code: 'MISSING_FIELD', message: 'Email is required', severity: 'CRITICAL' });
      score -= 20;
    }
    if (!data.departmentId) {
      warnings.push({ field: 'departmentId', code: 'MISSING_FIELD', message: 'Department ID is recommended', suggestion: 'Add department ID for better organization' });
      score -= 5;
    }
    return score;
  }

  private validateFacultyData(data: any, errors: ValidationError[], warnings: ValidationWarning[], score: number): number {
    if (!data.facultyId) {
      errors.push({ field: 'facultyId', code: 'MISSING_FIELD', message: 'Faculty ID is required', severity: 'CRITICAL' });
      score -= 20;
    }
    if (!data.email) {
      errors.push({ field: 'email', code: 'MISSING_FIELD', message: 'Email is required', severity: 'CRITICAL' });
      score -= 20;
    }
    if (!data.designation) {
      warnings.push({ field: 'designation', code: 'MISSING_FIELD', message: 'Designation is recommended', suggestion: 'Add designation for better faculty management' });
      score -= 5;
    }
    return score;
  }

  private validateRoomData(data: any, errors: ValidationError[], warnings: ValidationWarning[], score: number): number {
    if (!data.roomId) {
      errors.push({ field: 'roomId', code: 'MISSING_FIELD', message: 'Room ID is required', severity: 'CRITICAL' });
      score -= 20;
    }
    if (!data.capacity || data.capacity <= 0) {
      errors.push({ field: 'capacity', code: 'INVALID_VALUE', message: 'Capacity must be a positive number', severity: 'CRITICAL' });
      score -= 20;
    }
    if (!data.type) {
      warnings.push({ field: 'type', code: 'MISSING_FIELD', message: 'Room type is recommended', suggestion: 'Add room type for better categorization' });
      score -= 5;
    }
    return score;
  }

  private validateSubjectData(data: any, errors: ValidationError[], warnings: ValidationWarning[], score: number): number {
    if (!data.subjectId) {
      errors.push({ field: 'subjectId', code: 'MISSING_FIELD', message: 'Subject ID is required', severity: 'CRITICAL' });
      score -= 20;
    }
    if (!data.credits || data.credits <= 0) {
      errors.push({ field: 'credits', code: 'INVALID_VALUE', message: 'Credits must be a positive number', severity: 'CRITICAL' });
      score -= 20;
    }
    return score;
  }

  private validatePolicyData(data: any, errors: ValidationError[], warnings: ValidationWarning[], score: number): number {
    if (!data.id) {
      errors.push({ field: 'id', code: 'MISSING_FIELD', message: 'Policy ID is required', severity: 'CRITICAL' });
      score -= 20;
    }
    if (!data.version) {
      errors.push({ field: 'version', code: 'MISSING_FIELD', message: 'Policy version is required', severity: 'CRITICAL' });
      score -= 20;
    }
    return score;
  }

  private validateCalendarData(data: any, errors: ValidationError[], warnings: ValidationWarning[], score: number): number {
    if (!data.eventId) {
      errors.push({ field: 'eventId', code: 'MISSING_FIELD', message: 'Event ID is required', severity: 'CRITICAL' });
      score -= 20;
    }
    if (!data.startDate || !data.endDate) {
      errors.push({ field: 'dates', code: 'MISSING_FIELD', message: 'Start and end dates are required', severity: 'CRITICAL' });
      score -= 20;
    }
    return score;
  }

  private validateExaminationData(data: any, errors: ValidationError[], warnings: ValidationWarning[], score: number): number {
    if (!data.examId) {
      errors.push({ field: 'examId', code: 'MISSING_FIELD', message: 'Exam ID is required', severity: 'CRITICAL' });
      score -= 20;
    }
    if (!data.subjectId) {
      errors.push({ field: 'subjectId', code: 'MISSING_FIELD', message: 'Subject ID is required', severity: 'CRITICAL' });
      score -= 20;
    }
    return score;
  }

  private generateRecommendations(errors: ValidationError[], warnings: ValidationWarning[]): string[] {
    const recommendations: string[] = [];
    
    if (errors.length > 0) {
      recommendations.push('Fix critical validation errors before processing');
    }
    
    if (warnings.length > 0) {
      recommendations.push('Consider addressing validation warnings for better data quality');
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      recommendations.push('Data validation passed successfully');
    }
    
    return recommendations;
  }

  private shouldTriggerTimetableRegeneration(event: SyncEvent): boolean {
    // Define rules for when timetable regeneration should be triggered
    const criticalResourceTypes: ResourceType[] = ['STUDENT', 'FACULTY', 'ROOM', 'SUBJECT'];
    const criticalEventTypes: EventType[] = ['CREATE', 'UPDATE', 'DELETE'];
    
    return criticalResourceTypes.includes(event.resourceType) && 
           criticalEventTypes.includes(event.type) &&
           event.priority === 'HIGH';
  }

  private async simulateRAGUpdate(ragUpdate: any): Promise<void> {
    // Simulate RAG vector store update
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('RAG vector store updated:', ragUpdate.resourceType, ragUpdate.resourceId);
  }

  private async simulateTimetableRegeneration(event: SyncEvent): Promise<void> {
    // Simulate timetable regeneration
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Timetable regeneration triggered for:', event.resourceType, event.resourceId);
  }

  private async sendNotification(notification: any): Promise<void> {
    if (!this.config.webhookUrl) return;

    try {
      await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notification)
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  private updateSyncStats(processingTime: number): void {
    const totalProcessingTime = this.syncStats.averageProcessingTime * this.syncStats.processedEvents + processingTime;
    this.syncStats.averageProcessingTime = totalProcessingTime / (this.syncStats.processedEvents + 1);
    this.syncStats.lastSyncTime = new Date();
  }

  private validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.interval <= 0) {
      errors.push('Sync interval must be positive');
    }

    if (this.config.batchSize <= 0) {
      errors.push('Batch size must be positive');
    }

    if (this.config.retryAttempts < 0) {
      errors.push('Retry attempts cannot be negative');
    }

    if (this.config.maxConcurrentSyncs <= 0) {
      errors.push('Max concurrent syncs must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
        retryable: false,
        timestamp: new Date()
      },
      metadata: {
        requestId: this.generateRequestId(),
        source: 'LIVE_DATA_SYNCHRONIZER',
        version: '1.0.0',
        cacheHit: false,
        processingTime: 0
      },
      timestamp: new Date()
    };
  }

  // Public utility methods

  /**
   * Subscribe to synchronizer events
   */
  subscribe(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Unsubscribe from synchronizer events
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
   * Get current configuration
   */
  getConfiguration(): SyncConfiguration {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfiguration(newConfig: Partial<SyncConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
