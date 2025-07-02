import { ref } from 'vue';

interface TrackArtworkUrls {
  trackId: string;
  blobUrls: string[];
}

/**
 * Centralized blob URL management for track artwork
 * Ensures proper cleanup and memory management
 */
export function useArtworkBlobManager() {
  // Track all artwork blob URLs by track ID
  const trackArtworkUrls = ref<Map<string, string[]>>(new Map());

  /**
   * Create a blob URL from binary artwork data
   */
  function createArtworkBlobUrl(data: Uint8Array, format: string): string {
    const blob = new Blob([data], { type: format });
    return URL.createObjectURL(blob);
  }

  /**
   * Convert base64 data URL to blob URL for better memory efficiency
   */
  function convertBase64ToBlobUrl(base64DataUrl: string): string {
    // Extract the base64 data and mime type
    const [header, base64Data] = base64DataUrl.split(',');
    const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
    
    // Convert base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create blob URL
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  /**
   * Register artwork blob URLs for a track
   */
  function registerTrackArtwork(trackId: string, blobUrls: string[]): void {
    if (blobUrls.length === 0) return;
    
    // Clean up any existing URLs for this track first
    cleanupTrackArtwork(trackId);
    
    // Register new URLs
    trackArtworkUrls.value.set(trackId, [...blobUrls]);
    
    console.log(`🎨 Registered ${blobUrls.length} artwork URL(s) for track: ${trackId}`);
  }

  /**
   * Clean up artwork blob URLs for a specific track
   */
  function cleanupTrackArtwork(trackId: string): void {
    const urls = trackArtworkUrls.value.get(trackId);
    if (!urls) return;

    // Revoke all blob URLs for this track
    urls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('🎨 Failed to revoke artwork blob URL:', error);
      }
    });

    // Remove from tracking
    trackArtworkUrls.value.delete(trackId);
    
    console.log(`🎨 Cleaned up ${urls.length} artwork URL(s) for track: ${trackId}`);
  }

  /**
   * Clean up artwork for multiple tracks
   */
  function cleanupMultipleTrackArtwork(trackIds: string[]): void {
    trackIds.forEach(trackId => cleanupTrackArtwork(trackId));
  }

  /**
   * Clean up ALL tracked artwork blob URLs
   */
  function cleanupAllArtwork(): void {
    const trackIds = Array.from(trackArtworkUrls.value.keys());
    
    trackIds.forEach(trackId => {
      const urls = trackArtworkUrls.value.get(trackId);
      if (urls) {
        urls.forEach(url => {
          try {
            URL.revokeObjectURL(url);
          } catch (error) {
            console.warn('🎨 Failed to revoke artwork blob URL:', error);
          }
        });
      }
    });

    trackArtworkUrls.value.clear();
    console.log(`🎨 Cleaned up artwork for ${trackIds.length} tracks`);
  }

  /**
   * Get current artwork URL count (for debugging)
   */
  function getArtworkStats() {
    const totalTracks = trackArtworkUrls.value.size;
    const totalUrls = Array.from(trackArtworkUrls.value.values())
      .reduce((sum, urls) => sum + urls.length, 0);
    
    return { totalTracks, totalUrls };
  }

  /**
   * Check if a track has registered artwork
   */
  function hasTrackArtwork(trackId: string): boolean {
    return trackArtworkUrls.value.has(trackId);
  }

  return {
    createArtworkBlobUrl,
    convertBase64ToBlobUrl,
    registerTrackArtwork,
    cleanupTrackArtwork,
    cleanupMultipleTrackArtwork,
    cleanupAllArtwork,
    getArtworkStats,
    hasTrackArtwork
  };
}