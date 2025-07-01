import { api } from "./client";

export interface SpotifyProfile {
  id: string;
  display_name: string;
  email: string;
  product: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
  duration_ms: number;
}

export interface CurrentlyPlaying {
  isPlaying: boolean;
  progress_ms: number;
  track: SpotifyTrack;
  timestamp: number;
  device: {
    id: string;
    name: string;
    type: string;
    volume_percent: number;
  };
}

export interface SpotifyAnalysis {
  isPlaying: boolean;
  progress_ms: number;
  timestamp: number;
  track: SpotifyTrack;
  audioFeatures: any;
  audioAnalysis: any;
  device: {
    id: string;
    name: string;
    type: string;
    volume_percent: number;
  };
}

export interface SpotifyConnectionStatus {
  connected: boolean;
  profile?: SpotifyProfile;
  message?: string;
}

export interface SpotifyAuthResponse {
  authUrl: string;
  message: string;
}

export const spotifyApi = {
  async getConnectionStatus(): Promise<SpotifyConnectionStatus> {
    const response = await api.get<SpotifyConnectionStatus>("/api/spotify/status");
    return response.data;
  },

  async initializeAuth(returnUrl?: string): Promise<SpotifyAuthResponse> {
    const params = returnUrl ? { returnUrl } : {};
    const response = await api.post<SpotifyAuthResponse>("/api/spotify/auth", {}, { params });
    return response.data;
  },

  async disconnect(): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>("/api/spotify/disconnect");
    return response.data;
  },

  async getCurrentTrack(): Promise<CurrentlyPlaying | null> {
    const response = await api.get<CurrentlyPlaying>("/api/spotify/current");
    return response.data.isPlaying ? response.data : null;
  },

  async getCurrentAnalysis(): Promise<SpotifyAnalysis | null> {
    const response = await api.get<SpotifyAnalysis>("/api/spotify/analysis");
    return response.data.isPlaying ? response.data : null;
  },
};
