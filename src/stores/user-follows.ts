import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, computed } from "vue";
import { api } from "../api/client";
import { useToast } from "./toast";
import { useAuth } from "./auth";
import { useSocketCore } from "./socket-core";

export const useUserFollows = defineStore("userFollows", () => {
  const auth = useAuth();
  const toast = useToast();
  const socket = useSocketCore();
  
  // Store follow statuses keyed by wallet address
  const followStatuses = ref<Record<string, boolean>>({});
  const followerCounts = ref<Record<string, number>>({});
  const followingCounts = ref<Record<string, number>>({});
  const loading = ref<Record<string, boolean>>({});

  /**
   * Check if current user is following target user
   */
  async function checkFollowStatus(walletAddress: string): Promise<boolean> {
    if (!auth.isAuthenticated) return false;
    
    try {
      const response = await api.get(`/users/follow/status/${walletAddress}`);
      const isFollowing = response.data.isFollowing;
      followStatuses.value[walletAddress] = isFollowing;
      return isFollowing;
    } catch (error) {
      console.error("Failed to check follow status:", error);
      return false;
    }
  }

  /**
   * Get follower count for a user
   */
  async function getFollowerCount(walletAddress: string): Promise<number> {
    try {
      const response = await api.get(`/users/${walletAddress}/followers`);
      const count = response.data.followerCount;
      followerCounts.value[walletAddress] = count;
      return count;
    } catch (error) {
      console.error("Failed to get follower count:", error);
      return 0;
    }
  }

  /**
   * Get following count for a user
   */
  async function getFollowingCount(walletAddress: string): Promise<number> {
    try {
      const response = await api.get(`/users/${walletAddress}/following`);
      const count = response.data.followingCount;
      followingCounts.value[walletAddress] = count;
      return count;
    } catch (error) {
      console.error("Failed to get following count:", error);
      return 0;
    }
  }

  /**
   * Follow a user
   */
  async function followUser(walletAddress: string): Promise<boolean> {
    if (!auth.isAuthenticated) {
      toast.error("Please sign in to follow users");
      return false;
    }

    if (loading.value[walletAddress]) return false;

    try {
      loading.value[walletAddress] = true;
      
      // Emit real-time socket event ⚡
      socket.emit("social:follow-user", {
        targetWalletAddress: walletAddress,
        timestamp: Date.now(),
      });
      
      await api.post(`/users/follow/${walletAddress}`);
      
      // Update local state
      followStatuses.value[walletAddress] = true;
      
      // Update follower count
      if (followerCounts.value[walletAddress] !== undefined) {
        followerCounts.value[walletAddress]++;
      }
      
      toast.success("Successfully followed user");
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to follow user";
      toast.error(message);
      return false;
    } finally {
      loading.value[walletAddress] = false;
    }
  }

  /**
   * Unfollow a user
   */
  async function unfollowUser(walletAddress: string): Promise<boolean> {
    if (!auth.isAuthenticated) {
      toast.error("Please sign in to unfollow users");
      return false;
    }

    if (loading.value[walletAddress]) return false;

    try {
      loading.value[walletAddress] = true;
      
      // Emit real-time socket event ⚡
      socket.emit("social:unfollow-user", {
        targetWalletAddress: walletAddress,
        timestamp: Date.now(),
      });
      
      await api.delete(`/users/follow/${walletAddress}`);
      
      // Update local state
      followStatuses.value[walletAddress] = false;
      
      // Update follower count
      if (followerCounts.value[walletAddress] !== undefined) {
        followerCounts.value[walletAddress]--;
      }
      
      toast.success("Successfully unfollowed user");
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to unfollow user";
      toast.error(message);
      return false;
    } finally {
      loading.value[walletAddress] = false;
    }
  }

  /**
   * Load user's social stats
   */
  async function loadUserStats(walletAddress: string): Promise<void> {
    await Promise.all([
      getFollowerCount(walletAddress),
      getFollowingCount(walletAddress),
      auth.isAuthenticated ? checkFollowStatus(walletAddress) : Promise.resolve(false)
    ]);
  }

  // Computed getters
  const isFollowing = computed(() => (walletAddress: string) => {
    return followStatuses.value[walletAddress] || false;
  });

  const isLoading = computed(() => (walletAddress: string) => {
    return loading.value[walletAddress] || false;
  });

  const getFollowers = computed(() => (walletAddress: string) => {
    return followerCounts.value[walletAddress] || 0;
  });

  const getFollowing = computed(() => (walletAddress: string) => {
    return followingCounts.value[walletAddress] || 0;
  });

  // Helper to format activity feed for display
  const getFormattedActivityFeed = computed(() => {
    return socialActivityFeed.value.map(activity => ({
      ...activity,
      timeAgo: formatTimeAgo(activity.timestamp),
      activityText: formatActivityText(activity),
    }));
  });

  // Format activity into human readable text
  function formatActivityText(activity: any): string {
    const wallet = activity.walletAddress.slice(0, 8) + "...";
    
    // Map activity types to readable text
    if (activity.activityType === 1) { // LISTENING
      if (activity.trackInfo) {
        return `${wallet} is listening to ${activity.trackInfo}`;
      }
      return `${wallet} is listening to music`;
    } else if (activity.activityType === 2) { // VISUALIZING
      return `${wallet} is creating visual art`;
    } else if (activity.activityType === 3) { // COLLABORATING
      return `${wallet} is collaborating on a project`;
    } else {
      return `${wallet} is browsing`;
    }
  }

  // Format timestamp to relative time
  function formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  // 🔥⚡ REAL-TIME SOCKET EVENT LISTENERS ⚡🔥
  
  // Listen for follow notifications (when someone follows YOU)
  socket.on("social:follow-notification", (data: {
    followerWalletAddress: string;
    timestamp: number;
    followerCount: number;
  }) => {
    // Update your own follower count if we have it cached
    if (auth.walletAddress && followerCounts.value[auth.walletAddress] !== undefined) {
      followerCounts.value[auth.walletAddress] = data.followerCount;
    }
    
    // Show toast notification
    toast.success(`New follower: ${data.followerWalletAddress.slice(0, 8)}...`);
    
    console.log(`🎉 NEW FOLLOWER: ${data.followerWalletAddress.slice(0, 8)}...`);
  });

  // Listen for unfollow notifications (when someone unfollows YOU)
  socket.on("social:unfollow-notification", (data: {
    unfollowerWalletAddress: string;
    timestamp: number;
    followerCount: number;
  }) => {
    // Update your own follower count if we have it cached
    if (auth.walletAddress && followerCounts.value[auth.walletAddress] !== undefined) {
      followerCounts.value[auth.walletAddress] = data.followerCount;
    }
    
    console.log(`💔 UNFOLLOWER: ${data.unfollowerWalletAddress.slice(0, 8)}...`);
  });

  // Listen for social follow errors
  socket.on("social:follow-error", (error: { message: string; code?: string }) => {
    toast.error(error.message);
    console.error("Social follow error:", error);
  });

  // 🔥⚡ SOCIAL ACTIVITY FEED EVENTS ⚡🔥
  
  // Store for social activity feed (latest activities from followed users)
  const socialActivityFeed = ref<Array<{
    id: string;
    walletAddress: string;
    activityType: number;
    page: number;
    audioSource?: number;
    trackInfo?: string;
    timestamp: number;
  }>>([]);

  // Listen for follower activity updates (people you follow)
  socket.on("social:follower-activity", (data: {
    walletAddress: string;
    activityType: number;
    page: number;
    audioSource?: number;
    trackInfo?: string;
    timestamp: number;
  }) => {
    // Add to activity feed
    const feedItem = {
      id: `activity_${data.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
    };
    
    socialActivityFeed.value.unshift(feedItem);
    
    // Keep only last 50 activities to prevent memory bloat
    if (socialActivityFeed.value.length > 50) {
      socialActivityFeed.value = socialActivityFeed.value.slice(0, 50);
    }
    
    console.log(`🎯 ACTIVITY UPDATE: ${data.walletAddress.slice(0, 8)}... - ${data.activityType}`);
  });

  return {
    // State
    followStatuses,
    followerCounts,
    followingCounts,
    loading,
    socialActivityFeed,
    
    // Actions
    checkFollowStatus,
    getFollowerCount,
    getFollowingCount,
    followUser,
    unfollowUser,
    loadUserStats,
    
    // Computed
    isFollowing,
    isLoading,
    getFollowers,
    getFollowing,
    getFormattedActivityFeed,
    
    // Utility functions
    formatActivityText,
    formatTimeAgo,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserFollows, import.meta.hot));
}