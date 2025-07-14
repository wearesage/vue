import { defineStore, acceptHMRUpdate } from "pinia";
import { ref } from "vue";
import { useDebouncedSearch } from "../composables/data/useDebouncedSearch";

const API = import.meta.env.VITE_API;
const RANGES = ["week", "month"] as const;
type Range = (typeof RANGES)[number];

export const useAudius = defineStore("audius", () => {
  const { query, results } = useDebouncedSearch(search);

  const trending = ref({
    tracks: { week: [], month: [], year: [] },
    playlists: { week: [], month: [], year: [] },
  });

  async function search(q: string) {
    const res = await fetch(`${API}/api/audius/search/${encodeURIComponent(q)}`);
    const data = await res.json();
    return data;
  }

  async function fetchUser(handle: string) {
    const res = await fetch(`${API}/api/audius/users/${encodeURIComponent(handle)}`);
    const data = await res.json();
    return data;
  }

  async function fetchPlaylistById(id: string) {
    const res = await fetch(`${API}/api/audius/playlists/${encodeURIComponent(id)}`);
    const data = await res.json();
    return data;
  }

  async function fetchTrending() {
    const res = await fetch(`${API}/api/audius/trending`);
    const data = await res.json();
    console.log(data);
    trending.value.tracks = data.tracks;
    trending.value.playlists = data.playlists;
    return data;
  }

  async function getTrackStream(trackId: string) {
    const res = await fetch(`${API}/api/audius/stream/${encodeURIComponent(trackId)}`);
    const data = await res.json();
    return data;
  }

  return {
    query,
    results,
    trending,
    fetchTrending,
    fetchPlaylistById,
    fetchUser,
    getTrackStream,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAudius, import.meta.hot));
}
