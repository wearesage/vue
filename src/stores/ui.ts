import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, computed } from "vue";

export const useUI = defineStore("ui", () => {
  const loadingDots = ref(true);
  const showShaderScroll = ref(false);

  return {
    loadingDots: computed(() => loadingDots.value),
    setLoadingDots: (value: boolean) => {
      loadingDots.value = value;
    },
    showShaderScroll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUI, import.meta.hot));
}
