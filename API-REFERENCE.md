# API Reference

Complete API documentation for `@wearesage/vue` components, composables, stores, and utilities.

## Table of Contents

- [Core API](#core-api)
- [Components](#components)
- [Composables](#composables)
- [Stores](#stores)
- [Utilities](#utilities)
- [Types](#types)
- [GLSL Utilities](#glsl-utilities)

## Core API

### createApp

Creates a Vue application with all necessary plugins configured.

```typescript
function createApp(App: any, routes: any, target?: string): App
```

**Parameters:**
- `App` - Vue application component
- `routes` - Vue Router route definitions
- `target` - Mount target selector (default: `"#app"`)

**Returns:** Mounted Vue application instance

**Example:**
```typescript
import { createApp } from '@wearesage/vue';
import { routes } from 'vue-router/auto-routes';
import App from './App.vue';

createApp(App, routes);
```

### Vite Configuration

Pre-configured Vite plugins and settings.

```typescript
export const plugins: PluginOption[];
export const css: CSSOptions;
export const optimizeDeps: { include: string[] };
```

**Usage:**
```typescript
import { defineConfig } from 'vite';
import { plugins, css } from '@wearesage/vue/vite';

export default defineConfig({ plugins, css });
```

## Components

### Common Components

#### Button

Basic button component with hover effects and customizable styling.

```typescript
interface ButtonProps {
  // Inherits all native button attributes via v-bind="$attrs"
}

interface ButtonEmits {
  click: [];
}
```

**Usage:**
```vue
<Button @click="handleClick">
  Click me!
</Button>
```

#### Icon

SVG icon component with dynamic icon loading.

```typescript
interface IconProps {
  name: string;          // Icon name from assets/icons/
  size?: string | number; // Icon size
}
```

**Usage:**
```vue
<Icon name="play" size="24" />
<Icon name="spotify" />
```

#### Toast

Notification toast component.

```typescript
interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;     // Auto-dismiss time in ms
  persistent?: boolean;  // Disable auto-dismiss
}
```

#### Popover

Floating popover component with positioning.

```typescript
interface PopoverProps {
  visible: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
  trigger?: 'click' | 'hover' | 'manual';
}
```

#### Avatar

User avatar component with fallback support.

```typescript
interface AvatarProps {
  src?: string;         // Image URL
  alt?: string;         // Alt text
  size?: string | number; // Avatar size
  fallback?: string;    // Fallback text/initials
}
```

### Form Components

#### Input

Base input component with validation support.

```typescript
interface InputProps {
  modelValue: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

interface InputEmits {
  'update:modelValue': [value: string];
}
```

#### ColorInput

Color picker input component.

```typescript
interface ColorInputProps {
  modelValue: string | [number, number, number];
  isWebgl?: boolean;    // Use GLSL color format (0-1 range)
  disabled?: boolean;
}

interface ColorInputEmits {
  'update:modelValue': [value: string | [number, number, number]];
}
```

#### RangeInput

Range slider input component.

```typescript
interface RangeInputProps {
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

interface RangeInputEmits {
  'update:modelValue': [value: number];
}
```

#### Toggle

Toggle switch component.

```typescript
interface ToggleProps {
  modelValue: boolean;
  disabled?: boolean;
  label?: string;
}

interface ToggleEmits {
  'update:modelValue': [value: boolean];
}
```

### WebGL Components

#### Sketch

Main WebGL canvas component for shader rendering.

```typescript
interface SketchProps {
  shader: string;                    // GLSL fragment shader code
  uniforms: Record<string, Uniform>; // Shader uniform values
  width?: number;                    // Canvas width
  height?: number;                   // Canvas height
  dpr?: number;                      // Device pixel ratio
  animate?: boolean;                 // Enable animation loop
  volume?: number;                   // Audio volume input
  stream?: number;                   // Audio stream input
  renderMode?: 'always' | 'manual' | 'on-demand';
  position?: [number, number, number]; // 3D position
  visible?: boolean;                 // Visibility state
  scale?: number;                    // Scale factor
  meshKey?: boolean;                 // Force mesh recreation
}

interface SketchEmits {
  click: [];
}
```

**Example:**
```vue
<Sketch 
  :shader="fragmentShader"
  :uniforms="dynamicUniforms"
  :animate="true"
  @click="handleSketchClick"
/>
```

#### GLSLEditor

CodeMirror-based GLSL shader editor.

```typescript
interface GLSLEditorProps {
  modelValue: string;               // Shader code
  readonly?: boolean;               // Read-only mode
  theme?: string;                   // Editor theme
  lineNumbers?: boolean;            // Show line numbers
  errors?: ShaderError[];           // Compilation errors
}

interface GLSLEditorEmits {
  'update:modelValue': [code: string];
  compile: [code: string];
  error: [errors: ShaderError[]];
}
```

#### ShaderScroll

Scrollable shader gallery component.

```typescript
interface ShaderScrollProps extends Partial<SketchProps> {
  sketches: Sketch[];               // Array of shader sketches
  scrollY: number;                  // Scroll position
  visible?: boolean;                // Visibility state
}
```

### Audius Components

#### AudiusTrackList

Displays a list of Audius tracks.

```typescript
interface AudiusTrackListProps {
  tracks: AudiusTrack[];
  loading?: boolean;
  emptyMessage?: string;
}

interface AudiusTrackListEmits {
  'track-select': [track: AudiusTrack];
  'track-play': [track: AudiusTrack];
}
```

#### AudiusSearch

Search interface for Audius content.

```typescript
interface AudiusSearchProps {
  placeholder?: string;
  debounce?: number;               // Search debounce time
  categories?: string[];           // Search categories
}

interface AudiusSearchEmits {
  search: [query: string, category?: string];
  results: [results: AudiusSearchResult[]];
}
```

### Layout Components

#### View

Main layout container component.

```typescript
interface ViewProps {
  padding?: string | number;        // Container padding
  centered?: boolean;               // Center content
  fullHeight?: boolean;             // Full viewport height
}
```

#### Row / Column

Flexbox layout components.

```typescript
interface RowProps {
  gap?: string | number;            // Gap between items
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;                   // Allow wrapping
}

interface ColumnProps extends RowProps {
  // Same props as Row but with column direction
}
```

## Composables

### useAudioAnalyser

Primary composable for audio analysis integration.

```typescript
function useAudioAnalyser(): {
  instance: ShallowRef<AudioAnalyser | null>;
  initialize: (element: HTMLAudioElement) => void;
  stream: Ref<number>;
  volume: Ref<number>;
  time: ComputedRef<number>;
  cleanup: () => void;
  initialized: Ref<boolean>;
}
```

### useAudioElement

HTML audio element management.

```typescript
function useAudioElement(
  src: Ref<string>, 
  onLoad?: (element: HTMLAudioElement) => void
): {
  element: Ref<HTMLAudioElement | undefined>;
  playing: Ref<boolean>;
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => Promise<void>;
}
```

### useAnimation

Animation management with RAF integration.

```typescript
type AnimationTick = (now: number, progress: number, elapsed: number) => void;

interface AnimationOptions {
  duration?: number;
  easing?: (t: number) => number;
  autoStart?: boolean;
}

function useAnimation(
  tick: AnimationTick,
  options?: AnimationOptions
): {
  start: () => void;
  stop: () => void;
  progress: Ref<number>;
  elapsed: Ref<number>;
}
```

### useShader

Shader compilation and management.

```typescript
function useShader(
  fragmentShader: Ref<string>,
  uniforms?: Ref<Record<string, Uniform>>
): {
  material: ShallowRef<ShaderMaterial | null>;
  errors: Ref<ShaderError[]>;
  compile: () => void;
  isValid: ComputedRef<boolean>;
}
```

### useControls

Dynamic control interface generation.

```typescript
interface ControlDefinition {
  type: 'float' | 'int' | 'bool' | 'vec2' | 'vec3' | 'color';
  value: any;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

function useControls(
  definitions: Record<string, ControlDefinition>
): {
  values: Ref<Record<string, any>>;
  controls: ComputedRef<ControlComponent[]>;
  reset: () => void;
}
```

### useViewport

Viewport and device information.

```typescript
function useViewport(): {
  width: Ref<number>;
  height: Ref<number>;
  aspectRatio: ComputedRef<number>;
  isMobile: ComputedRef<boolean>;
  isTablet: ComputedRef<boolean>;
  isDesktop: ComputedRef<boolean>;
  orientation: Ref<'portrait' | 'landscape'>;
  dpr: Ref<number>;
}
```

## Stores

### useAudio

Basic audio playback store.

```typescript
interface AudioStore {
  // State
  element: Ref<HTMLAudioElement | undefined>;
  src: Ref<string>;
  volume: Ref<number>;
  stream: Ref<number>;
  playing: Ref<boolean>;
  initialized: Ref<boolean>;
  
  // Actions
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => Promise<void>;
}
```

### useVisualizer

Advanced audio visualization store.

```typescript
type AudioSource = 'SPOTIFY' | 'AUDIUS' | 'MICROPHONE' | 'RADIO_PARADISE' | 'KEXP' | 'FILE';

interface VisualizerStore {
  // Audio
  source: Ref<AudioSource | null>;
  sourceIcon: ComputedRef<string>;
  volume: Ref<number>;
  stream: Ref<number>;
  
  // UI State
  showEditor: Ref<boolean>;
  showCustomize: Ref<boolean>;
  showSources: Ref<boolean>;
  showSettings: Ref<boolean>;
  menuVisible: ComputedRef<boolean>;
  
  // Actions
  selectSource: (source: AudioSource) => void;
  toggleEditor: () => void;
  toggleCustomize: () => void;
  toggleSources: () => void;
  initialize: (element: HTMLAudioElement) => void;
}
```

### useRAF

RequestAnimationFrame management store.

```typescript
interface Animation {
  tick: (now: number, progress: number, elapsed: number) => void;
  duration?: number;
  id: string;
  easing?: (t: number) => number;
}

interface RAFStore {
  // State
  time: Ref<number>;
  frameRate: Ref<number>;
  frameNumber: Ref<number>;
  
  // Methods
  add: (tick: AnimationTick, animation: Partial<Animation>) => Promise<void> | void;
  remove: (id: string) => void;
  start: () => void;
  stop: () => void;
  $reset: () => void;
}
```

### useSketches

Shader sketch collection management.

```typescript
interface SketchesStore {
  // State
  sketches: Ref<Sketch[]>;
  currentSketch: Ref<Sketch | null>;
  currentIndex: Ref<number>;
  
  // Selection
  selectSketch: (index: number) => void;
  selectNextSketch: (method?: 'keyboard' | 'pointer' | 'internal') => void;
  selectPreviousSketch: (method?: 'keyboard' | 'pointer' | 'internal') => void;
  
  // Management
  addSketch: (sketch: Sketch) => void;
  removeSketch: (id: string) => void;
  updateSketch: (id: string, updates: Partial<Sketch>) => void;
}
```

### useToast

Toast notification management.

```typescript
interface ToastStore {
  // State
  toasts: Ref<Toast[]>;
  
  // Actions
  show: (message: string, type?: ToastType, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}
```

## Utilities

### Color Utilities

```typescript
// Color conversion functions
function hexToRgb(hex: string): [number, number, number];
function hexToGlslColor(hex: string): [number, number, number];
function glslColorToHex(color: [number, number, number]): string;
function hexToHsl(hex: string): { h: number; s: number; l: number };
function hslToHex(h: number, s: number, l: number): string;
function modelValueToHex(value: any, isWebgl: boolean): string;
function hexToModelValue(hex: string, isWebgl: boolean): any;
```

### Array Utilities

```typescript
// Array manipulation functions
function chunk<T>(array: T[], size: number): T[][];
function shuffle<T>(array: T[]): T[];
function unique<T>(array: T[]): T[];
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]>;
function sortBy<T>(array: T[], key: keyof T, direction?: 'asc' | 'desc'): T[];
```

### Number Utilities

```typescript
// Number processing functions
function clamp(value: number, min?: number, max?: number): number;
function lerp(start: number, end: number, t: number): number;
function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number;
function random(min?: number, max?: number): number;
function round(value: number, decimals?: number): number;
```

### String Utilities

```typescript
// String manipulation functions
function capitalize(str: string): string;
function kebabCase(str: string): string;
function camelCase(str: string): string;
function pascalCase(str: string): string;
function truncate(str: string, length: number, suffix?: string): string;
```

### DOM Utilities

```typescript
// DOM manipulation functions
function addClass(element: Element, className: string): void;
function removeClass(element: Element, className: string): void;
function toggleClass(element: Element, className: string): void;
function hasClass(element: Element, className: string): boolean;
function getElementOffset(element: Element): { top: number; left: number };
function isElementVisible(element: Element): boolean;
```

### Date Utilities

```typescript
// Date formatting and manipulation
function formatDate(date: Date, format: string): string;
function parseDate(dateString: string, format: string): Date;
function addDays(date: Date, days: number): Date;
function diffDays(date1: Date, date2: Date): number;
function isToday(date: Date): boolean;
function isWeekend(date: Date): boolean;
```

### Storage Utilities

```typescript
// Local storage helpers
function getItem<T>(key: string, defaultValue?: T): T;
function setItem<T>(key: string, value: T): void;
function removeItem(key: string): void;
function clear(): void;
function getKeys(): string[];
```

### Phone Utilities

```typescript
// Phone number formatting
function formatPhone(phoneNumber: string, format?: PhoneFormat): string;
function validatePhone(phoneNumber: string): boolean;
function parsePhone(phoneNumber: string): PhoneComponents;
```

## Types

### Core Types

```typescript
// Sketch and shader types
interface Sketch {
  _id: string;
  shader: string;
  variants: Variant[];
}

interface Variant {
  [uniformName: string]: Uniform;
}

interface Uniform {
  value: UniformValue;
}

type UniformValue = number | boolean | number[];

// Animation types
interface Animation {
  tick: AnimationTick;
  duration?: number;
  id: string;
  start?: number;
  easing?: (t: number) => number;
}

type AnimationTick = (now: number, progress: number, elapsed: number) => void;

// Audio types
interface AudioAnalyserConfig {
  bitDepth: number;
  definitions: AudioStreamDefinitions;
  meyda: boolean;
  lowpass: {
    frequency: number;
    Q: number;
  };
}

interface AudioAnalyserState {
  initialized: boolean;
  volume: number;
  stream: number;
  features: any;
  note: string | null;
  source: 'microphone' | 'audio' | 'spotify' | null;
  microphone: MediaStream | null;
  mediaElementSource: MediaElementAudioSourceNode | null;
  mediaStreamSource: MediaStreamAudioSourceNode | null;
  getSpotifyVolume: () => number;
}

// Component prop types
interface SketchProps {
  shader: string;
  uniforms: Record<string, Uniform>;
  width?: number;
  height?: number;
  dpr?: number;
  animate?: boolean;
  volume?: number;
  stream?: number;
  fixed?: boolean;
  time?: number;
  renderMode?: 'always' | 'manual' | 'on-demand';
  position?: [number, number, number];
  visible?: boolean;
  scale?: number;
  meshKey?: boolean;
}

// Layout types
type FlexAlign = 'start' | 'center' | 'end' | 'stretch';
type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
```

### Error Types

```typescript
interface ShaderError {
  line: number;
  message: string;
  type: 'error' | 'warning';
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}
```

### Event Types

```typescript
// Component events
interface SketchEvents {
  click: [];
}

interface InputEvents {
  'update:modelValue': [value: string];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}

interface AudioEvents {
  'track-select': [track: AudiusTrack];
  'source-change': [source: AudioSource];
  'volume-change': [volume: number];
}
```

## GLSL Utilities

### Injected Functions

These functions are automatically available in all shaders:

```glsl
// Coordinate utilities
vec2 k_uv()                          // Normalized UV with aspect ratio correction

// Color utilities  
vec3 k_rainbow(float progress, float stretch, float offset)  // Rainbow colors
vec4 k_hue(vec4 color, float shift)  // Hue shifting

// Geometry utilities
mat2 k_rotate2d(float angle)         // 2D rotation matrix
vec2 k_kale(vec2 uv, vec2 offset, float sides)  // Kaleidoscope effect
vec4 k_orb(vec2 uv, float size, vec2 position, vec3 color, float contrast)  // Orb rendering

// Coordinate transformations
vec2 k_sphere(vec3 pos)              // 3D to spherical UV mapping
vec3 k_uv_to_sphere(vec2 uv)         // UV to 3D sphere coordinates

// Utility functions
vec2 k_swap(vec2 uv, vec2 uv2, bool val, bool valTween, float valTweenProgress)  // Conditional UV swapping
```

### Standard Uniforms

These uniforms are automatically provided to shaders:

```glsl
uniform float u_time;        // Time in seconds
uniform vec2 resolution;     // Canvas resolution
uniform float u_volume;      // Audio volume (0-1)
uniform float u_stream;      // Audio stream value
uniform vec2 u_mouse;        // Mouse position
uniform float u_aspect;      // Aspect ratio
```

### Usage Example

```glsl
void main() {
  vec2 uv = k_uv();
  
  // Audio-reactive rotation
  mat2 rotation = k_rotate2d(u_stream * 0.1);
  uv *= rotation;
  
  // Volume-controlled brightness
  float brightness = u_volume * 2.0;
  
  // Rainbow colors with time animation
  vec3 color = k_rainbow(length(uv) + u_time * 0.1, 1.0, 0.0);
  color *= brightness;
  
  gl_FragColor = vec4(color, 1.0);
}
```

---

This API reference provides comprehensive documentation for all public APIs in the `@wearesage/vue` library. For implementation examples and advanced usage patterns, refer to the specialized documentation sections.