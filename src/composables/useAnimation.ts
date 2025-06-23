import { onMounted, onBeforeUnmount, ref, computed } from "vue";
import { useRAF, type Animation, AnimationTick } from "../stores/raf";
import { v4 } from "uuid";

export function useAnimation(tick: AnimationTick, config: Partial<Animation> = {}) {
  const generatedId = ref(v4());
  const { autoStart, duration, id } = { autoStart: true, ...config };
  const appliedId = computed(() => id ?? generatedId.value);
  const { add, remove } = useRAF();

  onMounted(() => {
    if (autoStart) {
      add(tick, {
        id: appliedId.value,
        duration,
      });
    }
  });

  onBeforeUnmount(() => {
    remove(appliedId.value);
  });

  return {
    start() {
      add(tick, {
        id: appliedId.value,
        duration,
      });
    },

    stop() {
      remove(appliedId.value);
    },
  };
}
