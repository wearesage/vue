import { defineStore } from "pinia";
import { ref } from "vue";
import { useAPI } from "./api";
import { useDebouncedSearch } from "../composables/useDebouncedSearch";

const RANGES = ["week", "month", "year"] as const;

type Range = (typeof RANGES)[number];

export const useAudius = defineStore("audius", () => {
  const { get } = useAPI();
  const { query, results } = useDebouncedSearch(search);
  const trending = ref({
    tracks: { week: [], month: [], year: [] },
    playlists: { week: [], month: [], year: [] },
  });

  function search(query: string) {
    return get(`/audius/search/${query}`);
  }

  function fetchUser(handle: string) {
    return get(`/audius/users/${handle}`);
  }

  function fetchPlaylistById(id: string) {
    return get(`/audius/playlists/${id}`);
  }

  function fetchTrendingPlaylists(range: Range) {
    return get(`/audius/playlists/trending/${range}`);
  }

  async function fetchTrendingTracks(range: Range) {
    return get(`/audius/tracks/trending/${range}`);
  }

  async function fetchAllTrendingPlaylists() {
    const [week, month, year] = await Promise.all(RANGES.map((range) => fetchTrendingPlaylists(range)));
    return { week, month, year };
  }

  async function fetchAllTrendingTracks() {
    const [week, month, year] = await Promise.all(RANGES.map((range) => fetchTrendingTracks(range)));
    return { week, month, year };
  }

  async function fetchTrending() {
    const [tracks, playlists] = await Promise.all([fetchAllTrendingTracks(), fetchAllTrendingPlaylists()]);

    trending.value = {
      tracks,
      playlists,
    };
  }

  return {
    fetchTrendingPlaylists,
    fetchTrendingTracks,
    fetchAllTrendingPlaylists,
    fetchAllTrendingTracks,
    fetchTrending,
    fetchPlaylistById,
    fetchUser,
    trending,
    query,
    results,
  };
});
