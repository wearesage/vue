import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, computed, readonly, onBeforeUnmount } from "vue";
import { useSocketCore } from "./socket-core";

export interface DirectMessage {
  id: string;
  fromWalletAddress: string;
  toWalletAddress: string;
  message: string;
  messageType: "text" | "notification" | "system";
  timestamp: number;
  data?: any;
}

export interface NotificationMessage {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: number;
  data?: any;
  read?: boolean;
}

export const useSocketMessaging = defineStore("socket-messaging", () => {
  const socketCore = useSocketCore();

  // Message storage
  const messages = ref<DirectMessage[]>([]);
  const notifications = ref<NotificationMessage[]>([]);
  const messageErrors = ref<string[]>([]);

  // Computed
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.read)
  );

  const unreadNotificationCount = computed(() => unreadNotifications.value.length);

  const getMessagesByUser = computed(() => (walletAddress: string) => 
    messages.value.filter(m => 
      m.fromWalletAddress === walletAddress || m.toWalletAddress === walletAddress
    ).sort((a, b) => a.timestamp - b.timestamp)
  );

  // Setup event listeners
  const setupMessagingListeners = () => {
    if (!socketCore.socket) {
      console.warn("🚫 Cannot setup messaging listeners - socket not connected");
      return;
    }

    // Incoming direct messages
    socketCore.on("user-message:received", (data: {
      fromWalletAddress: string;
      message: string;
      messageType: "text" | "notification" | "system";
      messageId: string;
      timestamp: number;
      data?: any;
    }) => {
      console.log("📬 Received direct message from:", data.fromWalletAddress);
      
      const message: DirectMessage = {
        id: data.messageId,
        fromWalletAddress: data.fromWalletAddress,
        toWalletAddress: "self", // We're the recipient
        message: data.message,
        messageType: data.messageType,
        timestamp: data.timestamp,
        data: data.data
      };

      messages.value.push(message);
      
      // Emit custom event for UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('directMessageReceived', { 
          detail: message 
        }));
      }
    });

    // Incoming notifications
    socketCore.on("notification:received", (data: {
      id: string;
      type: "info" | "success" | "warning" | "error";
      title: string;
      message: string;
      timestamp: number;
      data?: any;
    }) => {
      console.log("🔔 Received notification:", data.title);
      
      const notification: NotificationMessage = {
        ...data,
        read: false
      };

      notifications.value.unshift(notification); // Add to beginning for latest first
      
      // Emit custom event for UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notificationReceived', { 
          detail: notification 
        }));
      }
    });

    // Message sending errors
    socketCore.on("user-message:error", (error: { message: string; code?: string }) => {
      console.error("❌ Message error:", error.message);
      messageErrors.value.push(error.message);
      
      // Auto-remove error after 5 seconds
      setTimeout(() => {
        const index = messageErrors.value.indexOf(error.message);
        if (index > -1) {
          messageErrors.value.splice(index, 1);
        }
      }, 5000);
    });

    console.log("📡 Messaging listeners setup complete");
  };

  // Actions
  const sendMessage = (toWalletAddress: string, message: string, messageType: "text" | "notification" | "system" = "text", data?: any) => {
    if (!socketCore.connected) {
      console.warn("🚫 Cannot send message - socket not connected");
      return false;
    }

    const messageData = {
      toWalletAddress,
      message,
      messageType,
      timestamp: Date.now(),
      data: data || {}
    };

    socketCore.emit("user-message:send", messageData);
    
    // Add to local messages for immediate UI feedback
    const localMessage: DirectMessage = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromWalletAddress: "self", // We're the sender
      toWalletAddress,
      message,
      messageType,
      timestamp: messageData.timestamp,
      data: messageData.data
    };

    messages.value.push(localMessage);
    
    console.log(`📤 Sent message to ${toWalletAddress.slice(0, 8)}...`);
    return true;
  };

  const markNotificationRead = (notificationId: string) => {
    const notification = notifications.value.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  };

  const markAllNotificationsRead = () => {
    notifications.value.forEach(notification => {
      notification.read = true;
    });
  };

  const clearNotifications = () => {
    notifications.value = [];
  };

  const clearMessages = () => {
    messages.value = [];
  };

  const clearMessageErrors = () => {
    messageErrors.value = [];
  };

  const removeOldMessages = (olderThanMs = 24 * 60 * 60 * 1000) => {
    const cutoffTime = Date.now() - olderThanMs;
    messages.value = messages.value.filter(m => m.timestamp > cutoffTime);
  };

  const removeOldNotifications = (olderThanMs = 7 * 24 * 60 * 60 * 1000) => {
    const cutoffTime = Date.now() - olderThanMs;
    notifications.value = notifications.value.filter(n => n.timestamp > cutoffTime);
  };

  // Clean up all messaging-related socket event listeners
  const removeAllMessagingListeners = () => {
    if (!socketCore.socket) return;

    socketCore.off("user-message:received");
    socketCore.off("notification:received");
    socketCore.off("user-message:error");
    
    console.log("🧹 Removed all messaging socket event listeners");
  };

  // Cleanup on component unmount
  onBeforeUnmount(() => {
    console.log("🧹 Messaging store unmounting - cleaning up");
    
    // Remove all socket event listeners
    removeAllMessagingListeners();
    
    // Clear local message state
    messages.value = [];
    notifications.value = [];
    messageErrors.value = [];
  });

  return {
    // State (readonly)
    messages: readonly(messages),
    notifications: readonly(notifications),
    messageErrors: readonly(messageErrors),

    // Computed
    unreadNotifications,
    unreadNotificationCount,
    getMessagesByUser,

    // Actions
    setupMessagingListeners,
    sendMessage,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    clearMessages,
    clearMessageErrors,
    removeOldMessages,
    removeOldNotifications,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSocketMessaging, import.meta.hot));
}