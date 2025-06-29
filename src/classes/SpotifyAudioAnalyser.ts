import AudioAnalyser from "./AudioAnalyser";
import { definitions } from "./AudioAnalyser";

export default class SpotifyAudioAnalyser extends AudioAnalyser {
  private spotifyVolumeValue: number = 1;

  constructor() {
    super({
      definitions: [[3, 0.2]],
      getSpotifyVolume: () => this.spotifyVolumeValue,
    });
  }

  async initialize() {
    // Initialize in Spotify mode (no Web Audio API needed)
    await super.initialize({ spotify: true });
  }

  setSpotifyVolume(volume: number) {
    this.spotifyVolumeValue = volume;
  }

  // Inherit all the sampling logic from AudioAnalyser!
  // When tick() is called, it will use rawVolume getter which returns getSpotifyVolume()
}
