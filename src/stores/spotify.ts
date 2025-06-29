import { defineStore } from "pinia";
import { ref, computed, watch, shallowRef, markRaw, type Raw } from "vue";
import { useAuth } from "./auth";
import { useToast } from "./toast";
import { spotifyApi, type SpotifyProfile, type CurrentlyPlaying, type SpotifyAnalysis } from "../api/spotify";
import { useRoute, useRouter } from "vue-router";
import { scaleLinear } from "d3-scale";
import { interpolateBasis } from "d3-interpolate";
import { useRAF } from "./raf";
import { easeInOut, clamp } from "../util";
import SpotifyAudioAnalyser from "../classes/SpotifyAudioAnalyser";

const INTERVALS = ["segments", "tatums", "beats", "bars", "sections"] as const;
type Interval = (typeof INTERVALS)[number];

// Constants for timing
const SEEK_THRESHOLD_MS = 1000; // If progress jumps by more than 1s, assume seek
const RESYNC_INTERVAL_MS = 15000; // Resync every 10s to combat drift
const INTERVAL_CHECK_RATE_MS = 50; // Check for interval changes every 50ms

interface TimingReference {
  fetchTime: number; // When we fetched the data (Date.now())
  progressMs: number; // progress_ms from Spotify at fetch time
  playbackStart: number; // Calculated playback start time (accounting for seeks)
  lastSeekTime: number; // When the last seek was detected
}

