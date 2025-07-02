import { ref, computed, watch } from "vue";
import { defineStore, acceptHMRUpdate } from "pinia";
import { AudioSource } from "@wearesage/shared";
import { useToast } from "./toast";

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
  artworkBlobUrls?: string[]; // for cleanup tracking of generated blob URLs
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
 * Clean up artwork blob URLs for a single track
 */
function cleanupTrackArtworkBlobUrls(track: QueueTrack) {
  if (!track.artworkBlobUrls) return;
  
  track.artworkBlobUrls.forEach(url => {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('🎨 Failed to revoke artwork blob URL:', error);
    }
  });
}

/**
 * Clean up artwork blob URLs for multiple tracks
 */
function cleanupMultipleTracksArtworkBlobUrls(tracks: QueueTrack[]) {
  tracks.forEach(track => cleanupTrackArtworkBlobUrls(track));
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

  // ========== NOW PLAYING TOAST ==========
  // Toast is now handled by the audio store when tracks are actually loaded

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
    // Clean up artwork blob URLs for existing tracks before replacing
    cleanupMultipleTracksArtworkBlobUrls(queue.value.tracks);
    
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
    
    // Clean up artwork blob URLs for the track being removed
    const trackToRemove = queue.value.tracks[index];
    cleanupTrackArtworkBlobUrls(trackToRemove);
    
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
    // Clean up artwork blob URLs for all tracks before clearing
    cleanupMultipleTracksArtworkBlobUrls(queue.value.tracks);
    
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
      
      // If less than 10 seconds into the track, go to previous track
      if (currentPosition < 10000) {
        console.log('🎵 Going to previous track (<10s in)');
        // Continue to previous track logic below
      } else {
        console.log('🎵 Restarting current track (>10s in)');
        audio.seek(0); // Restart current track
        return;
      }
    } catch (error) {
      console.warn('Could not check audio position for previous track logic:', error);
      // If we can't check position, default to going to previous track
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

  // ========== AUDIO PLAYBACK INTEGRATION ==========
  // Media session is now managed by the audio store tied to actual playback

  // Watch for track changes while playing - this triggers audio loading when navigating tracks
  watch(
    currentTrack,
    async (newTrack) => {
      // Only load new tracks when we're actually playing
      if (!queue.value.isPlaying || !newTrack) return;
      
      try {
        const { useAudio } = await import('./audio');
        const audio = useAudio();
        
        // Spotify handles its own playback - queue is display-only
        if (newTrack.source === AudioSource.SPOTIFY) {
          console.log('🎵 Queue: Spotify track navigation - handled by Spotify store');
          return;
        }
        
        // Check if we need to load a new track
        const needsNewTrack = !audio.currentTrackId || audio.currentTrackId !== newTrack.sourceId;
        
        if (needsNewTrack) {
          console.log('🎵 Queue: Track navigation - loading new track:', newTrack.title);
          const success = await audio.playTrack(newTrack);
          if (!success) {
            console.warn('🎵 Queue: Failed to load track during navigation:', newTrack.title);
          }
        } else {
          console.log('🎵 Queue: Track navigation - same track already loaded:', newTrack.title);
        }
      } catch (error) {
        console.warn('Queue: Could not load track during navigation:', error);
      }
    }
  );

  // Watch play/pause state - handles initial playback and pause/resume
  watch(
    () => queue.value.isPlaying,
    async (isPlaying) => {
      try {
        const { useAudio } = await import('./audio');
        const audio = useAudio();
        
        if (isPlaying) {
          const track = currentTrack.value;
          if (track) {
            // Spotify handles its own playback - queue is display-only
            if (track.source === AudioSource.SPOTIFY) {
              console.log('🎵 Queue: Spotify track playing - handled by Spotify store');
              // Spotify playback is managed by the Spotify store, nothing to do here
            } else {
              // Non-Spotify tracks use the regular audio system
              const needsNewTrack = !audio.currentTrackId || audio.currentTrackId !== track.sourceId;
              
              if (needsNewTrack) {
                console.log('🎵 Queue: Initial play - loading and playing new track:', track.title);
                const success = await audio.playTrack(track);
                if (!success) {
                  console.warn('🎵 Queue: Failed to load track:', track.title);
                }
              } else {
                console.log('🎵 Queue: Resuming current track:', track.title);
                audio.play();
              }
            }
          } else {
            // No track in queue, just try to play whatever is loaded (non-Spotify only)
            audio.play();
          }
        } else {
          // Pause audio playback (Spotify handles its own pause)
          const track = currentTrack.value;
          if (track && track.source === AudioSource.SPOTIFY) {
            console.log('🎵 Queue: Spotify track pausing - handled by Spotify store');
            // Spotify playback is managed by the Spotify store, nothing to do here
          } else {
            audio.pause();
          }
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