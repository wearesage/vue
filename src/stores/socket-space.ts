import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, computed, readonly, onBeforeUnmount } from "vue";
import { useSocketCore } from "./socket-core";
import { useToast } from "./toast";
import { api } from "../api/client";
import { EventEmitter } from "events";
import { 
  SocketEvents, 
  SocketEventCategories,
  ProjectSocketEvent, 
  TaskSocketEvent, 
  BucketSocketEvent,
  SocketEvent,
  BaseSocketEvent
} from "@wearesage/shared";

/**
 * 🚀 UNIFIED SOCKET SPACE STORE
 * 
 * Single source of truth for ALL space: events
 * Replaces the "insane" competing stores (socket-project, socket-messaging, etc.)
 * 
 * Architecture:
 * - Listens to ALL space: events from socket
 * - Emits to entity-specific event emitters
 * - Entity stores subscribe to what they need
 * - NO competing listeners, NO prefix jumping
 */

interface SpaceParticipant {
  walletAddress: string;
  joinedAt: number;
  lastSeen: number;
}

interface SpaceCursor {
  walletAddress: string;
  x: number;
  y: number;
  timestamp: number;
}

interface SpaceDrag {
  walletAddress: string;
  taskId: string;
  timestamp: number;
}

export const useSocketSpace = defineStore("socket-space", () => {
  const socketCore = useSocketCore();
  const toast = useToast();

  // Central event emitter for all space events
  const spaceEventEmitter = new EventEmitter();

  // Space state management
  const joinedSpaces = ref<Set<string>>(new Set());
  const spaceParticipants = ref<Map<string, SpaceParticipant[]>>(new Map());
  const spaceCursors = ref<Map<string, Map<string, SpaceCursor>>>(new Map());
  const spaceDrags = ref<Map<string, Map<string, SpaceDrag>>>(new Map());

  // Computed getters
  const getSpaceParticipants = computed(() => (spaceId: string) => {
    return spaceParticipants.value.get(spaceId) || [];
  });

  const getSpaceCursors = computed(() => (spaceId: string) => {
    const cursors = spaceCursors.value.get(spaceId);
    return cursors ? Array.from(cursors.values()) : [];
  });

  const getSpaceDrags = computed(() => (spaceId: string) => {
    const drags = spaceDrags.value.get(spaceId);
    return drags ? Array.from(drags.values()) : [];
  });

  const isTaskBeingDragged = computed(() => (spaceId: string, taskId: string) => {
    const drags = spaceDrags.value.get(spaceId);
    if (!drags) return false;
    
    for (const drag of drags.values()) {
      if (drag.taskId === taskId) return true;
    }
    return false;
  });

  // Flag to ensure listeners are only set up once
  let spaceListenersSetup = false;

  // 🎯 UNIFIED SPACE EVENT LISTENERS
  const setupSpaceListeners = () => {
    console.log("🚀 SOCKET-SPACE: Setting up unified space listeners...");
    
    if (spaceListenersSetup) {
      console.log("🚀 SOCKET-SPACE: Listeners already set up, skipping...");
      return;
    }
    
    if (!socketCore.socket) {
      console.warn("🚫 Cannot setup space listeners - socket not connected");
      return;
    }
    
    console.log("🚀 SOCKET-SPACE: Socket exists, setting up unified listeners...");
    spaceListenersSetup = true;

    // ===== SPACE MANAGEMENT EVENTS =====
    
    socketCore.on(SocketEvents.SPACE_JOINED, (data: BaseSocketEvent & { spaceId: string; userWalletAddress: string }) => {
      console.log(`🎯 User joined space ${data.spaceId}:`, data.userWalletAddress);
      
      if (!spaceParticipants.value.has(data.spaceId)) {
        spaceParticipants.value.set(data.spaceId, []);
      }
      
      const participants = spaceParticipants.value.get(data.spaceId)!;
      const existing = participants.findIndex(p => p.walletAddress === data.userWalletAddress);
      
      if (existing >= 0) {
        participants[existing].lastSeen = data.timestamp;
      } else {
        participants.push({
          walletAddress: data.userWalletAddress,
          joinedAt: data.timestamp,
          lastSeen: data.timestamp,
        });
      }

      spaceEventEmitter.emit("space-user-joined", data);
    });

    socketCore.on(SocketEvents.SPACE_LEFT, (data: BaseSocketEvent & { spaceId: string; userWalletAddress: string }) => {
      console.log(`👋 User left space ${data.spaceId}:`, data.userWalletAddress);
      
      // Remove from participants
      const participants = spaceParticipants.value.get(data.spaceId);
      if (participants) {
        const filtered = participants.filter(p => p.walletAddress !== data.userWalletAddress);
        spaceParticipants.value.set(data.spaceId, filtered);
      }
      
      // Remove cursor and drag state
      const cursors = spaceCursors.value.get(data.spaceId);
      if (cursors) {
        cursors.delete(data.userWalletAddress);
      }
      
      const drags = spaceDrags.value.get(data.spaceId);
      if (drags) {
        drags.delete(data.userWalletAddress);
      }

      spaceEventEmitter.emit("space-user-left", data);
    });

    // ===== REAL-TIME ACTIVITY EVENTS =====
    
    socketCore.on(SocketEvents.SPACE_CURSOR_MOVE, (data: BaseSocketEvent & { spaceId: string; x: number; y: number }) => {
      if (!spaceCursors.value.has(data.spaceId)) {
        spaceCursors.value.set(data.spaceId, new Map());
      }
      
      const cursors = spaceCursors.value.get(data.spaceId)!;
      cursors.set(data.walletAddress, {
        walletAddress: data.walletAddress,
        x: data.x,
        y: data.y,
        timestamp: data.timestamp,
      });

      spaceEventEmitter.emit("space-cursor-move", data);
    });

    socketCore.on(SocketEvents.SPACE_DRAG_START, (data: BaseSocketEvent & { spaceId: string; taskId: string }) => {
      console.log(`🏗️ Drag started by ${data.walletAddress}:`, data.taskId);
      
      if (!spaceDrags.value.has(data.spaceId)) {
        spaceDrags.value.set(data.spaceId, new Map());
      }
      
      const drags = spaceDrags.value.get(data.spaceId)!;
      drags.set(data.walletAddress, {
        walletAddress: data.walletAddress,
        taskId: data.taskId,
        timestamp: data.timestamp,
      });

      spaceEventEmitter.emit("space-drag-start", data);
    });

    socketCore.on(SocketEvents.SPACE_DRAG_END, (data: BaseSocketEvent & { spaceId: string; taskId: string }) => {
      console.log(`🎯 Drag ended by ${data.walletAddress}:`, data.taskId);
      
      const drags = spaceDrags.value.get(data.spaceId);
      if (drags) {
        drags.delete(data.walletAddress);
      }

      spaceEventEmitter.emit("space-drag-end", data);
    });

    // ===== PROJECT CRUD EVENTS =====
    
    socketCore.on(SocketEvents.SPACE_PROJECT_CREATE, (event: ProjectSocketEvent) => {
      console.log(`✨ SPACE: Project created by ${event.walletAddress}:`, event.context.entityId);
      spaceEventEmitter.emit("project-created", event);
    });

    socketCore.on(SocketEvents.SPACE_PROJECT_UPDATE, (event: ProjectSocketEvent) => {
      console.log(`📝 SPACE: Project updated by ${event.walletAddress}:`, event.context.entityId);
      spaceEventEmitter.emit("project-updated", event);
    });

    socketCore.on(SocketEvents.SPACE_PROJECT_DELETE, (event: ProjectSocketEvent) => {
      console.log(`🗑️ SPACE: Project deleted by ${event.walletAddress}:`, event.context.entityId);
      spaceEventEmitter.emit("project-deleted", event);
    });

    // ===== BUCKET CRUD EVENTS =====
    
    socketCore.on(SocketEvents.SPACE_BUCKET_CREATE, (event: BucketSocketEvent) => {
      console.log(`📦 SPACE: Bucket created by ${event.walletAddress}:`, event.context.entityId);
      spaceEventEmitter.emit("bucket-created", event);
    });

    socketCore.on(SocketEvents.SPACE_BUCKET_UPDATE, (event: BucketSocketEvent) => {
      console.log(`📦 SPACE: Bucket updated by ${event.walletAddress}:`, event.context.entityId);
      spaceEventEmitter.emit("bucket-updated", event);
    });

    socketCore.on(SocketEvents.SPACE_BUCKET_DELETE, (event: BucketSocketEvent) => {
      console.log(`🗑️ SPACE: Bucket deleted by ${event.walletAddress}:`, event.context.entityId);
      spaceEventEmitter.emit("bucket-deleted", event);
    });

    // ===== TASK CRUD EVENTS =====
    
    socketCore.on(SocketEvents.SPACE_TASK_CREATE, (event: TaskSocketEvent) => {
      console.log(`🎯 SPACE: Task created by ${event.walletAddress}:`, event.context.entityId);
      spaceEventEmitter.emit("task-created", event);
    });

    socketCore.on(SocketEvents.SPACE_TASK_UPDATE, (event: TaskSocketEvent) => {
      console.log(`📝 SPACE: Task updated by ${event.walletAddress}:`, event.context.entityId);
      spaceEventEmitter.emit("task-updated", event);
    });

    socketCore.on(SocketEvents.SPACE_TASK_MOVE, (event: TaskSocketEvent) => {
      console.log(`🔄 SPACE: Task moved by ${event.walletAddress}:`, event.context.entityId);
      spaceEventEmitter.emit("task-moved", event);
    });

    socketCore.on(SocketEvents.SPACE_TASK_DELETE, (event: TaskSocketEvent) => {
      console.log(`🗑️ SPACE: Task deleted by ${event.walletAddress}:`, event.context.entityId);
      spaceEventEmitter.emit("task-deleted", event);
    });

    // ===== MESSAGE EVENTS =====
    
    socketCore.on(SocketEvents.SPACE_MESSAGE_SEND, (event: SocketEvent) => {
      console.log(`💬 SPACE: Message sent by ${event.walletAddress}`);
      spaceEventEmitter.emit("message-sent", event);
    });

    socketCore.on(SocketEvents.SPACE_MESSAGE_UPDATE, (event: SocketEvent) => {
      console.log(`✏️ SPACE: Message updated by ${event.walletAddress}`);
      spaceEventEmitter.emit("message-updated", event);
    });

    socketCore.on(SocketEvents.SPACE_MESSAGE_DELETE, (event: SocketEvent) => {
      console.log(`🗑️ SPACE: Message deleted by ${event.walletAddress}`);
      spaceEventEmitter.emit("message-deleted", event);
    });

    // ===== NOTIFICATION EVENTS =====
    
    socketCore.on(SocketEvents.SPACE_NOTIFICATION_CREATE, (event: SocketEvent) => {
      console.log(`🔔 SPACE: Notification created for ${event.walletAddress}`);
      spaceEventEmitter.emit("notification-created", event);
    });

    console.log("🚀 SOCKET-SPACE: Unified space listeners setup complete!");
    
    // Setup toast notifications
    setupToastNotifications();
  };

  // 🍞 UNIFIED TOAST NOTIFICATIONS
  const setupToastNotifications = () => {
    console.log("🍞 SPACE: Setting up unified toast notifications...");

    const getShortWallet = (walletAddress: string) => {
      return walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Unknown';
    };

    // Project toasts
    spaceEventEmitter.on("project-created", (event: ProjectSocketEvent) => {
      toast.message(`✨ ${getShortWallet(event.walletAddress)} created project "${event.payload.data?.name}"`);
    });

    spaceEventEmitter.on("project-updated", (event: ProjectSocketEvent) => {
      const updates = event.payload.changes ? Object.keys(event.payload.changes).join(', ') : 'unknown';
      toast.message(`📝 ${getShortWallet(event.walletAddress)} updated project "${event.payload.data?.name}" (${updates})`);
    });

    spaceEventEmitter.on("project-deleted", (event: ProjectSocketEvent) => {
      toast.message(`🗑️ ${getShortWallet(event.walletAddress)} deleted a project`);
    });

    // Bucket toasts
    spaceEventEmitter.on("bucket-created", (event: BucketSocketEvent) => {
      toast.message(`📦 ${getShortWallet(event.walletAddress)} created bucket "${event.payload.data?.name}"`);
    });

    spaceEventEmitter.on("bucket-updated", (event: BucketSocketEvent) => {
      toast.message(`📦 ${getShortWallet(event.walletAddress)} updated bucket "${event.payload.data?.name}"`);
    });

    spaceEventEmitter.on("bucket-deleted", (event: BucketSocketEvent) => {
      toast.message(`🗑️ ${getShortWallet(event.walletAddress)} deleted a bucket`);
    });

    // Task toasts - THE MOST IMPORTANT! 🎯
    spaceEventEmitter.on("task-created", (event: TaskSocketEvent) => {
      console.log('🍞 UNIFIED TOAST: Task created event!', event);
      const message = `🎯 ${getShortWallet(event.walletAddress)} created task "${event.payload.data?.title}"`;
      console.log('🍞 UNIFIED TOAST: Showing message:', message);
      toast.message(message);
    });

    spaceEventEmitter.on("task-updated", (event: TaskSocketEvent) => {
      const updates = event.payload.changes ? Object.keys(event.payload.changes).join(', ') : 'unknown';
      toast.message(`📝 ${getShortWallet(event.walletAddress)} updated "${event.payload.data?.title}" (${updates})`);
    });

    spaceEventEmitter.on("task-moved", (event: TaskSocketEvent) => {
      toast.message(`🔄 ${getShortWallet(event.walletAddress)} moved "${event.payload.data?.title}" to new bucket`);
    });

    spaceEventEmitter.on("task-deleted", (event: TaskSocketEvent) => {
      console.log('🍞 UNIFIED TOAST: Task deleted event!', event);
      toast.message(`🗑️ ${getShortWallet(event.walletAddress)} deleted a task`);
    });

    console.log("🍞 SPACE: Unified toast notifications enabled!");
  };

  // ===== SPACE ACTIONS =====

  const joinSpace = async (spaceId: string) => {
    if (!socketCore.connected) {
      console.warn("🚫 Cannot join space - socket not connected");
      return false;
    }

    if (joinedSpaces.value.has(spaceId)) {
      console.log(`🎯 Already joined space: ${spaceId}`);
      return true;
    }

    try {
      socketCore.emit(SocketEvents.SPACE_JOINED, { spaceId });
      joinedSpaces.value.add(spaceId);

      // Initialize space data structures
      if (!spaceCursors.value.has(spaceId)) {
        spaceCursors.value.set(spaceId, new Map());
      }
      if (!spaceParticipants.value.has(spaceId)) {
        spaceParticipants.value.set(spaceId, []);
      }
      if (!spaceDrags.value.has(spaceId)) {
        spaceDrags.value.set(spaceId, new Map());
      }

      console.log(`🎯 Joined space: ${spaceId}`);
      return true;
    } catch (error) {
      console.error("Error joining space:", error);
      return false;
    }
  };

  const leaveSpace = async (spaceId: string) => {
    if (!socketCore.connected) return;

    try {
      socketCore.emit(SocketEvents.SPACE_LEFT, { spaceId });
      joinedSpaces.value.delete(spaceId);

      // Clean up space data
      spaceCursors.value.delete(spaceId);
      spaceParticipants.value.delete(spaceId);
      spaceDrags.value.delete(spaceId);

      console.log(`👋 Left space: ${spaceId}`);
    } catch (error) {
      console.error("Error leaving space:", error);
    }
  };

  // Auto-join user projects (all projects are spaces!)
  const autoJoinUserProjects = async () => {
    if (!socketCore.connected) {
      console.warn("🚫 Cannot auto-join projects - socket not connected");
      return;
    }

    try {
      console.log("🎯 SPACE: Auto-joining user projects...");
      
      const response = await api.get('/api/projects');
      const projectsData = response.data?.projects;
      
      if (!projectsData) {
        console.warn('⚠️ No projects data in response');
        return;
      }
      
      const ownedProjects = Array.isArray(projectsData.owned) ? projectsData.owned : [];
      const collaboratedProjects = Array.isArray(projectsData.collaborated) ? projectsData.collaborated : [];
      const userProjects = [...ownedProjects, ...collaboratedProjects];
      
      console.log(`📋 SPACE: Found ${userProjects.length} total projects to join as spaces`);
      
      for (const project of userProjects) {
        await joinSpace(`project:${project.id}`);
        console.log(`✅ SPACE: Auto-joined project space: ${project.name} (project:${project.id})`);
        
        // Small delay to prevent overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      
      console.log(`🎉 SPACE: Successfully auto-joined ${userProjects.length} project spaces with unified toasts!`);
      
    } catch (error) {
      console.error("❌ Failed to auto-join user projects:", error);
      toast.error("Failed to connect to project updates");
    }
  };

  // Cleanup
  const removeAllSpaceListeners = () => {
    if (!socketCore.socket) return;

    // Remove all space event listeners using organized categories
    for (const category of Object.values(SocketEventCategories)) {
      for (const event of category) {
        if (event.startsWith('space:')) {
          socketCore.off(event);
        }
      }
    }
    
    console.log("🧹 SPACE: Removed all unified space event listeners");
  };

  const leaveAllSpaces = async () => {
    if (!socketCore.connected) return;

    const spaceIds = Array.from(joinedSpaces.value);
    console.log(`🚪 SPACE: Leaving ${spaceIds.length} spaces`);

    for (const spaceId of spaceIds) {
      await leaveSpace(spaceId);
    }

    // Clean up local state
    joinedSpaces.value.clear();
    spaceCursors.value.clear();
    spaceParticipants.value.clear();
    spaceDrags.value.clear();
  };

  // Collaborative features
  const sendCursorMove = (spaceId: string, x: number, y: number) => {
    if (!socketCore.connected || !joinedSpaces.value.has(spaceId)) {
      return;
    }

    socketCore.emit(SocketEvents.SPACE_CURSOR_MOVE, {
      spaceId,
      x,
      y,
      timestamp: Date.now()
    });
  };

  // Compatibility methods for migration from old socket stores
  const startCleanup = () => {
    // TODO: Implement periodic cleanup if needed
    console.log("🧹 SPACE: Starting cleanup routines");
  };

  const stopCleanup = () => {
    // TODO: Stop periodic cleanup if needed  
    console.log("🧹 SPACE: Stopping cleanup routines");
  };

  onBeforeUnmount(async () => {
    console.log("🧹 SPACE: Store unmounting - cleaning up");
    await leaveAllSpaces();
    removeAllSpaceListeners();
  });

  return {
    // State (readonly)
    joinedSpaces: readonly(joinedSpaces),
    spaceParticipants: readonly(spaceParticipants),
    spaceCursors: readonly(spaceCursors),
    spaceDrags: readonly(spaceDrags),

    // Computed
    getSpaceParticipants,
    getSpaceCursors,
    getSpaceDrags,
    isTaskBeingDragged,

    // Actions
    setupSpaceListeners,
    joinSpace,
    leaveSpace,
    autoJoinUserProjects,

    // Collaborative features
    sendCursorMove,
    startCleanup,
    stopCleanup,

    // Event emitter for entity stores to subscribe
    on: spaceEventEmitter.on.bind(spaceEventEmitter),
    off: spaceEventEmitter.off.bind(spaceEventEmitter),
    emit: spaceEventEmitter.emit.bind(spaceEventEmitter),
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSocketSpace, import.meta.hot));
}