import { ref, computed, watch } from "vue";
import { useSocketProject } from "../../stores";
import { useSharedCursors } from "./useSharedCursors";
import { useRoute } from "../../router/sage-router";

export function useProjectCollaboration(projectId: Ref<string>) {
  const socketProject = useSocketProject();
  const route = useRoute();

  // Use shared cursors with project ID directly (no prefix)
  const spaceId = computed(() => projectId.value);
  const sharedCursors = useSharedCursors(spaceId);

  // PROJECT-SPECIFIC: Only broadcast cursors on project detail pages
  const shouldBroadcastCursors = computed(() => {
    return route.name === "Project Detail";
  });

  // Set broadcasting rules
  sharedCursors.setShouldBroadcast(shouldBroadcastCursors);

  // Join project space when initialized and on project detail pages
  watch(
    [() => projectId.value, shouldBroadcastCursors],
    ([newProjectId, shouldBroadcast]) => {
      if (newProjectId && shouldBroadcast) {
        console.log("🎯 Joining project space for collaboration:", newProjectId);
        socketProject.joinProject(newProjectId);
      }
    },
    { immediate: true }
  );

  // Expose cursor data from shared cursors
  const cursors = sharedCursors.cursors;
  const participants = sharedCursors.participants;
  const scrollX = sharedCursors.scrollX;
  const scrollY = sharedCursors.scrollY;
  const activeDrags = computed(() => socketProject.getProjectDrags(projectId.value));

  // Check if a specific task is being dragged
  const isTaskBeingDragged = (taskId: string) => {
    return socketProject.isTaskBeingDragged(projectId.value, taskId);
  };

  // PROJECT-SPECIFIC: Task collaboration methods
  const sendTaskUpdate = (taskId: string, field: string, value: any) => {
    if (!sharedCursors.initialized) return;
    socketProject.sendTaskUpdate(projectId.value, taskId, field, value);
  };

  const sendTaskMove = (taskId: string, fromBucketId: string, toBucketId: string, position: number) => {
    if (!sharedCursors.initialized) return;
    socketProject.sendTaskMove(projectId.value, taskId, fromBucketId, toBucketId, position);
  };

  const sendDragStart = (taskId: string) => {
    if (!sharedCursors.initialized) return;
    socketProject.sendDragStart(projectId.value, taskId);
  };

  const sendDragEnd = (taskId: string) => {
    if (!sharedCursors.initialized) return;
    socketProject.sendDragEnd(projectId.value, taskId);
  };

  const sendProjectUpdate = (updates: { name?: string; description?: string; color?: string }) => {
    if (!sharedCursors.initialized) return;
    socketProject.sendProjectUpdate(projectId.value, updates);
  };

  return {
    // State (delegated from shared cursors)
    initialized: sharedCursors.initialized,
    cursors,
    participants,
    activeDrags,
    scrollX,
    scrollY,

    // Methods
    isTaskBeingDragged,

    // PROJECT-SPECIFIC: Task collaboration
    sendTaskUpdate,
    sendTaskMove,
    sendDragStart,
    sendDragEnd,
    sendProjectUpdate,
  };
}
