import { parseBuffer } from 'music-metadata';

export interface FileMetadata {
  title: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  track?: number;
  duration?: number;
  artwork?: string; // blob URL
  artworkBlobUrls?: string[]; // for cleanup tracking
}

/**
 * Composable for extracting rich metadata from audio files
 */
export function useAudioMetadata() {
  /**
   * Extract metadata from an audio file using music-metadata library
   */
  async function extractMetadata(file: File): Promise<FileMetadata> {
    try {
      // Convert File to ArrayBuffer for music-metadata
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      // Parse metadata using music-metadata
      const metadata = await parseBuffer(buffer, file.type, { duration: true });
      
      // Extract artwork if available - use blob URL for better memory efficiency
      let artwork: string | undefined;
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const picture = metadata.common.picture[0];
        const blob = new Blob([picture.data], { type: picture.format });
        artwork = URL.createObjectURL(blob);
      }
      
      // Build metadata object with fallback to filename parsing
      const result: FileMetadata = {
        title: metadata.common.title || extractTitleFromFilename(file.name),
        artist: metadata.common.artist,
        album: metadata.common.album,
        genre: metadata.common.genre?.[0], // genres is an array
        year: metadata.common.year,
        track: metadata.common.track?.no,
        duration: metadata.format.duration,
        artwork,
        artworkBlobUrls: artwork ? [artwork] : undefined
      };
      
      // If we didn't get artist from metadata, try filename parsing
      if (!result.artist) {
        const parsed = parseFilename(file.name);
        result.artist = parsed.artist;
        if (!metadata.common.title) {
          result.title = parsed.title;
        }
      }
      
      return result;
      
    } catch (error) {
      console.warn('🎵 Music metadata extraction failed, falling back to filename parsing:', error);
      
      // Fallback to filename parsing
      const parsed = parseFilename(file.name);
      return {
        title: parsed.title,
        artist: parsed.artist,
        album: undefined,
        duration: undefined,
        artwork: undefined
      };
    }
  }
  
  /**
   * Parse filename for basic metadata (fallback method)
   * Supports formats like "Artist - Title.mp3"
   */
  function parseFilename(filename: string): { title: string; artist?: string } {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const parts = nameWithoutExt.split(' - ');
    
    return {
      title: parts.length > 1 ? parts[1] : nameWithoutExt,
      artist: parts.length > 1 ? parts[0] : undefined
    };
  }
  
  /**
   * Extract title from filename, removing extension
   */
  function extractTitleFromFilename(filename: string): string {
    return filename.replace(/\.[^/.]+$/, "");
  }
  
  return {
    extractMetadata
  };
}