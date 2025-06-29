import { computed } from "vue";
import { useRoute } from "vue-router";

export function useMeta() {
  const route = useRoute();
  const meta = computed(() => route.meta || null)
  return meta
}
