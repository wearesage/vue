import { defineStore, storeToRefs } from "pinia";
import { ref, computed, watch } from "vue";
import { useRoute } from "../router/sage-router";
import { useSocketCore } from "./socket-core";
import { useAuth } from "./auth";
import { useSocketProject } from "./socket-project";
import { CurrentPage, ActivityType, AudioSource, UserStateField, UserStatus } from "@wearesage/shared";

/**
 * Centralized user state management and broadcasting
 *
 * Responsibilities:
 * - Track current page/route changes
 * - Broadcast user activity to server (ALWAYS)
 * - Manage audio state (source, track, position)
 * - Handle activity type updates
 * - Handle socket upgrade from anonymous to authenticated
 */
export const useUserState = defineStore("userState", () => {
  const route = useRoute();
  const socket = useSocketCore();
  const auth = useAuth();

  // Initialize auth since user state depends on it
  auth.initialize();

  // Current state
  const currentPage = ref<CurrentPage>(CurrentPage.HOME);
  const activityType = ref<ActivityType>(ActivityType.BROWSING);
  const audioSource = ref<AudioSource>(AudioSource.NONE);
  const audioTrack = ref<string | undefined>();
  const audioPosition = ref<number | undefined>();
  const geoLocation = ref<{ lat: number; lng: number } | undefined>();

  // Computed
  const isOnHomepage = computed(() => currentPage.value === CurrentPage.HOME);

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

  // Watch for route changes and broadcast
  watch(
    () => route.name,
    (newRouteName) => {
      const newPage = mapRouteToPage(newRouteName as string);
      if (newPage !== currentPage.value) {
        currentPage.value = newPage;
        broadcastUserState();
      }
    },
    { immediate: true }
  );

  watch(
    () => socket.connected,
    (connected) => {
      if (connected) setUserOnline();
    }
  );

  watch(
    () => [auth.isAuthenticated, socket.connected, auth.user?.walletAddress && auth.authToken],
    async () => {
      if (auth.isAuthenticated && socket.connected && auth.user?.walletAddress && auth.authToken) {
        socket.emit("user-state:authenticate", {
          walletAddress: auth.user.walletAddress,
          token: auth.authToken,
        });
      }
    },
    { immediate: true }
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

    // Actions
    updateAudioState,
    updateActivity,
    updateLocation,
    setUserOnline,
    setUserOffline,
    broadcastUserState,
  };
});
