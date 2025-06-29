import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { io, Socket } from "socket.io-client";

export const useSocketCore = defineStore("socket-core", () => {
  // Core connection state
  const socket = ref<Socket | null>(null);
  const connected = ref(false);
  const connecting = ref(false);
  const serverUrl = ref(import.meta.env.VITE_SOCKET_URL);

  // Heartbeat management
  let heartbeatInterval: number | null = null;

  // Connection management
  const connect = async (url?: string) => {
    if (socket.value?.connected) {
      console.log("🔌 Already connected to socket server");
      return socket.value;
    }

    if (url) serverUrl.value = url;
    connecting.value = true;

    try {
      socket.value = io(serverUrl.value, {
        transports: ["websocket", "polling"],
        autoConnect: true,
      });

      // Basic connection event handlers
      socket.value.on("connect", () => {
        connected.value = true;
        connecting.value = false;
        console.log("🔗 Connected to socket server:", socket.value?.id);
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
    }
  };

  // Generic event handlers
  const on = (event: string, handler: (...args: any[]) => void) => {
    if (!socket.value) {
      console.warn("🚫 Cannot add event handler - socket not connected");
      return;
    }
    socket.value.on(event, handler);
  };

  const off = (event: string, handler?: (...args: any[]) => void) => {
    if (!socket.value) return;
    socket.value.off(event, handler);
  };

  const emit = (event: string, ...args: any[]) => {
    if (!socket.value?.connected) {
      console.warn("🚫 Cannot emit - socket not connected");
      return false;
    }
    socket.value.emit(event, ...args);
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

    // Utils
    waitForConnection,
  };
});
