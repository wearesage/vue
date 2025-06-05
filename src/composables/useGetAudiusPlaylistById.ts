import { ref, watch, type ComputedRef, type Ref } from "vue";
import { useAudius } from "../stores/audius";

export function useGetAudiusPlaylistById(id: Ref | ComputedRef<string>) {
  const audius = useAudius();
  const playlist = ref<any>(null);

  async function fetchPlaylist() {
    if (!id.value) return;
    playlist.value = await audius.fetchPlaylistById(id.value);
  }

  watch(() => id.value, fetchPlaylist, { immediate: true });

  return playlist;
}
