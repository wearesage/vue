import { ref, computed, type ShallowRef, watchEffect } from "vue";
import { easeInOut, clamp } from "../../util";
import { scaleLinear } from "d3-scale";
import { interpolateBasis, interpolateNumber } from "d3-interpolate";
import SpotifyAudioAnalyser from "../../classes/SpotifyAudioAnalyser";
import { SpotifyAnalysis } from "../../api/spotify";
import { useRAF } from "../../stores";

const Intervals = ["segments", "beats"] as const;

type Interval = (typeof Intervals)[number];
type IntervalIndex = number;
type IntervalProgress = number;
type IntervalProgressEased = number;
type ActiveIntervalData = Record<Interval, [IntervalIndex, IntervalProgress, IntervalProgressEased]>;

export function useEchoNest(analysisData: ShallowRef<SpotifyAnalysis | null>) {
  const raf = useRAF();
  const now = computed(() => raf.now);
  const track = computed(() => analysisData.value?.track || null);
  const playing = computed(() => analysisData.value?.isPlaying || false);
  const latency = ref(0);
  const stream = ref(0);
  const position = computed(() => (analysisData.value ? now.value - analysisData.value.timestamp : null));
  const progress = computed<number | null>(() =>
    analysisData.value ? clamp(position.value! / analysisData.value.track.duration_ms) : null
  );
  const audioAnalyser = ref<SpotifyAudioAnalyser | null>(
    new SpotifyAudioAnalyser([
      [1, 0.1],
      [4, 0.1],
    ])
  );
  const activeIntervals = computed<ActiveIntervalData | null>(() =>
    !playing.value || position.value === null
      ? null
      : Intervals.reduce((acc, group) => {
          analysisData.value?.audioAnalysis[group].forEach((interval: any, i: number) => {
            if (acc[group]) return;
            const start = interval.start * 1000;
            const duration = interval.duration * 1000;
            if (position.value! > start && position.value! < start + duration) {
              const p = (position.value! - start) / duration;
              acc[group] = [i, p, easeInOut(p)];
            }
          });

          return acc;
        }, {} as ActiveIntervalData)
  );

  const volume = computed(() => {
    if (!playing.value || position.value === null) return 1;

    const segmentIndex = activeIntervals.value?.segments?.[0] || -1;
    const segments = analysisData.value?.audioAnalysis.segments;
    const segment = segments?.[segmentIndex];

    if (!segment || segmentIndex === -1 || !segments || !audioAnalyser.value) return 1;

    /**
     * Suck my fuck, Spotify 🖕
     */
    const { duration, start, loudness_max, loudness_max_time, loudness_start } = segment;
    const loudness_next = segments?.[segmentIndex + 1]?.loudness_start || loudness_max;
    const startMs = start * 1000;
    const durationMs = duration * 1000;
    const offset = loudness_max_time * 1000;
    const dbToLinear = (v: number) => Math.pow(10, v / 20);
    const startLinear = dbToLinear(loudness_start);
    const maxLinear = dbToLinear(loudness_max);
    const nextLinear = dbToLinear(loudness_next);
    const elapsed = position.value! - startMs;
    const progressA = clamp(elapsed / offset);
    const elapsedB = elapsed - offset;
    const progressB = clamp(elapsedB / (durationMs - offset));
    const from = progressA < 1 ? startLinear : maxLinear;
    const to = progressA < 1 ? maxLinear : nextLinear;
    const progress = progressA < 1 ? progressA : progressB;
    const iV = interpolateNumber(from, to);
    const value = iV(progress);

    audioAnalyser.value?.setSpotifyVolume(value);

    return (audioAnalyser.value?.tick(raf.frameRate) || { volume: 1 }).volume;
  });

  const base = scaleLinear([60, 120], [0.1, 0.03]);
  const bump = scaleLinear([60, 120], [0.2, 0.1]);

  watchEffect(() => {
    let tick = 0.01;

    if (playing.value) {
      const fps = raf.frameRate as number;
      const vol = Math.pow(volume.value, 0.75);
      const pSegment = activeIntervals.value?.segments?.[2] as number;
      const pBeat = activeIntervals.value?.beats?.[2] as number;

      if (pSegment && pBeat) {
        const iBeat = interpolateBasis([base(fps), base(fps) * vol + bump(fps) * vol, base(fps)]);
        const iSegment = interpolateBasis([base(fps), base(fps) * vol + bump(fps) * vol, base(fps)]);
        const value = iBeat(pBeat) + iSegment(pSegment);
        if (!isNaN(value)) {
          tick = value;
        }
      }
    }

    stream.value += tick;
  });

  return {
    stream,
    volume,
    progress,
    position,
    track,
    latency,
    playing,
  };
}
