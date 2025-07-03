import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { useSocketCore } from "./socket-core";
import { useAuth } from "./auth";

// Session Event Types
export enum SessionEventType {
  // Session Lifecycle
  SESSION_START = 0,
  SESSION_END = 1,
  PAGE_VIEW = 2,
  
  // Authentication Events
  AUTH_LOGIN_ATTEMPT = 10,
  AUTH_LOGIN_SUCCESS = 11,
  AUTH_LOGIN_FAILURE = 12,
  AUTH_LOGOUT = 13,
  AUTH_TOKEN_REFRESH = 14,
  AUTH_IMPERSONATION_START = 15,
  AUTH_IMPERSONATION_STOP = 16,
  
  // Audio Events
  AUDIO_SOURCE_CHANGE = 20,
  AUDIO_TRACK_START = 21,
  AUDIO_TRACK_END = 22,
  AUDIO_TRACK_SKIP = 23,
  AUDIO_VOLUME_CHANGE = 24,
  AUDIO_SEEK = 25,
  AUDIO_PAUSE = 26,
  AUDIO_RESUME = 27,
  
  // Creative Events
  SHADER_CHANGE = 30,
  VARIANT_TWEEN = 31,
  PROJECT_CREATE = 32,
  PROJECT_EDIT = 33,
  PROJECT_SHARE = 34,
  
  // User Interaction Events
  UI_CLICK = 40,
  UI_MODAL_OPEN = 41,
  UI_MODAL_CLOSE = 42,
  UI_SETTING_CHANGE = 43,
  UI_KEYBOARD_SHORTCUT = 44,
  
  // Performance Events
  COMPONENT_LOAD = 50,
  API_REQUEST = 51,
  API_RESPONSE = 52,
  ERROR_OCCURRED = 53,
  PERFORMANCE_METRIC = 54,
  
  // Collaboration Events
  SOCKET_CONNECT = 60,
  SOCKET_DISCONNECT = 61,
  REAL_TIME_MESSAGE = 62,
  ACTIVE_SPACE_JOIN = 63,
  ACTIVE_SPACE_LEAVE = 64,
}

// Core event structure
export interface SessionEvent {
  // Core identifiers
  timestamp: number;
  sessionId: string;
  userId: string | null; // walletAddress for authenticated users, null for anonymous
  anonymousId?: string; // For anonymous users
  
  // Event classification
  eventType: SessionEventType;
  eventCategory: string; // 'auth', 'audio', 'ui', 'performance', etc.
  
  // Event data
  eventData: Record<string, any>;
  
  // Context information
  context: {
    page: string;
    route: string;
    userAgent: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    clientPlatform: 'web' | 'electron' | 'mobile';
    viewport: { width: number; height: number };
    location?: { lat: number; lng: number };
    // Previous event type for sequence analysis
    previousEventType?: SessionEventType;
    // Time since session start
    sessionDuration: number;
  };
}

// Event priority levels for buffering strategy
export enum EventPriority {
  LOW = 0,     // Batch every 10 seconds
  MEDIUM = 1,  // Batch every 5 seconds
  HIGH = 2,    // Batch every 2 seconds
  CRITICAL = 3 // Send immediately
}

// Event buffer configuration
interface EventBuffer {
  events: SessionEvent[];
  lastFlush: number;
  flushInterval: number;
}

