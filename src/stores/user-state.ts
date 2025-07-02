import { defineStore, storeToRefs, acceptHMRUpdate } from "pinia";
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { useRoute } from "../router/sage-router";
import { useSocketCore } from "./socket-core";
import { useAuth } from "./auth";
import { useSocketProject } from "./socket-project";
import { useSources } from "./sources";
import { useQueue } from "./queue";
import { useSpotify } from "./spotify";
import {
  CurrentPage,
  ActivityType,
  AudioSource,
  UserStateField,
  UserStatus,
  UserPreferences,
  DEFAULT_USER_PREFERENCES,
} from "@wearesage/shared";

// Re-export queue types for backward compatibility
export type { QueueTrack } from "./queue";
export { RepeatMode } from "./queue";

/**
 * Streamlined user state management and broadcasting
 *
 * Responsibilities:
 * - Track current page/route changes
 * - Broadcast user activity to server (ALWAYS)
 * - Manage audio state for broadcasting (source, track, position)
 * - Handle activity type updates
 * - Handle socket upgrade from anonymous to authenticated
 * - Manage user preferences with socket-based persistence
 *
 * Note: Queue management is now handled by the dedicated useQueue store
 */
export const useUserState = defineStore("userState", () => {
  const route = useRoute();
  const socket = useSocketCore();
  const auth = useAuth();
  const sources = useSources();
  const queueStore = useQueue();

  // Current state
  const currentPage = ref<CurrentPage>(CurrentPage.HOME);
  const activityType = ref<ActivityType>(ActivityType.BROWSING);
  const audioSource = ref<AudioSource>(AudioSource.NONE);
  const audioTrack = ref<string | undefined>();
  const audioPosition = ref<number | undefined>();
  const geoLocation = ref<{ lat: number; lng: number } | undefined>();
  
  // Additional context state
  const deviceType = ref<"desktop" | "mobile" | "tablet">(
    /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) 
      ? (/iPad|tablet/.test(navigator.userAgent) ? "tablet" : "mobile")
      : "desktop"
  );
  const clientPlatform = ref<"web" | "electron" | "mobile">("web"); // Detect platform context
  const currentShaderId = ref<string | undefined>();
  const currentProjectId = ref<string | undefined>();

  // User preferences state
  const preferences = ref<UserPreferences>({ ...DEFAULT_USER_PREFERENCES });
  const isPreferencesLoaded = ref(false);
  const isSavingPreferences = ref(false);

  // Computed
  const isOnHomepage = computed(() => currentPage.value === CurrentPage.HOME);

  // Computed getters for preferences with setters
  const disableFlashing = computed({
    get: () => preferences.value.disableFlashing,
    set: (value: boolean) => updatePreference("disableFlashing", value),
  });

  const neonMode = computed({
    get: () => preferences.value.neonMode,
    set: (value: boolean) => updatePreference("neonMode", value),
  });

  const showMenuLabels = computed({
    get: () => preferences.value.showMenuLabels,
    set: (value: boolean) => updatePreference("showMenuLabels", value),
  });

  const alwaysShowTrack = computed({
    get: () => preferences.value.alwaysShowTrack,
    set: (value: boolean) => updatePreference("alwaysShowTrack", value),
  });

  const shuffleDesigns = computed({
    get: () => preferences.value.shuffleDesigns,
    set: (value: boolean) => updatePreference("shuffleDesigns", value),
  });

  const infinityPlay = computed({
    get: () => preferences.value.infinityPlay,
    set: (value: boolean) => updatePreference("infinityPlay", value),
  });

  const visualizerSpeed = computed({
    get: () => preferences.value.visualizerSpeed,
    set: (value: number) => updatePreference("visualizerSpeed", value),
  });

  const preferLossless = computed({
    get: () => preferences.value.preferLossless,
    set: (value: boolean) => updatePreference("preferLossless", value),
  });

  // Read-only preference computed values (managed elsewhere)
  const preferenceAudioSource = computed(() => preferences.value.audioSource);
  const lastTrack = computed(() => preferences.value.lastTrack);

  // Debounced preference updates
  let preferenceUpdateTimeout: number | null = null;
  const PREFERENCE_DEBOUNCE_MS = 500; // Wait 500ms before saving to server

  // Throttled user state broadcasts
  let lastBroadcastTime = 0;
  const BROADCAST_THROTTLE_MS = 1000; // Max one broadcast per second

  /**
   * Update a single preference field with debounced server save
   */
  function updatePreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    // Update local state immediately for responsiveness
    preferences.value = { ...preferences.value, [key]: value };

    // Debounce server updates to avoid spam
    if (preferenceUpdateTimeout) {
      clearTimeout(preferenceUpdateTimeout);
    }

    preferenceUpdateTimeout = window.setTimeout(() => {
      savePreferences();
    }, PREFERENCE_DEBOUNCE_MS);
  }

  /**
   * Save preferences to server via socket
   */
  async function savePreferences() {
    if (!auth.isAuthenticated || !socket.connected) {
      console.warn("🎛️ Cannot save preferences - not authenticated or connected");
      return;
    }

    try {
      isSavingPreferences.value = true;
      socket.emit("user-state:update-preferences", preferences.value);
      console.log("🎛️ Saving preferences to server...", preferences.value);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      isSavingPreferences.value = false;
    }
  }

  /**
   * Load preferences from auth response or socket event
   */
  function loadPreferences(userPreferences: UserPreferences) {
    preferences.value = { ...DEFAULT_USER_PREFERENCES, ...userPreferences };
    isPreferencesLoaded.value = true;
    console.log("🎛️ Loaded preferences:", preferences.value);
  }

  /**
   * Map Vue Router route names to CurrentPage enum
   */
  function mapRouteToPage(routeName: string | null | undefined): CurrentPage {
    if (!routeName) return CurrentPage.HOME;

    const routeMap: Record<string, CurrentPage> = {
      // Common pages
      Homepage: CurrentPage.HOME,
      index: CurrentPage.HOME,
      "/": CurrentPage.HOME,
      Visualizer: CurrentPage.VISUALIZER,
      Sketches: CurrentPage.SKETCHES,
      Studies: CurrentPage.STUDIES,
      Profile: CurrentPage.PROFILE,
      Settings: CurrentPage.SETTINGS,

      // Admin pages
      Dashboard: CurrentPage.DASHBOARD,
      Projects: CurrentPage.PROJECTS,
      "Project Detail": CurrentPage.PROJECT_DETAIL,

      // UI pages
      Design: CurrentPage.DESIGN,
      Gist: CurrentPage.GIST,
      "Audius Home": CurrentPage.AUDIUS_HOME,
      "Audius Playlist Detail": CurrentPage.AUDIUS_PLAYLIST_DETAIL,
      "Audius User Detail": CurrentPage.AUDIUS_USER_DETAIL,
      "Page Not Found": CurrentPage.PAGE_NOT_FOUND,
    };

    return routeMap[routeName] || CurrentPage.HOME;
  }

  /**
   * Broadcast current user state to server
   * Works for both authenticated and anonymous users
   */
  async function broadcastUserState() {
    if (!socket.connected) {
      return;
    }

    // Throttle broadcasts to prevent spam
    const now = Date.now();
    if (now - lastBroadcastTime < BROADCAST_THROTTLE_MS) {
      return;
    }
    lastBroadcastTime = now;

    const stateUpdate = {
      [UserStateField.PAGE]: currentPage.value,
      [UserStateField.ACTIVITY_TYPE]: activityType.value,
      [UserStateField.AUDIO_SOURCE]: audioSource.value,
      [UserStateField.DEVICE_TYPE]: deviceType.value === "desktop" ? 0 : deviceType.value === "mobile" ? 1 : 2,
      [UserStateField.CLIENT_PLATFORM]: clientPlatform.value === "web" ? 0 : clientPlatform.value === "electron" ? 1 : 2,
      ...(audioTrack.value && { [UserStateField.AUDIO_TRACK]: audioTrack.value }),
      ...(audioPosition.value !== undefined && { [UserStateField.AUDIO_POSITION]: audioPosition.value }),
      ...(currentShaderId.value && { [UserStateField.SHADER_ID]: currentShaderId.value }),
      ...(currentProjectId.value && { [UserStateField.PROJECT_ID]: currentProjectId.value }),
      ...(geoLocation.value && {
        [UserStateField.GEO_LAT]: geoLocation.value.lat,
        [UserStateField.GEO_LNG]: geoLocation.value.lng,
      }),
    };

    socket.emit("user-state:update", stateUpdate);
  }

  /**
   * Set user online with initial state
   * Works for both authenticated and anonymous users
   */
  async function setUserOnline() {
    if (!socket.connected) {
      return;
    }

    const initialState = {
      status: UserStatus.ONLINE,
      page: currentPage.value,
      activityType: activityType.value,
      audioSource: audioSource.value,
      deviceType: deviceType.value === "desktop" ? 0 : deviceType.value === "mobile" ? 1 : 2,
      clientPlatform: clientPlatform.value === "web" ? 0 : clientPlatform.value === "electron" ? 1 : 2,
      ...(audioTrack.value && { audioTrack: audioTrack.value }),
      ...(audioPosition.value !== undefined && { audioPosition: audioPosition.value }),
      ...(currentShaderId.value && { shaderId: currentShaderId.value }),
      ...(currentProjectId.value && { projectId: currentProjectId.value }),
      ...(geoLocation.value && {
        geoLat: geoLocation.value.lat,
        geoLng: geoLocation.value.lng,
      }),
    };

    socket.emit("user-state:online", initialState);
  }

  /**
   * Set user offline
   * Works for both authenticated and anonymous users
   */
  async function setUserOffline() {
    if (!socket.connected) {
      return;
    }

    socket.emit("user-state:offline");
  }

  /**
   * Update audio state (source, track, position)
   */
  function updateAudioState(state: { source?: AudioSource; track?: string; position?: number }) {
    if (state.source !== undefined) audioSource.value = state.source;
    if (state.track !== undefined) audioTrack.value = state.track;
    if (state.position !== undefined) audioPosition.value = state.position;

    broadcastUserState();
  }

  /**
   * Update activity type
   */
  function updateActivity(activity: ActivityType) {
    activityType.value = activity;
    broadcastUserState();
  }

  /**
   * Update location (if user grants permission)
   */
  function updateLocation(location: { lat: number; lng: number }) {
    geoLocation.value = location;
    broadcastUserState();
  }

  /**
   * Update current shader ID
   */
  function updateShaderId(shaderId: string | undefined) {
    currentShaderId.value = shaderId;
    broadcastUserState();
  }

  /**
   * Update current project ID
   */
  function updateProjectId(projectId: string | undefined) {
    currentProjectId.value = projectId;
    broadcastUserState();
  }

  /**
   * Update client platform (useful for electron detection)
   */
  function updateClientPlatform(platform: "web" | "electron" | "mobile") {
    clientPlatform.value = platform;
    broadcastUserState();
  }

  watch(
    () => route.value.name,
    (newRouteName) => {
      const newPage = mapRouteToPage(newRouteName as string);
      if (newPage !== currentPage.value) {
        currentPage.value = newPage;
        broadcastUserState();
      }
    },
    { immediate: true }
  );

  // Watch sources store for audio source changes
  watch(
    () => sources.source,
    (newSource) => {
      if (newSource !== null && newSource !== audioSource.value) {
        audioSource.value = newSource;
        broadcastUserState();
      }
    },
    { immediate: true }
  );

  // Set up reactive watching for Spotify track changes
  const spotify = useSpotify();

  watch(
    () => spotify.track?.name,
    (newTrack) => {
      if (newTrack && audioSource.value === AudioSource.SPOTIFY) {
        const trackId = `${spotify.track?.id || ""}:${spotify.track?.name || ""}`;
        if (trackId !== audioTrack.value) {
          audioTrack.value = trackId;
          broadcastUserState();
        }
      }
    }
  );

  watch(
    () => spotify.position,
    (newPosition) => {
      if (audioSource.value === AudioSource.SPOTIFY && newPosition !== audioPosition.value) {
        audioPosition.value = newPosition;
        // Broadcast position updates less frequently (every 5 seconds)
        if (Math.floor(newPosition / 5000) !== Math.floor((audioPosition.value || 0) / 5000)) {
          broadcastUserState();
        }
      }
    }
  );

  // Socket event handlers (defined here for proper cleanup)
  const handlePreferences = (data: { audioSource?: AudioSource; audioTrack?: string }) => {
    console.log("📡 Received user preferences from server:", data);

    // Auto-select the user's last audio source
    if (data.audioSource !== undefined && data.audioSource !== audioSource.value) {
      audioSource.value = data.audioSource;

      // Update sources store to match
      const sourcesStore = useSources();
      sourcesStore.setSourceFromServer(data.audioSource);
    }

    // Set last track if available
    if (data.audioTrack) {
      audioTrack.value = data.audioTrack;
    }
  };

  const handleAuthSuccess = (data: { user: any }) => {
    if (data.user.preferences) {
      loadPreferences(data.user.preferences);
    }
  };

  const handlePreferencesUpdated = (data: { preferences: UserPreferences }) => {
    // Update local state with server response (in case server modified anything)
    preferences.value = data.preferences;
    console.log("🎛️ Preferences updated successfully");
  };

  const handleSocketError = (error: { message: string; code?: string }) => {
    if (error.code === "AUTH_REQUIRED" || error.code === "UPDATE_FAILED") {
      console.error("🎛️ Preference update failed:", error.message);
      isSavingPreferences.value = false;
    }
  };

  const handlePageHidden = () => {
    console.log("👁️ Page hidden - setting user temporarily offline");
    // Don't call setUserOffline() here as user might just be switching tabs
    // Server can track this separately if needed
  };

  const handlePageVisible = () => {
    console.log("👁️ Page visible - user returned, updating state");
    // Re-broadcast current state when user returns
    broadcastUserState();
  };

  // Cleanup function for removing all socket event listeners
  const removeAllSocketEventListeners = () => {
    socket.off("user-state:preferences", handlePreferences);
    socket.off("auth:success", handleAuthSuccess);
    socket.off("user-state:preferences-updated", handlePreferencesUpdated);
    socket.off("user-state:error", handleSocketError);
    socket.off("user-state:page-hidden", handlePageHidden);
    socket.off("user-state:page-visible", handlePageVisible);
    console.log("🧹 Removed all user-state socket event listeners");
  };

  // Watch socket connection and set up event listeners when connected
  watch(
    () => socket.connected,
    async (connected) => {
      if (connected) {
        setUserOnline();
        
        // Set up socket event listeners
        socket.on("user-state:preferences", handlePreferences);
        socket.on("auth:success", handleAuthSuccess);
        socket.on("user-state:preferences-updated", handlePreferencesUpdated);
        socket.on("user-state:error", handleSocketError);
        socket.on("user-state:page-hidden", handlePageHidden);
        socket.on("user-state:page-visible", handlePageVisible);

        // Set up messaging listeners
        try {
          const { useSocketMessaging } = await import('./socket-messaging');
          const messaging = useSocketMessaging();
          messaging.setupMessagingListeners();
        } catch (error) {
          console.warn('Failed to setup messaging listeners:', error);
        }
      } else {
        // Clean up event listeners on disconnect
        removeAllSocketEventListeners();
      }
    },
    { immediate: true }
  );

  watch(
    () => [auth.isAuthenticated, socket.connected, auth.user?.walletAddress && auth.authToken],
    async () => {
      if (auth.isAuthenticated && socket.connected && auth.user?.walletAddress && auth.authToken) {
        socket.emit("user-state:authenticate", {
          walletAddress: auth.user.walletAddress,
          token: auth.authToken,
        });

        // Request user preferences after authentication
        socket.emit("user-state:get-preferences");
      }
    },
    { immediate: true }
  );

  // Watch auth.user for hydrated preferences (fixes refresh issue)
  watch(
    () => auth.user?.preferences,
    (userPreferences) => {
      if (userPreferences && !isPreferencesLoaded.value) {
        loadPreferences(userPreferences);
        console.log("🎛️ Loaded preferences from auth hydration");
      }
    },
    { immediate: true }
  );


  // Reset preferences to defaults on logout
  watch(
    () => auth.isAuthenticated,
    (authenticated) => {
      if (!authenticated) {
        preferences.value = { ...DEFAULT_USER_PREFERENCES };
        isPreferencesLoaded.value = false;
        if (preferenceUpdateTimeout) {
          clearTimeout(preferenceUpdateTimeout);
          preferenceUpdateTimeout = null;
        }
        console.log("🎛️ Reset preferences to defaults (logged out)");
      }
    }
  );

  // Cleanup on component unmount
  onBeforeUnmount(() => {
    console.log("🧹 User state store unmounting - cleaning up");
    
    // Set user offline before unmounting
    setUserOffline();
    
    // Clean up any pending preference saves
    if (preferenceUpdateTimeout) {
      clearTimeout(preferenceUpdateTimeout);
      preferenceUpdateTimeout = null;
    }
    
    // Remove socket event listeners
    removeAllSocketEventListeners();
  });

  return {
    // State
    currentPage: computed(() => currentPage.value),
    activityType: computed(() => activityType.value),
    audioSource: computed(() => audioSource.value),
    audioTrack: computed(() => audioTrack.value),
    audioPosition: computed(() => audioPosition.value),
    geoLocation: computed(() => geoLocation.value),
    
    // Additional context state
    deviceType: computed(() => deviceType.value),
    clientPlatform: computed(() => clientPlatform.value),
    currentShaderId: computed(() => currentShaderId.value),
    currentProjectId: computed(() => currentProjectId.value),

    // Computed
    isOnHomepage,

    // User preferences (reactive computed with setters)
    disableFlashing,
    neonMode,
    showMenuLabels,
    alwaysShowTrack,
    shuffleDesigns,
    infinityPlay,
    visualizerSpeed,
    preferLossless,

    // Read-only preference values
    preferenceAudioSource,
    lastTrack,

    // Preference state
    isPreferencesLoaded: computed(() => isPreferencesLoaded.value),
    isSavingPreferences: computed(() => isSavingPreferences.value),

    // Actions
    updateAudioState,
    updateActivity,
    updateLocation,
    updateShaderId,
    updateProjectId,
    updateClientPlatform,
    setUserOnline,
    setUserOffline,
    broadcastUserState,

    // Preference actions
    loadPreferences,
    savePreferences,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserState, import.meta.hot));
}
