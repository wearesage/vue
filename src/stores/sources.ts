import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, computed, watch } from "vue";
import { useTransition } from "@vueuse/core";
import { useAudioAnalyser, useAudioElement } from "../composables";
import { useAuth, useRAF, useSpotify } from ".";
import { useRouter } from "../router/sage-router";
import { AudioSource, enumKeyToLabel } from "@wearesage/shared";
import { clamp, easeInOut } from "../util";

export const AudioSourceIcons: Record<AudioSource, string> = {
  [AudioSource.SPOTIFY]: "spotify",
  [AudioSource.AUDIUS]: "audius",
  [AudioSource.MICROPHONE]: "microphone",
  [AudioSource.RADIO_PARADISE]: "radio-paradise",
  [AudioSource.KEXP]: "kexp",
  [AudioSource.FILE]: "upload",
  [AudioSource.BROWSER_AUDIO]: "sound",
  [AudioSource.NONE]: "sound",
};

export const SelectableAudioSources: AudioSource[] = [
  AudioSource.SPOTIFY,
  AudioSource.AUDIUS,
  AudioSource.MICROPHONE,
  AudioSource.RADIO_PARADISE,
  AudioSource.KEXP,
  AudioSource.FILE,
];

export function getAudioSourceLabel(source: AudioSource): string {
  const enumKey = Object.keys(AudioSource).find((key) => AudioSource[key as keyof typeof AudioSource] === source);
  return enumKey ? enumKeyToLabel(enumKey) : "Unknown";
}

