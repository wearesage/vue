/**
 * Performance Monitoring Composable
 * 
 * Tracks component load times, API response times, and other performance metrics
 * Integrates with the session logger for centralized analytics
 */

import { ref, onMounted, onUnmounted, readonly } from 'vue';
import { useSessionLogging } from './useSessionLogging';

const { logPerformance, logError } = useSessionLogging();

// Global performance tracking
const performanceObserver = ref<PerformanceObserver | null>(null);
const navigationTiming = ref<PerformanceNavigationTiming | null>(null);

export const usePerformanceMonitoring = () => {
  
  /**
   * Track component mount time
   */
  const trackComponentMount = (componentName: string) => {
    const startTime = performance.now();
    
    onMounted(() => {
      const mountTime = performance.now() - startTime;
      logPerformance(`component_mount_${componentName}`, mountTime, 'ms', {
        componentName,
        type: 'component_lifecycle'
      });
    });
  };

  /**
   * Track API request performance
   */
  const trackAPIRequest = async <T>(
    apiCall: () => Promise<T>,
    endpointName: string,
    method: string = 'GET'
  ): Promise<T> => {
    const startTime = performance.now();
    let success = false;
    let statusCode: number | undefined;
    let errorMessage: string | undefined;

    try {
      const result = await apiCall();
      success = true;
      statusCode = 200; // Assume success if no error
      
      const duration = performance.now() - startTime;
      logPerformance(`api_request_${endpointName}`, duration, 'ms', {
        endpoint: endpointName,
        method,
        success,
        statusCode,
        type: 'api_request'
      });
      
      return result;
    } catch (error: any) {
      success = false;
      statusCode = error.status || error.code || 500;
      errorMessage = error.message || 'Unknown error';
      
      const duration = performance.now() - startTime;
      
      // Log performance metric
      logPerformance(`api_request_${endpointName}`, duration, 'ms', {
        endpoint: endpointName,
        method,
        success,
        statusCode,
        error: errorMessage,
        type: 'api_request'
      });
      
      // Log error
      logError(error, `API request failed: ${method} ${endpointName}`, {
        endpoint: endpointName,
        method,
        statusCode,
        duration
      });
      
      throw error;
    }
  };

  /**
   * Track user interaction timing
   */
  const trackUserInteraction = (
    action: string,
    handler: () => void | Promise<void>
  ) => {
    return async () => {
      const startTime = performance.now();
      
      try {
        await handler();
        const duration = performance.now() - startTime;
        
        logPerformance(`user_interaction_${action}`, duration, 'ms', {
          action,
          type: 'user_interaction'
        });
      } catch (error: any) {
        const duration = performance.now() - startTime;
        
        logError(error, `User interaction failed: ${action}`, {
          action,
          duration,
          type: 'user_interaction'
        });
        
        throw error;
      }
    };
  };

  /**
   * Track page load performance
   */
  const trackPageLoad = (pageName: string) => {
    if (typeof window === 'undefined') return;
    
    onMounted(() => {
      // Wait for next tick to ensure DOM is fully rendered
      setTimeout(() => {
        if (performance.navigation && performance.timing) {
          const timing = performance.timing;
          
          const metrics = {
            // DNS lookup time
            dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
            // Connection time
            connectionTime: timing.connectEnd - timing.connectStart,
            // Request/response time
            requestTime: timing.responseEnd - timing.requestStart,
            // DOM parsing time
            domTime: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
            // Total load time
            loadTime: timing.loadEventEnd - timing.navigationStart,
            // Time to first byte
            ttfb: timing.responseStart - timing.navigationStart,
            // DOM ready time
            domReady: timing.domContentLoadedEventEnd - timing.navigationStart
          };
          
          // Log individual metrics
          Object.entries(metrics).forEach(([metric, value]) => {
            if (value > 0) {
              logPerformance(`page_load_${metric}`, value, 'ms', {
                page: pageName,
                metric,
                type: 'page_load'
              });
            }
          });
        }
        
        // Log modern navigation timing if available
        if (performance.getEntriesByType) {
          const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
          if (navEntries.length > 0) {
            const entry = navEntries[0];
            navigationTiming.value = entry;
            
            const modernMetrics = {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              firstPaint: 0, // Will be set by paint observer
              firstContentfulPaint: 0 // Will be set by paint observer
            };
            
            Object.entries(modernMetrics).forEach(([metric, value]) => {
              if (value > 0) {
                logPerformance(`modern_page_load_${metric}`, value, 'ms', {
                  page: pageName,
                  metric,
                  type: 'modern_page_load'
                });
              }
            });
          }
        }
      }, 100);
    });
  };

  /**
   * Track memory usage
   */
  const trackMemoryUsage = (context: string) => {
    if (typeof window === 'undefined' || !('memory' in performance)) return;
    
    const memory = (performance as any).memory;
    if (memory) {
      logPerformance('memory_usage', memory.usedJSHeapSize, 'bytes', {
        context,
        totalHeapSize: memory.totalJSHeapSize,
        heapLimit: memory.jsHeapSizeLimit,
        type: 'memory_usage'
      });
    }
  };

  /**
   * Setup global performance observers
   */
  const setupPerformanceObservers = () => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;
    
    try {
      // Observer for paint timing
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          logPerformance(`paint_${entry.name.replace(/-/g, '_')}`, entry.startTime, 'ms', {
            paintType: entry.name,
            type: 'paint_timing'
          });
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      
      // Observer for largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          logPerformance('largest_contentful_paint', entry.startTime, 'ms', {
            element: (entry as any).element?.tagName || 'unknown',
            size: (entry as any).size || 0,
            type: 'lcp'
          });
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Observer for cumulative layout shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        
        if (clsValue > 0) {
          logPerformance('cumulative_layout_shift', clsValue, 'score', {
            type: 'cls'
          });
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      
      performanceObserver.value = paintObserver; // Store reference for cleanup
      
    } catch (error) {
      console.warn('Performance observers not supported:', error);
    }
  };

  /**
   * Track long tasks (blocking the main thread)
   */
  const setupLongTaskObserver = () => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;
    
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          logPerformance('long_task', entry.duration, 'ms', {
            startTime: entry.startTime,
            type: 'long_task',
            blocking: true
          });
          
          // Also log as a potential issue
          if (entry.duration > 100) {
            logError(`Long task detected: ${entry.duration}ms`, 'performance', {
              duration: entry.duration,
              startTime: entry.startTime,
              type: 'long_task'
            });
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.warn('Long task observer not supported:', error);
    }
  };

  /**
   * Track error boundaries and unhandled errors
   */
  const setupErrorTracking = () => {
    if (typeof window === 'undefined') return;
    
    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      logError(event.reason || 'Unhandled promise rejection', 'unhandled_rejection', {
        type: 'unhandled_rejection',
        promise: event.promise
      });
    });
    
    // Track uncaught errors
    window.addEventListener('error', (event) => {
      logError(event.error || event.message, 'uncaught_error', {
        type: 'uncaught_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  };

  /**
   * Initialize all performance tracking
   */
  const initializePerformanceTracking = () => {
    setupPerformanceObservers();
    setupLongTaskObserver();
    setupErrorTracking();
  };

  /**
   * Cleanup observers
   */
  const cleanup = () => {
    if (performanceObserver.value) {
      performanceObserver.value.disconnect();
      performanceObserver.value = null;
    }
  };

  // Auto-cleanup on unmount
  onUnmounted(cleanup);

  return {
    trackComponentMount,
    trackAPIRequest,
    trackUserInteraction,
    trackPageLoad,
    trackMemoryUsage,
    initializePerformanceTracking,
    setupPerformanceObservers,
    setupErrorTracking,
    cleanup,
    navigationTiming: readonly(navigationTiming)
  };
};

// Global performance tracking initialization (without Vue lifecycle hooks)
export const initGlobalPerformanceTracking = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Initialize performance observers directly without Vue lifecycle
    setupGlobalPerformanceObservers();
    setupGlobalErrorTracking();
    console.log('⚡ Global performance tracking initialized');
  } catch (error) {
    console.warn('Performance tracking initialization failed:', error);
  }
};

// Global performance observers (without Vue lifecycle dependencies)
const setupGlobalPerformanceObservers = () => {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;
  
  try {
    // Observer for paint timing
    const paintObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        logPerformance(`paint_${entry.name.replace(/-/g, '_')}`, entry.startTime, 'ms', {
          paintType: entry.name,
          type: 'paint_timing'
        });
      });
    });
    paintObserver.observe({ entryTypes: ['paint'] });
    
    // Observer for largest contentful paint
    const lcpObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        logPerformance('largest_contentful_paint', entry.startTime, 'ms', {
          element: (entry as any).element?.tagName || 'unknown',
          size: (entry as any).size || 0,
          type: 'lcp'
        });
      });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // Observer for cumulative layout shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      list.getEntries().forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      
      if (clsValue > 0) {
        logPerformance('cumulative_layout_shift', clsValue, 'score', {
          type: 'cls'
        });
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    
    // Observer for long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        logPerformance('long_task', entry.duration, 'ms', {
          startTime: entry.startTime,
          type: 'long_task',
          blocking: true
        });
        
        if (entry.duration > 100) {
          logError(`Long task detected: ${entry.duration}ms`, 'performance', {
            duration: entry.duration,
            startTime: entry.startTime,
            type: 'long_task'
          });
        }
      });
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });
    
  } catch (error) {
    console.warn('Performance observers setup failed:', error);
  }
};

// Global error tracking (without Vue lifecycle dependencies)
const setupGlobalErrorTracking = () => {
  if (typeof window === 'undefined') return;
  
  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason || 'Unhandled promise rejection', 'unhandled_rejection', {
      type: 'unhandled_rejection',
      promise: event.promise
    });
  });
  
  // Track uncaught errors
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, 'uncaught_error', {
      type: 'uncaught_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
};

// Auto-start global tracking in browser environment
if (typeof window !== 'undefined') {
  // Start tracking after a short delay to ensure everything is loaded
  setTimeout(() => {
    initGlobalPerformanceTracking();
  }, 1000);
}