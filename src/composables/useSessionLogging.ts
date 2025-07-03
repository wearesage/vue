/**
 * Session Logging Helper Composable
 * 
 * Simple wrapper around the session logger for easy integration across stores
 */

import type { SessionEventType } from '../stores/session-logger';

let sessionLogger: any = null;

export const useSessionLogging = () => {
  /**
   * Lazy load session logger to avoid circular dependencies
   */
  const loadSessionLogger = async () => {
    if (!sessionLogger) {
      try {
        const { useSessionLogger } = await import('../stores/session-logger');
        sessionLogger = useSessionLogger();
      } catch (error) {
        console.warn('Session logger not available:', error);
        return null;
      }
    }
    return sessionLogger;
  };

  /**
   * Log an event with automatic error handling
   */
  const logEvent = async (
    eventType: SessionEventType | string,
    eventData: Record<string, any> = {},
    customContext?: any
  ) => {
    try {
      const logger = await loadSessionLogger();
      if (logger) {
        // Convert string to actual enum value if needed
        const actualEventType = typeof eventType === 'string' 
          ? logger.SessionEventType[eventType] 
          : eventType;
        logger.logEvent(actualEventType, eventData, customContext);
      }
    } catch (error) {
      console.warn('Failed to log session event:', error);
    }
  };

  /**
   * Log a UI interaction event
   */
  const logUIEvent = async (
    action: string,
    element?: string,
    data: Record<string, any> = {}
  ) => {
    const logger = await loadSessionLogger();
    if (logger) {
      logger.logEvent(logger.SessionEventType.UI_CLICK, {
        action,
        element,
        ...data
      });
    }
  };

  /**
   * Log a performance metric
   */
  const logPerformance = async (
    metric: string,
    value: number,
    unit: string = 'ms',
    data: Record<string, any> = {}
  ) => {
    const logger = await loadSessionLogger();
    if (logger) {
      logger.logEvent(logger.SessionEventType.PERFORMANCE_METRIC, {
        metric,
        value,
        unit,
        ...data
      });
    }
  };

  /**
   * Log an error event
   */
  const logError = async (
    error: Error | string,
    context?: string,
    data: Record<string, any> = {}
  ) => {
    const logger = await loadSessionLogger();
    if (logger) {
      logger.logEvent(logger.SessionEventType.ERROR_OCCURRED, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        context,
        ...data
      });
    }
  };

  /**
   * Get session statistics
   */
  const getSessionStats = async () => {
    const logger = await loadSessionLogger();
    return logger?.sessionStats || null;
  };

  /**
   * Control logging
   */
  const setLoggingEnabled = async (enabled: boolean) => {
    const logger = await loadSessionLogger();
    if (logger) {
      logger.setLoggingEnabled(enabled);
    }
  };

  const setVerboseLogging = async (enabled: boolean) => {
    const logger = await loadSessionLogger();
    if (logger) {
      logger.setVerboseLogging(enabled);
    }
  };

  return {
    logEvent,
    logUIEvent,
    logPerformance,
    logError,
    getSessionStats,
    setLoggingEnabled,
    setVerboseLogging,
    loadSessionLogger
  };
};

// Export session event types for convenience
export type { SessionEventType } from '../stores/session-logger';
export { SessionEventType } from '../stores/session-logger';