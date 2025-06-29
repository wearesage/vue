import { ref } from "vue";
import { useClipboard } from "@vueuse/core";
import { useToast } from "../../stores/toast";

export function useNativeShare() {
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
