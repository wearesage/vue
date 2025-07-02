import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, computed, toRaw, readonly } from "vue";
import { io, Socket } from "socket.io-client";

export const useSocketCore = defineStore("socket-core", () => {
  // Core connection state
  const socket = ref<Socket | null>(null);
  const connected = ref(false);
  const connecting = ref(false);
  const serverUrl = ref(import.meta.env.VITE_SOCKET_URL);

  // Heartbeat management
  let heartbeatInterval: number | null = null;

  // Browser close detection
  let browserCloseListenersAdded = false;

  // Connection management
  const connect = async (url?: string) => {
    console.log("🔧 connect() called - existing socket:", !!socket.value, "connected:", socket.value?.connected);
    
    // If socket already exists, return it (don't create a new one)
    if (socket.value) {
      console.log("🔌 Socket already exists, waiting for connection...");
      return await waitForConnection();
    }

    if (url) serverUrl.value = url;
    connecting.value = true;

    try {
      console.log("🔧 Creating NEW socket connection to:", serverUrl.value);
      socket.value = io(serverUrl.value, {
        transports: ["websocket", "polling"],
        autoConnect: true,
      });

      // Basic connection event handlers
      socket.value.on("connect", () => {
        connected.value = true;
        connecting.value = false;
        console.log("🔗 Connected to socket server:", socket.value?.id);
        
        // Add browser close detection when socket connects
        addBrowserCloseListeners();
      });

      socket.value.on("disconnect", (reason) => {
        connected.value = false;
        console.log("🔌 Disconnected from socket server:", reason);
      });

      socket.value.on("connect_error", (error) => {
        connecting.value = false;
        console.error("🚫 Socket connection error:", error);
      });

      return socket.value;
    } catch (error) {
      connecting.value = false;
      console.error("Failed to initialize socket connection:", error);
      throw error;
    }
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      connected.value = false;
      connecting.value = false;
      stopHeartbeat();
      removeBrowserCloseListeners();
    }
  };

  // Generic event handlers
  const on = (event: string, handler: (...args: any[]) => void) => {
    if (!socket.value) {
      console.warn("🚫 Cannot add event handler - socket not connected");
      return;
    }
    // Access the raw socket instance to avoid readonly proxy issues
    const rawSocket = toRaw(socket.value);
    rawSocket.on(event, handler);
  };

  const off = (event: string, handler?: (...args: any[]) => void) => {
    if (!socket.value) return;
    const rawSocket = toRaw(socket.value);
    rawSocket.off(event, handler);
  };

  const emit = (event: string, ...args: any[]) => {
    if (!socket.value?.connected) {
      console.warn("🚫 Cannot emit - socket not connected");
      return false;
    }
    const rawSocket = toRaw(socket.value);
    rawSocket.emit(event, ...args);
    return true;
  };

  // Heartbeat system
  const startHeartbeat = (intervalMs = 30000) => {
    if (heartbeatInterval) return;

    heartbeatInterval = window.setInterval(() => {
      if (connected.value) {
        emit("heartbeat");
      }
    }, intervalMs);

    console.log(`💓 Started heartbeat (${intervalMs}ms)`);
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
      console.log("💔 Stopped heartbeat");
    }
  };

  // Browser close detection handlers
  const handleBeforeUnload = () => {
    console.log("🚪 Browser beforeunload - cleaning up socket");
    cleanupOnPageUnload();
  };

  const handlePageHide = () => {
    console.log("🚪 Page pagehide - cleaning up socket");
    cleanupOnPageUnload();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      console.log("👁️ Page hidden - user may be leaving");
      // Only emit offline signal, don't disconnect socket
      // in case user is just switching tabs
      if (socket.value?.connected) {
        emit("user-state:page-hidden");
      }
    } else if (document.visibilityState === 'visible') {
      console.log("👁️ Page visible - user returned");
      if (socket.value?.connected) {
        emit("user-state:page-visible");
      }
    }
  };

  const cleanupOnPageUnload = () => {
    if (socket.value?.connected) {
      // Emit offline signal before disconnect
      const rawSocket = toRaw(socket.value);
      rawSocket.emit("user-state:offline");
      
      // Force immediate disconnect
      rawSocket.disconnect();
      console.log("🧹 Socket disconnected on page unload");
    }
    
    stopHeartbeat();
    removeBrowserCloseListeners();
  };

  const addBrowserCloseListeners = () => {
    if (browserCloseListenersAdded || typeof window === 'undefined') return;
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    browserCloseListenersAdded = true;
    console.log("👂 Added browser close detection listeners");
  };

  const removeBrowserCloseListeners = () => {
    if (!browserCloseListenersAdded || typeof window === 'undefined') return;
    
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('pagehide', handlePageHide);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    
    browserCloseListenersAdded = false;
    console.log("🧹 Removed browser close detection listeners");
  };

  // Utility to wait for connection
  const waitForConnection = (timeoutMs = 5000): Promise<Socket> => {
    return new Promise((resolve, reject) => {
      if (socket.value?.connected) {
        resolve(socket.value);
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("Socket connection timeout"));
      }, timeoutMs);

      const checkConnection = () => {
        if (socket.value?.connected) {
          clearTimeout(timeout);
          resolve(socket.value);
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  };

  return {
    // State (readonly)
    socket: readonly(socket),
    connected: readonly(connected),
    connecting: readonly(connecting),
    serverUrl: readonly(serverUrl),

    // Core actions
    connect,
    disconnect,

    // Event management
    on,
    off,
    emit,

    // Heartbeat
    startHeartbeat,
    stopHeartbeat,

    // Browser close detection
    addBrowserCloseListeners,
    removeBrowserCloseListeners,
    cleanupOnPageUnload,

    // Utils
    waitForConnection,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSocketCore, import.meta.hot));
}
