import { reactive } from "vue";
import { usePageName } from "./usePageName";
import { useSlotNames } from "./useSlotNames";
import { useMeta } from "./useMeta";
import { sample } from "../util/arrays";

function useViewIcon() {
  // Placeholder implementation
  return "";
}

export const placeholderMessages = [
  "🚧 Under construction! Watch out for falling features.",
  "Nothing here yet! But if you stare long enough, something might appear... or not.",
  "This page is still loading… just kidding, it doesn’t exist yet.",
  "Coming soon: a feature so powerful, even we don’t know what it does.",
  "Error 404: Feature Not Found (because we haven’t built it yet, duh).",
  "Welcome to the void! It's cozy, right?",
  "This space reserved for something amazing. Or a cat GIF. We haven’t decided yet.",
  "Shhh… this page is still sleeping. Come back later.",
  "Currently in stealth mode. Like a ninja. A really lazy ninja.",
  "Feature in progress: ETA unknown. Possibly powered by hope and coffee.",
];

export function useView() {
  const name = usePageName();
  const slots = useSlotNames();
  const icon = useViewIcon();
  const meta = useMeta();
  const placeholder = sample(placeholderMessages);

  return reactive({
    slots,
    icon,
    meta,
    name,
    placeholder,
  });
}
