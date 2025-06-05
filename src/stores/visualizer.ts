import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useMagicKeys } from "@vueuse/core";
import { useAudioAnalyser } from "../composables/useAudioAnalyser";
import { useSketches } from "./sketches";
import { useAudioElement } from "../composables/useAudioElement";
import { useRandomAdeleTrack } from "../composables/useRandomAdeleTrack";
import { AUDIO_SOURCES, AUDIO_SOURCE_ICONS, type AudioSource } from "../data/constants/audio-sources";

export const useVisualizer = defineStore("visualizer", () => {
  const sketches = useSketches();
  const { ArrowLeft, ArrowRight } = useMagicKeys();
  const { initialize, volume, stream } = useAudioAnalyser();
  const src = useRandomAdeleTrack();
  const { element, playing, play, pause, toggle } = useAudioElement(src, initialize);
  const source = ref<AudioSource | null>(null);
  const showEditor = ref(false);
  const showUniforms = ref(false);
  const showChat = ref(false);
  const sourceIcon = computed(() => {
    if (source.value && AUDIO_SOURCE_ICONS[source.value as AudioSource]) return AUDIO_SOURCE_ICONS[source.value];
    return "sound";
  });

  function selectSource(newSource: AudioSource) {
    if (AUDIO_SOURCES.includes(newSource)) {
      source.value = newSource;
    } else {
      console.warn(`Invalid audio source: ${newSource}`);
    }
  }

  function toggleEditor() {
    showEditor.value = !showEditor.value;
  }

  function toggleUniforms() {
    showUniforms.value = !showUniforms.value;
  }

  function toggleChat() {
    showChat.value = !showChat.value;
  }

  watch(ArrowLeft, (val) => {
    if (val) {
      if (showUniforms.value && showEditor.value) return;
      sketches.selectPreviousSketch();
    }
  });

  watch(ArrowRight, (val) => {
    if (val) {
      if (showUniforms.value && showEditor.value) return;
      sketches.selectNextSketch();
    }
  });

  return {
    source,
    sourceIcon,
    selectSource,
    toggleEditor,
    showEditor,
    showUniforms,
    toggleUniforms,
    showChat,
    toggleChat,
    initialize,
    volume,
    stream,
    element,
    playing,
    play,
    pause,
    toggle,
  };
});
