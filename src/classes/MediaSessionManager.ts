import { AudioSource } from "@wearesage/shared";

// Media session configuration per audio source
interface MediaSessionConfig {
  enabled: boolean;
  controls: MediaSessionAction[];
  metadata: boolean;
  supportsQueue: boolean;
}

const MEDIA_SESSION_CONFIG: Record<AudioSource, MediaSessionConfig> = {
  [AudioSource.AUDIUS]: {
    enabled: true,
    controls: ['play', 'pause', 'previoustrack', 'nexttrack', 'seekbackward', 'seekforward'],
    metadata: true,
    supportsQueue: true
  },
  [AudioSource.FILE]: {
    enabled: true,
    controls: ['play', 'pause', 'previoustrack', 'nexttrack', 'seekbackward', 'seekforward'],
    metadata: true,
    supportsQueue: true // Support multiple MP3 selection
  },
  [AudioSource.RADIO_PARADISE]: {
    enabled: true,
    controls: ['play', 'pause'],
    metadata: true,
    supportsQueue: false // Live stream
  },
  [AudioSource.KEXP]: {
    enabled: true,
    controls: ['play', 'pause'],
    metadata: true,
    supportsQueue: false // Live stream
  },
  [AudioSource.MICROPHONE]: {
    enabled: true,
    controls: ['play', 'pause'],
    metadata: false, // No track metadata for mic
    supportsQueue: false // Single input
  },
  [AudioSource.SPOTIFY]: {
    enabled: false, // Let Spotify handle its own media session
    controls: [],
    metadata: false,
    supportsQueue: false // Spotify handles its own queue
  },
  [AudioSource.BROWSER_AUDIO]: {
    enabled: true,
    controls: ['play', 'pause'],
    metadata: false,
    supportsQueue: false
  },
  [AudioSource.NONE]: {
    enabled: false,
    controls: [],
    metadata: false,
    supportsQueue: false
  }
};

function getAudioSourceLabel(source: AudioSource): string {
  const enumKey = Object.keys(AudioSource).find((key) => AudioSource[key as keyof typeof AudioSource] === source);
  return enumKey ? enumKey.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : "Unknown";
}

/**
 * Manages media session activation/deactivation per audio source
 */
export class MediaSessionManager {
  private currentConfig: MediaSessionConfig | null = null;

  /**
   * Activate media session for the given source
   */
  async activateForSource(source: AudioSource) {
    const config = MEDIA_SESSION_CONFIG[source];
    
    if (!config.enabled) {
      console.log(`🎵 MediaSessionManager: ${getAudioSourceLabel(source)} - media session disabled`);
      this.deactivate();
      return;
    }

    console.log(`🎵 Activating media session for ${getAudioSourceLabel(source)}`);
    
    // Clear existing handlers first
    this.clearAllHandlers();
    
    // Set up source-specific handlers
    if (config.controls.includes('play')) {
      navigator.mediaSession.setActionHandler('play', async () => {
        console.log(`🎵 Media key: Play (${getAudioSourceLabel(source)})`);
        try {
          const { useQueue } = await import('../stores/queue');
          const queue = useQueue();
          if (!queue.queue.isPlaying) queue.togglePlayPause();
        } catch (error) {
          console.warn('Media key play handler error:', error);
        }
      });
    }

    if (config.controls.includes('pause')) {
      navigator.mediaSession.setActionHandler('pause', async () => {
        console.log(`🎵 Media key: Pause (${getAudioSourceLabel(source)})`);
        try {
          const { useQueue } = await import('../stores/queue');
          const queue = useQueue();
          if (queue.queue.isPlaying) queue.togglePlayPause();
        } catch (error) {
          console.warn('Media key pause handler error:', error);
        }
      });
    }

    if (config.controls.includes('previoustrack')) {
      navigator.mediaSession.setActionHandler('previoustrack', async () => {
        console.log(`🎵 Media key: Previous track (${getAudioSourceLabel(source)})`);
        try {
          const { useQueue } = await import('../stores/queue');
          const queue = useQueue();
          queue.previousTrack();
        } catch (error) {
          console.warn('Media key previous handler error:', error);
        }
      });
    }

    if (config.controls.includes('nexttrack')) {
      navigator.mediaSession.setActionHandler('nexttrack', async () => {
        console.log(`🎵 Media key: Next track (${getAudioSourceLabel(source)})`);
        try {
          const { useQueue } = await import('../stores/queue');
          const queue = useQueue();
          queue.nextTrack();
        } catch (error) {
          console.warn('Media key next handler error:', error);
        }
      });
    }

    if (config.controls.includes('seekbackward')) {
      navigator.mediaSession.setActionHandler('seekbackward', async (details) => {
        console.log(`🎵 Media key: Seek backward (${getAudioSourceLabel(source)})`, details.seekOffset);
        try {
          const { useAudio } = await import('../stores/audio');
          const audio = useAudio();
          audio.skip(-(details.seekOffset || 10));
        } catch (error) {
          console.warn('Media key seek backward handler error:', error);
        }
      });
    }

    if (config.controls.includes('seekforward')) {
      navigator.mediaSession.setActionHandler('seekforward', async (details) => {
        console.log(`🎵 Media key: Seek forward (${getAudioSourceLabel(source)})`, details.seekOffset);
        try {
          const { useAudio } = await import('../stores/audio');
          const audio = useAudio();
          audio.skip(details.seekOffset || 10);
        } catch (error) {
          console.warn('Media key seek forward handler error:', error);
        }
      });
    }
    
    this.currentConfig = config;
  }

  /**
   * Deactivate media session (clear all handlers)
   */
  deactivate() {
    if (this.currentConfig) {
      console.log('🎵 Deactivating media session');
      this.clearAllHandlers();
      this.currentConfig = null;
    }
  }

  /**
   * Get current media session config
   */
  getCurrentConfig(): MediaSessionConfig | null {
    return this.currentConfig;
  }

  /**
   * Clear all media session action handlers
   */
  private clearAllHandlers() {
    if ('mediaSession' in navigator) {
      const allActions: MediaSessionAction[] = ['play', 'pause', 'previoustrack', 'nexttrack', 'seekbackward', 'seekforward'];
      allActions.forEach(action => {
        navigator.mediaSession.setActionHandler(action, null);
      });
    }
  }
}