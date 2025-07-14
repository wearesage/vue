import { onMounted } from "vue";
import { useAuth, useSocketCore, useUserState } from "../../stores";

export function useAppInitialization() {
  const auth = useAuth();
  // const socket = useSocketCore();

  useUserState();

  // Initialize auth immediately, not waiting for component mount
  auth.initialize();

  // onMounted(async () => {
  //   try {
  //     await socket.connect();
  //     if (!socket.connected) return;
  //     socket.startHeartbeat();
  //   } catch (error) {
  //     console.error("❌ Socket connection failed:", error);
  //   }
  // });

  const promise = new Promise(async (resolve) => {
    await auth.authDetermined;
    resolve(auth.isAuthenticated);
  });

  return {
    promise,
  };
}
