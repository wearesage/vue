import { defineStore, storeToRefs, acceptHMRUpdate } from "pinia";
import { ref, computed, watch } from "vue";
import { useRoute } from "../router/sage-router";
import { useSocketCore } from "./socket-core";
import { useAuth } from "./auth";
import { useSocketProject } from "./socket-project";
import { useSources } from "./sources";
import { useQueue } from "./queue";
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

  // Initialize auth since user state depends on it
  auth.initialize();

  // Current state
  const currentPage = ref<CurrentPage>(CurrentPage.HOME);
  const activityType = ref<ActivityType>(ActivityType.BROWSING);
  const audioSource = ref<AudioSource>(AudioSource.NONE);
  const audioTrack = ref<string | undefined>();
  const audioPosition = ref<number | undefined>();
  const geoLocation = ref<{ lat: number; lng: number } | undefined>();

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
      ...(audioTrack.value && { [UserStateField.AUDIO_TRACK]: audioTrack.value }),
      ...(audioPosition.value !== undefined && { [UserStateField.AUDIO_POSITION]: audioPosition.value }),
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
      ...(audioTrack.value && { audioTrack: audioTrack.value }),
      ...(audioPosition.value !== undefined && { audioPosition: audioPosition.value }),
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

  // Watch for Spotify track changes and broadcast
  const getSpotifyStore = () => {
    try {
      const { useSpotify } = require("./spotify");
      return useSpotify();
    } catch {
      return null;
    }
  };

  // Set up reactive watching for Spotify track changes
  const spotify = getSpotifyStore();
  if (spotify) {
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
  }

  watch(
    () => socket.connected,
    (connected) => {
      if (connected) setUserOnline();
    }
  );

  // Listen for server responses with user's saved preferences
  socket.on("user-state:preferences", (data: { audioSource?: AudioSource; audioTrack?: string }) => {
    console.log("📡 Received user preferences from server:", data);

    // Auto-select the user's last audio source
    if (data.audioSource !== undefined && data.audioSource !== audioSource.value) {
      audioSource.value = data.audioSource;

      // Update sources store to match
      try {
        const { useSources } = require("./sources");
        const sourcesStore = useSources();
        sourcesStore.setSourceFromServer(data.audioSource);
      } catch (error) {
        console.warn("Could not auto-select source in sources store:", error);
      }
    }

    // Set last track if available
    if (data.audioTrack) {
      audioTrack.value = data.audioTrack;
    }
  });

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

  // Listen for auth success to load preferences
  socket.on("auth:success", (data: { user: any }) => {
    if (data.user.preferences) {
      loadPreferences(data.user.preferences);
    }
  });

  // Listen for preference update confirmations
  socket.on("user-state:preferences-updated", (data: { preferences: UserPreferences }) => {
    // Update local state with server response (in case server modified anything)
    preferences.value = data.preferences;
    console.log("🎛️ Preferences updated successfully");
  });

  // Handle socket errors
  socket.on("user-state:error", (error: { message: string; code?: string }) => {
    if (error.code === "AUTH_REQUIRED" || error.code === "UPDATE_FAILED") {
      console.error("🎛️ Preference update failed:", error.message);
      isSavingPreferences.value = false;
    }
  });

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

  return {
    // State
    currentPage: computed(() => currentPage.value),
    activityType: computed(() => activityType.value),
    audioSource: computed(() => audioSource.value),
    audioTrack: computed(() => audioTrack.value),
    audioPosition: computed(() => audioPosition.value),
    geoLocation: computed(() => geoLocation.value),

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
