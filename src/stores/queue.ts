import { ref, computed, watch } from "vue";
import { defineStore, acceptHMRUpdate } from "pinia";
import { AudioSource } from "@wearesage/shared";

// Queue management types
export interface QueueTrack {
  id: string;
  source: AudioSource;
  sourceId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  artwork?: { small?: string; medium?: string; large?: string; };
  rawData?: any;
}

export enum RepeatMode {
  NONE = 'none',
  TRACK = 'track', 
  QUEUE = 'queue'
}

export interface QueueState {
  tracks: QueueTrack[];
  currentIndex: number;
  isShuffled: boolean;
  shuffledIndices: number[];
  repeatMode: RepeatMode;
  isPlaying: boolean;
}

/**
 * Dedicated queue management store
 * 
 * Responsibilities:
 * - Track queue state (tracks, current position, shuffle, repeat)
 * - Queue operations (add, remove, next, previous)
 * - Playback state (play/pause)
 * - Media Session API integration
 */
export const useQueue = defineStore("queue", () => {
  // Queue state
  const queue = ref<QueueState>({
    tracks: [],
    currentIndex: -1,
    isShuffled: false,
    shuffledIndices: [],
    repeatMode: RepeatMode.NONE,
    isPlaying: false
  });

  // Computed values
  const currentTrack = computed(() => {
    const { tracks, currentIndex, isShuffled, shuffledIndices } = queue.value;
    if (tracks.length === 0 || currentIndex === -1) return null;
    
    const actualIndex = isShuffled && shuffledIndices.length > 0 
      ? shuffledIndices[currentIndex] 
      : currentIndex;
    
    return tracks[actualIndex] || null;
  });

  const hasNext = computed(() => {
    const { tracks, currentIndex, repeatMode } = queue.value;
    if (tracks.length === 0) return false;
    if (repeatMode === RepeatMode.QUEUE || repeatMode === RepeatMode.TRACK) return true;
    return currentIndex < tracks.length - 1;
  });

  const hasPrevious = computed(() => {
    const { tracks, currentIndex, repeatMode } = queue.value;
    if (tracks.length === 0) return false;
    if (repeatMode === RepeatMode.QUEUE) return true;
    // Always show previous as available since it can restart current track
    return tracks.length > 0;
  });

  const queueLength = computed(() => queue.value.tracks.length);
  const queuePosition = computed(() => queue.value.currentIndex + 1);
  const isQueueEmpty = computed(() => queue.value.tracks.length === 0);

  // ========== QUEUE MANAGEMENT ==========

  /**
   * Generate shuffled indices for the current queue
   */
  function generateShuffledIndices() {
    const indices = Array.from({ length: queue.value.tracks.length }, (_, i) => i);
    
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    return indices;
  }

  /**
   * Set the queue with tracks (replaces current queue)
   */
  function setQueue(tracks: QueueTrack[], startIndex: number = 0) {
    queue.value.tracks = [...tracks];
    queue.value.currentIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
    
    // Regenerate shuffle if enabled
    if (queue.value.isShuffled) {
      queue.value.shuffledIndices = generateShuffledIndices();
    }
    
    console.log(`🎵 Queue set with ${tracks.length} tracks, starting at index ${queue.value.currentIndex}`);
  }

  /**
   * Add track(s) to queue
   */
  function addToQueue(tracks: QueueTrack | QueueTrack[], playNow: boolean = false) {
    const tracksArray = Array.isArray(tracks) ? tracks : [tracks];
    
    if (playNow && tracksArray.length > 0) {
      // Insert at current position and play immediately
      const insertIndex = queue.value.currentIndex + 1;
      queue.value.tracks.splice(insertIndex, 0, ...tracksArray);
      queue.value.currentIndex = insertIndex;
    } else {
      // Add to end of queue
      queue.value.tracks.push(...tracksArray);
      
      // If queue was empty, start playing first track
      if (queue.value.currentIndex === -1 && queue.value.tracks.length > 0) {
        queue.value.currentIndex = 0;
      }
    }
    
    // Regenerate shuffle if enabled
    if (queue.value.isShuffled) {
      queue.value.shuffledIndices = generateShuffledIndices();
    }
    
    console.log(`🎵 Added ${tracksArray.length} track(s) to queue`);
  }

  /**
   * Remove track from queue by index
   */
  function removeFromQueue(index: number) {
    if (index < 0 || index >= queue.value.tracks.length) return;
    
    queue.value.tracks.splice(index, 1);
    
    // Adjust current index if necessary
    if (index < queue.value.currentIndex) {
      queue.value.currentIndex--;
    } else if (index === queue.value.currentIndex && queue.value.currentIndex >= queue.value.tracks.length) {
      queue.value.currentIndex = queue.value.tracks.length - 1;
    }
    
    // Regenerate shuffle if enabled
    if (queue.value.isShuffled) {
      queue.value.shuffledIndices = generateShuffledIndices();
    }
  }

  /**
   * Clear the entire queue
   */
  function clearQueue() {
    queue.value.tracks = [];
    queue.value.currentIndex = -1;
    queue.value.shuffledIndices = [];
    queue.value.isPlaying = false; // Stop playback when clearing queue
    console.log('🎵 Queue cleared');
  }

  /**
   * Jump to specific track in queue
   */
  function jumpToTrack(index: number) {
    if (index < 0 || index >= queue.value.tracks.length) return;
    
    queue.value.currentIndex = index;
    console.log(`🎵 Jumped to track ${index + 1} of ${queue.value.tracks.length}`);
  }

  /**
   * Go to next track
   */
  function nextTrack() {
    const { tracks, currentIndex, repeatMode, isShuffled, shuffledIndices } = queue.value;
    
    if (tracks.length === 0) return;
    
    if (repeatMode === RepeatMode.TRACK) {
      // Stay on same track, just trigger reload
      console.log('🎵 Repeat track mode - staying on current track');
      return;
    }
    
    let nextIndex = currentIndex + 1;
    
    if (nextIndex >= tracks.length) {
      if (repeatMode === RepeatMode.QUEUE) {
        nextIndex = 0; // Loop back to start
      } else {
        return; // End of queue
      }
    }
    
    queue.value.currentIndex = nextIndex;
    console.log(`🎵 Next track: ${nextIndex + 1} of ${tracks.length}`);
  }

  /**
   * Go to previous track (with 10-second restart logic)
   */
  async function previousTrack() {
    const { tracks, currentIndex, repeatMode } = queue.value;
    
    if (tracks.length === 0) return;
    
    // Check current playback position to decide whether to restart or go to previous track
    try {
      const { useAudio } = await import('./audio');
      const audio = useAudio();
      const currentPosition = audio.currentPosition || 0; // Position in milliseconds
      
      // If more than 10 seconds into the track, restart current track
      if (currentPosition > 10000) {
        console.log('🎵 Restarting current track (>10s in)');
        audio.seek(0); // Restart current track
        return;
      }
    } catch (error) {
      console.warn('Could not check audio position for previous track logic:', error);
    }
    
    // Less than 10 seconds or couldn't check position - go to previous track
    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      if (repeatMode === RepeatMode.QUEUE) {
        prevIndex = tracks.length - 1; // Loop to end
      } else {
        prevIndex = 0; // Stay at first track
      }
    }
    
    queue.value.currentIndex = prevIndex;
    console.log(`🎵 Previous track: ${prevIndex + 1} of ${tracks.length}`);
  }

  /**
   * Toggle shuffle mode
   */
  function toggleShuffle() {
    queue.value.isShuffled = !queue.value.isShuffled;
    
    if (queue.value.isShuffled) {
      queue.value.shuffledIndices = generateShuffledIndices();
    } else {
      queue.value.shuffledIndices = [];
    }
    
    console.log(`🎵 Shuffle ${queue.value.isShuffled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Cycle repeat mode
   */
  function toggleRepeat() {
    const modes = [RepeatMode.NONE, RepeatMode.QUEUE, RepeatMode.TRACK];
    const currentModeIndex = modes.indexOf(queue.value.repeatMode);
    const nextModeIndex = (currentModeIndex + 1) % modes.length;
    
    queue.value.repeatMode = modes[nextModeIndex];
    console.log(`🎵 Repeat mode: ${queue.value.repeatMode}`);
  }

  /**
   * Toggle play/pause
   */
  function togglePlayPause() {
    const wasPlaying = queue.value.isPlaying;
    queue.value.isPlaying = !wasPlaying;
    
    console.log(`🎵 ${queue.value.isPlaying ? 'Playing' : 'Paused'}`);
  }

  // ========== MEDIA SESSION API (via useMediaControls) ==========

  /**
   * Setup media session via audio store's useMediaControls
   */
  async function setupMediaSession() {
    try {
      const { useAudio } = await import('./audio');
      const audio = useAudio();
      
      // Set up media key handlers using audio store
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => {
          console.log('🎵 Media key: Play');
          if (!queue.value.isPlaying) togglePlayPause();
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          console.log('🎵 Media key: Pause');
          if (queue.value.isPlaying) togglePlayPause();
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
          console.log('🎵 Media key: Previous track');
          previousTrack();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
          console.log('🎵 Media key: Next track');
          nextTrack();
        });

        // Seek handlers with audio store integration
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          console.log('🎵 Media key: Seek backward', details.seekOffset);
          audio.skip(-(details.seekOffset || 10));
        });

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          console.log('🎵 Media key: Seek forward', details.seekOffset);
          audio.skip(details.seekOffset || 10);
        });

        console.log('🎵 Media Session API connected to audio store');
      }
    } catch (error) {
      console.warn('Could not setup media session:', error);
    }
  }

  /**
   * Update track metadata using useMediaControls enableTrack
   */
  async function updateTrackMetadata() {
    const track = currentTrack.value;
    if (!track) return;

    try {
      const { useAudio } = await import('./audio');
      const audio = useAudio();
      
      // Check if enableTrack is available and element is initialized
      if (typeof audio.enableTrack === 'function' && audio.element && audio.userGestureInitialized) {
        // Use useMediaControls enableTrack for automatic metadata management
        audio.enableTrack({
          title: track.title,
          artist: track.artist,
          album: track.album || '',
          artwork: track.artwork ? [
            { src: track.artwork.small || '', sizes: '64x64', type: 'image/jpeg' },
            { src: track.artwork.medium || '', sizes: '300x300', type: 'image/jpeg' },
            { src: track.artwork.large || '', sizes: '640x640', type: 'image/jpeg' },
          ].filter(art => art.src) : [],
        });

        console.log('🎵 Updated track metadata via useMediaControls');
      } else {
        console.log('🎵 Skipping metadata update - audio not initialized or enableTrack not available');
        
        // Fallback to manual Media Session API if available
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
          console.log('🎵 Updated track metadata via fallback Media Session API');
        }
      }
    } catch (error) {
      console.warn('Could not update track metadata:', error);
    }
  }

  // Setup media session on store creation
  if (typeof window !== 'undefined') {
    setupMediaSession();
  }

  // Watch current track changes to update metadata
  watch(
    currentTrack,
    () => {
      updateTrackMetadata();
    },
    { immediate: true }
  );

  // Coordinate with audio store when track changes
  watch(
    currentTrack,
    async (newTrack) => {
      // Only trigger audio loading if we have a track and playback is enabled
      if (newTrack && queue.value.isPlaying) {
        try {
          // Dynamic import to avoid circular dependencies
          const { useAudio } = await import('./audio');
          const audio = useAudio();
          
          console.log('🎵 Queue: Loading new track in audio store:', newTrack.title);
          const success = await audio.playTrack(newTrack);
          
          if (!success) {
            console.warn('🎵 Queue: Failed to load audio for track');
          }
        } catch (error) {
          console.warn('Queue: Could not load track in audio store:', error);
        }
      }
    },
    { immediate: false }
  );

  // Watch play/pause state to coordinate with audio store
  watch(
    () => queue.value.isPlaying,
    async (isPlaying) => {
      try {
        const { useAudio } = await import('./audio');
        const audio = useAudio();
        
        if (isPlaying) {
          const track = currentTrack.value;
          if (track) {
            console.log('🎵 Queue: Starting playback with track:', track.title);
            await audio.playTrack(track);
          } else {
            // No track in queue, just play whatever is loaded
            audio.play();
          }
        } else {
          // Pause audio playback
          audio.pause();
        }
      } catch (error) {
        console.warn('Queue: Could not control audio playback:', error);
      }
    }
  );

  /**
   * Reset queue store state (called during major cleanups)
   */
  function reset() {
    console.log('🎵 Resetting queue store state');
    clearQueue();
    queue.value.repeatMode = RepeatMode.NONE;
    queue.value.isShuffled = false;
    queue.value.shuffledIndices = [];
  }

  return {
    // State (reactive)
    queue: computed(() => queue.value),
    currentTrack,
    hasNext,
    hasPrevious,
    queueLength,
    queuePosition,
    isQueueEmpty,

    // Queue operations
    setQueue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    jumpToTrack,
    nextTrack,
    previousTrack,
    toggleShuffle,
    toggleRepeat,
    togglePlayPause,

    // Cleanup
    reset,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useQueue, import.meta.hot));
}