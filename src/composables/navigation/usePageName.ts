import { useRoute } from "../../router/sage-router";

export function usePageName() {
  const route = useRoute();
  return route?.name || "";
}
