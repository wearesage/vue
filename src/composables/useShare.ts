import { useToast } from "../stores/toast";
import { useClipboard } from "@vueuse/core";
import { ref } from "vue";

export function useShare() {
  const toast = useToast();
  const shareUrl = ref("https://beta.kaleidosync.com");
  const { copy } = useClipboard({ source: shareUrl });

  async function share() {
    if (navigator?.canShare({ url: shareUrl.value })) {
      navigator?.share({ url: shareUrl.value });
      return;
    }

    await copy();
    toast.message("Link copied to clipboard!");
  }

  return share;
}
