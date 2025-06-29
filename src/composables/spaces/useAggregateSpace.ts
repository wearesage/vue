import { ref, computed, onUnmounted } from "vue";
import { useSocketCore } from "../../stores/socket-core";

interface AggregateSpaceConfig {
  spaceId: string;
  updateIntervalMs?: number;
  autoJoin?: boolean;
}

interface LocationPoint {
  lat: number;
  lng: number;
  count: number;
  city?: string;
  country?: string;
}

interface AggregateData {
  totalUsers: number;
  locations: LocationPoint[];
  activities: Record<string, number>;
  metadata?: Record<string, any>;
  lastUpdated: number;
}

export function useAggregateSpace(config: AggregateSpaceConfig) {
  const socketCore = useSocketCore();
  
  // State
  const joined = ref(false);
  const aggregateData = ref<AggregateData>({
    totalUsers: 0,
    locations: [],
    activities: {},
    lastUpdated: 0
  });
  
  // Computed
  const totalUsers = computed(() => aggregateData.value.totalUsers);
  const locations = computed(() => aggregateData.value.locations);
  const activities = computed(() => aggregateData.value.activities);
  
  // Event handlers
  const setupEventHandlers = () => {
    const updateEvent = `aggregate-space:${config.spaceId}:update`;
    const joinedEvent = `aggregate-space:${config.spaceId}:joined`;
    const leftEvent = `aggregate-space:${config.spaceId}:left`;
    
    socketCore.on(updateEvent, (data: AggregateData) => {
      aggregateData.value = {
        ...data,
        lastUpdated: Date.now()
      };
      console.log(`📊 Aggregate update for ${config.spaceId}:`, data);
    });
    
    socketCore.on(joinedEvent, () => {
      joined.value = true;
      console.log(`✅ Joined aggregate space: ${config.spaceId}`);
    });
    
    socketCore.on(leftEvent, () => {
      joined.value = false;
      console.log(`👋 Left aggregate space: ${config.spaceId}`);
    });
  };
  
  // Actions
  const join = async (userData?: {
    location?: { lat: number; lng: number; city?: string; country?: string };
    activity?: string;
    metadata?: Record<string, any>;
  }) => {
    if (!socketCore.connected) {
      console.warn(`🚫 Cannot join ${config.spaceId} - socket not connected`);
      return false;
    }
    
    if (joined.value) {
      console.log(`🔄 Already joined ${config.spaceId}`);
      return true;
    }
    
    const joinData = {
      spaceId: config.spaceId,
      userData: {
        activity: 'idle',
        ...userData,
        deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
        joinedAt: Date.now()
      }
    };
    
    socketCore.emit('aggregate-space:join', joinData);
    console.log(`📍 Joining aggregate space: ${config.spaceId}`);
    return true;
  };
  
  const leave = () => {
    if (!socketCore.connected || !joined.value) return;
    
    socketCore.emit('aggregate-space:leave', { spaceId: config.spaceId });
    joined.value = false;
    console.log(`👋 Left aggregate space: ${config.spaceId}`);
  };
  
  const updateActivity = (data: {
    location?: { lat: number; lng: number; city?: string; country?: string };
    activity?: string;
    metadata?: Record<string, any>;
  }) => {
    if (!socketCore.connected || !joined.value) return;
    
    socketCore.emit('aggregate-space:update', {
      spaceId: config.spaceId,
      userData: {
        ...data,
        lastSeen: Date.now()
      }
    });
    
    console.log(`🔄 Updated activity in ${config.spaceId}:`, data);
  };
  
  const requestCurrentData = () => {
    if (!socketCore.connected) return;
    
    socketCore.emit('aggregate-space:get-data', { spaceId: config.spaceId });
  };
  
  // Initialize
  const initialize = async () => {
    try {
      await socketCore.waitForConnection();
      setupEventHandlers();
      
      if (config.autoJoin !== false) {
        await join();
      }
      
      // Request current data
      requestCurrentData();
      
    } catch (error) {
      console.error(`Failed to initialize aggregate space ${config.spaceId}:`, error);
    }
  };
  
  // Cleanup
  onUnmounted(() => {
    if (joined.value) {
      leave();
    }
  });
  
  return {
    // State
    joined: readonly(joined),
    aggregateData: readonly(aggregateData),
    
    // Computed
    totalUsers,
    locations,
    activities,
    
    // Actions
    initialize,
    join,
    leave,
    updateActivity,
    requestCurrentData
  };
}