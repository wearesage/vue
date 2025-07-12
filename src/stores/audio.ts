import { ref, computed, watch } from "vue";
import { defineStore, acceptHMRUpdate } from "pinia";
import { useMediaControls } from "@vueuse/core";
import { audioSystem } from "../classes/AudioSystemManager";
import { useAudioAnalyser } from "../composables/audio/useAudioAnalyser";
import { useRAF } from "./raf";
import { useToast } from "./toast";
import { AudioSource } from "@wearesage/shared";
import { api } from "../api/client";


export const useAudio = defineStore("audio", () => {
  // Audio element and source (managed by AudioSystemManager)
  const audioElement = ref<HTMLAudioElement>();
  const src = ref<string>("");
  const currentTrackId = ref<string | null>(null);
  
  // Toast for "Now Playing" notifications
  const toast = useToast();
  const lastToastTrackId = ref<string | null>(null);
  
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
    console.log('🔊 Attempting to play audio...');
    const success = await audioSystem.playAudio();
    if (success) {
      console.log('🔊 Audio playing via AudioSystemManager');
      
    } else {
      console.warn('🔊 AudioSystemManager playAudio() returned false');
    }
    return success;
  };

  const pause = async () => {
    audioSystem.pauseAudio();
    
  };

  // Audio analysis using the SAUCE (useAudioAnalyser + AudioSystemManager)
  const { initialize: initializeAnalyser, volume, stream, cleanup: cleanupAnalyser, initialized: analyserInitialized } = useAudioAnalyser();
  
  // RAF loop for continuous audio analysis (runs regardless of audio element state)
  const raf = useRAF();
  raf.add((now) => {
    if (analyserInitialized.value) {
      const result = audioSystem.tick(raf.frameRate);
      volume.value = result.volume;
      stream.value = result.stream;
    }
  }, { id: 'audio-analysis' });
  
  const initialized = ref(false);
  const isLoading = ref(false);
  
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
    isLoading.value = true; // Start loading
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
  async function initializeAudio() {
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
        
        if (audioElement.value) {
          // Initialize the consolidated AudioSystemManager for audio element
          await initializeAnalyser(audioElement.value);
          
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
   * Show "Now Playing" toast notification
   */
  function showNowPlayingToast(track: any) {
    if (!track || track.id === lastToastTrackId.value) return;
    
    console.log('🎵 Now Playing:', track.title, 'by', track.artist);
    
    const message = `🎵 Now Playing: "${track.title}" by ${track.artist}`;
    toast.message(message);
    
    lastToastTrackId.value = track.id;
  }

  /**
   * Update media session metadata for the currently loaded track
   */
  async function updateMediaSessionMetadata(track: any) {
    if (!track) {
      // Clear metadata if no track
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
      }
      return;
    }

    try {
      // Check if the current source supports metadata
      const { useSources } = await import('./sources');
      const sources = useSources();
      const mediaConfig = sources.mediaSessionManager.getCurrentConfig();
      
      // Only update metadata if current source has media session enabled and supports metadata
      if (!mediaConfig?.enabled || !mediaConfig.metadata) {
        console.log('🎵 Skipping metadata update - current source does not support metadata');
        return;
      }

      // Use enableTrack if available and audio is properly initialized
      if (typeof enableTrack === 'function' && audioElement.value && userGestureInitialized.value) {
        enableTrack({
          title: track.title,
          artist: track.artist,
          album: track.album || '',
          artwork: track.artwork ? [
            { src: track.artwork.small || '', sizes: '64x64', type: 'image/jpeg' },
            { src: track.artwork.medium || '', sizes: '300x300', type: 'image/jpeg' },
            { src: track.artwork.large || '', sizes: '640x640', type: 'image/jpeg' },
          ].filter(art => art.src) : [],
        });

        console.log('🎵 Updated track metadata via useMediaControls for:', track.title);
      } else {
        // Fallback to manual Media Session API
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist,
            album: track.album || '',
            artwork: track.artwork ? [
              { src: track.artwork.small || '', sizes: '64x64', type: 'image/jpeg' },
              { src: track.artwork.medium || '', sizes: '300x300', type: 'image/jpeg' },
              { src: track.artwork.large || '', sizes: '640x640', type: 'image/jpeg' },
            ].filter(art => art.src) : [],
          });
          console.log('🎵 Updated track metadata via fallback Media Session API for:', track.title);
        }
      }
    } catch (error) {
      console.warn('Could not update media session metadata:', error);
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

    // Update current track ID for duplicate prevention
    currentTrackId.value = track.sourceId;
    

    // Handle Audius stream URL fetching
    if (audioUrl.startsWith("audius-stream:")) {
      const trackId = audioUrl.replace("audius-stream:", "");

      try {
        console.log("🔊 Fetching Audius stream URL for track ID:", trackId);

        // Call our API to get the stream URL using authenticated client
        const response = await api.get(`/api/audius/stream/${trackId}`);
        const { url: streamUrl } = response.data;

        if (streamUrl) {
          console.log("🔊 Got Audius stream URL:", streamUrl);
          setSource(streamUrl);
          
          // Update media session metadata now that we're loading this track
          await updateMediaSessionMetadata(track);
          
          // Show "Now Playing" toast
          showNowPlayingToast(track);
        } else {
          throw new Error("No stream URL returned");
        }
      } catch (error) {
        console.error("🔊 Failed to fetch Audius stream URL:", error);
        // Clear current track ID on error
        currentTrackId.value = null;
        // No fallback - just return false
        return false;
      }
    } else {
      // Regular URL, use directly
      setSource(audioUrl);
      
      // Update media session metadata now that we're loading this track
      await updateMediaSessionMetadata(track);
      
      // Show "Now Playing" toast
      showNowPlayingToast(track);
    }

    // Autoplay is enabled on the audio element, so just setting src should trigger playback
    console.log('🔊 Track loaded with autoplay enabled');
    return true;
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
    async (element) => {
      if (element && !initialized.value) {
        console.log("🔊 Audio element connected from AudioSystemManager");
        
        // Initialize with consolidated AudioSystemManager
        await initializeAnalyser(element);
        initialized.value = true;
        
        // Set up loading state event listeners
        const handleCanPlay = () => {
          console.log("🔊 Audio can play - loading complete");
          isLoading.value = false;
        };
        
        const handleLoadStart = () => {
          console.log("🔊 Audio load started");
          isLoading.value = true;
        };
        
        // Add event listeners for loading state
        element.addEventListener('loadstart', handleLoadStart);
        element.addEventListener('canplay', handleCanPlay);
        element.addEventListener('playing', handleCanPlay);
        
        // Clean up event listeners when element changes
        const cleanup = () => {
          element.removeEventListener('loadstart', handleLoadStart);
          element.removeEventListener('canplay', handleCanPlay);
          element.removeEventListener('playing', handleCanPlay);
        };
        
        // Store cleanup function for later use
        (element as any)._audioLoadingCleanup = cleanup;
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
    isLoading,

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
    currentTrackId,
    updateMediaSessionMetadata,
    showNowPlayingToast,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAudio, import.meta.hot));
}
