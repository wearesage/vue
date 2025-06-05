import { onMounted, onBeforeUnmount, type Ref } from "vue";

export function useClickOnce(onClick: any, target: Ref<HTMLElement> | null = null) {
  onMounted(() => {
    (target?.value || window)?.addEventListener("click", onClick, {
      once: true,
    });
  });

  onBeforeUnmount(() => {
    (target?.value || window)?.removeEventListener("click", onClick);
  });
}
