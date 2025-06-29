import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useSocketCore, useSocketProject, useViewport } from "../../stores";

export interface SharedCursor {
  walletAddress: string;
  x: number;
  y: number;
  timestamp: number;
}

export interface SharedParticipant {
  walletAddress: string;
  joinedAt: number;
  lastSeen: number;
}

export function useSharedCursors(spaceId: Ref<string> | string) {
  const socketCore = useSocketCore();
  const socketProject = useSocketProject();
  const viewport = useViewport();
  
  // Normalize spaceId to ref
  const normalizedSpaceId = typeof spaceId === 'string' ? ref(spaceId) : spaceId;
  
  // Core state
  const initialized = ref(false);
  const shouldBroadcast = ref(true);
  
  // Mouse and scroll from viewport
  const mouseX = computed(() => viewport.mouse.x);
  const mouseY = computed(() => viewport.mouse.y);
  const scrollX = computed(() => viewport.scrollPosition.x);
  const scrollY = computed(() => viewport.scrollPosition.y);
  
  // Cursor data for this space
  const cursors = computed(() => socketProject.getProjectCursors(normalizedSpaceId.value));
  const participants = computed(() => socketProject.getProjectParticipants(normalizedSpaceId.value));
  
  // Throttled cursor sending
  let lastCursorSend = 0;
  const CURSOR_THROTTLE = 50; // 50ms throttle
  
  const sendCursorUpdate = () => {
    const now = Date.now();
    if (now - lastCursorSend < CURSOR_THROTTLE) return;
    if (!initialized.value || !shouldBroadcast.value) return;
    
    // Calculate absolute position (mouse + scroll offset)
    const x = mouseX.value + scrollX.value;
    const y = mouseY.value + scrollY.value;
    
    socketProject.sendCursorMove(normalizedSpaceId.value, x, y);
    lastCursorSend = now;
  };
  
  // Initialize connection to space
  const initialize = async () => {
    if (initialized.value) return;
    
    try {
      // Ensure socket core is connected
      if (!socketCore.connected) {
        await socketCore.connect();
      }
      
      // Setup project listeners if not already done
      if (socketCore.connected) {
        socketProject.setupProjectListeners();
        socketProject.startCleanup();
        
        // Join the space
        await socketProject.joinProject(normalizedSpaceId.value);
        
        initialized.value = true;
        console.log(`🎯 Shared cursors initialized for space: ${normalizedSpaceId.value}`);
      }
    } catch (error) {
      console.error("Failed to initialize shared cursors:", error);
    }
  };
  
  // Cleanup connection
  const cleanup = async () => {
    if (!initialized.value) return;
    
    try {
      await socketProject.leaveProject(normalizedSpaceId.value);
      socketProject.stopCleanup();
      initialized.value = false;
      console.log(`👋 Shared cursors cleanup for space: ${normalizedSpaceId.value}`);
    } catch (error) {
      console.error("Error during shared cursors cleanup:", error);
    }
  };
  
  // Control broadcasting
  const setShouldBroadcast = (enabled: Ref<boolean> | boolean) => {
    if (typeof enabled === 'boolean') {
      shouldBroadcast.value = enabled;
    } else {
      watch(enabled, (newValue) => {
        shouldBroadcast.value = newValue;
      }, { immediate: true });
    }
  };
  
  // Watch mouse movement and send cursor updates
  watch([mouseX, mouseY], () => {
    sendCursorUpdate();
  });
  
  // Watch for space ID changes
  watch(normalizedSpaceId, async (newSpaceId, oldSpaceId) => {
    if (oldSpaceId && initialized.value) {
      await socketProject.leaveProject(oldSpaceId);
    }
    
    if (newSpaceId && socketCore.connected) {
      await socketProject.joinProject(newSpaceId);
    }
  });
  
  // Lifecycle
  onMounted(async () => {
    await initialize();
  });
  
  onUnmounted(async () => {
    await cleanup();
  });
  
  return {
    // State (readonly)
    initialized: readonly(initialized),
    shouldBroadcast: readonly(shouldBroadcast),
    cursors,
    participants,
    scrollX,
    scrollY,
    
    // Methods
    initialize,
    cleanup,
    setShouldBroadcast,
    
    // Raw data for domain-specific logic
    mouseX,
    mouseY,
  };
}