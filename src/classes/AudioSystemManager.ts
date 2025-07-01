/**
 * AudioSystemManager - Bulletproof AudioContext Management
 * 
 * Ensures AudioContext is created synchronously within user gestures
 * and maintains gesture chain for seamless audio playback across all browsers.
 */

export interface AudioSystemState {
  isPrimed: boolean;
  isInitialized: boolean;
  contextState: AudioContextState;
  hasUserGesture: boolean;
}

export class AudioSystemManager {
  private static instance: AudioSystemManager;
  
  // Core audio infrastructure
  private audioContext?: AudioContext;
  private audioElement?: HTMLAudioElement;
  private mediaElementSource?: MediaElementAudioSourceNode;
  private analyserNode?: AnalyserNode;
  private filterNode?: BiquadFilterNode;
  
  // State tracking
  private state: AudioSystemState = {
    isPrimed: false,
    isInitialized: false,
    contextState: 'suspended' as AudioContextState,
    hasUserGesture: false
  };
  
  // Silent audio data URI to prime the system
  private readonly SILENT_AUDIO = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+oQBfBMJqoRAHOLbdOJ9MwOjUcEQ8KW+9hKNAiR8vYPd9SJddQJwgJQBDjXXKr';
  
  private constructor() {
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
      
      // 3. Create audio nodes synchronously
      this.mediaElementSource = this.audioContext.createMediaElementSource(this.audioElement);
      this.analyserNode = this.audioContext.createAnalyser();
      this.filterNode = this.audioContext.createBiquadFilter();
      
      // 4. Configure audio nodes
      this.analyserNode.smoothingTimeConstant = 0;
      this.analyserNode.fftSize = 1024;
      
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 7500;
      this.filterNode.Q.value = 0.75;
      
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
   * Get current system state
   */
  getState(): AudioSystemState {
    if (this.audioContext) {
      this.state.contextState = this.audioContext.state;
    }
    return { ...this.state };
  }
  
  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    try {
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.src = '';
      }
      
      if (this.mediaElementSource) {
        this.mediaElementSource.disconnect();
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
      
      // Reset state
      this.state.isPrimed = false;
      this.state.isInitialized = false;
      
      console.log('🎵 Audio system cleaned up');
      
    } catch (error) {
      console.warn('🎵 Error during audio system cleanup:', error);
    }
  }
}

// Export singleton instance
export const audioSystem = AudioSystemManager.getInstance();