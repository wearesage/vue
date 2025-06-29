import { defineStore } from "pinia";
import { ref, shallowRef, type Raw, computed } from "vue";
import { spotifyApi, type CurrentlyPlaying, type SpotifyAnalysis } from "../api/spotify";
import { scaleLinear } from "d3-scale";
import { interpolateBasis } from "d3-interpolate";
import { useRAF } from "./raf";
import { useToast } from "./toast";
import { useAuth } from "./auth";
import { easeInOut, clamp } from "../util";
import SpotifyAudioAnalyser from "../classes/SpotifyAudioAnalyser";

const INTERVALS = ["segments", "tatums", "beats", "bars", "sections"] as const;
type Interval = (typeof INTERVALS)[number];

interface TimingReference {
  fetchTime: number; // When we fetched the data (Date.now())
  progressMs: number; // progress_ms from Spotify at fetch time
  playbackStart: number; // Calculated playback start time (accounting for seeks)
  lastSeekTime: number; // When the last seek was detected
}

export const useSpotify = defineStore("spotify", () => {
  const raf = useRAF();
  const toast = useToast();
  const auth = useAuth();
  const profile = computed(() => auth?.user?.spotifyProfile);
  const currentTrack = ref<CurrentlyPlaying | null>(null);
  const analysisData = shallowRef<Raw<SpotifyAnalysis> | null>(null);
  const playing = ref(false);
  const timingRef = ref<TimingReference>();
  const stream = ref(0);
  const normalizedVolume = ref(1);
  const pitches = ref<number[]>([]);
  const timbre = ref<number[]>([]);
  const audioAnalyser = ref<SpotifyAudioAnalyser | null>(new SpotifyAudioAnalyser());
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

  function getCurrentPosition(): number {
    if (!timingRef.value || !playing.value) return 0;
    const now = Date.now();
    const elapsed = now - timingRef.value.fetchTime;
    const estimatedProgress = timingRef.value.progressMs + elapsed;
    return estimatedProgress / 1000;
  }

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

  function findActiveIntervals() {
    if (!analysisData.value?.isPlaying || !currentTrack.value) return;
    const position = getCurrentPosition();
    INTERVALS.forEach((intervalType) => {
      const intervals = analysisData.value?.audioAnalysis?.[intervalType];
      if (!intervals) return;
      const newIndex = findActiveInterval(intervals, position);
      if (newIndex !== activeIntervals.value[intervalType]) {
        activeIntervals.value[intervalType] = newIndex;
        if (newIndex >= 0) intervalProgress.value[intervalType] = 0;
      }
    });
  }

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
      const rawProgress = (position - interval.start) / interval.duration;
      const clampedProgress = clamp(rawProgress);
      intervalProgress.value[intervalType] = clampedProgress;
      easedProgress.value[intervalType] = easeInOut(clampedProgress);
    });
  }

  const base = scaleLinear([60, 120], [0.1, 0.05]);
  const bump = scaleLinear([60, 120], [0.6, 0.3]);

  function updateStreamFromPulse() {
    const fps = raf.frameRate as number;
    const iStream = interpolateBasis([base(fps), bump(fps), base(fps)]);
    const progress = easedProgress.value.beats;
    stream.value += iStream(progress);
  }

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

  async function getSpotifyTokens() {
    try {
      const currentUrl = window.location.href.split("?")[0];
      const data = await spotifyApi.initializeAuth(currentUrl);
      console.log(data);
      document.location.href = data.authUrl;
    } catch (error) {
      console.log(error);
    }
  }

  async function getCurrentAnalysis() {
    try {
      const data = await spotifyApi.getCurrentAnalysis();
      analysisData.value = data || null;
    } catch (error) {
      console.error("Failed to get current analysis:", error);
    }
  }

  const interval = ref();

  function stopInterval() {
    clearInterval(interval.value);
  }

  function startInterval() {
    stopInterval();

    interval.value = setInterval(async () => {
      await getCurrentAnalysis();
      if (currentTrack.value) stopInterval();
    }, 5000);
  }

  async function initialize() {
    await getCurrentAnalysis();

    if (profile.value?.display_name) {
      toast.message(`Connected to Spotify as ${profile.value?.display_name}!`);
    }

    if (!analysisData.value) {
      startInterval();
    }

    raf.add(
      (now) => {
        if (!analysisData.value) return;

        findActiveIntervals();
        updateIntervalProgress();
        updateVolume();
        updateStreamFromPulse();
        console.log(now);
      },
      { id: "spotify" }
    );
  }

  function cleanup() {
    raf.remove("spotify");
  }

  return {
    profile,
    currentTrack,
    analysisData,
    playing,
    stream,
    volume: normalizedVolume,
    activeIntervals,
    intervalProgress,
    easedProgress,
    pitches,
    timbre,
    timingRef,
    getSpotifyTokens,
    getCurrentPosition,
    initialize,
    cleanup,
  };
});
