import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, computed, readonly, onBeforeUnmount } from "vue";
import { useSocketCore } from "./socket-core";
import { EventEmitter } from "events";

interface ProjectCursor {
  walletAddress: string;
  x: number;
  y: number;
  timestamp: number;
}

interface ProjectDrag {
  walletAddress: string;
  taskId: string;
  timestamp: number;
}

interface ProjectParticipant {
  walletAddress: string;
  joinedAt: number;
  lastSeen: number;
}

export const useSocketProject = defineStore("socket-project", () => {
  const socketCore = useSocketCore();

  // Event emitter for project events
  const eventEmitter = new EventEmitter();

  // State
  const joinedProjects = ref<Set<string>>(new Set());
  const cursors = ref<Map<string, Map<string, ProjectCursor>>>(new Map()); // projectId -> walletAddress -> cursor
  const participants = ref<Map<string, ProjectParticipant[]>>(new Map()); // projectId -> participants
  const activeDrags = ref<Map<string, Map<string, ProjectDrag>>>(new Map()); // projectId -> walletAddress -> drag

  // Computed
  const getProjectCursors = computed(() => (projectId: string) => {
    const projectCursors = cursors.value.get(projectId);
    return projectCursors ? Array.from(projectCursors.values()) : [];
  });

  const getProjectParticipants = computed(() => (projectId: string) => {
    return participants.value.get(projectId) || [];
  });

  const getProjectDrags = computed(() => (projectId: string) => {
    const projectDrags = activeDrags.value.get(projectId);
    return projectDrags ? Array.from(projectDrags.values()) : [];
  });

  const isTaskBeingDragged = computed(() => (projectId: string, taskId: string) => {
    const projectDrags = activeDrags.value.get(projectId);
    if (!projectDrags) return false;

    for (const drag of projectDrags.values()) {
      if (drag.taskId === taskId) return true;
    }
    return false;
  });

  // Setup event listeners
  const setupProjectListeners = () => {
    console.log("🔍 SOCKET-PROJECT: setupProjectListeners called");
    if (!socketCore.socket) {
      console.warn("🚫 Cannot setup project listeners - socket not connected");
      return;
    }
    console.log("🔍 SOCKET-PROJECT: Socket exists, setting up listeners...");

    // User joined project
    socketCore.on("project-space:user-joined", (data: { projectId: string; walletAddress: string; timestamp: number }) => {
      console.log(`👋 User joined project ${data.projectId}:`, data.walletAddress);

      if (!participants.value.has(data.projectId)) {
        participants.value.set(data.projectId, []);
      }

      const projectParticipants = participants.value.get(data.projectId)!;
      const existing = projectParticipants.findIndex((p) => p.walletAddress === data.walletAddress);

      if (existing >= 0) {
        projectParticipants[existing].lastSeen = data.timestamp;
      } else {
        projectParticipants.push({
          walletAddress: data.walletAddress,
          joinedAt: data.timestamp,
          lastSeen: data.timestamp,
        });
      }
    });

    // User left project
    socketCore.on("project-space:user-left", (data: { projectId: string; walletAddress: string; timestamp: number }) => {
      console.log(`👋 User left project ${data.projectId}:`, data.walletAddress);

      // Remove from participants
      const projectParticipants = participants.value.get(data.projectId);
      if (projectParticipants) {
        const filtered = projectParticipants.filter((p) => p.walletAddress !== data.walletAddress);
        participants.value.set(data.projectId, filtered);
      }

      // Remove cursor
      const projectCursors = cursors.value.get(data.projectId);
      if (projectCursors) {
        projectCursors.delete(data.walletAddress);
      }

      // Remove any active drag
      const projectDrags = activeDrags.value.get(data.projectId);
      if (projectDrags) {
        projectDrags.delete(data.walletAddress);
      }
    });

    // Cursor move
    socketCore.on(
      "project-space:cursor-move",
      (data: { projectId: string; walletAddress: string; x: number; y: number; timestamp: number }) => {
        if (!cursors.value.has(data.projectId)) {
          cursors.value.set(data.projectId, new Map());
        }

        const projectCursors = cursors.value.get(data.projectId)!;
        projectCursors.set(data.walletAddress, {
          walletAddress: data.walletAddress,
          x: data.x,
          y: data.y,
          timestamp: data.timestamp,
        });
      }
    );

    // Bucket CRUD events
    socketCore.on(
      "project-space:bucket-created",
      (data: {
        projectId: string;
        walletAddress: string;
        bucket: any;
        timestamp: number;
      }) => {
        console.log(`🔍 SOCKET-PROJECT: Bucket created event received:`, data.bucket.id, data.bucket.name);
        console.log(`🔍 SOCKET-PROJECT: Re-emitting bucket-created to event listeners...`);
        eventEmitter.emit("bucket-created", data);
        console.log(`🔍 SOCKET-PROJECT: Bucket event re-emitted`);
      }
    );

    socketCore.on(
      "project-space:bucket-updated",
      (data: {
        projectId: string;
        walletAddress: string;
        bucketId: string;
        updates: any;
        bucket: any;
        timestamp: number;
      }) => {
        console.log(`🪣 Bucket updated by ${data.walletAddress}:`, data.bucketId, data.updates);
        eventEmitter.emit("bucket-updated", data);
      }
    );

    socketCore.on(
      "project-space:bucket-deleted",
      (data: {
        projectId: string;
        walletAddress: string;
        bucketId: string;
        timestamp: number;
      }) => {
        console.log(`🗑️ Bucket deleted by ${data.walletAddress}:`, data.bucketId);
        eventEmitter.emit("bucket-deleted", data);
      }
    );

    // Task CRUD events (fixed event names to match backend)
    socketCore.on(
      "project-space:task-created",
      (data: {
        projectId: string;
        walletAddress: string;
        bucketId: string;
        task: any;
        timestamp: number;
      }) => {
        console.log(`🔍 SOCKET-PROJECT: Task created event received:`, data.task.id, data.task.title);
        console.log(`🔍 SOCKET-PROJECT: Re-emitting to event listeners...`);
        eventEmitter.emit("task-created", data);
        console.log(`🔍 SOCKET-PROJECT: Event re-emitted, listeners should be called now`);
      }
    );

    socketCore.on(
      "project-space:task-updated",
      (data: {
        projectId: string;
        walletAddress: string;
        taskId: string;
        updates: any;
        task: any;
        timestamp: number;
      }) => {
        console.log(`📝 Task updated by ${data.walletAddress}:`, data.taskId, data.updates);
        eventEmitter.emit("task-updated", data);
      }
    );

    socketCore.on(
      "project-space:task-moved",
      (data: {
        projectId: string;
        walletAddress: string;
        taskId: string;
        targetBucketId: string;
        position?: number;
        task: any;
        timestamp: number;
      }) => {
        console.log(`🔄 Task moved by ${data.walletAddress}:`, data.taskId, "to", data.targetBucketId);
        eventEmitter.emit("task-moved", data);
      }
    );

    socketCore.on(
      "project-space:task-deleted",
      (data: {
        projectId: string;
        walletAddress: string;
        taskId: string;
        timestamp: number;
      }) => {
        console.log(`🗑️ Task deleted by ${data.walletAddress}:`, data.taskId);
        eventEmitter.emit("task-deleted", data);
      }
    );

    // Legacy task events (for backward compatibility with UI-driven updates)
    socketCore.on(
      "project-space:task-update",
      (data: { projectId: string; walletAddress: string; taskId: string; field: string; value: any; timestamp: number }) => {
        console.log(`📝 Task field update from ${data.walletAddress}:`, data.taskId, data.field, data.value);
        eventEmitter.emit("task-field-updated", data);
      }
    );

    socketCore.on(
      "project-space:task-move",
      (data: {
        projectId: string;
        walletAddress: string;
        taskId: string;
        fromBucketId: string;
        toBucketId: string;
        position: number;
        timestamp: number;
      }) => {
        console.log(`🔄 Task drag moved by ${data.walletAddress}:`, data.taskId, "from", data.fromBucketId, "to", data.toBucketId);
        eventEmitter.emit("task-drag-moved", data);
      }
    );

    // Drag start
    socketCore.on("project-space:drag-start", (data: { projectId: string; walletAddress: string; taskId: string; timestamp: number }) => {
      console.log(`🏗️ Drag started by ${data.walletAddress}:`, data.taskId);

      if (!activeDrags.value.has(data.projectId)) {
        activeDrags.value.set(data.projectId, new Map());
      }

      const projectDrags = activeDrags.value.get(data.projectId)!;
      projectDrags.set(data.walletAddress, {
        walletAddress: data.walletAddress,
        taskId: data.taskId,
        timestamp: data.timestamp,
      });
    });

    // Drag end
    socketCore.on("project-space:drag-end", (data: { projectId: string; walletAddress: string; taskId: string; timestamp: number }) => {
      console.log(`🎯 Drag ended by ${data.walletAddress}:`, data.taskId);

      const projectDrags = activeDrags.value.get(data.projectId);
      if (projectDrags) {
        projectDrags.delete(data.walletAddress);
      }
    });

    // Project CRUD events
    socketCore.on(
      "project-space:project-created",
      (data: {
        projectId: string;
        walletAddress: string;
        project: any;
        timestamp: number;
      }) => {
        console.log(`✨ Project created by ${data.walletAddress}:`, data.projectId);
        eventEmitter.emit("project-created", data);
      }
    );

    socketCore.on(
      "project-space:project-updated",
      (data: {
        projectId: string;
        walletAddress: string;
        updates: { name?: string; description?: string; color?: string };
        project: any;
        timestamp: number;
      }) => {
        console.log(`📝 Project updated by ${data.walletAddress}:`, data.projectId, data.updates);
        eventEmitter.emit("project-updated", data);
      }
    );

    socketCore.on(
      "project-space:project-deleted",
      (data: {
        projectId: string;
        walletAddress: string;
        timestamp: number;
      }) => {
        console.log(`🗑️ Project deleted by ${data.walletAddress}:`, data.projectId);
        eventEmitter.emit("project-deleted", data);
      }
    );

    // Error handling
    socketCore.on("project-space:error", (error: { message: string; code?: string }) => {
      console.error("🚫 Project space error:", error);
    });

    console.log("📡 Project space listeners setup complete");
  };

  // Actions
  const joinProject = async (projectId: string) => {
    if (!socketCore.connected) {
      console.warn("🚫 Cannot join project - socket not connected");
      return false;
    }

    if (joinedProjects.value.has(projectId)) {
      console.log(`🎯 Already joined project: ${projectId}`);
      return true;
    }

    try {
      socketCore.emit("project-space:join", { projectId });
      joinedProjects.value.add(projectId);

      // Initialize project data structures
      if (!cursors.value.has(projectId)) {
        cursors.value.set(projectId, new Map());
      }
      if (!participants.value.has(projectId)) {
        participants.value.set(projectId, []);
      }
      if (!activeDrags.value.has(projectId)) {
        activeDrags.value.set(projectId, new Map());
      }

      console.log(`🎯 Joined project space: ${projectId}`);
      return true;
    } catch (error) {
      console.error("Error joining project:", error);
      return false;
    }
  };

  const leaveProject = async (projectId: string) => {
    if (!socketCore.connected) return;

    try {
      socketCore.emit("project-space:leave", { projectId });
      joinedProjects.value.delete(projectId);

      // Clean up project data
      cursors.value.delete(projectId);
      participants.value.delete(projectId);
      activeDrags.value.delete(projectId);

      console.log(`👋 Left project space: ${projectId}`);
    } catch (error) {
      console.error("Error leaving project:", error);
    }
  };

  const sendCursorMove = (projectId: string, x: number, y: number) => {
    if (!socketCore.connected || !joinedProjects.value.has(projectId)) return;

    socketCore.emit("project-space:cursor-move", {
      projectId,
      x,
      y,
      timestamp: Date.now(),
    });
  };

  const sendTaskUpdate = (projectId: string, taskId: string, field: string, value: any) => {
    if (!socketCore.connected || !joinedProjects.value.has(projectId)) return;

    socketCore.emit("project-space:task-update", {
      projectId,
      taskId,
      field,
      value,
      timestamp: Date.now(),
    });
  };

  const sendTaskMove = (projectId: string, taskId: string, fromBucketId: string, toBucketId: string, position: number) => {
    if (!socketCore.connected || !joinedProjects.value.has(projectId)) return;

    socketCore.emit("project-space:task-move", {
      projectId,
      taskId,
      fromBucketId,
      toBucketId,
      position,
      timestamp: Date.now(),
    });
  };

  const sendDragStart = (projectId: string, taskId: string) => {
    if (!socketCore.connected || !joinedProjects.value.has(projectId)) return;

    socketCore.emit("project-space:drag-start", {
      projectId,
      taskId,
      timestamp: Date.now(),
    });
  };

  const sendDragEnd = (projectId: string, taskId: string) => {
    if (!socketCore.connected || !joinedProjects.value.has(projectId)) return;

    socketCore.emit("project-space:drag-end", {
      projectId,
      taskId,
      timestamp: Date.now(),
    });
  };

  const sendProjectUpdate = (projectId: string, updates: { name?: string; description?: string; color?: string }) => {
    console.log("🚀 sendProjectUpdate called:", { projectId, updates });
    console.log("📡 Socket connected:", socketCore.connected);
    console.log("🎯 Joined projects:", Array.from(joinedProjects.value));

    if (!socketCore.connected) {
      console.error("❌ Socket not connected");
      return;
    }

    if (!joinedProjects.value.has(projectId)) {
      console.error("❌ Not joined to project:", projectId);
      return;
    }

    console.log("✅ Emitting project-space:project-update");
    socketCore.emit("project-space:project-update", {
      projectId,
      updates,
      timestamp: Date.now(),
    });
  };

  // Re-join all projects (used after authentication)
  const rejoinAllProjects = async () => {
    if (!socketCore.connected) return;

    const projectIds = Array.from(joinedProjects.value);
    console.log(`🔄 Re-joining ${projectIds.length} projects after authentication`);

    // Leave and rejoin each project to update server-side identity
    for (const projectId of projectIds) {
      await leaveProject(projectId);
      // Small delay to ensure leave is processed
      await new Promise((resolve) => setTimeout(resolve, 50));
      await joinProject(projectId);
    }
  };

  // Cleanup cursors older than 10 seconds
  const cleanupOldCursors = () => {
    const now = Date.now();
    const maxAge = 10000; // 10 seconds

    for (const [projectId, projectCursors] of cursors.value) {
      for (const [walletAddress, cursor] of projectCursors) {
        if (now - cursor.timestamp > maxAge) {
          projectCursors.delete(walletAddress);
        }
      }
    }
  };

  // Auto-cleanup old cursors every 5 seconds
  let cleanupInterval: number | null = null;

  const startCleanup = () => {
    if (cleanupInterval) return;
    cleanupInterval = window.setInterval(cleanupOldCursors, 5000);
  };

  const stopCleanup = () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }
  };

  // Clean up all project-related socket event listeners
  const removeAllProjectListeners = () => {
    if (!socketCore.socket) return;

    // Collaboration events
    socketCore.off("project-space:user-joined");
    socketCore.off("project-space:user-left");
    socketCore.off("project-space:cursor-move");
    socketCore.off("project-space:drag-start");
    socketCore.off("project-space:drag-end");
    
    // Project CRUD events
    socketCore.off("project-space:project-created");
    socketCore.off("project-space:project-updated");
    socketCore.off("project-space:project-deleted");
    
    // Bucket CRUD events
    socketCore.off("project-space:bucket-created");
    socketCore.off("project-space:bucket-updated");
    socketCore.off("project-space:bucket-deleted");
    
    // Task CRUD events
    socketCore.off("project-space:task-created");
    socketCore.off("project-space:task-updated");
    socketCore.off("project-space:task-moved");
    socketCore.off("project-space:task-deleted");
    
    // Legacy task events
    socketCore.off("project-space:task-update");
    socketCore.off("project-space:task-move");
    
    // Error handling
    socketCore.off("project-space:error");
    
    console.log("🧹 Removed all project space event listeners");
  };

  // Leave all joined projects (for browser close cleanup)
  const leaveAllProjects = async () => {
    if (!socketCore.connected) return;

    const projectIds = Array.from(joinedProjects.value);
    console.log(`🚪 Leaving ${projectIds.length} projects due to browser close`);

    for (const projectId of projectIds) {
      try {
        socketCore.emit("project-space:leave", { projectId });
        console.log(`👋 Left project space: ${projectId}`);
      } catch (error) {
        console.error(`Error leaving project ${projectId}:`, error);
      }
    }

    // Clean up local state
    joinedProjects.value.clear();
    cursors.value.clear();
    participants.value.clear();
    activeDrags.value.clear();
  };

  // Cleanup on component unmount
  onBeforeUnmount(async () => {
    console.log("🧹 Project store unmounting - cleaning up projects");
    
    // Leave all projects and clean up state
    await leaveAllProjects();
    
    // Remove all socket event listeners
    removeAllProjectListeners();
    
    // Stop cursor cleanup interval
    stopCleanup();
  });

  return {
    // State (readonly)
    joinedProjects: readonly(joinedProjects),
    cursors: readonly(cursors),
    participants: readonly(participants),
    activeDrags: readonly(activeDrags),

    // Computed
    getProjectCursors,
    getProjectParticipants,
    getProjectDrags,
    isTaskBeingDragged,

    // Actions
    setupProjectListeners,
    joinProject,
    leaveProject,
    sendCursorMove,
    sendTaskUpdate,
    sendTaskMove,
    sendDragStart,
    sendDragEnd,
    sendProjectUpdate,
    rejoinAllProjects,
    startCleanup,
    stopCleanup,

    // Event emitter for custom listeners
    on: eventEmitter.on.bind(eventEmitter),
    off: eventEmitter.off.bind(eventEmitter),
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSocketProject, import.meta.hot));
}