export const useSpotify = defineStore("spotify", () => {
  const auth = useAuth();
  const toast = useToast();
  const route = useRoute();
  const router = useRouter();
  const raf = useRAF();

  // Core state
  const profile = ref<SpotifyProfile | null>(null);
  const currentTrack = ref<CurrentlyPlaying | null>(null);
  const analysisData = shallowRef<Raw<SpotifyAnalysis> | null>(null);
  const isConnecting = ref(false);
  const isLoading = ref(false);
  const playing = ref(false);
  const shouldAutoSelect = ref(false);

  // Timing state - this is the key to handling seeks properly
  const timingRef = ref<TimingReference | null>(null);
  const lastIntervalCheck = ref(0);
  const resyncTimer = ref<any>(null);

  // Animation state
  const stream = ref(0);
  const normalizedVolume = ref(1);
  const pitches = ref<number[]>([]);
  const timbre = ref<number[]>([]);
  const audioAnalyser = ref<SpotifyAudioAnalyser | null>(new SpotifyAudioAnalyser());

  // Interval tracking
  const activeIntervals = ref<Record<Interval, number>>({
    segments: -1,
    tatums: -1,
    beats: -1,
    bars: -1,
    sections: -1,
  });

  const intervalProgress = ref<Record<Interval, number>>({
    segments: 0,
    tatums: 0,
    beats: 0,
    bars: 0,
    sections: 0,
  });

  const easedProgress = ref<Record<Interval, number>>({
    segments: 0,
    tatums: 0,
    beats: 0,
    bars: 0,
    sections: 0,
  });

  // Computed
  const isConnected = computed(() => !!profile.value);
  const hasValidAuth = computed(() => auth.isAuthenticated && !!auth.user);
  const canConnect = computed(() => hasValidAuth.value && !isConnected.value);

  // Get current playback position in seconds, handling seeks
  function getCurrentPosition(): number {
    if (!timingRef.value || !playing.value) return 0;

    const now = Date.now();
    const elapsed = now - timingRef.value.fetchTime;
    const estimatedProgress = timingRef.value.progressMs + elapsed;

    return estimatedProgress / 1000; // Convert to seconds
  }

  // Detect and handle seeks by comparing expected vs actual progress
  function detectAndHandleSeek(newProgressMs: number) {
    if (!timingRef.value) return false;

    const now = Date.now();
    const elapsed = now - timingRef.value.fetchTime;
    const expectedProgress = timingRef.value.progressMs + elapsed;
    const difference = Math.abs(newProgressMs - expectedProgress);

    if (difference > SEEK_THRESHOLD_MS) {
      console.log(`🔄 Seek detected! Expected: ${expectedProgress}ms, Got: ${newProgressMs}ms`);

      // Update timing reference to account for seek
      timingRef.value = {
        fetchTime: now,
        progressMs: newProgressMs,
        playbackStart: now - newProgressMs,
        lastSeekTime: now,
      };

      // Reset interval tracking after seek
      resetIntervalTracking();
      return true;
    }

    return false;
  }

  // Reset interval tracking (useful after seeks)
  function resetIntervalTracking() {
    Object.keys(activeIntervals.value).forEach((key) => {
      activeIntervals.value[key as Interval] = -1;
      intervalProgress.value[key as Interval] = 0;
      easedProgress.value[key as Interval] = 0;
    });
  }

  // Binary search for active interval (more efficient than linear search)
  function findActiveInterval(intervals: any[], position: number): number {
    if (!intervals || intervals.length === 0) return -1;

    let left = 0;
    let right = intervals.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const interval = intervals[mid];

      if (position >= interval.start && position < interval.start + interval.duration) {
        return mid;
      }

      if (position < interval.start) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    return -1;
  }

  // Find all active intervals
  function findActiveIntervals() {
    if (!analysisData.value?.isPlaying || !currentTrack.value) return;

    const position = getCurrentPosition();

    INTERVALS.forEach((intervalType) => {
      const intervals = analysisData.value?.audioAnalysis?.[intervalType];
      if (!intervals) return;

      const newIndex = findActiveInterval(intervals, position);

      if (newIndex !== activeIntervals.value[intervalType]) {
        activeIntervals.value[intervalType] = newIndex;
        // Reset progress when entering new interval
        if (newIndex >= 0) {
          intervalProgress.value[intervalType] = 0;
        }
      }
    });
  }

  // Update progress for all active intervals
  function updateIntervalProgress() {
    if (!analysisData.value?.isPlaying || !currentTrack.value) return;

    const position = getCurrentPosition();

    INTERVALS.forEach((intervalType) => {
      const activeIndex = activeIntervals.value[intervalType];
      if (activeIndex === -1) return;

      const intervals = analysisData.value?.audioAnalysis?.[intervalType];
      if (!intervals || activeIndex >= intervals.length) return;

      const interval = intervals[activeIndex];
      if (!interval) return;

      // Calculate progress within current interval
      const rawProgress = (position - interval.start) / interval.duration;
      const clampedProgress = clamp(rawProgress);

      intervalProgress.value[intervalType] = clampedProgress;
      easedProgress.value[intervalType] = easeInOut(clampedProgress);
    });
  }

  // Pulse animation scales for stream calculation
  const base = scaleLinear([60, 120], [0.1, 0.05]);
  const bump = scaleLinear([60, 120], [0.6, 0.3]);

  // Calculate stream using beat/tatum pulse interpolators
  function updateStreamFromPulse() {
    // Stream animation based on beat progress with FPS-responsive scaling
    const fps = raf.frameRate as number;
    const iStream = interpolateBasis([base(fps), bump(fps), base(fps)]);
    const progress = easedProgress.value.beats;
    stream.value += iStream(progress);
  }

  // Main animation loop
  function pulse() {
    if (!analysisData.value?.isPlaying) return;

    const now = Date.now();

    // Only check for interval changes periodically
    if (now - lastIntervalCheck.value > INTERVAL_CHECK_RATE_MS) {
      findActiveIntervals();
      lastIntervalCheck.value = now;
    }

    // Always update progress for smooth animation
    updateIntervalProgress();

    // Update volume using AudioAnalyser (for bloom)
    updateVolume();

    // Calculate stream using beat/tatum pulse interpolators (high resolution)
    updateStreamFromPulse();
  }

  // Update volume based on current segment
  function updateVolume() {
    const segmentIndex = activeIntervals.value.segments;
    if (segmentIndex === -1 || !analysisData.value?.audioAnalysis?.segments || !audioAnalyser.value) return;

    const segment = analysisData.value.audioAnalysis.segments[segmentIndex];
    if (!segment) return;

    const start = Math.pow(10, segment.loudness_start / 20); // Convert dB to linear
    const max = Math.pow(10, segment.loudness_max / 20); // Convert dB to linear

    console.log(segment, start, max);

    // // Feed this to the audio analyser for volume processing only
    // console.log(loudness, linearVolume);
    // audioAnalyser.value.setSpotifyVolume(linearVolume);
    // const result = audioAnalyser.value.tick(raf.frameRate as number);

    // // Use only the analyser's processed volume (for bloom)
    // normalizedVolume.value = result.volume;

    // // Update pitches and timbre from segment data
    // if (segment.pitches) pitches.value = [...segment.pitches];
    // if (segment.timbre) timbre.value = [...segment.timbre];
  }

  // Start animation loop
  function startAnimation() {
    raf.add(pulse, { id: "spotify-pulse" });
  }

  // Stop animation loop
  function stopAnimation() {
    raf.remove("spotify-pulse");
  }

  // Start periodic resync to combat drift
  function startResyncTimer() {
    stopResyncTimer();

    resyncTimer.value = setInterval(async () => {
      if (playing.value) {
        console.log("⏱️ Performing periodic resync");
        await getCurrentTrack();
      }
    }, RESYNC_INTERVAL_MS);
  }

  // Stop resync timer
  function stopResyncTimer() {
    if (resyncTimer.value) {
      clearInterval(resyncTimer.value);
      resyncTimer.value = null;
    }
  }

  // Check connection status
  async function checkConnectionStatus() {
    if (!hasValidAuth.value) return;

    try {
      const data = await spotifyApi.getConnectionStatus();
      if (data.connected) {
        profile.value = data.profile!;
      } else {
        profile.value = null;
      }
    } catch (error) {
      console.error("Failed to check Spotify connection status:", error);
    }
  }

  // Connect to Spotify
  async function connect() {
    console.log("🎵 Spotify connect() called");
    console.log("🎵 hasValidAuth:", hasValidAuth.value);
    console.log("🎵 isConnecting:", isConnecting.value);

    if (!hasValidAuth.value) {
      console.log("🎵 No valid auth, showing error");
      toast.error("Please sign in first");
      return;
    }

    if (isConnecting.value) {
      console.log("🎵 Already connecting, returning");
      return;
    }

    try {
      console.log("🎵 Starting Spotify connection...");
      isConnecting.value = true;
      
      // Pass the current URL as the return URL so we come back to the same place
      const currentUrl = window.location.href.split('?')[0]; // Remove any existing query params
      const data = await spotifyApi.initializeAuth(currentUrl);
      console.log("🎵 Got auth response:", data);
      console.log("🎵 Redirecting to:", data.authUrl);

      // For external URLs, we need to use the native browser navigation
      // Vue Router might be intercepting window.location changes
      console.log("🎵 Using document.location for external redirect...");
      document.location.href = data.authUrl;
    } catch (error) {
      console.error("🎵 Failed to connect Spotify:", error);
      toast.error("Failed to connect to Spotify");
      isConnecting.value = false;
    }
  }

  // Disconnect from Spotify
  async function disconnect() {
    if (!isConnected.value) return;

    try {
      cleanup();
      await spotifyApi.disconnect();
      profile.value = null;
      currentTrack.value = null;
      analysisData.value = null;
      playing.value = false;
      timingRef.value = null;
      toast.message("Spotify disconnected");
    } catch (error) {
      console.error("Failed to disconnect Spotify:", error);
      toast.error("Failed to disconnect from Spotify");
    }
  }

  // Get current track and handle timing
  async function getCurrentTrack() {
    if (!isConnected.value) return null;

    try {
      const data = await spotifyApi.getCurrentTrack();
      const wasPlaying = playing.value;
      const previousTrackId = currentTrack.value?.track?.id;

      currentTrack.value = data;
      playing.value = data?.isPlaying || false;

      if (data) {
        const now = Date.now();
        const trackChanged = previousTrackId !== data.track.id;

        // Handle seek detection or track change
        if (trackChanged) {
          console.log(`🎵 New track: ${data.track.artists[0]?.name} - ${data.track.name}`);
          timingRef.value = {
            fetchTime: now,
            progressMs: data.progress_ms,
            playbackStart: now - data.progress_ms,
            lastSeekTime: 0,
          };
          resetIntervalTracking();
        } else if (timingRef.value) {
          // Check for seek
          detectAndHandleSeek(data.progress_ms);
        } else {
          // First time setup
          timingRef.value = {
            fetchTime: now,
            progressMs: data.progress_ms,
            playbackStart: now - data.progress_ms,
            lastSeekTime: 0,
          };
        }

        if (playing.value) {
          // Get analysis if track changed or we don't have it
          if (trackChanged || !analysisData.value) {
            await getCurrentAnalysis();
          }

          if (!wasPlaying) {
            startAnimation();
            startResyncTimer();
          }
        } else {
          stopAnimation();
          stopResyncTimer();
        }
      } else {
        // No track playing
        timingRef.value = null;
        stopAnimation();
        stopResyncTimer();
      }

      return currentTrack.value;
    } catch (error) {
      console.error("Failed to get current track:", error);
      return null;
    }
  }

  // Get audio analysis for current track
  async function getCurrentAnalysis() {
    if (!isConnected.value || !currentTrack.value) return null;

    try {
      isLoading.value = true;
      const data = await spotifyApi.getCurrentAnalysis();

      if (data) {
        // Validate and sort intervals
        INTERVALS.forEach((intervalType) => {
          const intervals = data.audioAnalysis?.[intervalType];
          if (intervals && intervals.length > 1) {
            // Check if sorted by start time
            let needsSort = false;
            for (let i = 1; i < intervals.length; i++) {
              if (intervals[i].start < intervals[i - 1].start) {
                needsSort = true;
                break;
              }
            }
            if (needsSort) {
              console.warn(`⚠️ ${intervalType} intervals were not sorted, fixing...`);
              intervals.sort((a: any, b: any) => a.start - b.start);
            }
          }
        });
      }

      analysisData.value = markRaw(data);

      // Initialize active intervals and audio analyser
      if (data?.isPlaying) {
        findActiveIntervals();
        if (audioAnalyser.value) {
          audioAnalyser.value.initialize();
        }
      }

      return analysisData.value;
    } catch (error) {
      console.error("Failed to get current analysis:", error);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // Cleanup function
  function cleanup() {
    stopAnimation();
    stopResyncTimer();
    if (audioAnalyser.value) {
      audioAnalyser.value.destroy();
    }
  }

  // Require connection helper
  async function requireConnection(): Promise<boolean> {
    console.log("🎵 requireConnection() called");
    console.log("🎵 isConnected:", isConnected.value);

    if (isConnected.value) {
      console.log("🎵 Already connected, returning true");
      return true;
    }

    if (!hasValidAuth.value) {
      console.log("🎵 No valid auth for requireConnection");
      toast.error("Please sign in to connect Spotify");
      return false;
    }

    console.log("🎵 Calling connect() from requireConnection");
    await connect();
    console.log("🎵 connect() finished, returning false");
    return false;
  }

  // Handle source selection
  async function handleSourceSelection() {
    console.log("🎵 handleSourceSelection() called");
    console.log("🎵 isConnected:", isConnected.value);

    if (!isConnected.value) {
      console.log("🎵 Not connected, calling requireConnection");
      const connected = await requireConnection();
      console.log("🎵 requireConnection returned:", connected);
      if (!connected) {
        console.log("🎵 Spotify connection required, redirecting to OAuth...");
        return false;
      }
    }

    console.log("🎵 Connected! Showing success message");
    toast.message(`Connected to Spotify as ${profile.value?.display_name}`);
    await getCurrentTrack();
    return true;
  }

  // Watchers
  watch(
    () => auth.isFullyAuthenticated,
    async (authenticated) => {
      if (authenticated) {
        // Check if user already has Spotify tokens stored
        if (auth.user?.spotifyProfile?.accessToken) {
          profile.value = auth.user.spotifyProfile;
          console.log("🎵 Restored Spotify connection from stored tokens");
        }

        // Handle OAuth return flow
        if (route.query.spotify === "connected") {
          await checkConnectionStatus();
          if (isConnected.value) {
            toast.message("Spotify connected successfully!");
            await getCurrentTrack();
            shouldAutoSelect.value = true;
          }
        }
      } else {
        cleanup();
        profile.value = null;
        currentTrack.value = null;
        analysisData.value = null;
        timingRef.value = null;
      }
    },
    { immediate: true }
  );

  watch(
    () => route.query.spotify,
    async (spotifyParam) => {
      if (spotifyParam === "connected" && auth.isFullyAuthenticated) {
        await checkConnectionStatus();
        if (isConnected.value) {
          toast.message("Spotify connected successfully!");
          await getCurrentTrack();
          shouldAutoSelect.value = true;
        }
      }
    }
  );

  // Cleanup on unmount
  watch(
    () => auth.isFullyAuthenticated,
    (authenticated) => {
      if (!authenticated) {
        cleanup();
      }
    }
  );

  return {
    // State
    profile,
    currentTrack,
    analysisData,
    isConnected,
    isConnecting,
    isLoading,
    hasValidAuth,
    canConnect,
    playing,
    stream,
    volume: normalizedVolume,
    activeIntervals,
    intervalProgress,
    easedProgress,
    pitches,
    timbre,
    shouldAutoSelect,

    // Methods
    connect,
    disconnect,
    getCurrentTrack,
    getCurrentAnalysis,
    requireConnection,
    checkConnectionStatus,
    cleanup,
    handleSourceSelection,

    // Timing info (useful for debugging)
    timingRef,
    getCurrentPosition,
  };
});
