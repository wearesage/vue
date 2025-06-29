import { defineStore } from "pinia";
import { ref, computed, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { api } from "../api/client";
import { useToast } from "./toast";
import { useWallet } from "../composables/auth/useWallet";
import { VITE_DEFAULT_AUTHENTICATED_VIEW } from "../constants/env";

export const useAuth = defineStore("auth", () => {
  const router = useRouter();
  const route = useRoute();
  const toast = useToast();
  const wallet = useWallet();
  const authToken = ref<string | null>(localStorage.getItem("authToken"));
  const refreshToken = ref<string | null>(localStorage.getItem("refreshToken"));
  const user = ref<any>(JSON.parse(localStorage.getItem("user") || "null"));
  const loading = ref(true);
  const isAuthenticating = ref(false);
  const isHydrated = ref(false);
  const hydratedTokenValid = ref(false);

  let _authDetermined: any;

  let authDetermined = new Promise((resolve) => {
    _authDetermined = resolve;
  });

  const isAuthenticated = computed(
    () =>
      (isHydrated.value && hydratedTokenValid.value && !!authToken.value && !!user.value) ||
      (!isHydrated.value && !!authToken.value && !!user.value)
  );

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

  watch(
    isAuthenticated,
    (authenticated) => {
      if (authenticated && route.fullPath === "/") {
        router.replace(VITE_DEFAULT_AUTHENTICATED_VIEW);
      }
    },
    { immediate: true }
  );

  async function validateStoredToken(): Promise<boolean> {
    const token = localStorage.getItem("authToken");

    if (!token) return false;

    try {
      const response = await api.get("/api/auth/validate");

      if (response.data?.user) {
        user.value = response.data.user;
        hydratedTokenValid.value = true;
        return true;
      }

      hydratedTokenValid.value = false;
      return false;
    } catch (error: any) {
      if (error.response?.status === 401) clearAuthState();
      hydratedTokenValid.value = false;
      return false;
    }
  }

  function clearAuthState() {
    authToken.value = null;
    refreshToken.value = null;
    user.value = null;
    hydratedTokenValid.value = false;
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  async function signIn() {
    try {
      isAuthenticating.value = true;
      if (!wallet.isConnected.value) {
        await wallet.connect();
        await new Promise<void>((resolve) => {
          const unwatch = watch(
            () => wallet.isConnected.value,
            (connected) => {
              if (connected) {
                unwatch();
                resolve();
              }
            }
          );

          const unwatchModal = watch(
            () => wallet.isModalOpen.value,
            (isOpen) => {
              if (!isOpen && !wallet.isConnected.value) {
                unwatch();
                unwatchModal();
                resolve();
              }
            }
          );
        });

        if (!wallet.isConnected.value) {
          toast.message("Connection cancelled");
          return;
        }
      }

      toast.message("Getting authentication challenge...");
      const challengeResponse = await api.post("/api/auth/challenge", {
        address: wallet.address.value,
      });

      const { message } = challengeResponse.data;
      toast.message("Please sign the message in your wallet...");

      let signature: string;
      try {
        signature = await wallet.signMessage(message);
      } catch (error: any) {
        if (error.message?.includes("rejected")) {
          await wallet.disconnect();
          toast.error("Signature rejected");
          return;
        }
        throw error;
      }

      toast.message("Verifying signature...");

      const verifyResponse = await api.post("/api/auth/verify", {
        message,
        signature,
        address: wallet.address.value,
      });

      const { accessToken, refreshToken: newRefreshToken, user: userData } = verifyResponse.data;
      authToken.value = accessToken;
      refreshToken.value = newRefreshToken;
      user.value = userData;
      toast.message(`Welcome ${userData.walletAddress.slice(0, 8)}!`);
      console.log("🚀 Sign in successful, redirecting to", VITE_DEFAULT_AUTHENTICATED_VIEW);
      _authDetermined?.(true);
      if (route.fullPath === "/") {
        router.replace(VITE_DEFAULT_AUTHENTICATED_VIEW);
      }
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
      await api.post("/api/auth/logout").catch(() => {});
    } finally {
      clearAuthState();
      await wallet.disconnect();
      toast.message("Signed out successfully");
      router.replace("/");
    }
  }

  async function initialize() {
    try {
      loading.value = true;
      await validateStoredToken();
      isHydrated.value = true;
    } finally {
      loading.value = false;
      if (isAuthenticated.value && route.fullPath === "/") {
        _authDetermined?.(isAuthenticated.value);
        router.replace(VITE_DEFAULT_AUTHENTICATED_VIEW);
      }
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
    authDetermined,
  };
});
