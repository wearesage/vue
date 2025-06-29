import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "../api/client";
import { useDebouncedSearch } from "../composables/data/useDebouncedSearch";

const RANGES = ["week", "month", "year"] as const;

type Range = (typeof RANGES)[number];

export const useAudius = defineStore("audius", () => {
  const { query, results } = useDebouncedSearch(search);
  const trending = ref({
    tracks: { week: [], month: [], year: [] },
    playlists: { week: [], month: [], year: [] },
  });

  async function search(query: string) {
    const response = await api.get(`/api/audius/search/${query}`);
    return response.data;
  }

  async function fetchUser(handle: string) {
    const response = await api.get(`/api/audius/users/${handle}`);
    return response.data;
  }

  async function fetchPlaylistById(id: string) {
    const response = await api.get(`/api/audius/playlists/${id}`);
    return response.data;
  }

  async function fetchTrendingPlaylists(range: Range) {
    const response = await api.get(`/api/audius/playlists/trending/${range}`);
    return response.data;
  }

  async function fetchTrendingTracks(range: Range) {
    const response = await api.get(`/api/audius/tracks/trending/${range}`);
    return response.data;
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
