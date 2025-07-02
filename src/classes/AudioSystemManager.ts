/**
 * AudioSystemManager - Bulletproof AudioContext Management + Audio Analysis
 * 
 * Ensures AudioContext is created synchronously within user gestures
 * and maintains gesture chain for seamless audio playback across all browsers.
 * 
 * Includes the sophisticated frequency/time domain audio analysis algorithm
 * that creates perceptually-aware volume detection using adaptive scaling.
 */

import { scaleLinear } from "d3-scale";

export type AudioStream = [number, number];
export type AudioStreamDefinitions = AudioStream[];

export interface AudioAnalysisConfig {
  bitDepth: number;
  definitions: AudioStreamDefinitions;
  lowpass: {
    frequency: number;
    Q: number;
  };
}

export interface AudioSystemState {
  isPrimed: boolean;
  isInitialized: boolean;
  contextState: AudioContextState;
  hasUserGesture: boolean;
  // Analysis state
  volume: number;
  stream: number;
  source: "microphone" | "audio" | "spotify" | null;
}

export class AudioSystemManager {
  private static instance: AudioSystemManager;
  
  // Core audio infrastructure
  private audioContext?: AudioContext;
  private audioElement?: HTMLAudioElement;
  private mediaElementSource?: MediaElementAudioSourceNode;
  private mediaStreamSource?: MediaStreamAudioSourceNode;
  private analyserNode?: AnalyserNode;
  private filterNode?: BiquadFilterNode;
  private currentSource?: MediaElementAudioSourceNode | MediaStreamAudioSourceNode;
  
  // Analysis infrastructure (preserving the original algorithm exactly)
  private analysisConfig: AudioAnalysisConfig;
  private analyserBuffer?: Uint8Array;
  private volumeBuffer: number[] = [];
  private microphone?: MediaStream;
  private getSpotifyVolume: () => number;
  
  // State tracking
  private state: AudioSystemState = {
    isPrimed: false,
    isInitialized: false,
    contextState: 'suspended' as AudioContextState,
    hasUserGesture: false,
    // Analysis state
    volume: 1,
    stream: 0,
    source: null
  };
  
  // Silent audio file to prime the system
  private readonly SILENT_AUDIO = '/silence.mp3';
  
  private constructor() {
    // Initialize analysis config with exact same defaults as original AudioAnalyser
    this.analysisConfig = {
      definitions: [[2.5, 0.09]] as AudioStreamDefinitions, // The genius time window config!
      bitDepth: Math.pow(2, 10), // 1024 - same as original
      lowpass: {
        frequency: 7500,
        Q: 0.75,
      },
    };
    
    // Default Spotify volume getter (can be overridden)
    this.getSpotifyVolume = () => 1;
    
    this.setupGestureDetection();
  }
  
  static getInstance(): AudioSystemManager {
    if (!AudioSystemManager.instance) {
      AudioSystemManager.instance = new AudioSystemManager();
    }
    return AudioSystemManager.instance;
  }
  
  /**
   * Set up gesture detection to track when we can safely create AudioContext
   */
  private setupGestureDetection() {
    if (typeof window === 'undefined') return;
    
    const gestureEvents = ['click', 'touchstart', 'keydown', 'mousedown'];
    
    const onGesture = () => {
      this.state.hasUserGesture = true;
      console.log('🎵 User gesture detected - AudioContext ready for initialization');
      
      // Remove listeners after first gesture
      gestureEvents.forEach(event => {
        document.removeEventListener(event, onGesture);
      });
    };
    
    gestureEvents.forEach(event => {
      document.addEventListener(event, onGesture, { once: true, passive: true });
    });
  }
  
