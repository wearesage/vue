import { computed } from "vue";
import { 
  AudioSource, 
  RadioParadiseStation, 
  RadioStreamUrls,
  type RadioParadiseStation as RadioParadiseStationType 
} from "@wearesage/shared";

/**
 * Composable for resolving radio stream URLs based on source, station, and quality preference
 */
export function useRadioStream(
  source: AudioSource,
  station?: RadioParadiseStationType,
  preferLossless = false
) {
  const streamUrl = computed(() => {
    switch (source) {
      case AudioSource.RADIO_PARADISE:
        if (station === undefined) {
          // Default to Main Mix if no station specified
          station = RadioParadiseStation.MAIN_MIX;
        }
        
        const rpUrls = RadioStreamUrls.RADIO_PARADISE[station];
        if (!rpUrls) {
          console.warn(`Invalid Radio Paradise station: ${station}`);
          return null;
        }
        
        // Return FLAC if available and preferred, otherwise MP3
        return preferLossless && rpUrls.flac ? rpUrls.flac : rpUrls.mp3;
        
      case AudioSource.KEXP:
        // KEXP only has MP3 stream available
        return RadioStreamUrls.KEXP.mp3;
        
      default:
        return null;
    }
  });
  
  const streamQuality = computed(() => {
    if (!streamUrl.value) return null;
    
    switch (source) {
      case AudioSource.RADIO_PARADISE:
        if (station === undefined) station = RadioParadiseStation.MAIN_MIX;
        const rpUrls = RadioStreamUrls.RADIO_PARADISE[station];
        return streamUrl.value === rpUrls?.flac ? 'FLAC' : 'MP3 320k';
        
      case AudioSource.KEXP:
        return 'AAC 160k';
        
      default:
        return null;
    }
  });
  
  const stationName = computed(() => {
    switch (source) {
      case AudioSource.RADIO_PARADISE:
        if (station === undefined) return 'Radio Paradise - Main Mix';
        
        switch (station) {
          case RadioParadiseStation.MAIN_MIX:
            return 'Radio Paradise - Main Mix';
          case RadioParadiseStation.MELLOW_MIX:
            return 'Radio Paradise - Mellow Mix';
          case RadioParadiseStation.ROCK_MIX:
            return 'Radio Paradise - Rock Mix';
          case RadioParadiseStation.GLOBAL_MIX:
            return 'Radio Paradise - Global Mix';
          default:
            return 'Radio Paradise';
        }
        
      case AudioSource.KEXP:
        return 'KEXP';
        
      default:
        return null;
    }
  });
  
  return {
    streamUrl,
    streamQuality,
    stationName
  };
}