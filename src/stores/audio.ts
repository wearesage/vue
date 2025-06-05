import { ref } from "vue";
import { defineStore } from "pinia";
import { useAudioAnalyser } from "../composables/useAudioAnalyser";
import { useAudioElement } from "../composables/useAudioElement";

export const useAudio = defineStore("audio", () => {
  const src = ref(`/music/braids/plath.heart.mp3`);
  const { initialize, volume, stream, initialized } = useAudioAnalyser();
  const { element, playing, play, pause, toggle } = useAudioElement(src, initialize);

  return {
    element,
    src,
    volume,
    stream,
    toggle,
    playing,
    play,
    pause,
    initialized,
  };
});
