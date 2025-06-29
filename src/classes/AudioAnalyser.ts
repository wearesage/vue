import { scaleLinear } from "d3-scale";

export type AudioStream = [number, number];
export type AudioStreamDefinitions = AudioStream[];
export const definitions: AudioStreamDefinitions = [[2.5, 0.09]];

export type AudioAnalyserConfig = {
  bitDepth: number;
  definitions: AudioStreamDefinitions;
  meyda: boolean;
  lowpass: {
    frequency: number;
    Q: number;
  };
};

export type AudioAnalyserState = {
  initialized: boolean;
  volume: number;
  stream: number;
  features: any;
  note: string | null;
  source: "microphone" | "audio" | "spotify" | null;
  microphone: MediaStream | null;
  mediaElementSource: MediaElementAudioSourceNode | null;
  mediaStreamSource: MediaStreamAudioSourceNode | null;
  getSpotifyVolume: any;
};

export default class AudioAnalyser {
  public config: AudioAnalyserConfig;
  public state: AudioAnalyserState;
  private ctx?: AudioContext;
  private analyser?: AnalyserNode;
  private filter?: BiquadFilterNode;
  private analyserBuffer?: Uint8Array;
  private volumeBuffer: number[] = [];
  private source?: MediaElementAudioSourceNode | MediaStreamAudioSourceNode;

  constructor({
    definitions,
    bitDepth,
    meyda,
    lowpass,
    getSpotifyVolume,
  }: {
    definitions?: AudioStreamDefinitions;
    bitDepth?: number;
    meyda?: boolean;
    lowpass?: {
      frequency: number;
      Q: number;
    };
    getSpotifyVolume: any;
  }) {
    this.config = {
      definitions: definitions as any,
      bitDepth: bitDepth || Math.pow(2, 10),
      meyda: meyda || false,
      lowpass: lowpass || {
        frequency: 7500,
        Q: 0.75,
      },
    };

    this.state = {
      initialized: false,
      source: null,
      volume: 1,
      stream: 0,
      features: {},
      note: null,
      microphone: null,
      mediaElementSource: null,
      mediaStreamSource: null,
      getSpotifyVolume:
        getSpotifyVolume ||
        function () {
          return 1;
        },
    };

    this.tick = this.tick.bind(this);
    this.destroy = this.destroy.bind(this);
    this.initialize = this.initialize.bind(this);
  }

  set definitions(definitions: AudioStreamDefinitions) {
    this.config.definitions = definitions;
  }

  get rawVolume() {
    if (this.state.initialized === false) return 1;
    if (this.state.source === "spotify") return this.state.getSpotifyVolume();
    if (!this.analyserBuffer) {
      this.analyserBuffer = new Uint8Array(this.config.bitDepth / 2);
      let len = this.config.bitDepth / 2;
      for (let i = 0; i < len; i++) this.analyserBuffer[i] = 0;
    }

    this.analyser?.getByteFrequencyData(this.analyserBuffer);
    let len = this.config.bitDepth / 2;
    let val = 0;
    for (let i = 0; i < len; i++) val += this.analyserBuffer[i];
    return val / len;
  }

  async initialize({ element, microphone, spotify }: { element?: HTMLAudioElement; microphone?: boolean; spotify?: boolean }) {
    if (spotify) {
      this.state.source = "spotify";
      this.state.initialized = true;
      return;
    }

    this.ctx = new AudioContext();
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = this.config.lowpass.frequency;
    this.filter.Q.value = this.config.lowpass.Q;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.smoothingTimeConstant = 0;
    this.analyser.fftSize = this.config.bitDepth;

    if (element) {
      if (this.state.microphone) this.state.microphone.getTracks().forEach((track) => track.stop());
      this.state.source = "audio";
      this.state.mediaElementSource = this.ctx.createMediaElementSource(element);
      this.source = this.state.mediaElementSource;
    }

    if (microphone) {
      this.state.source = "microphone";
      const mic = this.state.microphone as any;
      this.state.microphone = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      this.state.mediaStreamSource = this.ctx.createMediaStreamSource(mic);
      this.source = this.state.mediaStreamSource;
    }

    if (!this.source) {
      console.warn("AudioAnalyser has no valid source.");
      return;
    }

    this.source.connect(this.filter);
    this.filter.connect(this.analyser);

    if (this.state.source !== "microphone") {
      this.source.connect(this.ctx.destination);
    }

    this.state.initialized = true;
  }

  private sampleVolume(totalSamples: number): [number, number] {
    let value = 0;
    const start = Math.max(this.volumeBuffer.length - 1, 0);
    const end = Math.max(start - totalSamples, 0);
    let min = Infinity;
    for (let i = start; i >= end; i--) {
      value += this.volumeBuffer[i];
      if (this.volumeBuffer[i] < min) min = this.volumeBuffer[i];
    }
    return [value / totalSamples, min];
  }

  tick(frameRate: number) {
    const volume = this.rawVolume;
    this.volumeBuffer.push(volume);
    const frameDuration = 1000 / frameRate;
    const [ref, min] = this.sampleVolume((this.config.definitions[0][0] * 1000) / frameDuration);
    const [sample] = this.sampleVolume((this.config.definitions[0][1] * 1000) / frameDuration);
    const raw = Number(Math.pow(scaleLinear([min, ref], [0, 1])(sample), this.state.source === "spotify" ? 1 : 1.5).toFixed(3));

    if (!isNaN(raw)) {
      this.state.volume = raw / 2;
      const stream = this.state.stream + Math.pow(raw, 0.75) / 10;
      if (!isNaN(stream)) this.state.stream = Number(stream.toFixed(3));
    }

    return {
      volume: this.state.volume,
      stream: this.state.stream,
    };
  }

  async destroy() {
    try {
      if (this.state.microphone) this.state.microphone.getTracks().forEach((track) => track.stop());
      this.analyser?.disconnect();
      this.filter?.disconnect();
      await this.ctx?.close();
    } catch (e) {
      // Don't care.
    }
  }
}
