# @wearesage/vue

A sophisticated Vue 3 component library for multimedia applications and creative coding projects.

## ✨ Features

- 🎵 **Real-time Audio Analysis** - Web Audio API integration with multi-source support
- 🎨 **WebGL/3D Graphics** - Three.js integration via TresJS with shader development environment
- 🧩 **Modular Components** - Domain-organized components for audio, visualization, forms, and more
- ⚡ **Performance Optimized** - RequestAnimationFrame-based animation system
- 🎛️ **Multiple Audio Sources** - Spotify, Audius, microphone, radio streams, and file uploads
- 🔧 **Developer Friendly** - TypeScript, auto-imports, and comprehensive utilities

## 🚀 Quick Start

### Installation

```bash
npm install @wearesage/vue
```

### Vite Configuration

Configure your `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import { plugins, css } from "@wearesage/vue/vite";

export default defineConfig({
  plugins,
  css,
});
```

### App Setup

Initialize your app in `main.ts`:

```typescript
import { createApp } from "@wearesage/vue";
import { routes } from "vue-router/auto-routes";
import App from "./App.vue";

createApp(App, routes);
```

### Basic Usage

```vue
<template>
  <div>
    <!-- Audio-reactive WebGL shader -->
    <Sketch 
      :shader="fragmentShader" 
      :uniforms="uniforms" 
      :animate="true" 
    />
    
    <!-- UI Components -->
    <Button @click="handleClick">
      <Icon name="play" />
      Play Audio
    </Button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Button, Icon, Sketch } from '@wearesage/vue/components';
import { useAudioAnalyser } from '@wearesage/vue/composables';

const { volume, stream } = useAudioAnalyser();

const fragmentShader = `
  void main() {
    vec2 uv = k_uv();
    vec3 color = k_rainbow(length(uv) + u_stream * 0.1, 1.0, 0.0);
    gl_FragColor = vec4(color * u_volume, 1.0);
  }
`;

const uniforms = computed(() => ({
  u_volume: { value: volume.value },
  u_stream: { value: stream.value }
}));
</script>
```

## 📦 What's Included

### Core Systems
- **Audio Analysis** - Real-time audio processing and visualization
- **WebGL Shaders** - GLSL development environment with live preview
- **Animation Framework** - Sophisticated RAF-based animation management
- **State Management** - Pinia stores for audio, visualization, and UI state

### Component Categories
- **`common/`** - Essential UI components (Button, Icon, Toast, etc.)
- **`forms/`** - Form controls with specialized inputs (Color, Range, etc.)
- **`webgl/`** - WebGL components (Sketch, GLSLEditor, etc.)
- **`audius/`** - Music platform integration components
- **`layout/`** - Layout and grid components
- **`chat/`** - Chat and messaging components

### Utilities
- **Colors** - Hex, RGB, HSL, and GLSL color conversions
- **Audio** - Audio processing and analysis helpers
- **GLSL** - Shader utilities and common functions
- **DOM** - Element manipulation and event handling
- **Data** - Array processing and data transformation

## 🎯 Use Cases

Perfect for building:
- **Audio Visualizers** - Real-time music visualization applications
- **Creative Coding Projects** - Interactive art and generative design
- **Multimedia Applications** - Apps combining audio, video, and graphics
- **Data Visualization** - Interactive charts and visual analytics
- **Educational Tools** - Teaching audio processing and computer graphics

## 📚 Documentation

- **[Architecture Guide](./ARCHITECTURE.md)** - Deep dive into system architecture and design patterns
- **[API Reference](./API-REFERENCE.md)** - Complete API documentation for components and utilities
- **[Audio System](./AUDIO-SYSTEM.md)** - Audio analysis, sources, and audio-visual synchronization
- **[Shader Development](./SHADER-DEVELOPMENT.md)** - WebGL shaders, GLSL utilities, and the development environment
- **[Development Guide](./DEVELOPMENT-GUIDE.md)** - Contributing, building, and extending the library

## 🎨 Example Projects

### Audio Visualizer
```vue
<template>
  <div class="visualizer">
    <Sketch 
      :shader="visualizerShader" 
      :uniforms="audioUniforms"
      :animate="true"
    />
    <div class="controls">
      <Button @click="audio.toggle()">
        <Icon :name="audio.playing ? 'pause' : 'play'" />
      </Button>
    </div>
  </div>
</template>

<script setup>
import { useAudio } from '@wearesage/vue/stores';
const audio = useAudio();
</script>
```

### GLSL Shader Editor
```vue
<template>
  <div class="editor-layout">
    <GLSLEditor 
      v-model="shaderCode" 
      @compile="handleCompile"
    />
    <Sketch 
      :shader="shaderCode" 
      :uniforms="dynamicUniforms"
    />
  </div>
</template>
```

## 🛠️ Advanced Features

- **Multi-source Audio** - Seamlessly switch between Spotify, microphone, and file sources
- **Shader Hot Reload** - Live shader editing with real-time compilation
- **Performance Monitoring** - Built-in frame rate monitoring and optimization
- **Responsive Design** - Mobile-friendly components with touch support
- **Accessibility** - ARIA-compliant components with keyboard navigation

## 🔧 Configuration

### SCSS Integration
```scss
@use "@wearesage/vue/sass" as *;

.my-component {
  @include flex-row;
  @include box(1, 2);
  color: var(--primary-color);
}
```

### TypeScript Support
Full TypeScript support with comprehensive type definitions:
```typescript
import type { SketchProps, AudioSource } from '@wearesage/vue/types';
```

## 🤝 Contributing

We welcome contributions! Please see our [Development Guide](./DEVELOPMENT-GUIDE.md) for details on:
- Setting up the development environment
- Component development patterns
- Testing and quality assurance
- Submitting pull requests

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

Built with modern web technologies:
- [Vue 3](https://vuejs.org/) - Progressive JavaScript framework
- [Three.js](https://threejs.org/) - 3D graphics library
- [TresJS](https://tresjs.org/) - Vue 3 Three.js integration
- [Pinia](https://pinia.vuejs.org/) - State management
- [Vite](https://vitejs.dev/) - Build tool
- [CodeMirror](https://codemirror.net/) - Code editor

---

**Created by [Zach Winter](mailto:contact@zachwinter.com)**