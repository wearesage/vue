import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, computed, watch, nextTick } from "vue";
import { useRouter, useRoute } from "../router/sage-router";
import { api } from "../api/client";
import { useToast } from "./toast";
import { useWallet } from "../composables/auth/useWallet";
import { useSocketCore } from "./socket-core";
import { useUI } from "./ui";
import { VITE_DEFAULT_AUTHENTICATED_VIEW, VITE_ADMIN_WALLET } from "../constants/env";
import { UserRole } from "@wearesage/shared";

// Session logging integration
let sessionLogger: any = null;
const loadSessionLogger = async () => {
  if (!sessionLogger) {
    try {
      const { useSessionLogger } = await import('./session-logger');
      sessionLogger = useSessionLogger();
    } catch (error) {
      console.warn('Session logger not available:', error);
    }
  }
  return sessionLogger;
};

export const useAuth = defineStore("auth", () => {
  const router = useRouter();
  const route = useRoute();
  const toast = useToast();
  const wallet = useWallet();
  const ui = useUI();
  const authToken = ref<string | null>(localStorage.getItem("authToken"));
  const refreshToken = ref<string | null>(localStorage.getItem("refreshToken"));
  const user = ref<any>(JSON.parse(localStorage.getItem("user") || "null"));
  const loading = ref(false);
  const isAuthenticating = ref(false);
  
  // Track explicit user intent to prevent auto-firing
  const userIntentToSignIn = ref(false);

  // 🎭 Admin impersonation state
  const originalUser = ref<any>(JSON.parse(localStorage.getItem("originalUser") || "null"));
  const viewingAsUser = ref<any>(JSON.parse(localStorage.getItem("viewingAsUser") || "null"));
  const isImpersonating = ref<boolean>(localStorage.getItem("isImpersonating") === "true");

  const isAuthenticated = computed(() => !!authToken.value && !!user.value);

  // When impersonating, return the target user's wallet address, otherwise the current user's
  const walletAddress = computed(() => {
    if (isImpersonating.value && viewingAsUser.value) {
      return viewingAsUser.value.walletAddress;
    }
    return user.value?.walletAddress || null;
  });

  // For admin checks, ALWAYS use the original user (admin privileges are preserved during impersonation)
  const isAdmin = computed(() => {
    const adminUser = isImpersonating.value ? originalUser.value : user.value;
    return isAuthenticated.value && 
           adminUser?.walletAddress === VITE_ADMIN_WALLET && 
           adminUser?.role === UserRole.ADMIN;
  });

  // The current effective user (for UI display and permissions)
  const currentUser = computed(() => {
    if (isImpersonating.value && viewingAsUser.value) {
      return viewingAsUser.value;
    }
    return user.value;
  });

  const isArtist = computed(() => {
    return isAuthenticated.value && currentUser.value?.role === UserRole.ARTIST;
  });

  const isSubscriber = computed(() => {
    return isAuthenticated.value && currentUser.value?.role === UserRole.SUBSCRIBER;
  });

  const isPaidTier = computed(() => {
    return isAuthenticated.value && [UserRole.SUBSCRIBER, UserRole.ARTIST, UserRole.ADMIN].includes(currentUser.value?.role);
  });

  const isArtistOrAdmin = computed(() => {
    return isAuthenticated.value && [UserRole.ARTIST, UserRole.ADMIN].includes(currentUser.value?.role);
  });

  const userRole = computed(() => {
    if (!isAuthenticated.value || !currentUser.value?.role) return null;
    const roleNames = {
      [UserRole.USER]: "USER",
      [UserRole.ADMIN]: "ADMIN", 
      [UserRole.ARTIST]: "ARTIST",
      [UserRole.SUBSCRIBER]: "SUBSCRIBER"
    };
    return roleNames[currentUser.value.role] || "UNKNOWN";
  });

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

  // 🎭 Impersonation state watchers
  watch(
    originalUser,
    (userData) => {
      if (userData) {
        localStorage.setItem("originalUser", JSON.stringify(userData));
      } else {
        localStorage.removeItem("originalUser");
      }
    },
    { deep: true }
  );

  watch(
    viewingAsUser,
    (userData) => {
      if (userData) {
        localStorage.setItem("viewingAsUser", JSON.stringify(userData));
      } else {
        localStorage.removeItem("viewingAsUser");
      }
    },
    { deep: true }
  );

  watch(isImpersonating, (impersonating) => {
    if (impersonating) {
      localStorage.setItem("isImpersonating", "true");
    } else {
      localStorage.removeItem("isImpersonating");
    }
  });

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
        let timeoutId: NodeJS.Timeout | null = null;
        let isResolved = false;

        // Set up listeners for socket validation response
        const handleSuccess = ({ user: userData }: any) => {
          if (isResolved) return;
          isResolved = true;
          
          user.value = userData;
          
          // 🚀 Extension Auth Handoff for token validation - Send existing auth to extension
          try {
            if (typeof window !== 'undefined' && window.postMessage && authToken.value) {
              console.log("🔗 Extension handoff for existing auth...");
              window.postMessage({
                type: 'KALEIDOSYNC_AUTH_HANDOFF',
                source: 'kaleidosync-page',
                authToken: authToken.value,
                refreshToken: refreshToken.value,
                user: userData,
                timestamp: Date.now()
              }, '*');
              console.log("✅ Extension auth handoff sent for existing session");
            }
          } catch (error) {
            console.warn("Extension handoff failed (extension may not be installed):", error);
          }
          
          cleanup();
          resolve(true);
        };

        const handleInvalid = () => {
          if (isResolved) return;
          isResolved = true;
          
          clearAuthState();
          cleanup();
          resolve(false);
        };

        // Cleanup function
        const cleanup = () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
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
        timeoutId = setTimeout(() => {
          if (isResolved) return;
          isResolved = true;
          
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
      // Set user intent flag to prevent auto-firing
      userIntentToSignIn.value = true;
      console.log("🟢 User intent flag set to TRUE - explicit signIn called");
      isAuthenticating.value = true;
      
      // Log authentication attempt
      const logger = await loadSessionLogger();
      if (logger) {
        logger.logEvent(logger.SessionEventType.AUTH_LOGIN_ATTEMPT, {
          method: 'wallet',
          timestamp: Date.now()
        });
      }

      // Check wallet connection status and handle accordingly
      if (!wallet.isConnected) {
        console.log("💰 No wallet connected - opening AppKit modal");
        toast.message("Please connect your wallet...");
        await wallet.connect();
        
        // After modal interaction, check if connection was successful
        if (!wallet.isConnected) {
          toast.error("Wallet connection was cancelled or failed");
          return;
        }
        toast.success("Wallet connected successfully!");
      } else {
        console.log("💰 Wallet already connected - proceeding with authentication");
        toast.message("Using connected wallet for authentication...");
      }

      let walletAddress = wallet.address.value;
      if (!walletAddress) {
        // Wallet shows connected but no address - likely a connection issue
        console.log("💰 Wallet connected but no address - opening modal to reconnect");
        toast.message("Please reconnect your wallet...");
        await wallet.connect();
        
        // Check again after reconnection attempt
        walletAddress = wallet.address.value;
        if (!walletAddress) {
          toast.error("Unable to connect wallet - please try again");
          return;
        }
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
            // Only proceed if user explicitly intended to sign in
            if (!userIntentToSignIn.value) {
              console.log("🚫 Wallet signing blocked - no user intent (flag is false)");
              socketCore.off("auth:challenge-response", handleChallenge);
              socketCore.off("auth:success", handleSuccess);
              socketCore.off("auth:error", handleError);
              reject(new Error("No user intent to sign in"));
              return;
            }
            
            console.log("✅ User intent flag is TRUE - proceeding with signing");
            
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
        const handleSuccess = async ({ user: userData, accessToken, refreshToken: newRefreshToken }: any) => {
          authToken.value = accessToken;
          refreshToken.value = newRefreshToken;
          user.value = userData;
          toast.message(`Welcome ${userData.walletAddress.slice(0, 8)}!`);
          
          // Log successful authentication
          const logger = await loadSessionLogger();
          if (logger) {
            logger.logEvent(logger.SessionEventType.AUTH_LOGIN_SUCCESS, {
              method: 'wallet',
              walletAddress: userData.walletAddress,
              userRole: userData.role,
              timestamp: Date.now()
            });
          }
          
          // 🚀 Extension Auth Handoff - Send auth data to Chrome extension if installed
          try {
            if (typeof window !== 'undefined' && window.postMessage) {
              console.log("🔗 Attempting extension auth handoff...");
              window.postMessage({
                type: 'KALEIDOSYNC_AUTH_HANDOFF',
                source: 'kaleidosync-page',
                authToken: accessToken,
                refreshToken: newRefreshToken,
                user: userData,
                timestamp: Date.now()
              }, '*');
              console.log("✅ Extension auth handoff message sent");
            }
          } catch (error) {
            console.warn("Extension handoff failed (extension may not be installed):", error);
          }
          
          if (route.value.path === "/") {
            console.log("🚀 Socket auth successful, redirecting to", VITE_DEFAULT_AUTHENTICATED_VIEW);
            router.replace(VITE_DEFAULT_AUTHENTICATED_VIEW);
          }
          cleanup();
          resolve();
        };

        // Handle auth error
        const handleError = async ({ message }: { message: string }) => {
          toast.error(`Authentication failed: ${message}`);
          
          // Log authentication failure
          const logger = await loadSessionLogger();
          if (logger) {
            logger.logEvent(logger.SessionEventType.AUTH_LOGIN_FAILURE, {
              method: 'wallet',
              error: message,
              timestamp: Date.now()
            });
          }
          
          cleanup();
          reject(new Error(message));
        };

        // Cleanup function
        const cleanup = () => {
          socketCore.off("auth:challenge-response", handleChallenge);
          socketCore.off("auth:success", handleSuccess);
          socketCore.off("auth:error", handleError);
          console.log("🔴 User intent flag reset to FALSE - auth cleanup");
          userIntentToSignIn.value = false; // Reset user intent flag
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
      // Don't reset userIntentToSignIn here - let the cleanup function handle it
      // after the Promise resolves/rejects
    }
  }

  async function signOut() {
    try {
      // Log logout event
      const logger = await loadSessionLogger();
      if (logger) {
        logger.logEvent(logger.SessionEventType.AUTH_LOGOUT, {
          walletAddress: walletAddress.value,
          timestamp: Date.now()
        });
      }
      
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
    ui.setLoadingDots(true);
    try {
      await validateStoredToken();
    } finally {
      loading.value = false;
      ui.setLoadingDots(false);
    }
  }

  // 🎭 Admin impersonation methods
  async function startImpersonation(targetWalletAddress: string) {
    if (!isAdmin.value) {
      toast.error("Admin access required for impersonation");
      throw new Error("Admin access required");
    }

    if (isImpersonating.value) {
      toast.error("Already impersonating a user");
      throw new Error("Already impersonating");
    }

    try {
      // Store the original admin user
      originalUser.value = { ...user.value };
      
      // Validate the target user exists via API
      const response = await api.post("/api/admin/impersonation/validate", {
        walletAddress: targetWalletAddress
      });

      if (!response.data.valid) {
        throw new Error(response.data.message || "Cannot impersonate this user");
      }

      // Set the target user data
      viewingAsUser.value = response.data.user;
      isImpersonating.value = true;

      // Notify socket server about impersonation
      const socketCore = useSocketCore();
      if (socketCore.connected) {
        socketCore.emit("admin:start-impersonation", { targetWalletAddress });
      }

      toast.success(`Now viewing as ${targetWalletAddress.slice(0, 8)}...`);
    } catch (error: any) {
      console.error("Failed to start impersonation:", error);
      toast.error(error.message || "Failed to start impersonation");
      throw error;
    }
  }

  async function stopImpersonation() {
    if (!isImpersonating.value) {
      return;
    }

    try {
      // Notify socket server about stopping impersonation
      const socketCore = useSocketCore();
      if (socketCore.connected) {
        socketCore.emit("admin:stop-impersonation");
      }

      // Clear impersonation state
      originalUser.value = null;
      viewingAsUser.value = null;
      isImpersonating.value = false;

      toast.success("Stopped impersonation - back to admin view");
    } catch (error: any) {
      console.error("Failed to stop impersonation:", error);
      toast.error("Failed to stop impersonation");
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
    isAdmin,
    isArtist,
    isSubscriber,
    isPaidTier,
    isArtistOrAdmin,
    userRole,
    signIn,
    signOut,
    initialize,
    // 🎭 Impersonation
    currentUser,
    originalUser: computed(() => originalUser.value),
    viewingAsUser: computed(() => viewingAsUser.value),
    isImpersonating: computed(() => isImpersonating.value),
    startImpersonation,
    stopImpersonation,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuth, import.meta.hot));
}