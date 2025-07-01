import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, computed, watch, nextTick } from "vue";
import { useRouter, useRoute } from "../router/sage-router";
import { api } from "../api/client";
import { useToast } from "./toast";
import { useWallet } from "../composables/auth/useWallet";
import { useSocketCore } from "./socket-core";
import { VITE_DEFAULT_AUTHENTICATED_VIEW } from "../constants/env";

export const useAuth = defineStore("auth", () => {
  const router = useRouter();
  const route = useRoute();
  const toast = useToast();
  const wallet = useWallet();
  const authToken = ref<string | null>(localStorage.getItem("authToken"));
  const refreshToken = ref<string | null>(localStorage.getItem("refreshToken"));
  const user = ref<any>(JSON.parse(localStorage.getItem("user") || "null"));
  const loading = ref(false);
  const isAuthenticating = ref(false);

  const isAuthenticated = computed(() => !!authToken.value && !!user.value);

  const walletAddress = computed(() => user.value?.walletAddress || null);

  watch(authToken, (token) => {
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  });

  watch(refreshToken, (token) => {
    if (token) {
      localStorage.setItem("refreshToken", token);
    } else {
      localStorage.removeItem("refreshToken");
    }
  });

  watch(
    user,
    (userData) => {
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        localStorage.removeItem("user");
      }
    },
    { deep: true }
  );

  // Removed router logic - moved to Root.vue where it belongs!

  async function validateStoredToken(): Promise<boolean> {
    const token = localStorage.getItem("authToken");

    if (!token) return false;

    try {
      // Socket-first token validation
      const socketCore = useSocketCore();

      // Ensure socket is connected
      if (!socketCore.connected) {
        await socketCore.connect();
      }
      await socketCore.waitForConnection();

      return new Promise<boolean>((resolve) => {
        // Set up listeners for socket validation response
        const handleSuccess = ({ user: userData }: any) => {
          user.value = userData;
          cleanup();
          resolve(true);
        };

        const handleInvalid = () => {
          clearAuthState();
          cleanup();
          resolve(false);
        };

        // Cleanup function
        const cleanup = () => {
          socketCore.off("auth:success", handleSuccess);
          socketCore.off("auth:invalid", handleInvalid);
        };

        // Set up socket listeners
        socketCore.on("auth:success", handleSuccess);
        socketCore.on("auth:invalid", handleInvalid);

        // Send token validation request (after connection is established)
        console.log("🔑 Sending token validation request...");
        socketCore.emit("auth:validate-token", token);

        // Timeout after 5 seconds and fall back to HTTP
        setTimeout(() => {
          cleanup();
          console.log("Socket validation timeout, falling back to HTTP");

          // HTTP fallback
          api
            .get("/api/auth/validate")
            .then((response) => {
              if (response.data?.user) {
                user.value = response.data.user;
                resolve(true);
              } else {
                resolve(false);
              }
            })
            .catch((error) => {
              if (error.response?.status === 401) clearAuthState();
              resolve(false);
            });
        }, 5000);
      });
    } catch (error: any) {
      console.error("Token validation error:", error);
      return false;
    }
  }

  function clearAuthState() {
    authToken.value = null;
    refreshToken.value = null;
    user.value = null;
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    // Clean up any lingering socket auth listeners
    const socketCore = useSocketCore();
    socketCore.off("auth:success");
    socketCore.off("auth:challenge-response");
    socketCore.off("auth:error");
    socketCore.off("auth:invalid");
  }

  async function signIn() {
    try {
      isAuthenticating.value = true;

      // Get wallet address and signature (simple imperative flow)
      if (!wallet.isConnected) {
        await wallet.connect();
      }

      const walletAddress = wallet.address.value;
      if (!walletAddress) {
        toast.error("Failed to connect wallet");
        return;
      }

      // Socket-first authentication
      const socketCore = useSocketCore();

      // Ensure socket is connected and wait for it
      if (!socketCore.connected) {
        await socketCore.connect();
      }
      await socketCore.waitForConnection();

      return new Promise<void>((resolve, reject) => {
        // Handle challenge response
        const handleChallenge = async ({ message }: { message: string }) => {
          try {
            console.log("🔑 Challenge received:", message.substring(0, 50) + "...");
            toast.message("Please sign the message in your wallet...");
            const signature = await wallet.signMessage(message);

            toast.message("Verifying signature...");
            socketCore.emit("auth:wallet-verify", { message, signature, walletAddress });
          } catch (error: any) {
            if (error.message?.includes("rejected")) {
              toast.error("Signature rejected");
            } else {
              toast.error("Failed to sign message");
            }
            cleanup();
            reject(error);
          }
        };

        // Handle auth success
        const handleSuccess = ({ user: userData, accessToken, refreshToken: newRefreshToken }: any) => {
          authToken.value = accessToken;
          refreshToken.value = newRefreshToken;
          user.value = userData;
          toast.message(`Welcome ${userData.walletAddress.slice(0, 8)}!`);
          if (route.value.path === "/") {
            console.log("🚀 Socket auth successful, redirecting to", VITE_DEFAULT_AUTHENTICATED_VIEW);
            router.replace(VITE_DEFAULT_AUTHENTICATED_VIEW);
          }
          cleanup();
          resolve();
        };

        // Handle auth error
        const handleError = ({ message }: { message: string }) => {
          toast.error(`Authentication failed: ${message}`);
          cleanup();
          reject(new Error(message));
        };

        // Cleanup function
        const cleanup = () => {
          socketCore.off("auth:challenge-response", handleChallenge);
          socketCore.off("auth:success", handleSuccess);
          socketCore.off("auth:error", handleError);
        };

        // Set up socket listeners
        socketCore.on("auth:challenge-response", handleChallenge);
        socketCore.on("auth:success", handleSuccess);
        socketCore.on("auth:error", handleError);

        // Request challenge via socket (after listeners are set up)
        toast.message("Getting authentication challenge...");
        console.log("🔑 Requesting challenge for:", walletAddress);
        socketCore.emit("auth:wallet-challenge", { walletAddress });
      });
    } catch (error: any) {
      console.error("Sign in failed:", error);
      toast.error("Authentication failed");
      throw error;
    } finally {
      isAuthenticating.value = false;
    }
  }

  async function signOut() {
    try {
      // Socket-first logout
      const socketCore = useSocketCore();
      socketCore.emit("auth:logout");

      // HTTP logout as fallback
      await api.post("/api/auth/logout").catch(() => {});
    } finally {
      clearAuthState();
      
      // Reset all stores to clear tokens, intervals, and state
      try {
        const { useSpotify } = await import('./spotify');
        const { useSources } = await import('./sources');
        const { useSketches } = await import('./sketches');
        
        const spotify = useSpotify();
        const sources = useSources();
        const sketches = useSketches();
        
        spotify.reset();
        sources.reset();
        sketches.reset();
      } catch (error) {
        console.warn('Failed to reset stores on logout:', error);
      }
      
      // No need to disconnect wallet - it's just a signing tool
      toast.message("Signed out successfully");
      router.replace("/");
    }
  }

  async function initialize() {
    loading.value = true;
    try {
      await validateStoredToken();
    } finally {
      loading.value = false;
    }
  }

  return {
    authToken: computed(() => authToken.value),
    refreshToken: computed(() => refreshToken.value),
    user: computed(() => user.value),
    walletAddress,
    loading: computed(() => loading.value),
    isAuthenticating: computed(() => isAuthenticating.value),
    isAuthenticated,
    signIn,
    signOut,
    initialize,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuth, import.meta.hot));
}