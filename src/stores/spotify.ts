import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, shallowRef, computed, watch } from "vue";
import { spotifyApi, type SpotifyAnalysis } from "../api/spotify";
import { useToast } from "./toast";
import { useAuth } from "./auth";
import { useEchoNest } from "../composables/audio";
import { useQueue } from "./queue";
import { useSources } from "./sources";
import { AudioSource } from "@wearesage/shared";
import type { QueueTrack } from "./queue";
import { adaptSpotifyTrack } from "../composables/audio/useTrackAdapter";

export const useSpotify = defineStore("spotify", () => {
  const toast = useToast();
  const auth = useAuth();
  const queue = useQueue();
  const sources = useSources();
  const profile = computed(() => auth?.user?.spotifyProfile);
  const analysisData = shallowRef<SpotifyAnalysis | null>(null);
  const { stream, volume, progress, position, track, playing, latency } = useEchoNest(analysisData);
  const fetchInterval = ref();
  const lastQueueClearTime = ref(0);

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
      console.log('🎵 Spotify: Track changed but not active source, skipping queue update');
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
      rawData: adaptedTrack.rawData
    };
    
    // Only update queue if this is a different track
    const currentQueueTrack = queue.currentTrack;
    if (!currentQueueTrack || currentQueueTrack.sourceId !== adaptedTrack.sourceId) {
      console.log('🎵 Spotify: Adding track to queue:', queueTrack.title);
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
      const currentUrl = window.location.href.split("?")[0];
      const data = await spotifyApi.initializeAuth(currentUrl);
      document.location.href = data.authUrl;
    } catch (error) {
      console.log(error);
    }
  }

  async function getCurrentAnalysis() {
    try {
      const newAnalysisData = await spotifyApi.getCurrentAnalysis();
      
      // If Spotify reports nothing playing AND Spotify is the active source
      if (!newAnalysisData && sources.source === AudioSource.SPOTIFY) {
        // Throttle queue clearing to prevent spam (max once every 10 seconds)
        const now = Date.now();
        if (now - lastQueueClearTime.value > 10000) {
          console.log('🎵 Spotify: No track playing (commercial/track ended), clearing queue');
          queue.clearQueue();
          lastQueueClearTime.value = now;
        }
        analysisData.value = null;
        return;
      }
      
      analysisData.value = newAnalysisData;
      if (!analysisData.value) startInterval();
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
    await getCurrentAnalysis();

    if (profile.value?.display_name) {
      toast.message(`Connected to Spotify as ${profile.value?.display_name}!`);
    }

    if (!analysisData.value) startInterval();
  }

  /**
   * Reset Spotify store state (called on logout)
   */
  function reset() {
    console.log('🎵 Resetting Spotify store state');
    
    // Stop any running intervals
    stopInterval();
    
    // Clear all reactive data
    analysisData.value = null;
    
    // Note: profile is computed from auth.user.spotifyProfile, so it will clear automatically
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