  /**
   * Prime the entire audio system synchronously within a user gesture
   * This MUST be called synchronously within a user interaction event
   */
  primeAudioSystem(): boolean {
    if (this.state.isPrimed) {
      console.log('🎵 Audio system already primed');
      return true;
    }
    
    if (!this.state.hasUserGesture) {
      console.warn('🎵 Cannot prime audio system without user gesture');
      return false;
    }
    
    try {
      console.log('🎵 Priming audio system synchronously...');
      
      // 1. Create AudioContext synchronously
      this.audioContext = new AudioContext();
      
      // 2. Create audio element synchronously
      this.audioElement = document.createElement('audio');
      this.audioElement.preload = 'metadata';
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.autoplay = true;
      
      // 3. Create audio nodes synchronously
      this.mediaElementSource = this.audioContext.createMediaElementSource(this.audioElement);
      this.analyserNode = this.audioContext.createAnalyser();
      this.filterNode = this.audioContext.createBiquadFilter();
      
      // 4. Configure audio nodes using analysis config
      this.analyserNode.smoothingTimeConstant = 0;
      this.analyserNode.fftSize = this.analysisConfig.bitDepth;
      
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = this.analysisConfig.lowpass.frequency;
      this.filterNode.Q.value = this.analysisConfig.lowpass.Q;
      
      // 5. Connect audio graph
      this.mediaElementSource.connect(this.filterNode);
      this.filterNode.connect(this.analyserNode);
      this.mediaElementSource.connect(this.audioContext.destination);
      
      // 6. Prime with silent audio to keep gesture alive
      this.audioElement.src = this.SILENT_AUDIO;
      
      // 7. Update state
      this.state.isPrimed = true;
      this.state.contextState = this.audioContext.state;
      
      console.log('🎵 Audio system primed successfully!');
      return true;
      
    } catch (error) {
      console.error('🎵 Failed to prime audio system:', error);
      return false;
    }
  }
  
  /**
   * Get the audio element (creates system if needed)
   */
  getAudioElement(): HTMLAudioElement | null {
    if (!this.state.isPrimed && this.state.hasUserGesture) {
      this.primeAudioSystem();
    }
    return this.audioElement || null;
  }
  
  /**
   * Get the AudioContext (creates system if needed)
   */
  getAudioContext(): AudioContext | null {
    if (!this.state.isPrimed && this.state.hasUserGesture) {
      this.primeAudioSystem();
    }
    return this.audioContext || null;
  }
  
