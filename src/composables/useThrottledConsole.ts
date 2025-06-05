import { ref } from "vue";

export function useThrottledConsole() {
  const waiting = ref(false);
  return {
    log(val: any) {
      if (waiting.value) return;
      waiting.value = true;
      setTimeout(() => {
        console.log(val);
        waiting.value = false;
      }, 150);
    },
  };
}
