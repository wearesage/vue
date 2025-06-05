import { ref } from "vue";
import library from "../assets/data/adele.json";
import { sample } from "../util/arrays";

export function useRandomAdeleTrack() {
  const album = sample(library.albums) as any;
  const src = ref(`/music/adele/${album.name}/${(sample(album.tracks) as any).filename}`);
  return src;
}
