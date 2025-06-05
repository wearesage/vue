import { useRoute } from "vue-router";

export function usePageName() {
  const route = useRoute();
  return route?.name || "";
}
