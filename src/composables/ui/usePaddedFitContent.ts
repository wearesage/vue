import { watch, ref, computed, type Ref } from "vue";

export function usePaddedFitContent(elementRef: Ref<HTMLElement>, padding: number = 10) {
  const minWidth = ref("fit-content");
  const maxWidth = ref("fit-content");
  const styles = computed(() => ({
    "min-width": minWidth.value,
    "max-width": maxWidth.value,
  }));

  function set() {
    const contentWidth = parseFloat(window.getComputedStyle(elementRef.value).width);
    minWidth.value = `${contentWidth + padding}px`;
    maxWidth.value = `${contentWidth + 2 * padding}px`;
  }

  watch(
    elementRef,
    (val) => {
      if (val) set();
    },
    {
      immediate: true,
    }
  );

  return styles;
}
