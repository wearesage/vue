import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, shallowRef, computed, watch } from "vue";
// import { spotifyApi, type SpotifyAnalysis } from "../api/spotify";
import { useToast } from "./toast";
import { useEchoNest } from "../composables/audio";
import { useQueue } from "./queue";
import { useSources } from "./sources";
import { AudioSource } from "@wearesage/shared";
import type { QueueTrack } from "./queue";
import { adaptSpotifyTrack } from "../composables/audio/useTrackAdapter";
import Cookies from "js-cookie";

export const useSpotify = defineStore("spotify", () => {
  const toast = useToast();
  const queue = useQueue();
  const sources = useSources();
  const profile = computed(() => auth?.user?.spotifyProfile);
  const analysisData = shallowRef<any>();
  const { stream, volume, progress, position, track, playing, latency } = useEchoNest(analysisData);
  const fetchInterval = ref();
  const lastQueueClearTime = ref(0);
  const SpotifyAccessToken = Cookies.get("spotify_access_token");
  const SpotifyRefreshToken = Cookies.get("spotify_refresh_token");
  const accessToken = ref(SpotifyAccessToken);
  const refreshToken = ref(SpotifyRefreshToken);

  watch(progress, (val: number) => {
    // Only fetch new analysis if Spotify is the active source and track ended
    if (val === 1 && sources.source === AudioSource.SPOTIFY) {
      getCurrentAnalysis();
    }
  });

  // Sync Spotify track to queue when it changes
  watch(track, (newTrack) => {
    if (!newTrack) return;

    // Only sync to queue if Spotify is the active source
    if (sources.source !== AudioSource.SPOTIFY) {
      console.log("🎵 Spotify: Track changed but not active source, skipping queue update");
      return;
    }

    // Use the track adapter to properly convert Spotify data
    const adaptedTrack = adaptSpotifyTrack(newTrack);
    if (!adaptedTrack) return;

    // Convert to QueueTrack format
    const queueTrack: QueueTrack = {
      id: adaptedTrack.id,
      source: adaptedTrack.source,
      sourceId: adaptedTrack.sourceId,
      title: adaptedTrack.title,
      artist: adaptedTrack.artist,
      album: adaptedTrack.album,
      duration: adaptedTrack.duration,
      artwork: adaptedTrack.artwork,
      rawData: adaptedTrack.rawData,
    };

    // Only update queue if this is a different track
    const currentQueueTrack = queue.currentTrack;
    if (!currentQueueTrack || currentQueueTrack.sourceId !== adaptedTrack.sourceId) {
      console.log("🎵 Spotify: Adding track to queue:", queueTrack.title);
      queue.setQueue([queueTrack], 0);

      // Set playing state based on Spotify's playing state
      if (playing.value && !queue.queue.isPlaying) {
        queue.queue.isPlaying = true;
      } else if (!playing.value && queue.queue.isPlaying) {
        queue.queue.isPlaying = false;
      }
    }
  });

  // Sync playing state from Spotify to queue
  watch(playing, (isPlaying) => {
    // Only sync playing state if Spotify is the active source
    if (sources.source === AudioSource.SPOTIFY && queue.currentTrack?.source === AudioSource.SPOTIFY) {
      queue.queue.isPlaying = isPlaying;
    }
  });

  async function getSpotifyTokens() {
    try {
      if (!accessToken.value) {
        const currentUrl = window.location.href.split("?")[0];
        document.location.href = `${import.meta.env.VITE_API}/api/spotify/auth?returnUrl=${currentUrl}`;
      } else {
        getCurrentAnalysis();
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function getCurrentAnalysis() {
    try {
      const data = await fetch(`${import.meta.env.VITE_API}/api/spotify/now-playing`, { credentials: "include" }).then((res) => res.json());
      analysisData.value = data;
    } catch (error) {
      console.error("Failed to get current analysis:", error);
    }
  }

  function stopInterval() {
    clearInterval(fetchInterval.value);
  }

  function startInterval() {
    stopInterval();

    fetchInterval.value = setInterval(async () => {
      await getCurrentAnalysis();
      if (analysisData.value) stopInterval();
    }, 5000);
  }

  async function initialize() {
    getSpotifyTokens();

    if (profile.value?.display_name) {
      toast.message(`Connected to Spotify as ${profile.value?.display_name}!`);
    }

    if (!analysisData.value) startInterval();
  }

  function reset() {
    stopInterval();
    analysisData.value = null;
  }

  return {
    profile,
    track,
    analysisData,
    playing,
    stream,
    volume,
    position,
    progress,
    getSpotifyTokens,
    initialize,
    reset,
    latency,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSpotify, import.meta.hot));
}
