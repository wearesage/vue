import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useAudioAnalyser, useAudioElement } from "../composables";
import { useSpotify } from "./spotify";
import { useRoute, useRouter } from "vue-router";
import { useAuth, useSettings } from ".";
import { AudioSource, enumKeyToLabel } from "@wearesage/shared";

// Icon mapping for UI display
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

// Available sources for UI selection (exclude NONE and BROWSER_AUDIO)
export const SelectableAudioSources: AudioSource[] = [
  AudioSource.SPOTIFY,
  AudioSource.AUDIUS,
  AudioSource.MICROPHONE,
  AudioSource.RADIO_PARADISE,
  AudioSource.KEXP,
  AudioSource.FILE,
];

// Helper to get pretty label for display
export function getAudioSourceLabel(source: AudioSource): string {
  const enumKey = Object.keys(AudioSource).find((key) => AudioSource[key as keyof typeof AudioSource] === source);
  return enumKey ? enumKeyToLabel(enumKey) : "Unknown";
}

export const useSources = defineStore("sources", () => {
  const route = useRoute();
  const router = useRouter();
  const auth = useAuth();
  const spotify = useSpotify();
  const settings = useSettings();
  const src = ref(null);
  const { initialize, volume: audioVolume, stream: audioStream } = useAudioAnalyser();
  const { element, playing: audioPlaying, play, pause, toggle } = useAudioElement(src, initialize);
  const source = ref<AudioSource | null>(null);
  const prettySource = computed(() => (source.value !== null ? getAudioSourceLabel(source.value) : null));
  const sourceIcon = computed(() => (source.value !== null ? AudioSourceIcons[source.value] : "sound"));
  const useSpotifyValues = computed(() => source.value === AudioSource.SPOTIFY && spotify.isConnected && spotify.playing);
  const volume = computed(() => (useSpotifyValues.value ? spotify.volume : audioVolume.value));
  const stream = computed(() => (useSpotifyValues.value ? spotify.stream : audioStream.value));
  const playing = computed(() => (source.value === AudioSource.SPOTIFY && spotify.isConnected ? spotify.playing : audioPlaying.value));
  const activeVolume = computed(() => (settings.disableFlashing ? 1 : volume.value));
  const activeStream = computed(() => stream.value * settings.visualizerSpeed);

  watch(
    () => spotify.shouldAutoSelect,
    async (shouldSelect) => {
      if (shouldSelect && source.value !== AudioSource.SPOTIFY) {
        await selectSource(AudioSource.SPOTIFY);
        spotify.shouldAutoSelect = false;
        console.log("Auto-selected Spotify after OAuth connection");
        if (route.query.spotify === "connected") {
          router.replace({ query: { ...route.query, spotify: undefined } });
        }
      }
    }
  );

  watch(
    () => auth.isAuthenticated,
    async () => {
      await auth.authDetermined;
      const lastSourceStr = localStorage.getItem("selectedAudioSource");
      if (!lastSourceStr || source.value !== null) return;
      const lastSource = Number(lastSourceStr) as AudioSource;
      if (SelectableAudioSources.includes(lastSource) && lastSource === AudioSource.SPOTIFY && spotify.isConnected) {
        await selectSource(AudioSource.SPOTIFY);
      }
    },
    { immediate: true }
  );

  async function selectSource(newSource: AudioSource) {
    if (!SelectableAudioSources.includes(newSource)) return console.warn(`Invalid audio source: ${newSource}`);
    if (newSource === AudioSource.SPOTIFY && !(await spotify.handleSourceSelection())) return;
    source.value = newSource;
    localStorage.setItem("selectedAudioSource", newSource.toString());
    if (source.value === AudioSource.AUDIUS) router.push("/audius");
  }

  return {
    source,
    prettySource,
    sourceIcon,
    selectSource,
    initialize,
    volume: activeVolume,
    stream: activeStream,
    element,
    playing,
    play,
    pause,
    toggle,
    settings,
  };
});
