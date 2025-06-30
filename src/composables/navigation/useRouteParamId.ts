import { useRoute } from "../../router/sage-router";
import { computed } from "vue";

export function useRouteParamId() {
  const route = useRoute();
  const id = computed(() => (route.value.params as any)?.id as string);
  return id;
}
