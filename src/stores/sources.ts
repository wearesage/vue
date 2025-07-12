import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, computed, watch } from "vue";
import { useTransition } from "@vueuse/core";
import { interpolateNumber } from "d3-interpolate";
import { useAudioAnalyser, useAudioElement } from "../composables";
import { useAuth, useRAF, useSpotify } from ".";
import { useRouter } from "../router/sage-router";
import { AudioSource, RadioParadiseStation, enumKeyToLabel, type RadioParadiseStation as RadioParadiseStationType } from "@wearesage/shared";
import { clamp, easeInOut } from "../util";
import { MediaSessionManager } from "../classes/MediaSessionManager";
import { useRadioStream } from "../composables/useRadioStream";


export const AudioSourceIcons: Record<AudioSource, string> = {
  [AudioSource.SPOTIFY]: "spotify",
  [AudioSource.AUDIUS]: "audius",
  [AudioSource.MICROPHONE]: "microphone",
  [AudioSource.RADIO_PARADISE]: "radio-paradise",
  [AudioSource.KEXP]: "kexp",
  [AudioSource.FILE]: "upload",
  [AudioSource.BROWSER_AUDIO]: "sound",
  [AudioSource.NONE]: "sound",
};

export const SelectableAudioSources: AudioSource[] = [
  AudioSource.SPOTIFY,
  AudioSource.AUDIUS,
  AudioSource.MICROPHONE,
  AudioSource.RADIO_PARADISE,
  AudioSource.KEXP,
  AudioSource.FILE,
];

export function getAudioSourceLabel(source: AudioSource): string {
  const enumKey = Object.keys(AudioSource).find((key) => AudioSource[key as keyof typeof AudioSource] === source);
  return enumKey ? enumKeyToLabel(enumKey) : "Unknown";
}

