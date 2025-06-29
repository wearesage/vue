import { ref } from "vue";
import { defineStore } from "pinia";
import * as env from "../util";

export const useDevice = defineStore("device", () => {
  const isSafari = ref(env.isSafari());
  const isPWA = ref(env.isPWA());
  const isMobile = ref(env.isMobile());

  return {
    isSafari,
    isPWA,
    isMobile,
  };
});
