import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, computed, readonly, onBeforeUnmount } from "vue";
import { useSocketCore } from "./socket-core";
import { useToast } from "./toast";
import { api } from "../api/client";
import { EventEmitter } from "eventemitter3";
import { SocketEvents, ProjectSocketEvent, TaskSocketEvent, BucketSocketEvent } from "@wearesage/shared";

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
  const toast = useToast();

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

  // Flag to ensure listeners are only set up once
  let projectListenersSetup = false;

  // Setup event listeners
  const setupProjectListeners = () => {
    console.log("🔍 SOCKET-PROJECT: setupProjectListeners called");

    if (projectListenersSetup) {
      console.log("🔍 SOCKET-PROJECT: Listeners already set up, skipping...");
      return;
    }

    if (!socketCore.socket) {
      console.warn("🚫 Cannot setup project listeners - socket not connected");
      return;
    }

    console.log("🔍 SOCKET-PROJECT: Socket exists, setting up listeners...");
    projectListenersSetup = true;

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

    // Bucket CRUD events (space: namespace)
    socketCore.on(SocketEvents.SPACE_BUCKET_CREATE, (event: BucketSocketEvent) => {
      console.log(`🔍 SOCKET-PROJECT: Bucket created event received:`, event.context.entityId, event.payload.data?.name);
      console.log(`🔍 SOCKET-PROJECT: Re-emitting bucket-created to event listeners...`);
      eventEmitter.emit("bucket-created", event);
      console.log(`🔍 SOCKET-PROJECT: Bucket event re-emitted`);
    });

    socketCore.on(SocketEvents.SPACE_BUCKET_UPDATE, (event: BucketSocketEvent) => {
      console.log(`🪣 Bucket updated by ${event.walletAddress}:`, event.context.entityId, event.payload.changes);
      eventEmitter.emit("bucket-updated", event);
    });

    socketCore.on(SocketEvents.SPACE_BUCKET_DELETE, (event: BucketSocketEvent) => {
      console.log(`🗑️ Bucket deleted by ${event.walletAddress}:`, event.context.entityId);
      eventEmitter.emit("bucket-deleted", event);
    });

    // Task CRUD events (space: namespace)
    socketCore.on(SocketEvents.SPACE_TASK_CREATE, (event: TaskSocketEvent) => {
      console.log(`🔍 SOCKET-PROJECT: Task created event received:`, event.context.entityId, event.payload.data?.title);
      console.log(`🔍 SOCKET-PROJECT: Re-emitting to event listeners...`);
      eventEmitter.emit("task-created", event);
      console.log(`🔍 SOCKET-PROJECT: Event re-emitted, listeners should be called now`);
    });

    socketCore.on(SocketEvents.SPACE_TASK_UPDATE, (event: TaskSocketEvent) => {
      console.log(`📝 Task updated by ${event.walletAddress}:`, event.context.entityId, event.payload.changes);
      eventEmitter.emit("task-updated", event);
    });

    socketCore.on(SocketEvents.SPACE_TASK_MOVE, (event: TaskSocketEvent) => {
      console.log(`🔄 Task moved by ${event.walletAddress}:`, event.context.entityId, "to", event.payload.metadata?.targetBucketId);
      eventEmitter.emit("task-moved", event);
    });

    socketCore.on(SocketEvents.SPACE_TASK_DELETE, (event: TaskSocketEvent) => {
      console.log(`🗑️ Task deleted by ${event.walletAddress}:`, event.context.entityId);
      eventEmitter.emit("task-deleted", event);
    });

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

    // Project CRUD events (space: namespace)
    socketCore.on(SocketEvents.SPACE_PROJECT_CREATE, (event: ProjectSocketEvent) => {
      console.log(`✨ Project created by ${event.walletAddress}:`, event.context.entityId);
      eventEmitter.emit("project-created", event);
    });

    socketCore.on(SocketEvents.SPACE_PROJECT_UPDATE, (event: ProjectSocketEvent) => {
      console.log(`📝 Project updated by ${event.walletAddress}:`, event.context.entityId, event.payload.changes);
      eventEmitter.emit("project-updated", event);
    });

    socketCore.on(SocketEvents.SPACE_PROJECT_DELETE, (event: ProjectSocketEvent) => {
      console.log(`🗑️ Project deleted by ${event.walletAddress}:`, event.context.entityId);
      eventEmitter.emit("project-deleted", event);
    });

    // Error handling
    socketCore.on("project-space:error", (error: { message: string; code?: string }) => {
      console.error("🚫 Project space error:", error);
    });

    console.log("📡 Project space listeners setup complete");

    // Setup toast notifications after socket listeners are ready
    setupToastNotifications();
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

  // Auto-join all user projects after authentication
  const autoJoinUserProjects = async () => {
    if (!socketCore.connected) {
      console.warn("🚫 Cannot auto-join projects - socket not connected");
      return;
    }

    try {
      console.log("🎯 Auto-joining user projects...");

      // Get all user projects from API
      const response = await api.get("/api/projects");
      console.log("🔍 API response:", response.data);

      // Handle the actual API response structure: {projects: {owned: [], collaborated: []}}
      const projectsData = response.data?.projects;
      if (!projectsData) {
        console.warn("⚠️ No projects data in response");
        return;
      }

      // Combine owned and collaborated projects
      const ownedProjects = Array.isArray(projectsData.owned) ? projectsData.owned : [];
      const collaboratedProjects = Array.isArray(projectsData.collaborated) ? projectsData.collaborated : [];
      const userProjects = [...ownedProjects, ...collaboratedProjects];

      console.log(
        `📋 Found ${ownedProjects.length} owned + ${collaboratedProjects.length} collaborated = ${userProjects.length} total projects`
      );

      // Toast notifications will be set up after socket listeners are ready

      // Join each project
      for (const project of userProjects) {
        await joinProject(project.id);
        console.log(`✅ Auto-joined project: ${project.name} (${project.id})`);

        // Small delay to prevent overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`🎉 Successfully auto-joined ${userProjects.length} projects with toast notifications enabled`);
    } catch (error) {
      console.error("❌ Failed to auto-join user projects:", error);
      toast.error("Failed to connect to project updates");
    }
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

  // Flag to ensure toast notifications are only set up once
  let toastNotificationsSetup = false;

  // Toast notifications for all incoming project events
  const setupToastNotifications = () => {
    if (toastNotificationsSetup) {
      console.log("🍞 Toast notifications already set up, skipping...");
      return;
    }

    console.log("🍞 Setting up toast notifications for project events...");
    toastNotificationsSetup = true;

    // Helper function to get short wallet address
    const getShortWallet = (walletAddress: string) => {
      return walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Unknown";
    };

    // Project events
    eventEmitter.on("project-created", (event: ProjectSocketEvent) => {
      toast.message(`✨ ${getShortWallet(event.walletAddress)} created project "${event.payload.data?.name}"`);
    });

    eventEmitter.on("project-updated", (event: ProjectSocketEvent) => {
      const updates = event.payload.changes ? Object.keys(event.payload.changes).join(", ") : "unknown";
      toast.message(`📝 ${getShortWallet(event.walletAddress)} updated project "${event.payload.data?.name}" (${updates})`);
    });

    eventEmitter.on("project-deleted", (event: ProjectSocketEvent) => {
      toast.message(`🗑️ ${getShortWallet(event.walletAddress)} deleted a project`);
    });

    // Bucket events
    eventEmitter.on("bucket-created", (event: BucketSocketEvent) => {
      console.log("🍞 TOAST: Bucket created event triggered!", event);
      const message = `📦 ${getShortWallet(event.walletAddress)} created bucket "${event.payload.data?.name}"`;
      console.log("🍞 TOAST: Calling toast.message with:", message);
      toast.message(message);
      console.log("🍞 TOAST: toast.message called!");
    });

    eventEmitter.on("bucket-updated", (event: BucketSocketEvent) => {
      toast.message(`📦 ${getShortWallet(event.walletAddress)} updated bucket "${event.payload.data?.name}"`);
    });

    eventEmitter.on("bucket-deleted", (event: BucketSocketEvent) => {
      toast.message(`🗑️ ${getShortWallet(event.walletAddress)} deleted a bucket`);
    });

    // Task events - the most important ones!
    eventEmitter.on("task-created", (event: TaskSocketEvent) => {
      console.log("🍞 TOAST: Task created event triggered!", event);
      const message = `🎯 ${getShortWallet(event.walletAddress)} created task "${event.payload.data?.title}"`;
      console.log("🍞 TOAST: Calling toast.message with:", message);
      toast.message(message);
      console.log("🍞 TOAST: toast.message called!");
    });

    eventEmitter.on("task-updated", (event: TaskSocketEvent) => {
      const updates = event.payload.changes ? Object.keys(event.payload.changes).join(", ") : "unknown";
      toast.message(`📝 ${getShortWallet(event.walletAddress)} updated "${event.payload.data?.title}" (${updates})`);
    });

    eventEmitter.on("task-moved", (event: TaskSocketEvent) => {
      toast.message(`🔄 ${getShortWallet(event.walletAddress)} moved "${event.payload.data?.title}" to new bucket`);
    });

    eventEmitter.on("task-deleted", (event: TaskSocketEvent) => {
      console.log("🍞 TOAST: Task deleted event triggered!", event);
      const message = `🗑️ ${getShortWallet(event.walletAddress)} deleted a task`;
      console.log("🍞 TOAST: Calling toast.message with:", message);
      toast.message(message);
      console.log("🍞 TOAST: toast.message called!");
    });

    console.log("🍞 Toast notifications enabled for all project events!");
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

    // Collaboration events (these still use old format for now)
    socketCore.off("project-space:user-joined");
    socketCore.off("project-space:user-left");
    socketCore.off("project-space:cursor-move");
    socketCore.off("project-space:drag-start");
    socketCore.off("project-space:drag-end");

    // Project CRUD events (space: namespace)
    socketCore.off(SocketEvents.SPACE_PROJECT_CREATE);
    socketCore.off(SocketEvents.SPACE_PROJECT_UPDATE);
    socketCore.off(SocketEvents.SPACE_PROJECT_DELETE);

    // Bucket CRUD events (space: namespace)
    socketCore.off(SocketEvents.SPACE_BUCKET_CREATE);
    socketCore.off(SocketEvents.SPACE_BUCKET_UPDATE);
    socketCore.off(SocketEvents.SPACE_BUCKET_DELETE);

    // Task CRUD events (space: namespace)
    socketCore.off(SocketEvents.SPACE_TASK_CREATE);
    socketCore.off(SocketEvents.SPACE_TASK_UPDATE);
    socketCore.off(SocketEvents.SPACE_TASK_MOVE);
    socketCore.off(SocketEvents.SPACE_TASK_DELETE);

    // Legacy task events (still using old format)
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
    autoJoinUserProjects,
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
