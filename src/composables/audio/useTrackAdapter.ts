import { computed } from "vue";
import { AudioSource } from "@wearesage/shared";
import type { Ref, ComputedRef } from "vue";

/**
 * Universal Track Structure
 * Normalized format for all track types across different audio sources
 */
export interface UniversalTrack {
  // Core identifiers
  id: string;
  source: AudioSource;
  sourceId: string; // Original ID from the source (Spotify ID, Audius ID, etc.)

  // Basic metadata
  title: string;
  artist: string;
  album?: string;

  // Duration and timing
  duration?: number; // Duration in milliseconds (normalized)
  durationSeconds?: number; // Duration in seconds (convenience)
  position?: number; // Current playback position in milliseconds
  progress?: number; // Progress as 0-1 decimal

  // Visual assets
  artwork?: {
    small?: string; // ~64x64
    medium?: string; // ~300x300
    large?: string; // ~640x640
  };

  // Additional metadata
  genre?: string;
  year?: number;
  releaseDate?: string;
  label?: string;
  tags?: string[];
  playCount?: number;

  // Playback state
  isPlaying?: boolean;

  // Source-specific data (for debugging/advanced use)
  rawData?: any;
}

/**
 * Spotify Track Adapter
 */
function adaptSpotifyTrack(spotifyData: any): UniversalTrack | null {
  // Handle both wrapped format ({ track: {...} }) and direct track format
  const track = spotifyData?.track || spotifyData;
  if (!track) return null;

  console.log(spotifyData);
  const duration = track.duration_ms;
  const position = spotifyData.progress_ms || 0;

  return {
    id: `spotify:${track.id}`,
    source: AudioSource.SPOTIFY,
    sourceId: track.id,
    title: track.name,
    artist: track.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
    album: track.album?.name,
    duration,
    durationSeconds: duration ? Math.floor(duration / 1000) : undefined,
    position,
    progress: duration ? position / duration : 0,
    artwork: {
      small: track.album?.images?.[2]?.url,
      medium: track.album?.images?.[1]?.url,
      large: track.album?.images?.[0]?.url,
    },
    isPlaying: spotifyData.isPlaying !== false, // Default to true if not specified
    rawData: spotifyData,
  };
}

/**
 * Audius Track Adapter
 */
function adaptAudiusTrack(audiusData: any): UniversalTrack | null {
  if (!audiusData) return null;

  const duration = audiusData.duration ? audiusData.duration * 1000 : undefined; // Convert seconds to ms
  const sourceId = audiusData.audiusId || audiusData.id || audiusData.track_id || "unknown";

  return {
    id: `audius:${sourceId}`,
    source: AudioSource.AUDIUS,
    sourceId: sourceId.toString(),
    title: audiusData.title || audiusData.track_name || audiusData.name || "Unknown Title",
    artist: audiusData.artist || audiusData.user?.name || audiusData.user?.handle || "Unknown Artist",
    album: audiusData.album,
    duration,
    durationSeconds: audiusData.duration,
    genre: audiusData.genre,
    year: audiusData.releaseDate ? new Date(audiusData.releaseDate).getFullYear() : undefined,
    releaseDate: audiusData.releaseDate,
    tags: audiusData.tags,
    playCount: audiusData.playCount || audiusData.play_count,
    artwork: {
      small: audiusData.artwork?.small || audiusData.artwork?.["150x150"],
      medium: audiusData.artwork?.medium || audiusData.artwork?.["480x480"],
      large: audiusData.artwork?.large || audiusData.artwork?.["1000x1000"],
    },
    isPlaying: true, // Set to true when we set it as current track
    rawData: audiusData,
  };
}

/**
 * Radio Paradise Track Adapter
 */
function adaptRadioTrack(radioData: any): UniversalTrack | null {
  if (!radioData) return null;

  const duration = radioData.duration ? radioData.duration * 1000 : undefined; // Convert seconds to ms

  return {
    id: `radio:${radioData.source}:${radioData.sourceTrackId || `${radioData.artist}-${radioData.title}`}`,
    source: radioData.source === "RADIO_PARADISE" ? AudioSource.RADIO_PARADISE : AudioSource.KEXP,
    sourceId: radioData.sourceTrackId || `${radioData.artist}-${radioData.title}`,
    title: radioData.title,
    artist: radioData.artist,
    album: radioData.album,
    duration,
    durationSeconds: radioData.duration,
    genre: radioData.genre,
    year: radioData.year,
    label: radioData.label,
    isPlaying: true, // Radio is always "playing" when we have current track data
    rawData: radioData,
  };
}

/**
 * Generic Track Adapter
 * Handles any track data and tries to normalize it
 */
function adaptGenericTrack(data: any, source: AudioSource): UniversalTrack | null {
  if (!data) return null;

  // Try to extract common fields from various possible structures
  const title = data.title || data.name || data.track_name || "Unknown Title";
  const artist = data.artist || data.artist_name || data.artists?.[0]?.name || "Unknown Artist";

  return {
    id: `${source}:${data.id || `${artist}-${title}`}`,
    source,
    sourceId: data.id || `${artist}-${title}`,
    title,
    artist,
    album: data.album || data.album_name,
    duration: data.duration_ms || (data.duration ? data.duration * 1000 : undefined),
    durationSeconds: data.duration || (data.duration_ms ? Math.floor(data.duration_ms / 1000) : undefined),
    rawData: data,
  };
}

/**
 * Pure Track Adapter
 * Takes a reactive track and source, returns normalized UniversalTrack
 */
export function useTrackAdapter(
  track: Ref<any> | ComputedRef<any>,
  source: Ref<AudioSource | null> | ComputedRef<AudioSource | null>
): ComputedRef<UniversalTrack | null> {
  return computed(() => {
    const trackData = track?.value;
    const sourceType = source?.value;

    if (!trackData || !sourceType) {
      return null;
    }

    try {
      switch (sourceType) {
        case AudioSource.SPOTIFY:
          return adaptSpotifyTrack(trackData);
        case AudioSource.AUDIUS:
          return adaptAudiusTrack(trackData);
        case AudioSource.RADIO_PARADISE:
        case AudioSource.KEXP:
          return adaptRadioTrack(trackData);
        default:
          return adaptGenericTrack(trackData, sourceType);
      }
    } catch (error) {
      console.error("Error adapting track data:", error);
      return null;
    }
  });
}

/**
 * Get adapter function for a specific source
 */
export function getAdapterForSource(source: AudioSource) {
  switch (source) {
    case AudioSource.SPOTIFY:
      return adaptSpotifyTrack;
    case AudioSource.AUDIUS:
      return adaptAudiusTrack;
    case AudioSource.RADIO_PARADISE:
    case AudioSource.KEXP:
      return adaptRadioTrack;
    default:
      return (data: any) => adaptGenericTrack(data, source);
  }
}

/**
 * Adapt any track data to universal format (one-time conversion)
 */
export function adaptTrack(data: any, source: AudioSource): UniversalTrack | null {
  const adapter = getAdapterForSource(source);
  return adapter(data);
}

/**
 * Individual adapters for direct use
 */
export { adaptSpotifyTrack, adaptAudiusTrack, adaptRadioTrack, adaptGenericTrack };

/**
 * Type exports for external usage
 */
export type { UniversalTrack };
