import { ref, computed, watch } from "vue";
import { defineStore, acceptHMRUpdate } from "pinia";
import { useMediaControls } from "@vueuse/core";
import { audioSystem } from "../classes/AudioSystemManager";
import { useAudioAnalyser } from "../composables/audio/useAudioAnalyser";
import { AudioSource } from "@wearesage/shared";

export const useAudio = defineStore("audio", () => {
  // Audio element and source (managed by AudioSystemManager)
  const audioElement = ref<HTMLAudioElement>();
  const src = ref<string>("");
  
  // Get element from audio system manager
  if (typeof window !== 'undefined') {
    // Element will be created when user gesture happens
    const checkForElement = () => {
      const element = audioSystem.getAudioElement();
      if (element && !audioElement.value) {
        audioElement.value = element;
        console.log('🎵 Audio element acquired from AudioSystemManager');
      }
    };
    
    // Check immediately and set up interval for when gesture happens
    checkForElement();
    const interval = setInterval(() => {
      checkForElement();
      if (audioElement.value) {
        clearInterval(interval);
      }
    }, 100);
  }

  // Use VueUse media controls for comprehensive audio management
  const mediaControls = useMediaControls(audioElement, {
    src,
  });

  // Destructure with safer access
  const {
    currentTime,
    duration,
    playing,
    waiting,
    ended,
    volume: mediaVolume,
    muted,
    enableTrack,
  } = mediaControls;

  // Use AudioSystemManager for bulletproof play/pause
  const play = async () => {
    const success = await audioSystem.playAudio();
    if (success) {
      console.log('🔊 Audio playing via AudioSystemManager');
    }
    return success;
  };

  const pause = () => {
    audioSystem.pauseAudio();
  };

  // Audio analysis using the SAUCE (useAudioAnalyser + AudioSystemManager)
  const { initialize: initializeAnalyser, volume, stream, cleanup: cleanupAnalyser, initialized: analyserInitialized } = useAudioAnalyser();
  const initialized = ref(false);
  
  // Track if audio system is initialized
  const userGestureInitialized = computed(() => {
    const state = audioSystem.getState();
    return state.isPrimed && state.hasUserGesture;
  });

  // Convert to milliseconds for consistency with old API
  const currentPosition = computed(() => currentTime.value * 1000);
  const audioDuration = computed(() => duration.value * 1000);

  // Progress tracking (0-1)
  const progress = computed(() => {
    return duration.value > 0 ? currentTime.value / duration.value : 0;
  });

  /**
   * Set audio source URL using AudioSystemManager
   */
  function setSource(url: string) {
    console.log("🔊 Setting audio source:", url);
    src.value = url;
    audioSystem.setAudioSource(url);
  }

  /**
   * Seek to specific position (in seconds)
   */
  function seek(seconds: number) {
    currentTime.value = seconds;
  }

  /**
   * Skip forward/backward by specified seconds
   */
  function skip(seconds: number) {
    const newTime = Math.max(0, Math.min(currentTime.value + seconds, duration.value || 0));
    seek(newTime);
  }

  /**
   * Set volume (0-1)
   */
  function setVolume(level: number) {
    mediaVolume.value = Math.max(0, Math.min(1, level));
  }

  /**
   * Initialize audio with user gesture using AudioSystemManager + AudioAnalyser
   * Must be called synchronously within a user interaction event
   */
  function initializeAudio() {
    if (userGestureInitialized.value) {
      console.log("🔊 Audio already initialized via AudioSystemManager");
      return true;
    }

    try {
      console.log("🔊 Initializing audio system with user gesture...");
      
      // Prime the audio system synchronously
      const success = audioSystem.primeAudioSystem();
      
      if (success) {
        // Get the primed audio element and context
        audioElement.value = audioSystem.getAudioElement();
        const audioContext = audioSystem.getAudioContext();
        const analyserNode = audioSystem.getAnalyserNode();
        
        if (audioElement.value && audioContext && analyserNode) {
          // Initialize the AudioAnalyser with shared context and nodes
          initializeAnalyser(audioElement.value, {
            audioContext,
            analyserNode
          });
          
          initialized.value = true;
          console.log("🔊 Audio system + AudioAnalyser initialized successfully!");
          return true;
        } else {
          console.warn("🔊 Missing audio components from AudioSystemManager");
          return false;
        }
      } else {
        console.warn("🔊 Failed to prime audio system");
        return false;
      }
    } catch (error) {
      console.error("🔊 Failed to initialize audio system:", error);
      return false;
    }
  }

  /**
   * Get audio URL for a queue track based on its source
   */
  function getAudioUrlForTrack(track: any): string | null {
    if (!track) return null;

    switch (track.source) {
      case AudioSource.SPOTIFY:
        // Spotify requires premium and Web Playback SDK - return null for now
        console.warn("🔊 Spotify playback requires Web Playback SDK integration");
        return null;

      case AudioSource.AUDIUS:
        // Audius requires a separate API call to get the stream URL
        // We need to get the track ID and make a request to our API
        const audiusTrackId = track.rawData?.id || track.rawData?.audiusId || track.sourceId;

        if (audiusTrackId) {
          console.log("🔊 Audius track ID:", audiusTrackId);
          // Return a special marker that we'll handle in playTrack()
          return `audius-stream:${audiusTrackId}`;
        }

        console.warn("🔊 No track ID found for Audius track:", track);
        console.warn("🔊 Available rawData fields:", Object.keys(track.rawData || {}));
        return null;

      case AudioSource.RADIO_PARADISE:
      case AudioSource.KEXP:
        // Radio stations - would need live stream URLs
        console.warn("🔊 Radio playback not yet implemented");
        return null;

      case AudioSource.FILE:
        // File source should have a direct URL
        return track.rawData?.url || track.sourceId;

      default:
        console.warn("🔊 Unknown audio source:", track.source);
        return null;
    }
  }

  /**
   * Load and play a queue track
   */
  async function playTrack(track: any) {
    // Ensure audio is initialized before playing
    if (!userGestureInitialized.value) {
      console.log("🔊 Audio not initialized, initializing now...");
      const initSuccess = initializeAudio();
      if (!initSuccess) {
        console.error("🔊 Failed to initialize audio");
        return false;
      }
    }

    const audioUrl = getAudioUrlForTrack(track);

    if (!audioUrl) {
      console.error("🔊 No playable audio URL for track:", track);
      // No fallback - just return false
      return false;
    }

    console.log("🔊 Loading track:", track.title, "by", track.artist);

    // Handle Audius stream URL fetching
    if (audioUrl.startsWith("audius-stream:")) {
      const trackId = audioUrl.replace("audius-stream:", "");

      try {
        console.log("🔊 Fetching Audius stream URL for track ID:", trackId);

        // Call our API to get the stream URL
        const response = await fetch(`/api/audius/stream/${trackId}`);

        if (!response.ok) {
          console.error("🔊 API response not OK:", response.status, response.statusText);
          const errorText = await response.text();
          console.error("🔊 Error response body:", errorText);

          // Check if we got HTML instead of JSON (API server not running)
          if (errorText.includes("<!doctype html>")) {
            throw new Error("Backend API server not available - got HTML instead of JSON");
          }

          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const responseText = await response.text();
        console.log("🔊 Raw API response:", responseText);

        // Check if response is HTML (indicates API routing issue)
        if (responseText.trim().startsWith("<!doctype html>") || responseText.includes("<html")) {
          throw new Error("Got HTML response instead of JSON - check API proxy configuration");
        }

        const responseData = JSON.parse(responseText);
        const { url: streamUrl } = responseData;

        if (streamUrl) {
          console.log("🔊 Got Audius stream URL:", streamUrl);
          setSource(streamUrl);
        } else {
          throw new Error("No stream URL returned");
        }
      } catch (error) {
        console.error("🔊 Failed to fetch Audius stream URL:", error);
        // No fallback - just return false
        return false;
      }
    } else {
      // Regular URL, use directly
      setSource(audioUrl);
    }

    // Reset position
    seek(0);

    // Auto-play with AudioSystemManager (preserves gesture chain)
    const success = await play();
    return success;
  }

  // Watch for track end to auto-advance
  watch(
    ended,
    (trackEnded) => {
      if (trackEnded) {
        console.log("🔊 Track ended");

        // Try to get queue store for automatic progression
        import("./queue")
          .then(({ useQueue }) => {
            const queue = useQueue();

            // Auto-advance to next track if available
            if (queue.hasNext) {
              console.log("🔊 Auto-advancing to next track");
              queue.nextTrack();
            } else {
              console.log("🔊 End of queue reached");
            }
          })
          .catch((error) => {
            console.warn("Could not auto-advance track:", error);
          });
      }
    }
  );

  // Watch for audio element from AudioSystemManager
  watch(
    audioElement,
    (element) => {
      if (element && !initialized.value) {
        console.log("🔊 Audio element connected from AudioSystemManager");
        
        // Try to initialize with shared context if available
        const audioContext = audioSystem.getAudioContext();
        const analyserNode = audioSystem.getAnalyserNode();
        
        if (audioContext && analyserNode) {
          initializeAnalyser(element, { audioContext, analyserNode });
          initialized.value = true;
        }
      }
    },
    { immediate: true }
  );

  return {
    // Core audio element (from useMediaControls)
    element: audioElement,

    // Audio state (from useMediaControls)
    src,
    playing,
    currentPosition,
    duration: audioDuration,
    progress,
    waiting,
    ended,
    muted,

    // Audio analysis (from useAudioAnalyser - the SAUCE!)
    volume, // Sophisticated volume analysis with smoothing
    stream, // Stream animation with proper scaling
    initialized: computed(() => initialized.value && analyserInitialized.value),
    userGestureInitialized,

    // Controls (from useMediaControls)
    play,
    pause,
    toggle: () => playing.value ? pause() : play(), // Add toggle for compatibility
    seek,
    skip,
    setVolume,

    // Media Session API (from useMediaControls)
    enableTrack,

    // Queue integration
    setSource,
    playTrack,
    getAudioUrlForTrack,
    initializeAudio,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAudio, import.meta.hot));
}