export const useSources = defineStore("sources", () => {
  const auth = useAuth();
  const router = useRouter();
  const spotify = useSpotify();
  const raf = useRAF();
  
  // Media session manager for source-specific controls
  const mediaSessionManager = new MediaSessionManager();
  
  // Audio analysis will be handled by the audio store

  // Watch for audio element from audio store to connect analyser
  let audioPlaying = ref(false);

  // Get volume, stream, and playing state from audio store
  let audioStoreVolume = ref(0);
  let audioStoreStream = ref(0);
  
  const connectToAudioStore = async () => {
    try {
      const { useAudio } = await import("./audio");
      const audio = useAudio();

      // Sync playing state
      watch(
        () => audio.playing,
        (playing) => {
          audioPlaying.value = playing;
        },
        { immediate: true }
      );

      // Watch volume
      watch(
        () => audio.volume,
        (volume) => {
          audioStoreVolume.value = volume;
        },
        { immediate: true }
      );

      // Watch stream
      watch(
        () => audio.stream,
        (stream) => {
          audioStoreStream.value = stream;
        },
        { immediate: true }
      );

      console.log("🔊 Sources: Connected to audio store for volume/stream/playing data");
    } catch (error) {
      console.warn("Sources: Could not connect to audio store:", error);
    }
  };

  // Connect on store creation
  connectToAudioStore();
  const source = ref<AudioSource | null>(null);
  const radioParadiseStation = ref<RadioParadiseStationType>(RadioParadiseStation.MAIN_MIX);
  
  // Radio stream integration
  const radioStream = computed(() => {
    if (source.value === AudioSource.RADIO_PARADISE || source.value === AudioSource.KEXP) {
      // TODO: Get preferLossless from user preferences
      const preferLossless = false; // Default for now
      return useRadioStream(source.value, radioParadiseStation.value, preferLossless);
    }
    return null;
  });
  
  const prettySource = computed(() => {
    if (source.value !== null) {
      // Use radio stream station name if available
      if (radioStream.value?.stationName.value) {
        return radioStream.value.stationName.value;
      }
      return getAudioSourceLabel(source.value);
    }
    return null;
  });
  const sourceIcon = computed(() => (source.value !== null ? AudioSourceIcons[source.value] : "sound"));
  const useSpotifyValues = computed(() => source.value === AudioSource.SPOTIFY && spotify.playing);

  // Raw volume values from different sources
  const spotifyVolume = computed(() => spotify.volume);
  const microphoneVolume = computed(() => {
    // Microphone volume comes from the same audioStoreVolume since
    // it's now handled by the consolidated AudioSystemManager
    return source.value === AudioSource.MICROPHONE ? audioStoreVolume.value : 0;
  });


  // Raw source volume (before interpolation)
  const rawSourceVolume = computed(() => {
    if (useSpotifyValues.value) return spotifyVolume.value;
    return audioStoreVolume.value; // From audio store's analyser
  });

  // Volume interpolation for smooth source transitions
  const interpolatedVolume = ref(0);
  const isVolumeInterpolating = ref(false);
  
  // Initialize interpolated volume with current source volume
  interpolatedVolume.value = rawSourceVolume.value;
  
  // Update interpolated volume when raw source volume changes (but only when not transitioning)
  watch(() => rawSourceVolume.value, (newVolume) => {
    if (!isVolumeInterpolating.value) {
      interpolatedVolume.value = newVolume;
    }
  });


  // Detect if anything is actually playing
  const isPlayingAThing = computed(() => {
    if (source.value === AudioSource.SPOTIFY) return spotify.playing;
    if (source.value === AudioSource.MICROPHONE) return true; // Microphone is always "playing" when active
    return audioPlaying.value;
  });

  // Smooth volume floor transition using our custom easing
  const minVolume = useTransition(
    computed(() => (isPlayingAThing.value ? 0 : 1)),
    {
      duration: 1000,
      transition: easeInOut,
    }
  );

  // Stream is now handled in connectToAudioStore() above

  // Stream continuity tracking to prevent snaps when switching sources
  const lastSourceStream = ref(0);
  const streamOffset = ref(0);
  const hasCalculatedOffset = ref(false);
  
  // Raw stream from current source
  const rawStream = computed(() => (useSpotifyValues.value ? spotify.stream : audioStoreStream.value));
  
  // Check if new stream source is stable and ready
  const isNewStreamStable = computed(() => {
    return rawStream.value > 0.001 &&  // Not just initialized to 0
           source.value !== null &&     // Source is actually set
           source.value !== AudioSource.MICROPHONE; // Skip offset for real-time sources like microphone
  });
  
  // Watch for when stream becomes stable to calculate offset ONCE
  watch(() => isNewStreamStable.value, (stable) => {
    if (stable && !hasCalculatedOffset.value) {
      // Stream just became stable, calculate offset once
      const newOffset = lastSourceStream.value - rawStream.value;
      streamOffset.value = newOffset;
      hasCalculatedOffset.value = true;
      console.log(`🎯 Stream offset calculated once: ${newOffset.toFixed(3)}`);
    }
  });
  
  // Watch for source changes to handle volume transitions and reset stream offset calculation
  watch(() => source.value, (newSource, oldSource) => {
    if (oldSource !== null && newSource !== oldSource) {
      console.log(`🎯 Stream continuity: switching from ${getAudioSourceLabel(oldSource)} to ${getAudioSourceLabel(newSource)}`);
      
      // Reset offset calculation flag for new source
      hasCalculatedOffset.value = false;
      
      // Volume interpolation  
      const fromVolume = interpolatedVolume.value || rawSourceVolume.value;
      const toVolume = rawSourceVolume.value;
      
      if (Math.abs(fromVolume - toVolume) > 0.01) { // Only interpolate if there's a meaningful difference
        console.log(`🎵 Volume interpolation: ${fromVolume.toFixed(3)} → ${toVolume.toFixed(3)}`);
        
        isVolumeInterpolating.value = true;
        const volumeInterpolator = interpolateNumber(fromVolume, toVolume);
        
        raf.remove("volume-source-transition");
        raf.add(
          (now, progress) => {
            interpolatedVolume.value = volumeInterpolator(progress);
            if (progress >= 1) {
              isVolumeInterpolating.value = false;
            }
          },
          {
            id: "volume-source-transition",
            duration: 750, // Same duration as useAppliedVolume
          }
        );
      } else {
        // No meaningful difference, just set directly
        interpolatedVolume.value = toVolume;
        isVolumeInterpolating.value = false;
      }
    }
  });
  
  // Final applied volume - never goes below minVolume, uses interpolated volume for smooth transitions
  const volume = computed(() => clamp(interpolatedVolume.value, minVolume.value, 1));
  const stream = computed(() => {
    // For real-time sources like microphone, use raw stream without offset
    if (source.value === AudioSource.MICROPHONE) {
      return rawStream.value;
    }
    // For track-based sources, apply offset for continuity
    return rawStream.value + streamOffset.value;
  });
  
  // Update tracking to maintain the last known continuous stream value
  watch(() => stream.value, (newStream) => {
    if (isNewStreamStable.value) {
      lastSourceStream.value = newStream;
    }
  });
  const playing = computed(() => isPlayingAThing.value);
  // Note: Components can apply user preferences (disableFlashing, visualizerSpeed) to these values

  // Source transition lock to prevent race conditions
  const isTransitioning = ref(false);
  
  // Queue lock to prevent queue updates during source transitions
  const isQueueLocked = ref(false);

  async function selectSource(newSource: AudioSource) {
    // Prevent concurrent source switches
    if (isTransitioning.value) {
      console.warn(`🔄 Source transition already in progress, ignoring switch to ${getAudioSourceLabel(newSource)}`);
      return;
    }
    if (!SelectableAudioSources.includes(newSource)) {
      console.warn(`Invalid audio source: ${newSource}`);
      return;
    }

    // Lock transitions and queue updates
    isTransitioning.value = true;
    isQueueLocked.value = true;
    
    try {
      // Clean up current source before switching
      const oldSource = source.value;
      if (oldSource !== newSource) {
        console.log(`🔄 Switching from ${getAudioSourceLabel(oldSource)} to ${getAudioSourceLabel(newSource)}`);
        await performSourceCleanup(oldSource);
        
      }

      // Activate media session for the new source BEFORE setting source value
      // This ensures media session is ready when watchers fire
      mediaSessionManager.activateForSource(newSource);

      source.value = newSource;
      // No localStorage saving - we want fresh discovery each session! 🎵

      // Audio analysis will be handled by the audio store element
      if (newSource !== AudioSource.SPOTIFY && newSource !== AudioSource.NONE) {
        console.log(`🔊 Selected audio source: ${getAudioSourceLabel(newSource)}`);
        // Audio analyser will connect automatically when audio store plays
      }

      if (newSource === AudioSource.SPOTIFY) {
        // Only initialize Spotify if user is authenticated
        if (auth.user) {
          if (auth.user.spotifyProfile?.accessToken) {
            spotify.initialize();
          } else {
            spotify.getSpotifyTokens();
          }
        }
        // If not authenticated yet, just set the source - Spotify will initialize when auth loads
      }

      if (source.value === AudioSource.AUDIUS) {
        router.push("/audius");
      }

      // Handle radio sources with stream URLs
      if (newSource === AudioSource.RADIO_PARADISE || newSource === AudioSource.KEXP) {
        await handleRadioSourceSelection(newSource);
      }

      // Handle microphone source
      if (newSource === AudioSource.MICROPHONE) {
        await handleMicrophoneSourceSelection();
      }

      // Handle file source
      if (newSource === AudioSource.FILE) {
        await handleFileSourceSelection();
      }
      
      // Verify queue state is clean after transition
      try {
        const { useQueue } = await import('./queue');
        const queue = useQueue();
        console.log(`🎵 Post-transition queue verification: ${queue.queue.tracks.length} tracks, playing: ${queue.queue.isPlaying}`);
      } catch (error) {
        console.warn('Could not verify queue state after transition:', error);
      }
      
      console.log(`✅ Source transition completed: ${getAudioSourceLabel(newSource)}`);
      
    } catch (error) {
      console.error(`❌ Source transition failed to ${getAudioSourceLabel(newSource)}:`, error);
      
      // Reset to no source on failure to prevent inconsistent state
      source.value = AudioSource.NONE;
      mediaSessionManager.deactivate();
      
    } finally {
      // Always unlock transitions and queue
      isTransitioning.value = false;
      isQueueLocked.value = false;
    }
  }

  /**
   * Handle radio source selection (Radio Paradise, KEXP)
   */
  async function handleRadioSourceSelection(radioSource: AudioSource) {
    const stream = radioStream.value;
    if (!stream?.streamUrl.value) {
      console.warn(`No stream URL available for ${getAudioSourceLabel(radioSource)}`);
      return;
    }

    try {
      // Initialize audio element source in AudioSystemManager
      const { useAudioAnalyser } = await import("../composables/audio/useAudioAnalyser");
      const audioAnalyser = useAudioAnalyser();
      await audioAnalyser.audioSystem.initializeAudioElement();
      
      const { useAudio } = await import("./audio");
      const audio = useAudio();
      
      console.log(`🎵 Setting stream URL: ${stream.streamUrl.value}`);
      console.log(`🎵 Stream quality: ${stream.streamQuality.value}`);
      
      // Set the stream URL in the audio store
      await audio.setSource(stream.streamUrl.value);
      
      // Join Radio Paradise socket space if applicable
      if (radioSource === AudioSource.RADIO_PARADISE) {
        await joinRadioParadiseSpace(radioParadiseStation.value);
      }
    } catch (error) {
      console.error(`Failed to initialize radio source ${getAudioSourceLabel(radioSource)}:`, error);
    }
  }

  /**
   * Handle microphone source selection
   */
  async function handleMicrophoneSourceSelection() {
    try {
      console.log('🎤 Initializing microphone source...');
      
      const { useAudioAnalyser } = await import("../composables/audio/useAudioAnalyser");
      const audioAnalyser = useAudioAnalyser();
      
      // Initialize microphone using the consolidated AudioSystemManager
      const success = await audioAnalyser.initializeMicrophone();
      
      if (success) {
        console.log('🎤 Microphone initialized successfully!');
      } else {
        console.error('🎤 Failed to initialize microphone');
        
        // Fallback to no source if microphone fails
        source.value = AudioSource.NONE;
        
        // Show user-friendly error (could be permission denied, no device, etc.)
        // You might want to show a toast notification here
      }
    } catch (error) {
      console.error('🎤 Error initializing microphone:', error);
      source.value = AudioSource.NONE;
    }
  }

  /**
   * Handle file source selection
   */
  async function handleFileSourceSelection() {
    try {
      console.log('📁 Initializing file source...');
      
      // Initialize audio element source in AudioSystemManager  
      const { useAudioAnalyser } = await import("../composables/audio/useAudioAnalyser");
      const audioAnalyser = useAudioAnalyser();
      await audioAnalyser.audioSystem.initializeAudioElement();
      
      console.log('📁 File source initialized - ready for file selection');
      
      // NOTE: Actual file loading will be handled by the file input component
      // and will call setFileSource() when files are selected
      
    } catch (error) {
      console.error('📁 Error initializing file source:', error);
      source.value = AudioSource.NONE;
    }
  }

  /**
   * Select a specific Radio Paradise station
   */
  async function selectRadioParadiseStation(station: RadioParadiseStationType) {
    const oldStation = radioParadiseStation.value;
    
    // Leave old Radio Paradise space if switching stations
    if (source.value === AudioSource.RADIO_PARADISE && oldStation !== station) {
      console.log(`🎵 Switching from station ${oldStation} to station ${station}`);
      await leaveRadioParadiseSpace(oldStation);
    }
    
    radioParadiseStation.value = station;
    localStorage.setItem("radioParadiseStation", station.toString());

    console.log(`🎵 Selected Radio Paradise station: ${radioStream.value?.stationName.value}`);

    // If already on Radio Paradise, switch to the new station
    if (source.value === AudioSource.RADIO_PARADISE) {
      await handleRadioSourceSelection(AudioSource.RADIO_PARADISE);
    }
  }

  /**
   * Join Radio Paradise socket space for real-time track updates
   */
  async function joinRadioParadiseSpace(station: RadioParadiseStationType) {
    try {
      const { useSocketCore } = await import("./socket-core");
      const socketCore = useSocketCore();
      
      console.log(`🎵 Attempting to join Radio Paradise space for station ${station}`);
      console.log(`🎵 Socket connected: ${socketCore.connected}`);
      
      // Connect socket if not already connected
      if (!socketCore.connected) {
        console.log("🎵 Socket not connected, attempting to connect...");
        await socketCore.connect();
      }
      
      if (socketCore.connected) {
        console.log(`🎵 Joining Radio Paradise space for station ${station}`);
        
        // Clean up any existing listeners first
        socketCore.off("radio-paradise:track-update", handleRadioParadiseTrackUpdate);
        
        // Listen for track updates and update queue
        socketCore.on("radio-paradise:track-update", (data) => {
          console.log("🎵 DEBUG: Raw Radio Paradise track update received:", data);
          handleRadioParadiseTrackUpdate(data);
        });
        
        // Emit join event
        socketCore.emit("radio-paradise:join", { station });
        
        console.log(`🎵 Radio Paradise listeners set up for station ${station}`);
      } else {
        console.error("🎵 Failed to establish socket connection for Radio Paradise");
      }
    } catch (error) {
      console.error("Could not join Radio Paradise socket space:", error);
    }
  }

  /**
   * Leave Radio Paradise socket space and clean up listeners
   */
  async function leaveRadioParadiseSpace(station?: RadioParadiseStationType) {
    try {
      const { useSocketCore } = await import("./socket-core");
      const socketCore = useSocketCore();
      
      const stationToLeave = station ?? radioParadiseStation.value;
      console.log(`🎵 Leaving Radio Paradise space for station ${stationToLeave}`);
      
      if (socketCore.connected) {
        // Emit leave event for the station
        socketCore.emit("radio-paradise:leave", { station: stationToLeave });
        console.log(`🎵 Emitted radio-paradise:leave for station ${stationToLeave}`);
      }
      
      // Remove Radio Paradise track update listeners
      socketCore.off("radio-paradise:track-update", handleRadioParadiseTrackUpdate);
      console.log("🎵 Removed Radio Paradise track update listeners");
      
    } catch (error) {
      console.error("Could not leave Radio Paradise socket space:", error);
    }
  }

  /**
   * Handle Radio Paradise track updates from socket events
   */
  async function handleRadioParadiseTrackUpdate(data: any) {
    console.log("🎵 DEBUG: handleRadioParadiseTrackUpdate called with data:", JSON.stringify(data, null, 2));
    
    // Skip queue updates if locked during source transition
    if (isQueueLocked.value) {
      console.log("🎵 Queue locked during source transition, skipping Radio Paradise track update");
      return;
    }
    
    try {
      // Validate incoming data
      if (!data || !data.track) {
        console.error("🎵 Invalid Radio Paradise track data - missing track:", data);
        return;
      }
      
      if (!data.track.title || !data.track.artist) {
        console.error("🎵 Invalid Radio Paradise track data - missing title/artist:", data.track);
        return;
      }
      
      const { useQueue } = await import("./queue");
      const queue = useQueue();
      
      console.log("🎵 DEBUG: Queue store imported successfully");
      
      // Convert Radio Paradise track to QueueTrack format
      const queueTrack = {
        id: `radio-paradise:${data.station}:${data.track.songId || `${data.track.artist}-${data.track.title}`}`,
        source: AudioSource.RADIO_PARADISE,
        sourceId: data.track.songId || `${data.track.artist}-${data.track.title}`,
        title: data.track.title,
        artist: data.track.artist,
        album: data.track.album,
        duration: data.track.duration ? data.track.duration * 1000 : undefined, // Convert seconds to ms
        artwork: data.track.cover ? {
          medium: data.track.cover,
          large: data.track.cover,
          small: data.track.cover,
        } : undefined,
        rawData: data
      };
      
      console.log("🎵 DEBUG: Created queue track:", JSON.stringify(queueTrack, null, 2));
      
      // Set as current track in queue (Radio Paradise is always "now playing")
      queue.setQueue([queueTrack], 0);
      
      // Update media session metadata through audio store for radio tracks
      try {
        const { useAudio } = await import('./audio');
        const audio = useAudio();
        await audio.updateMediaSessionMetadata(queueTrack);
        console.log(`🎵 Updated media session for Radio Paradise track: ${queueTrack.title}`);
      } catch (error) {
        console.warn('Could not update media session for Radio Paradise track:', error);
      }
      
      console.log(`🎵 Radio Paradise track updated: ${queueTrack.title} by ${queueTrack.artist}`);
      console.log(`🎵 DEBUG: Current queue after update:`, queue.currentTrack);
    } catch (error) {
      console.error("Failed to handle Radio Paradise track update:", error);
    }
  }

  /**
   * Cleanup when switching away from a source
   */
  async function performSourceCleanup(oldSource: AudioSource | null) {
    if (!oldSource) return;

    console.log(`🧹 Cleaning up ${getAudioSourceLabel(oldSource)} source`);

    // Deactivate media session for the old source
    mediaSessionManager.deactivate();

    try {
      // Stop audio playback
      const { useAudio } = await import('./audio');
      const audio = useAudio();
      
      if (audio.playing) {
        console.log('🔊 Stopping audio playback for source switch');
        audio.pause();
      }

      // Aggressively reset the queue when switching sources
      const { useQueue } = await import('./queue');
      const queue = useQueue();
      
      console.log(`🎵 Aggressively resetting queue for source switch (current tracks: ${queue.queue.tracks.length}, playing: ${queue.queue.isPlaying})`);
      queue.reset();
      
      // Ensure queue is completely clear before proceeding
      await new Promise(resolve => setTimeout(resolve, 50)); // Brief pause to ensure reset completes
      
      if (queue.queue.tracks.length > 0) {
        console.warn(`🎵 Queue still has ${queue.queue.tracks.length} tracks after reset, force clearing...`);
        queue.reset(); // Force reset again if needed
      }

      // Source-specific cleanup
      switch (oldSource) {
        case AudioSource.SPOTIFY:
          // Properly reset Spotify store to stop intervals and clear data
          const { useSpotify } = await import('./spotify');
          const spotify = useSpotify();
          spotify.reset();
          console.log('🎵 Spotify store reset and cleanup complete');
          break;
        
        case AudioSource.AUDIUS:
          // No specific cleanup needed for Audius
          console.log('🎵 Audius cleanup complete');
          break;
        
        case AudioSource.RADIO_PARADISE:
          // Use the dedicated leave function for proper cleanup
          await leaveRadioParadiseSpace();
          console.log('🎵 Radio Paradise cleanup complete');
          break;
        
        case AudioSource.MICROPHONE:
          // Microphone cleanup is handled by AudioSystemManager automatically
          // when switching sources - microphone stream will be stopped
          console.log('🎤 Microphone cleanup complete');
          break;
        
        case AudioSource.FILE:
          // File cleanup - revoke object URLs to prevent memory leaks
          await cleanupFileSource();
          console.log('📁 File cleanup complete');
          break;
        
        default:
          console.log(`🎵 Generic cleanup for ${getAudioSourceLabel(oldSource)}`);
          break;
      }
    } catch (error) {
      console.warn('Error during source cleanup:', error);
    }
  }

  /**
   * Store for file-related state
   */
  const currentFileUrls = ref<string[]>([]);

  /**
   * Clean up file source - revoke object URLs to prevent memory leaks
   */
  async function cleanupFileSource() {
    try {
      // Revoke all current file object URLs
      currentFileUrls.value.forEach(url => {
        URL.revokeObjectURL(url);
        console.log('📁 Revoked object URL:', url);
      });
      currentFileUrls.value = [];
    } catch (error) {
      console.warn('Error during file cleanup:', error);
    }
  }

  /**
   * Load files into the audio system and queue
   */
  async function loadFiles(files: FileList) {
    if (!files || files.length === 0) {
      console.warn('📁 No files provided to load');
      return;
    }

    // Skip file loading if not in file source mode
    if (source.value !== AudioSource.FILE) {
      console.warn('📁 Cannot load files - not in file source mode');
      return;
    }

    // Skip file loading if queue is locked during transition
    if (isQueueLocked.value) {
      console.log('📁 Queue locked during source transition, skipping file load');
      return;
    }

    try {
      console.log(`📁 Loading ${files.length} file(s)...`);
      
      // Clean up any existing file URLs
      await cleanupFileSource();
      
      const { useQueue } = await import('./queue');
      const queue = useQueue();
      
      const { useAudio } = await import('./audio');
      const audio = useAudio();
      
      const tracks = [];
      
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('audio/')) {
          console.warn(`📁 Skipping non-audio file: ${file.name}`);
          continue;
        }
        
        console.log(`📁 Processing file: ${file.name} (${file.type})`);
        
        // Create object URL for the file
        const objectUrl = URL.createObjectURL(file);
        currentFileUrls.value.push(objectUrl);
        
        // Extract metadata (basic info from file object)
        const metadata = await extractFileMetadata(file);
        
        // Create queue track
        const track = {
          id: `file:${file.name}:${file.lastModified}`,
          source: AudioSource.FILE,
          sourceId: objectUrl,
          title: metadata.title || file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          artist: metadata.artist || 'Unknown Artist',
          album: metadata.album,
          duration: metadata.duration,
          artwork: metadata.artwork ? { large: metadata.artwork } : undefined,
          artworkBlobUrls: metadata.artworkBlobUrls,
          rawData: { file, objectUrl }
        };
        
        tracks.push(track);
        console.log(`📁 Created track: ${track.title} by ${track.artist}`);
      }
      
      if (tracks.length > 0) {
        // Set queue with the loaded tracks and start playing the first one
        queue.setQueue(tracks, 0);
        
        // Set the first track as the audio source
        const firstTrack = tracks[0];
        await audio.setSource(firstTrack.sourceId);
        
        // Start playback in the queue so media keys work
        if (!queue.queue.isPlaying) {
          queue.togglePlayPause();
        }
        
        console.log(`📁 Loaded ${tracks.length} file(s) into queue, playing: ${firstTrack.title}`);
      } else {
        console.warn('📁 No valid audio files found to load');
      }
      
    } catch (error) {
      console.error('📁 Error loading files:', error);
      await cleanupFileSource();
    }
  }

  /**
   * Extract metadata from audio file using music-metadata library
   */
  async function extractFileMetadata(file: File) {
    try {
      const { useAudioMetadata } = await import('../composables/audio/useAudioMetadata');
      const { extractMetadata } = useAudioMetadata();
      
      return await extractMetadata(file);
    } catch (error) {
      console.warn('📁 Error extracting metadata:', error);
      return {
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: undefined,
        album: undefined,
        duration: undefined,
        artwork: undefined
      };
    }
  }

  // Auto-select source from server response when user authenticates
  function setSourceFromServer(serverSource: AudioSource) {
    if (SelectableAudioSources.includes(serverSource)) {
      console.log("🎵 Auto-selecting audio source from server:", getAudioSourceLabel(serverSource));
      selectSource(serverSource); // Use selectSource to properly initialize the source
    }
  }


  // Initialize source preferences (but don't auto-select sources!)
  function initializeSource() {
    // Restore Radio Paradise station preference (so users don't have to reselect their favorite)
    const savedStation = localStorage.getItem("radioParadiseStation");
    if (savedStation) {
      const stationValue = parseInt(savedStation) as RadioParadiseStationType;
      if (Object.values(RadioParadiseStation).includes(stationValue)) {
        radioParadiseStation.value = stationValue;
        console.log("🎵 Restored Radio Paradise station preference:", stationValue);
      }
    }

    // 🔥 FORCE MUSIC DISCOVERY! No auto-source restoration! 
    // Make those blebs actively choose their audio adventure every session
    console.log("🎵 No auto-source restoration - forcing fresh music discovery! 🎶");
    source.value = null;
  }

  // Initialize on store creation
  initializeSource();

  // Watch for auth loading when Spotify is selected but not initialized
  watch(
    () => auth.user,
    (user) => {
      if (user && source.value === AudioSource.SPOTIFY) {
        // Auth loaded and Spotify is selected - initialize it now
        if (user.spotifyProfile?.accessToken) {
          spotify.initialize();
        } else {
          spotify.getSpotifyTokens();
        }
      }
    }
  );

  async function reset() {
    console.log("🎵 Resetting sources store state");

    // Perform cleanup of current source
    await performSourceCleanup(source.value);

    // Clean up volume interpolation
    raf.remove("volume-source-transition");
    isVolumeInterpolating.value = false;

    // Reset source state
    source.value = null;
    localStorage.removeItem("selectedAudioSource");

    // Reset queue state
    try {
      const { useQueue } = await import('./queue');
      const queue = useQueue();
      queue.reset();
    } catch (error) {
      console.warn('Could not reset queue during sources cleanup:', error);
    }
  }

  return {
    source,
    radioParadiseStation,
    radioStream,
    prettySource,
    sourceIcon,
    selectSource,
    selectRadioParadiseStation,
    setSourceFromServer,
    loadFiles,
    volume,
    stream,
    playing,
    reset,
    mediaSessionManager,
    // Debugging/monitoring
    isTransitioning,
    isQueueLocked,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSources, import.meta.hot));
}
