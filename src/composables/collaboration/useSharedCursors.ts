import { ref, computed, watch, onMounted, onUnmounted, Ref, readonly } from "vue";
import { useSocketCore, useViewport } from "../../stores";
// TODO: Replace with V2 targeted messaging for space-specific cursor updates

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
  // const socketSpace = useSocketSpace(); // DELETED - use V2 targeted messaging
  const viewport = useViewport();

  // Normalize spaceId to ref
  const normalizedSpaceId = typeof spaceId === "string" ? ref(spaceId) : spaceId;

  // Core state
  const initialized = ref(false);
  const shouldBroadcast = ref(true);

  // Mouse and scroll from viewport
  const mouseX = computed(() => viewport.mouse.x);
  const mouseY = computed(() => viewport.mouse.y);
  const scrollX = computed(() => viewport.scrollPosition.x);
  const scrollY = computed(() => viewport.scrollPosition.y);

  // TODO: Replace with V2 targeted messaging for cursor data
  const cursors = computed(() => [] as SharedCursor[]);
  const participants = computed(() => [] as SharedParticipant[]);

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

    // Send cursor update through unified socket space
    socketSpace.sendCursorMove(normalizedSpaceId.value, x, y);
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

      // Setup space listeners if not already done
      if (socketCore.connected) {
        socketSpace.setupSpaceListeners();
        socketSpace.startCleanup();

        // Join the space
        await socketSpace.joinSpace(normalizedSpaceId.value);

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
      await socketSpace.leaveSpace(normalizedSpaceId.value);
      socketSpace.stopCleanup();
      initialized.value = false;
      console.log(`👋 Shared cursors cleanup for space: ${normalizedSpaceId.value}`);
    } catch (error) {
      console.error("Error during shared cursors cleanup:", error);
    }
  };

  // Control broadcasting
  const setShouldBroadcast = (enabled: Ref<boolean> | boolean) => {
    if (typeof enabled === "boolean") {
      shouldBroadcast.value = enabled;
    } else {
      watch(
        enabled,
        (newValue) => {
          shouldBroadcast.value = newValue;
        },
        { immediate: true }
      );
    }
  };

  // Watch mouse movement and send cursor updates
  watch([mouseX, mouseY], () => {
    sendCursorUpdate();
  });

  // Watch for space ID changes
  watch(normalizedSpaceId, async (newSpaceId, oldSpaceId) => {
    if (oldSpaceId && initialized.value) {
      await socketSpace.leaveSpace(oldSpaceId);
    }

    if (newSpaceId && socketCore.connected) {
      await socketSpace.joinSpace(newSpaceId);
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
