import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, computed, readonly } from "vue";
import { io, Socket } from "socket.io-client";

// Import shared types to avoid duplication
type ActiveParticipant = {
  walletAddress: string;
  location?: {
    lat: number;
    lng: number;
    city?: string;
    country?: string;
  };
  currentActivity: "idle" | "coding" | "listening";
  activityDetails: {
    shaderId?: string;
    shaderName?: string;
    activeSketchId?: string;
    activeVariant?: number;
    source?: number; // AudioSource enum value
    trackId?: string;
    trackTitle?: string;
    artist?: string;
    channel?: string;
  };
  metadata: {
    username?: string;
    avatar?: string;
    deviceType?: "desktop" | "mobile" | "tablet";
  };
  joinedAt: number;
  lastSeen: number;
}

type ActiveSpaceEvent = {
  type: "user-joined" | "user-left" | "activity-changed" | "location-updated";
  walletAddress: string;
  participant?: ActiveParticipant;
  timestamp: number;
}

type SpaceStats = {
  totalParticipants: number;
  activitiesByType: Record<string, number>;
  locationsByCountry: Record<string, number>;
  recentEvents: ActiveSpaceEvent[];
}

export const useSocket = defineStore("socket", () => {
  // Socket connection
  const socket = ref<Socket | null>(null);
  const connected = ref(false);
  const connecting = ref(false);

  // Active space data
  const participants = ref<ActiveParticipant[]>([]);
  const spaceStats = ref<SpaceStats | null>(null);
  const joinedActiveSpace = ref(false);
  const currentUser = ref<ActiveParticipant | null>(null);

  // Computed
  const totalActiveUsers = computed(() => participants.value.length);
  const activitiesByType = computed(() => spaceStats.value?.activitiesByType || {});
  const locationsByCountry = computed(() => spaceStats.value?.locationsByCountry || {});

  // Connection management
  const connect = async (serverUrl = "http://localhost:2223") => {
    if (socket.value?.connected) {
      console.log("🔌 Already connected to socket server");
      return;
    }

    connecting.value = true;
    console.log(`🔌 Attempting to connect to socket server: ${serverUrl}`);

    try {
      socket.value = io(serverUrl, {
        transports: ["websocket", "polling"],
        autoConnect: true,
      });

      // Connection event handlers
      socket.value.on("connect", () => {
        connected.value = true;
        connecting.value = false;
        console.log("🔗 Connected to socket server:", socket.value?.id);
        console.log("🔌 Socket connected, server will send current state");
      });

      socket.value.on("disconnect", (reason) => {
        connected.value = false;
        joinedActiveSpace.value = false;
        console.log("🔌 Disconnected from socket server:", reason);
      });

      socket.value.on("connect_error", (error) => {
        connecting.value = false;
        console.error("🚫 Socket connection error:", error);
      });

      // Active space event handlers
      setupActiveSpaceListeners();
    } catch (error) {
      connecting.value = false;
      console.error("Failed to initialize socket connection:", error);
    }
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      connected.value = false;
      connecting.value = false;
      joinedActiveSpace.value = false;
      participants.value = [];
      spaceStats.value = null;
      currentUser.value = null;
    }
  };

  // Active space listeners
  const setupActiveSpaceListeners = () => {
    if (!socket.value) return;

    socket.value.on("active-space:user-joined", (event: ActiveSpaceEvent) => {
      console.log("👋 User joined:", event.walletAddress);
      if (event.participant) {
        const existing = participants.value.findIndex((p) => p.walletAddress === event.walletAddress);
        if (existing >= 0) {
          participants.value[existing] = event.participant;
        } else {
          participants.value.push(event.participant);
        }
      }
      refreshStats();
    });

    socket.value.on("active-space:user-left", (event: ActiveSpaceEvent) => {
      console.log("👋 User left:", event.walletAddress);
      participants.value = participants.value.filter((p) => p.walletAddress !== event.walletAddress);
      refreshStats();
    });

    socket.value.on("active-space:activity-changed", (event: ActiveSpaceEvent) => {
      console.log("🔄 User activity changed:", event.walletAddress);
      if (event.participant) {
        const existing = participants.value.findIndex((p) => p.walletAddress === event.walletAddress);
        if (existing >= 0) {
          participants.value[existing] = event.participant;
        }
      }
      refreshStats();
    });

    socket.value.on("active-space:participants", (data: ActiveParticipant[]) => {
      participants.value = data;
      console.log(`📊 Received ${data.length} active participants`);
    });

    socket.value.on("active-space:stats", (data: SpaceStats) => {
      spaceStats.value = data;
      console.log("📈 Received space stats:", data);
    });

    socket.value.on("active-space:error", (error) => {
      console.error("🚫 Active space error:", error);
    });
  };

  // Active space actions
  const joinActiveSpace = async (
    data: {
      location?: { lat: number; lng: number; city?: string; country?: string };
      currentActivity?: "idle" | "coding" | "listening";
      activityDetails?: ActiveParticipant["activityDetails"];
      metadata?: ActiveParticipant["metadata"];
    } = {}
  ) => {
    if (!socket.value?.connected) {
      console.warn("🚫 Cannot join active space - not connected to socket");
      return;
    }

    const joinData = {
      location: data.location,
      currentActivity: data.currentActivity || "idle",
      activityDetails: data.activityDetails || {},
      metadata: {
        deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? "mobile" : "desktop",
        ...data.metadata,
      },
    };

    socket.value.emit("active-space:join", joinData);
    joinedActiveSpace.value = true;
    console.log("📍 Joining active space with data:", joinData);
  };

  const leaveActiveSpace = () => {
    if (!socket.value?.connected) return;

    socket.value.emit("active-space:leave");
    joinedActiveSpace.value = false;
    currentUser.value = null;
    console.log("👋 Left active space");
  };

  const updateActivity = (data: {
    currentActivity?: "idle" | "coding" | "listening";
    activityDetails?: Partial<ActiveParticipant["activityDetails"]>;
    location?: { lat: number; lng: number; city?: string; country?: string };
  }) => {
    if (!socket.value?.connected || !joinedActiveSpace.value) return;

    socket.value.emit("active-space:update-activity", data);
    console.log("🔄 Updated activity:", data);
  };

  const sendHeartbeat = () => {
    if (!socket.value?.connected || !joinedActiveSpace.value) return;
    socket.value.emit("active-space:heartbeat");
  };

  const refreshStats = () => {
    if (!socket.value?.connected) return;
    socket.value.emit("active-space:get-stats");
  };

  const refreshParticipants = () => {
    if (!socket.value?.connected) return;
    socket.value.emit("active-space:get-participants");
  };

  // Auto-heartbeat (every 30 seconds)
  let heartbeatInterval: number | null = null;

  const startHeartbeat = () => {
    if (heartbeatInterval) return;
    heartbeatInterval = window.setInterval(() => {
      sendHeartbeat();
    }, 30000); // 30 seconds
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };

  return {
    // State
    socket: readonly(socket),
    connected: readonly(connected),
    connecting: readonly(connecting),
    participants: readonly(participants),
    spaceStats: readonly(spaceStats),
    joinedActiveSpace: readonly(joinedActiveSpace),
    currentUser: readonly(currentUser),

    // Computed
    totalActiveUsers,
    activitiesByType,
    locationsByCountry,

    // Actions
    connect,
    disconnect,
    joinActiveSpace,
    leaveActiveSpace,
    updateActivity,
    sendHeartbeat,
    refreshStats,
    refreshParticipants,
    startHeartbeat,
    stopHeartbeat,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSocket, import.meta.hot));
}