export const useSources = defineStore("sources", () => {
  const auth = useAuth();
  const router = useRouter();
  const spotify = useSpotify();
  const raf = useRAF();
  // Audio analysis will be handled by the audio store

  // Watch for audio element from audio store to connect analyser
  let audioPlaying = ref(false);

  // Get volume and stream directly from audio store instead of creating our own analyser
  const connectToAudioStore = async () => {
    try {
      const { useAudio } = await import("./audio");
      const audio = useAudio();

      // Sync playing state
      watch(
        () => audio.playing,
        (playing) => {
          audioPlaying.value = playing;
        },
        { immediate: true }
      );

      console.log("🔊 Sources: Connected to audio store for volume data");
    } catch (error) {
      console.warn("Sources: Could not connect to audio store:", error);
    }
  };

  // Connect on store creation
  connectToAudioStore();
  const source = ref<AudioSource | null>(null);
  const prettySource = computed(() => (source.value !== null ? getAudioSourceLabel(source.value) : null));
  const sourceIcon = computed(() => (source.value !== null ? AudioSourceIcons[source.value] : "sound"));
  const useSpotifyValues = computed(() => source.value === AudioSource.SPOTIFY && spotify.playing);

  // Raw volume values from different sources
  const spotifyVolume = computed(() => spotify.volume);
  const microphoneVolume = computed(() => 0); // TODO: implement microphone volume

  // Get volume from audio store
  let audioStoreVolume = ref(0);
  const getAudioStoreVolume = async () => {
    try {
      const { useAudio } = await import("./audio");
      const audio = useAudio();

      watch(
        () => audio.volume,
        (volume) => {
          audioStoreVolume.value = volume;
        },
        { immediate: true }
      );
    } catch (error) {
      console.warn("Sources: Could not get volume from audio store:", error);
    }
  };

  // Initialize audio store volume connection
  getAudioStoreVolume();

  // Which source volume should we use?
  const activeSourceVolume = computed(() => {
    if (useSpotifyValues.value) return spotifyVolume.value;
    return audioStoreVolume.value; // From audio store's analyser
  });


  // Detect if anything is actually playing
  const isPlayingAThing = computed(() => {
    return source.value === AudioSource.SPOTIFY ? spotify.playing : audioPlaying.value;
  });

  // Smooth volume floor transition using our custom easing
  const minVolume = useTransition(
    computed(() => (isPlayingAThing.value ? 0 : 1)),
    {
      duration: 1000,
      transition: easeInOut,
    }
  );

  // Get stream from audio store
  let audioStoreStream = ref(0);
  const getAudioStoreStream = async () => {
    try {
      const { useAudio } = await import("./audio");
      const audio = useAudio();

      watch(
        () => audio.stream,
        (stream) => {
          audioStoreStream.value = stream;
        },
        { immediate: true }
      );
    } catch (error) {
      console.warn("Sources: Could not get stream from audio store:", error);
    }
  };

  // Initialize audio store stream connection
  getAudioStoreStream();

  // Final applied volume - never goes below minVolume
  const volume = computed(() => clamp(activeSourceVolume.value, minVolume.value, 1));
  const stream = computed(() => (useSpotifyValues.value ? spotify.stream : audioStoreStream.value));
  const playing = computed(() => isPlayingAThing.value);
  // Note: Components can apply user preferences (disableFlashing, visualizerSpeed) to these values

  function selectSource(newSource: AudioSource) {
    if (!SelectableAudioSources.includes(newSource)) {
      console.warn(`Invalid audio source: ${newSource}`);
      return;
    }

    // Clean up current source before switching
    const oldSource = source.value;
    if (oldSource !== newSource) {
      console.log(`🔄 Switching from ${getAudioSourceLabel(oldSource)} to ${getAudioSourceLabel(newSource)}`);
      performSourceCleanup(oldSource);
    }

    source.value = newSource;
    localStorage.setItem("selectedAudioSource", newSource.toString());

    // Audio analysis will be handled by the audio store element
    if (newSource !== AudioSource.SPOTIFY && newSource !== AudioSource.NONE) {
      console.log(`🔊 Selected audio source: ${getAudioSourceLabel(newSource)}`);
      // Audio analyser will connect automatically when audio store plays
    }

    if (newSource === AudioSource.SPOTIFY) {
      // Only initialize Spotify if user is authenticated
      if (auth.user) {
        if (auth.user.spotifyProfile?.accessToken) {
          spotify.initialize();
        } else {
          spotify.getSpotifyTokens();
        }
      }
      // If not authenticated yet, just set the source - Spotify will initialize when auth loads
    }

    if (source.value === AudioSource.AUDIUS) {
      router.push("/audius");
    }
  }

  /**
   * Cleanup when switching away from a source
   */
  async function performSourceCleanup(oldSource: AudioSource | null) {
    if (!oldSource) return;

    console.log(`🧹 Cleaning up ${getAudioSourceLabel(oldSource)} source`);

    try {
      // Stop audio playback
      const { useAudio } = await import('./audio');
      const audio = useAudio();
      
      if (audio.playing) {
        console.log('🔊 Stopping audio playback for source switch');
        audio.pause();
      }

      // Reset the queue when switching sources
      const { useQueue } = await import('./queue');
      const queue = useQueue();
      
      if (!queue.isQueueEmpty) {
        console.log('🎵 Resetting queue for source switch');
        queue.reset();
      }

      // Source-specific cleanup
      switch (oldSource) {
        case AudioSource.SPOTIFY:
          // Spotify cleanup is handled by its own store
          console.log('🎵 Spotify cleanup handled by spotify store');
          break;
        
        case AudioSource.AUDIUS:
          // No specific cleanup needed for Audius
          console.log('🎵 Audius cleanup complete');
          break;
        
        default:
          console.log(`🎵 Generic cleanup for ${getAudioSourceLabel(oldSource)}`);
          break;
      }
    } catch (error) {
      console.warn('Error during source cleanup:', error);
    }
  }

  // Auto-select source from server response when user authenticates
  function setSourceFromServer(serverSource: AudioSource) {
    if (SelectableAudioSources.includes(serverSource)) {
      console.log("🎵 Auto-selecting audio source from server:", getAudioSourceLabel(serverSource));
      selectSource(serverSource); // Use selectSource to properly initialize the source
    }
  }


  // Initialize source from localStorage or default
  function initializeSource() {
    const savedSource = localStorage.getItem("selectedAudioSource");
    if (savedSource) {
      const sourceValue = parseInt(savedSource) as AudioSource;
      if (SelectableAudioSources.includes(sourceValue)) {
        console.log("🎵 Restoring saved audio source:", getAudioSourceLabel(sourceValue));

        // For Spotify, we can set the source immediately (no audio context needed)
        if (sourceValue === AudioSource.SPOTIFY) {
          source.value = sourceValue;
          console.log("🎵 Spotify source restored (no audio context initialization)");
        } else {
          // For other sources, just set the source value but don't initialize audio context
          // Audio context will be initialized when user actually plays something
          source.value = sourceValue;
          console.log(`🎵 ${getAudioSourceLabel(sourceValue)} source restored (audio context will initialize on first play)`);
        }
      }
    }
  }

  // Initialize on store creation
  initializeSource();

  // Watch for auth loading when Spotify is selected but not initialized
  watch(
    () => auth.user,
    (user) => {
      if (user && source.value === AudioSource.SPOTIFY) {
        // Auth loaded and Spotify is selected - initialize it now
        if (user.spotifyProfile?.accessToken) {
          spotify.initialize();
        } else {
          spotify.getSpotifyTokens();
        }
      }
    }
  );

  async function reset() {
    console.log("🎵 Resetting sources store state");

    // Perform cleanup of current source
    await performSourceCleanup(source.value);

    // Reset source state
    source.value = null;
    localStorage.removeItem("selectedAudioSource");

    // Reset queue state
    try {
      const { useQueue } = await import('./queue');
      const queue = useQueue();
      queue.reset();
    } catch (error) {
      console.warn('Could not reset queue during sources cleanup:', error);
    }
  }

  return {
    source,
    prettySource,
    sourceIcon,
    selectSource,
    setSourceFromServer,
    volume,
    stream,
    playing,
    reset,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSources, import.meta.hot));
}
