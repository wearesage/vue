import { onMounted, computed } from "vue";
import { useAuth, useSocketCore, useUserState } from "../../stores";

export function useAppInitialization() {
  const auth = useAuth();
  const socket = useSocketCore();
  const authenticated = computed(() => auth.isAuthenticated);

  useUserState();

  onMounted(async () => {
    await auth.initialize();

    try {
      await socket.connect();
      if (!socket.connected) return;
      socket.startHeartbeat();
    } catch (error) {
      console.error("❌ Socket connection failed:", error);
    }
  });

  return {
    authenticated,
  };
}
