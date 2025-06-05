import { onMounted, onBeforeUnmount, ref } from "vue";
import { useRAF } from "../stores/raf";

export function useAnimation(tick: ({ now }: { now: DOMHighResTimeStamp }) => void, autoStart: boolean = true) {
  const { add, remove } = useRAF();
  const name = ref(`animation-${Math.floor(Math.random() * 100000000)}`);

  onMounted(() => {
    if (autoStart) {
      add(
        {
          tick,
        },
        name.value
      );
    }
  });

  onBeforeUnmount(() => {
    remove(name.value);
  });

  return {
    start() {
      add(
        {
          tick,
        },
        name.value
      );
    },

    stop() {
      remove(name.value);
    },
  };
}