  /**
   * Get the analyser node for audio visualization
   */
  getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode || null;
  }
  
  /**
   * Set audio source URL while preserving gesture chain
   */
  setAudioSource(url: string): boolean {
    if (!this.audioElement) {
      console.warn('🎵 Audio element not available for setAudioSource');
      return false;
    }
    
    try {
      console.log('🎵 Setting audio source:', url);
      this.audioElement.src = url;
      return true;
    } catch (error) {
      console.error('🎵 Failed to set audio source:', error);
      return false;
    }
  }
  
  /**
   * Play audio while preserving gesture chain
   */
  async playAudio(): Promise<boolean> {
    if (!this.audioElement) {
      console.warn('🎵 Audio element not available for playAudio');
      return false;
    }
    
    try {
      // Resume AudioContext if suspended
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
        this.state.contextState = this.audioContext.state;
      }
      
      await this.audioElement.play();
      console.log('🎵 Audio playing successfully');
      return true;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🎵 Play interrupted by new load request (normal during track switching)');
      } else if (error.name === 'NotAllowedError') {
        console.warn('🎵 Play failed: User interaction required for autoplay');
      } else {
        console.error('🎵 Play failed:', error);
      }
      return false;
    }
  }
  
  /**
   * Pause audio
   */
  pauseAudio(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      console.log('🎵 Audio paused');
    }
  }
  
  /**
   * CORE ANALYSIS ALGORITHM - Preserving the original genius frequency/time domain cheat
   * 
   * Gets raw volume using FFT frequency intensity right now
   */
  get rawVolume(): number {
    if (!this.state.isPrimed) return 1;
    if (this.state.source === "spotify") return this.getSpotifyVolume();
    
    // Debug: Check if we're trying to analyze when source doesn't match
    if (this.state.source === null) {
      // No source active, return baseline
      return 1;
    }
    
    if (!this.analyserBuffer) {
      this.analyserBuffer = new Uint8Array(this.analysisConfig.bitDepth / 2);
      let len = this.analysisConfig.bitDepth / 2;
      for (let i = 0; i < len; i++) this.analyserBuffer[i] = 0;
    }

    this.analyserNode?.getByteFrequencyData(this.analyserBuffer);
    let len = this.analysisConfig.bitDepth / 2;
    let val = 0;
    for (let i = 0; i < len; i++) val += this.analyserBuffer[i];
    return val / len;
  }

  /**
   * CORE ANALYSIS ALGORITHM - The "shorthand selection" data structure magic
   * 
   * Samples different time windows for dynamic min/max references
   */
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

  /**
   * CORE ANALYSIS ALGORITHM - The perceptually-aware tick function
   * 
   * Maps current sample between quietest point and mean volume using adaptive scaling
   */
  tick(frameRate: number): { volume: number; stream: number } {
    const volume = this.rawVolume;
    this.volumeBuffer.push(volume);
    const frameDuration = 1000 / frameRate;
    const [ref, min] = this.sampleVolume((this.analysisConfig.definitions[0][0] * 1000) / frameDuration);
    const [sample] = this.sampleVolume((this.analysisConfig.definitions[0][1] * 1000) / frameDuration);
    const raw = Number(Math.pow(scaleLinear([min, ref], [0, 1])(sample), this.state.source === "spotify" ? 1.5 : 1.5).toFixed(3));

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

  /**
   * Set the Spotify volume getter function
   */
  setSpotifyVolumeGetter(getter: () => number): void {
    this.getSpotifyVolume = getter;
  }

  /**
   * Set analysis definitions (the genius time window config)
   */
  setAnalysisDefinitions(definitions: AudioStreamDefinitions): void {
    this.analysisConfig.definitions = definitions;
  }

  /**
   * Stop microphone with timeout protection
   */
  private async stopMicrophoneWithTimeout(timeoutMs: number = 5000): Promise<void> {
    if (!this.microphone) return;
    
    console.log('🎤 Stopping microphone tracks with timeout protection...');
    
    const tracks = this.microphone.getTracks();
    const stopPromises = tracks.map(track => {
      return new Promise<void>((resolve) => {
        // Set up timeout
        const timeout = setTimeout(() => {
          console.warn(`🎤 Track stop timeout after ${timeoutMs}ms, forcing resolution`);
          resolve();
        }, timeoutMs);
        
        // Stop the track
        track.stop();
        
        // Monitor track state
        const checkStopped = () => {
          if (track.readyState === 'ended') {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkStopped, 10);
          }
        };
        checkStopped();
      });
    });
    
    await Promise.all(stopPromises);
    this.microphone = undefined;
    console.log('🎤 Microphone tracks stopped successfully');
    console.log('🎤 Microphone MediaStream cleared');
  }

  /**
   * Initialize microphone input with bulletproof gesture handling
   */
  async initializeMicrophone(): Promise<boolean> {
    if (!this.state.isPrimed) {
      console.warn('🎵 Audio system must be primed before microphone initialization');
      return false;
    }

    if (!this.audioContext || !this.filterNode || !this.analyserNode) {
      console.error('🎵 Audio infrastructure not available for microphone');
      return false;
    }

    try {
      console.log('🎵 Initializing microphone...');
      
      // Stop any existing microphone with timeout protection
      await this.stopMicrophoneWithTimeout(5000);

      // Request microphone access
      this.microphone = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // Disconnect current source
      this.disconnectCurrentSource();

      // Create microphone source and connect to audio graph
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.microphone);
      this.currentSource = this.mediaStreamSource;
      
      // Connect microphone chain: microphone -> filter -> analyser
      // NOTE: Don't connect to destination to avoid feedback
      this.mediaStreamSource.connect(this.filterNode);
      this.filterNode.connect(this.analyserNode);

      // Update state
      this.state.source = "microphone";
      
      console.log('🎤 Microphone initialized successfully! Source set to:', this.state.source);
      console.log('🎤 AudioSystemManager state:', { source: this.state.source, isPrimed: this.state.isPrimed });
      console.log(`🎵 AudioSystemManager source is now: ${this.state.source}`);
      return true;

    } catch (error) {
      console.error('🎵 Failed to initialize microphone:', error);
      
      if (error.name === 'NotAllowedError') {
        console.warn('🎵 Microphone permission denied by user');
      } else if (error.name === 'NotFoundError') {
        console.warn('🎵 No microphone device found');
      }
      
      return false;
    }
  }

  /**
   * Initialize audio element source (file/streaming)
   */
  async initializeAudioElement(): Promise<boolean> {
    if (!this.state.isPrimed) {
      console.warn('🎵 Audio system must be primed before audio element initialization');
      return false;
    }

    if (!this.audioElement || !this.mediaElementSource) {
      console.error('🎵 Audio element not available');
      return false;
    }

    try {
      console.log('🎵 Initializing audio element source...');
      
      // Stop microphone if active with timeout protection
      await this.stopMicrophoneWithTimeout(3000);

      // Disconnect current source
      this.disconnectCurrentSource();

      // Reconnect audio element to audio graph
      this.currentSource = this.mediaElementSource;
      this.mediaElementSource.connect(this.filterNode!);
      this.filterNode!.connect(this.analyserNode!);
      this.mediaElementSource.connect(this.audioContext!.destination);

      // Update state
      this.state.source = "audio";
      
      console.log('🎵 Audio element source initialized successfully!');
      console.log(`🎵 AudioSystemManager source is now: ${this.state.source}`);
      return true;

    } catch (error) {
      console.error('🎵 Failed to initialize audio element:', error);
      return false;
    }
  }

  /**
   * Set source to Spotify (no audio graph needed)
   */
  async initializeSpotifySource(): Promise<void> {
    console.log('🎵 Switching to Spotify source...');
    
    // Stop microphone if active with timeout protection
    await this.stopMicrophoneWithTimeout(3000);

    // Disconnect current source
    this.disconnectCurrentSource();

    // Update state
    this.state.source = "spotify";
    
    console.log('🎵 Spotify source active');
  }

  /**
   * Disconnect current audio source
   */
  private disconnectCurrentSource(): void {
    if (this.currentSource) {
      try {
        this.currentSource.disconnect();
      } catch (error) {
        // Ignore disconnect errors - node might already be disconnected
      }
      this.currentSource = undefined;
    }
  }

  /**
   * Get current system state
   */
  getState(): AudioSystemState {
    if (this.audioContext) {
      this.state.contextState = this.audioContext.state;
    }
    return { ...this.state };
  }
  
  /**
   * Clean up resources including microphone
   */
  async destroy(): Promise<void> {
    try {
      // Stop microphone if active with timeout protection
      await this.stopMicrophoneWithTimeout(3000);

      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.src = '';
      }
      
      // Disconnect all sources
      this.disconnectCurrentSource();
      
      if (this.mediaElementSource) {
        this.mediaElementSource.disconnect();
      }

      if (this.mediaStreamSource) {
        this.mediaStreamSource.disconnect();
      }
      
      if (this.analyserNode) {
        this.analyserNode.disconnect();
      }
      
      if (this.filterNode) {
        this.filterNode.disconnect();
      }
      
      if (this.audioContext) {
        await this.audioContext.close();
      }
      
      // Reset analysis state
      this.volumeBuffer = [];
      this.analyserBuffer = undefined;
      
      // Reset state
      this.state.isPrimed = false;
      this.state.isInitialized = false;
      this.state.volume = 1;
      this.state.stream = 0;
      this.state.source = null;
      
      console.log('🎵 Audio system cleaned up');
      
    } catch (error) {
      console.warn('🎵 Error during audio system cleanup:', error);
    }
  }
}

// Export singleton instance
export const audioSystem = AudioSystemManager.getInstance();