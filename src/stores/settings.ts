import { ref } from "vue";
import { defineStore } from "pinia";

export const useSettings = defineStore("settings", () => {
  const disableFlashing = ref(false);
  const neonMode = ref(false);
  const showMenuLabels = ref(true);
  const alwaysShowTrack = ref(false);
  const shuffleDesigns = ref(false);
  const infinityPlay = ref(true);
  const visualizerSpeed = ref(1);
  const preferLossless = ref(false);

  return {
    disableFlashing,
    neonMode,
    showMenuLabels,
    alwaysShowTrack,
    shuffleDesigns,
    infinityPlay,
    visualizerSpeed,
    preferLossless,
  };
});
