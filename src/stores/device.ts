import { ref } from "vue";
import { defineStore, acceptHMRUpdate } from "pinia";
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

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDevice, import.meta.hot));
}
