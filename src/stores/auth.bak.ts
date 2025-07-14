import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, computed, watch } from "vue";
import { createAppKit, useAppKit, useAppKitAccount, useAppKitState, useAppKitProvider, useDisconnect } from "@reown/appkit/vue";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { mainnet, arbitrum, base, solana } from "@reown/appkit/networks";
import bs58 from "bs58";
import { useRouter, useRoute } from "../router/sage-router";
import { api } from "../api/client";
import { useToast } from "./toast";
import { useSocketCore } from "./socket-core";
import { useUI } from "./ui";
import { VITE_DEFAULT_AUTHENTICATED_VIEW, VITE_ADMIN_WALLET, VITE_REOWN_PROJECT_ID } from "../constants/env";
import { UserRole } from "@wearesage/shared";

let appKitInitialized = false;

export const useAuth = defineStore("auth", () => {
  // --- Wallet / AppKit Initialization ---
  if (!appKitInitialized) {
    const wagmiAdapter = new WagmiAdapter({
      networks: [mainnet, arbitrum, base],
      projectId: VITE_REOWN_PROJECT_ID,
    });
    const solanaAdapter = new SolanaAdapter({
      networks: [solana],
      projectId: VITE_REOWN_PROJECT_ID,
    });
    createAppKit({
      adapters: [wagmiAdapter, solanaAdapter],
      networks: [mainnet, arbitrum, base, solana],
      projectId: VITE_REOWN_PROJECT_ID,
      metadata: {
        name: "Kaleidosync",
        description: "WebGL Music Visualizer",
        url: window.location.origin,
        icons: ["https://kaleidosync.com/favicon.png"],
      },
      features: {
        email: true,
        socials: ["google", "discord", "github"],
        emailShowWallets: true,
        onramp: true,
        swaps: true,
      },
    });
    appKitInitialized = true;
  }

  const { open: openWalletModal, close: closeWalletModal } = useAppKit();
  const account = useAppKitAccount();
  const appKitState = useAppKitState();
  const { disconnect: disconnectWalletProvider } = useDisconnect();
  const eip155Provider = useAppKitProvider("eip155");
  const solanaProvider = useAppKitProvider("solana");

  const isWalletInitializing = ref(true);
  watch(
    account,
    () => {
      isWalletInitializing.value = false;
    },
    { immediate: true, deep: true }
  );

  const isWalletConnected = computed(() => account.value?.isConnected || false);
  const walletAddress = computed(() => account.value?.address || null);
  const isModalOpen = computed(() => appKitState.open || false);
  const chainType = computed(() => {
    const addr = walletAddress.value;
    if (!addr) return null;
    if (addr.startsWith("0x") && addr.length === 42) return "evm";
    if (addr.length >= 32 && addr.length <= 44) return "solana";
    return "unknown";
  });
  const connectionType = computed(() => (!isWalletConnected.value ? null : account.value.embeddedWalletInfo ? "social" : "wallet"));
  const email = computed(() => account.value?.embeddedWalletInfo?.user?.email || null);

  async function waitForProvider(maxWait = 2000) {
    const start = Date.now();
    return new Promise((resolve) => {
      (function poll() {
        if (
          (chainType.value === "evm" && eip155Provider.walletProvider) ||
          (chainType.value === "solana" && solanaProvider.walletProvider)
        ) {
          resolve(true);
        } else if (Date.now() - start > maxWait) {
          resolve(false);
        } else {
          setTimeout(poll, 50);
        }
      })();
    });
  }

  async function signMessage(message) {
    if (!isWalletConnected.value || !walletAddress.value) {
      throw new Error("Wallet not connected");
    }
    const ready = await waitForProvider();
    if (!ready) throw new Error("Provider not available");

    let signature;
    if (chainType.value === "evm") {
      signature = await eip155Provider.walletProvider.request({
        method: "personal_sign",
        params: [message, walletAddress.value],
      });
    } else if (chainType.value === "solana") {
      const encoded = new TextEncoder().encode(message);
      const res = await solanaProvider.walletProvider.signMessage(encoded);
      const raw = res.signature || res;
      signature = raw instanceof Uint8Array ? bs58.encode(raw) : raw;
    } else {
      throw new Error("Unsupported chain for signing");
    }
    return signature;
  }

  // --- Auth / Pinia State ---
  const router = useRouter();
  const route = useRoute();
  const toast = useToast();
  const ui = useUI();

  const authToken = ref(localStorage.getItem("authToken"));
  const refreshToken = ref(localStorage.getItem("refreshToken"));
  const user = ref(JSON.parse(localStorage.getItem("user") || "null"));
  const originalUser = ref(JSON.parse(localStorage.getItem("originalUser") || "null"));
  const viewingAsUser = ref(JSON.parse(localStorage.getItem("viewingAsUser") || "null"));
  const isImpersonating = ref(localStorage.getItem("isImpersonating") === "true");
  const loading = ref(false);
  const isAuthenticating = ref(false);
  const userIntentToSignIn = ref(false);

  const isAuthenticated = computed(() => !!authToken.value && !!user.value);
  const currentUser = computed(() => (isImpersonating.value && viewingAsUser.value ? viewingAsUser.value : user.value));
  const isAdmin = computed(
    () =>
      isAuthenticated.value && (currentUser.value?.walletAddress || "") === VITE_ADMIN_WALLET && currentUser.value?.role === UserRole.ADMIN
  );
  const isArtist = computed(() => isAuthenticated.value && currentUser.value?.role === UserRole.ARTIST);
  const isSubscriber = computed(() => isAuthenticated.value && currentUser.value?.role === UserRole.SUBSCRIBER);
  const isPaidTier = computed(
    () => isAuthenticated.value && [UserRole.SUBSCRIBER, UserRole.ARTIST, UserRole.ADMIN].includes(currentUser.value?.role)
  );
  const isArtistOrAdmin = computed(() => isAuthenticated.value && [UserRole.ARTIST, UserRole.ADMIN].includes(currentUser.value?.role));
  const userRole = computed(() => {
    if (!isAuthenticated.value) return null;
    return UserRole[currentUser.value.role] || "UNKNOWN";
  });

  // Persist to localStorage
  watch(authToken, (val) => (val ? localStorage.setItem("authToken", val) : localStorage.removeItem("authToken")));
  watch(refreshToken, (val) => (val ? localStorage.setItem("refreshToken", val) : localStorage.removeItem("refreshToken")));
  watch(user, (val) => (val ? localStorage.setItem("user", JSON.stringify(val)) : localStorage.removeItem("user")), { deep: true });
  watch(
    originalUser,
    (val) => (val ? localStorage.setItem("originalUser", JSON.stringify(val)) : localStorage.removeItem("originalUser")),
    { deep: true }
  );
  watch(
    viewingAsUser,
    (val) => (val ? localStorage.setItem("viewingAsUser", JSON.stringify(val)) : localStorage.removeItem("viewingAsUser")),
    { deep: true }
  );
  watch(isImpersonating, (val) => (val ? localStorage.setItem("isImpersonating", "true") : localStorage.removeItem("isImpersonating")));

  function clearAuthState() {
    authToken.value = null;
    refreshToken.value = null;
    user.value = null;
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  async function validateStoredToken() {
    const token = authToken.value;
    if (!token) return false;
    try {
      const socket = useSocketCore();
      if (!socket.connected) await socket.connect();
      await socket.waitForConnection();
      return new Promise((resolve) => {
        let settled = false;
        const timeout = setTimeout(async () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          try {
            const resp = await api.get("/api/auth/validate");
            if (resp.data.user) {
              user.value = resp.data.user;
              resolve(true);
            } else {
              resolve(false);
            }
          } catch {
            clearAuthState();
            resolve(false);
          }
        }, 5000);

        socket.on("auth:success", ({ user: u }) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          user.value = u;
          resolve(true);
        });
        socket.on("auth:invalid", () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          clearAuthState();
          resolve(false);
        });
        socket.emit("auth:validate-token", token);
      });
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async function connectWallet() {
    if (isWalletConnected.value) await disconnectWalletProvider();
    await openWalletModal();
    if (!isWalletConnected.value) throw new Error("Wallet connection failed");
  }

  async function signIn() {
    // 1. if they’ve never connected, just open the modal
    if (!isWalletConnected.value) {
      await connectWallet();
      return; // they cancelled
    }
    userIntentToSignIn.value = true;
    isAuthenticating.value = true;
    try {
      const { message } = (await api.post("/api/auth/challenge", { address: walletAddress.value })).data;
      const signature = await signMessage(message);
      const { user: u, tokens } = (await api.post("/api/auth/verify", { message, signature, address: walletAddress.value })).data;
      authToken.value = tokens.accessToken;
      refreshToken.value = tokens.refreshToken;
      user.value = u;
      if (route.path === "/") router.replace(VITE_DEFAULT_AUTHENTICATED_VIEW);
    } catch (e) {
      throw e;
    } finally {
      isAuthenticating.value = false;
      userIntentToSignIn.value = false;
    }
  }

  async function signOut() {
    try {
      // 1️⃣ Tell your socket/server you’re out
      const socket = useSocketCore();
      socket.emit("auth:logout");

      // 2️⃣ Fire the HTTP logout as a fallback
      await api.post("/api/auth/logout").catch(() => {});
    } finally {
      // 3️⃣ Disconnect from whatever wallet is attached
      await disconnectWalletProvider();

      // 4️⃣ If the modal is still open for some reason, close it
      closeWalletModal();

      // 5️⃣ Wipe all your auth bits & localStorage
      clearAuthState();

      // 6️⃣ Reset impersonation
      originalUser.value = null;
      viewingAsUser.value = null;
      isImpersonating.value = false;

      // 7️⃣ Redirect home
      router.replace("/");
    }
  }

  async function startImpersonation(target) {
    if (!isAdmin.value) throw new Error("Admin required");
    originalUser.value = { ...user.value };
    const { valid, user: u } = (await api.post("/api/admin/impersonation/validate", { walletAddress: target })).data;
    if (!valid) throw new Error("Cannot impersonate");
    viewingAsUser.value = u;
    isImpersonating.value = true;
    useSocketCore().emit("admin:start-impersonation", { target });
  }

  async function stopImpersonation() {
    useSocketCore().emit("admin:stop-impersonation");
    originalUser.value = null;
    viewingAsUser.value = null;
    isImpersonating.value = false;
  }

  async function initialize() {
    loading.value = true;
    ui.setLoadingDots(true);
    await validateStoredToken();
    loading.value = false;
    ui.setLoadingDots(false);
  }

  return {
    // Wallet
    isWalletConnected,
    walletAddress,
    chainType,
    connectionType,
    email,
    isModalOpen,
    isWalletInitializing,
    openWalletModal,
    closeWalletModal,
    disconnectWalletProvider,
    signMessage,
    connectWallet,
    // Auth
    authToken,
    refreshToken,
    user,
    isAuthenticated,
    isAdmin,
    isArtist,
    isSubscriber,
    isPaidTier,
    isArtistOrAdmin,
    userRole,
    loading,
    isAuthenticating,
    signIn,
    signOut,
    initialize,
    startImpersonation,
    stopImpersonation,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuth, import.meta.hot));
}
