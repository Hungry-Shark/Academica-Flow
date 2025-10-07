/**
 * Model Context Protocol (MCP) - Main Export File
 * Exports all MCP components for external system integration
 */

// Types and Interfaces
export * from './types';

// Connectors
export { NEPPolicyConnector } from './connectors/NEPPolicyConnector';
export { ExternalSystemConnector } from './connectors/ExternalSystemConnector';

// Server
export { MCPServer } from './server/MCPServer';

// Synchronization
export { LiveDataSynchronizer } from './sync/LiveDataSynchronizer';

// Utilities
export { MCPUtils } from './utils/MCPUtils';

// Default configuration
export const DEFAULT_MCP_CONFIG = {
  server: {
    port: 3001,
    host: 'localhost',
    maxConnections: 100,
    rateLimitPerMinute: 1000,
    cacheSize: 1000,
    cacheTTL: 300000, // 5 minutes
    enableAuditLog: true,
    enableMetrics: true,
    sslEnabled: false,
    corsOrigins: ['http://localhost:3000'],
    apiVersion: '1.0.0'
  },
  sync: {
    enabled: true,
    interval: 300000, // 5 minutes
    batchSize: 10,
    retryAttempts: 3,
    retryDelay: 5000,
    parallelSync: true,
    maxConcurrentSyncs: 5,
    dataValidation: true,
    conflictResolution: 'LAST_WINS',
    notificationEnabled: false
  },
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
    retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMITED', 'SERVER_ERROR']
  }
};

// Helper function to create MCP instance
export function createMCPInstance(config?: Partial<typeof DEFAULT_MCP_CONFIG>) {
  const mergedConfig = {
    server: { ...DEFAULT_MCP_CONFIG.server, ...config?.server },
    sync: { ...DEFAULT_MCP_CONFIG.sync, ...config?.sync },
    retry: { ...DEFAULT_MCP_CONFIG.retry, ...config?.retry }
  };

  return {
    config: mergedConfig,
    // Factory methods will be added here
  };
}
