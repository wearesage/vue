import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useAudioAnalyser, useAudioElement } from "../composables";
import { useSpotify } from "./spotify";
import { useAuth } from ".";
import { useRouter } from "../router/sage-router";
import { useSettings } from ".";
import { AudioSource, enumKeyToLabel } from "@wearesage/shared";

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
  const settings = useSettings();
  const src = ref(null);
  const { initialize, volume: audioVolume, stream: audioStream } = useAudioAnalyser();
  const { element, playing: audioPlaying, play, pause, toggle } = useAudioElement(src, initialize);
  const source = ref<AudioSource | null>(null);
  const prettySource = computed(() => (source.value !== null ? getAudioSourceLabel(source.value) : null));
  const sourceIcon = computed(() => (source.value !== null ? AudioSourceIcons[source.value] : "sound"));
  const useSpotifyValues = computed(() => source.value === AudioSource.SPOTIFY && spotify.playing);
  const volume = computed(() => (useSpotifyValues.value ? spotify.volume : audioVolume.value));
  const stream = computed(() => (useSpotifyValues.value ? spotify.stream : audioStream.value));
  const playing = computed(() => (source.value === AudioSource.SPOTIFY ? spotify.playing : audioPlaying.value));
  const activeVolume = computed(() => (settings.disableFlashing ? 1 : volume.value));
  const activeStream = computed(() => stream.value * settings.visualizerSpeed);

  async function selectSource(newSource: AudioSource) {
    if (!SelectableAudioSources.includes(newSource)) {
      console.warn(`Invalid audio source: ${newSource}`);
      return;
    }

    source.value = newSource;
    localStorage.setItem("selectedAudioSource", newSource.toString());

    if (newSource === AudioSource.SPOTIFY) {
      if (auth.user.spotifyProfile?.accessToken) {
        spotify.initialize();
      } else {
        spotify.getSpotifyTokens();
      }
    }

    if (source.value === AudioSource.AUDIUS) {
      router.push("/audius");
    }
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
