import { useRoute } from "vue-router";
import { computed } from "vue";

export function useRouteParamId() {
  const route = useRoute();
  const id = computed(() => (route.params as any)?.id as string);
  return id;
}
