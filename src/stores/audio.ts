import { ref } from "vue";
import { defineStore } from "pinia";
import { useAudioAnalyser } from "../composables/audio/useAudioAnalyser";
import { useAudioElement } from "../composables/audio/useAudioElement";

export const useAudio = defineStore("audio", () => {
  const src = ref(`/music/PREXSE/fractals.mp3`);
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
