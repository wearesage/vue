import { ref, onUnmounted } from "vue";
import { useSocketCore } from "../../stores/socket-core";
import { useAuth } from "../../stores/auth";

/**
 * V2 Targeted Messaging Composable
 * 
 * Implements V2 Pattern 3: Targeted messaging with wallet/source rooms.
 * Clean, simple room-based messaging without the complexity of the old stores.
 * 
 * Features:
 * - ✅ Join wallet-specific rooms for direct notifications
 * - ✅ Join source-specific rooms (spotify, audius, etc) for broadcasts
 * - ✅ Send targeted messages to specific wallets or sources
 * - ✅ Proper room cleanup on unmount
 * - ✅ No EventEmitter abstraction - direct socket events
 */
export function useTargetedMessaging() {
  const socket = useSocketCore();
  const auth = useAuth();
  
  // State
  const joinedRooms = ref<Set<string>>(new Set());
  const notifications = ref<Array<{
    type: string;
    message: string;
    timestamp: number;
  }>>([]);
  
  // Room management
  const joinWalletRoom = async (walletAddress: string) => {
    if (!socket.connected) {
      console.warn("🚫 Cannot join wallet room - socket not connected");
      return false;
    }
    
    const roomName = `wallet:${walletAddress}`;
    socket.emit("user:join-wallet-room", { walletAddress });
    joinedRooms.value.add(roomName);
    console.log(`👤 Joined wallet room: ${walletAddress}`);
    return true;
  };
  
  const joinSourceRoom = async (source: string) => {
    if (!socket.connected) {
      console.warn("🚫 Cannot join source room - socket not connected");
      return false;
    }
    
    const roomName = `source:${source}`;
    socket.emit("user:join-source-room", { source });
    joinedRooms.value.add(roomName);
    console.log(`🎵 Joined source room: ${source}`);
    return true;
  };
  
  const leaveRoom = async (room: string) => {
    if (!socket.connected) {
      console.warn("🚫 Cannot leave room - socket not connected");
      return false;
    }
    
    socket.emit("user:leave-room", { room });
    joinedRooms.value.delete(room);
    console.log(`👋 Left room: ${room}`);
    return true;
  };
  
  // Auto-join user's wallet room when authenticated
  const joinMyWalletRoom = async () => {
    if (auth.isAuthenticated && auth.user?.walletAddress) {
      return await joinWalletRoom(auth.user.walletAddress);
    }
    return false;
  };
  
  // Notification handler
  const handleNotification = (data: {
    type: string;
    message: string;
    timestamp: number;
  }) => {
    notifications.value.unshift(data);
    
    // Keep only last 50 notifications
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50);
    }
    
    console.log(`📬 Received notification: ${data.type} - ${data.message}`);
  };
  
  // Set up notification listener
  socket.on("notification", handleNotification);
  
  // Cleanup on unmount
  onUnmounted(() => {
    // Leave all joined rooms
    for (const room of joinedRooms.value) {
      socket.emit("user:leave-room", { room });
    }
    joinedRooms.value.clear();
    
    // Remove notification listener
    socket.off("notification", handleNotification);
    
    console.log("🧹 Cleaned up targeted messaging on unmount");
  });
  
  return {
    // State (read-only)
    joinedRooms: joinedRooms,
    notifications: notifications,
    
    // Room management
    joinWalletRoom,
    joinSourceRoom,
    leaveRoom,
    joinMyWalletRoom,
    
    // Utilities
    clearNotifications: () => {
      notifications.value = [];
    },
    
    isInRoom: (room: string) => joinedRooms.value.has(room),
    
    getNotificationCount: () => notifications.value.length,
    
    getRecentNotifications: (count: number = 10) => 
      notifications.value.slice(0, count)
  };
}