export const useSessionLogger = defineStore("sessionLogger", () => {
  const socket = useSocketCore();
  const auth = useAuth();
  
  // Session tracking
  const sessionId = ref<string>(generateSessionId());
  const sessionStartTime = ref<number>(Date.now());
  const isLoggingEnabled = ref<boolean>(true);
  const isVerboseLogging = ref<boolean>(false);
  
  // Event buffering by priority
  const eventBuffers = ref<Record<EventPriority, EventBuffer>>({
    [EventPriority.LOW]: { events: [], lastFlush: Date.now(), flushInterval: 10000 },
    [EventPriority.MEDIUM]: { events: [], lastFlush: Date.now(), flushInterval: 5000 },
    [EventPriority.HIGH]: { events: [], lastFlush: Date.now(), flushInterval: 2000 },
    [EventPriority.CRITICAL]: { events: [], lastFlush: Date.now(), flushInterval: 0 }
  });
  
  // Last event tracking for sequence analysis
  const lastEventType = ref<SessionEventType | null>(null);
  
  // Statistics
  const totalEventsLogged = ref<number>(0);
  const totalEventsSent = ref<number>(0);
  const totalEventsBuffered = computed(() => {
    return Object.values(eventBuffers.value).reduce((total, buffer) => total + buffer.events.length, 0);
  });
  
  // Flush intervals for each priority level
  const flushIntervals = ref<Record<EventPriority, number | null>>({
    [EventPriority.LOW]: null,
    [EventPriority.MEDIUM]: null,
    [EventPriority.HIGH]: null,
    [EventPriority.CRITICAL]: null
  });
  
  /**
   * Generate a unique session ID
   */
  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generate anonymous user ID for non-authenticated users
   */
  function generateAnonymousId(): string {
    const existing = localStorage.getItem('anonymousSessionId');
    if (existing) return existing;
    
    const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('anonymousSessionId', anonymousId);
    return anonymousId;
  }
  
  /**
   * Get current user identifier
   */
  function getCurrentUserId(): string | null {
    return auth.walletAddress || null;
  }
  
  /**
   * Get current context information
   */
  function getCurrentContext(): SessionEvent['context'] {
    const now = Date.now();
    return {
      page: window.location.pathname,
      route: window.location.pathname,
      userAgent: navigator.userAgent,
      deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) 
        ? (/iPad|tablet/.test(navigator.userAgent) ? "tablet" : "mobile")
        : "desktop",
      clientPlatform: "web", // Could be enhanced to detect electron
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      previousEventType: lastEventType.value || undefined,
      sessionDuration: now - sessionStartTime.value
    };
  }
  
  /**
   * Determine event priority based on type
   */
  function getEventPriority(eventType: SessionEventType): EventPriority {
    switch (eventType) {
      // Critical events - send immediately
      case SessionEventType.SESSION_START:
      case SessionEventType.SESSION_END:
      case SessionEventType.AUTH_LOGIN_SUCCESS:
      case SessionEventType.AUTH_LOGIN_FAILURE:
      case SessionEventType.ERROR_OCCURRED:
        return EventPriority.CRITICAL;
      
      // High priority - send within 2 seconds
      case SessionEventType.AUTH_LOGIN_ATTEMPT:
      case SessionEventType.AUTH_LOGOUT:
      case SessionEventType.AUDIO_TRACK_START:
      case SessionEventType.PAGE_VIEW:
      case SessionEventType.PROJECT_CREATE:
        return EventPriority.HIGH;
      
      // Medium priority - send within 5 seconds
      case SessionEventType.AUDIO_SOURCE_CHANGE:
      case SessionEventType.AUDIO_TRACK_END:
      case SessionEventType.SHADER_CHANGE:
      case SessionEventType.API_REQUEST:
      case SessionEventType.UI_MODAL_OPEN:
        return EventPriority.MEDIUM;
      
      // Low priority - batch and send every 10 seconds
      case SessionEventType.AUDIO_VOLUME_CHANGE:
      case SessionEventType.UI_CLICK:
      case SessionEventType.PERFORMANCE_METRIC:
      case SessionEventType.VARIANT_TWEEN:
        return EventPriority.LOW;
      
      default:
        return EventPriority.LOW;
    }
  }
  
  /**
   * Get event category from event type
   */
  function getEventCategory(eventType: SessionEventType): string {
    if (eventType >= 10 && eventType < 20) return 'auth';
    if (eventType >= 20 && eventType < 30) return 'audio';
    if (eventType >= 30 && eventType < 40) return 'creative';
    if (eventType >= 40 && eventType < 50) return 'ui';
    if (eventType >= 50 && eventType < 60) return 'performance';
    if (eventType >= 60 && eventType < 70) return 'collaboration';
    return 'session';
  }
  
  /**
   * Log a session event
   */
  function logEvent(
    eventType: SessionEventType,
    eventData: Record<string, any> = {},
    customContext?: Partial<SessionEvent['context']>
  ): void {
    if (!isLoggingEnabled.value) return;
    
    const event: SessionEvent = {
      timestamp: Date.now(),
      sessionId: sessionId.value,
      userId: getCurrentUserId(),
      anonymousId: getCurrentUserId() ? undefined : generateAnonymousId(),
      eventType,
      eventCategory: getEventCategory(eventType),
      eventData,
      context: {
        ...getCurrentContext(),
        ...customContext
      }
    };
    
    // Update last event type for sequence analysis
    lastEventType.value = eventType;
    totalEventsLogged.value++;
    
    if (isVerboseLogging.value) {
      console.log("📊 Session Event:", {
        type: SessionEventType[eventType],
        category: event.eventCategory,
        data: eventData,
        sessionDuration: `${(event.context.sessionDuration / 1000).toFixed(1)}s`
      });
    }
    
    // Add to appropriate buffer based on priority
    const priority = getEventPriority(eventType);
    eventBuffers.value[priority].events.push(event);
    
    // Immediately flush critical events
    if (priority === EventPriority.CRITICAL) {
      flushBuffer(priority);
    }
  }
  
  /**
   * Flush event buffer for a specific priority
   */
  async function flushBuffer(priority: EventPriority): Promise<void> {
    const buffer = eventBuffers.value[priority];
    if (buffer.events.length === 0) return;
    
    const eventsToSend = [...buffer.events];
    buffer.events = [];
    buffer.lastFlush = Date.now();
    
    try {
      await sendEvents(eventsToSend);
      totalEventsSent.value += eventsToSend.length;
      
      if (isVerboseLogging.value && eventsToSend.length > 1) {
        console.log(`📊 Flushed ${eventsToSend.length} events (priority: ${EventPriority[priority]})`);
      }
    } catch (error) {
      console.error("📊 Failed to send events:", error);
      // Re-add events to buffer to retry later
      buffer.events.unshift(...eventsToSend);
    }
  }
  
  /**
   * Send events to server
   */
  async function sendEvents(events: SessionEvent[]): Promise<void> {
    if (events.length === 0) return;
    
    // Try socket first, fall back to HTTP
    if (socket.connected) {
      socket.emit("session:log-events", { events });
    } else {
      // HTTP fallback
      const response = await fetch("/api/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(auth.authToken && { Authorization: `Bearer ${auth.authToken}` })
        },
        body: JSON.stringify({ events })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
  }
  
  /**
   * Start flush intervals for each priority level
   */
  function startFlushIntervals(): void {
    Object.entries(eventBuffers.value).forEach(([priorityStr, buffer]) => {
      const priority = parseInt(priorityStr) as EventPriority;
      
      if (priority === EventPriority.CRITICAL) return; // Critical events flush immediately
      
      if (flushIntervals.value[priority]) {
        clearInterval(flushIntervals.value[priority]!);
      }
      
      flushIntervals.value[priority] = window.setInterval(() => {
        if (buffer.events.length > 0) {
          flushBuffer(priority);
        }
      }, buffer.flushInterval);
    });
  }
  
  /**
   * Stop all flush intervals
   */
  function stopFlushIntervals(): void {
    Object.entries(flushIntervals.value).forEach(([priority, interval]) => {
      if (interval) {
        clearInterval(interval);
        flushIntervals.value[parseInt(priority) as EventPriority] = null;
      }
    });
  }
  
  /**
   * Flush all buffers immediately
   */
  async function flushAllBuffers(): Promise<void> {
    const promises = Object.keys(eventBuffers.value).map(priorityStr => {
      const priority = parseInt(priorityStr) as EventPriority;
      return flushBuffer(priority);
    });
    
    await Promise.all(promises);
  }
  
  /**
   * Start a new session
   */
  function startSession(): void {
    sessionId.value = generateSessionId();
    sessionStartTime.value = Date.now();
    lastEventType.value = null;
    
    logEvent(SessionEventType.SESSION_START, {
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      initialPage: window.location.pathname
    });
    
    startFlushIntervals();
    
    if (isVerboseLogging.value) {
      console.log("📊 Session started:", sessionId.value);
    }
  }
  
  /**
   * End the current session
   */
  async function endSession(): Promise<void> {
    logEvent(SessionEventType.SESSION_END, {
      duration: Date.now() - sessionStartTime.value,
      totalEvents: totalEventsLogged.value
    });
    
    // Flush all remaining events
    await flushAllBuffers();
    stopFlushIntervals();
    
    if (isVerboseLogging.value) {
      console.log("📊 Session ended:", sessionId.value);
    }
  }
  
  /**
   * Enable/disable logging
   */
  function setLoggingEnabled(enabled: boolean): void {
    isLoggingEnabled.value = enabled;
    
    if (enabled && !flushIntervals.value[EventPriority.LOW]) {
      startFlushIntervals();
    } else if (!enabled) {
      stopFlushIntervals();
    }
  }
  
  /**
   * Enable/disable verbose logging
   */
  function setVerboseLogging(enabled: boolean): void {
    isVerboseLogging.value = enabled;
  }
  
  /**
   * Get session statistics
   */
  const sessionStats = computed(() => ({
    sessionId: sessionId.value,
    duration: Date.now() - sessionStartTime.value,
    eventsLogged: totalEventsLogged.value,
    eventsSent: totalEventsSent.value,
    eventsBuffered: totalEventsBuffered.value,
    lastEventType: lastEventType.value ? SessionEventType[lastEventType.value] : null
  }));
  
  // Auto-start session on store initialization
  startSession();
  
  // Handle page unload
  onBeforeUnmount(async () => {
    await endSession();
  });
  
  // Handle browser close/refresh
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      // Use navigator.sendBeacon for reliable delivery during page unload
      if (navigator.sendBeacon && totalEventsBuffered.value > 0) {
        const allEvents: SessionEvent[] = [];
        Object.values(eventBuffers.value).forEach(buffer => {
          allEvents.push(...buffer.events);
        });
        
        if (allEvents.length > 0) {
          const data = JSON.stringify({ events: allEvents });
          navigator.sendBeacon('/api/session/log', data);
        }
      }
    });
  }
  
  return {
    // State
    sessionId: computed(() => sessionId.value),
    sessionStartTime: computed(() => sessionStartTime.value),
    isLoggingEnabled: computed(() => isLoggingEnabled.value),
    isVerboseLogging: computed(() => isVerboseLogging.value),
    sessionStats,
    
    // Core functions
    logEvent,
    
    // Session management
    startSession,
    endSession,
    
    // Configuration
    setLoggingEnabled,
    setVerboseLogging,
    
    // Buffer management
    flushAllBuffers,
    
    // Event types export for external use
    SessionEventType,
    EventPriority
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSessionLogger, import.meta.hot));
}