import { ref, shallowRef, computed, watch } from "vue";
import { defineStore, acceptHMRUpdate } from "pinia";
import { useViewport } from "./viewport";
import { coord } from "../util";

export const usePopover = defineStore("popover", () => {
  const viewport = useViewport();
  const visible = ref(false);
  const promise = shallowRef<any>(null);
  const inputText = ref("");
  const inputTextKey = ref("");
  const uniformKey = ref<string | null>(null);

  watch(
    () => visible.value,
    (val) => {
      if (!val) {
        uniformKey.value = null;
      }
    }
  );

  const position = computed(() => {
    const { x, y } = viewport.clicked;
    return coord(x - 15, y + 15);
  });

  const transform = computed(() => {
    const { x, y } = position.value;
    return `translateX(${x}px) translateY(${y}px) scale(${visible.value ? 1 : 0})`;
  });

  function getText(key: string = "") {
    visible.value = true;
    inputTextKey.value = key;
    return new Promise((resolve) => {
      promise.value = resolve;
    });
  }

  function acceptText() {
    visible.value = false;
    promise.value?.(inputText.value);
    inputText.value = "";
    inputTextKey.value = "";
  }

  function editUniform(key: string) {
    visible.value = true;
    uniformKey.value = key;
  }

  return {
    visible,
    position,
    transform,
    getText,
    inputText,
    inputTextKey,
    acceptText,
    editUniform,
    uniformKey,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePopover, import.meta.hot));
}
