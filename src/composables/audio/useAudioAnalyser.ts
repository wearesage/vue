import { ref, computed } from "vue";
import { audioSystem } from "../../classes/AudioSystemManager";
import { useRAF } from "../../stores/raf";

export function useAudioAnalyser() {
  const raf = useRAF();
  const stream = ref(0);
  const volume = ref(1);
  const time = computed(() => raf.time);
  const initialized = ref(false);

  // Note: RAF loop management moved to audio store
  // These refs will be updated by the audio store's RAF loop

  async function initialize(element: HTMLAudioElement) {
    if (element) {
      // Initialize audio element source in the consolidated AudioSystemManager
      await audioSystem.initializeAudioElement();
      initialized.value = true;
      
      console.log('🎵 useAudioAnalyser initialized with consolidated AudioSystemManager');
    }
  }

  function cleanup() {
    // RAF loop is managed by audio store, nothing to clean up here
  }

  // Add method to initialize microphone
  async function initializeMicrophone(): Promise<boolean> {
    const success = await audioSystem.initializeMicrophone();
    if (success) {
      initialized.value = true;
      console.log('🎵 useAudioAnalyser initialized microphone with consolidated AudioSystemManager');
    }
    return success;
  }

  // Add method to initialize Spotify
  async function initializeSpotify(spotifyVolumeGetter: () => number): Promise<void> {
    audioSystem.setSpotifyVolumeGetter(spotifyVolumeGetter);
    await audioSystem.initializeSpotifySource();
    initialized.value = true;
    console.log('🎵 useAudioAnalyser initialized Spotify with consolidated AudioSystemManager');
  }

  return {
    audioSystem, // Expose audioSystem for advanced usage
    initialize,
    initializeMicrophone,
    initializeSpotify,
    stream,
    volume,
    time,
    cleanup,
    initialized,
  };
}
