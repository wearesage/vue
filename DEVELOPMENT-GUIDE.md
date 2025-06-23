# Development Guide

Comprehensive guide for contributing to and extending `@wearesage/vue`.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Component Development](#component-development)
- [Adding Utilities](#adding-utilities)
- [Store Development](#store-development)
- [Testing](#testing)
- [Documentation](#documentation)
- [Build and Release](#build-and-release)
- [Contributing Guidelines](#contributing-guidelines)

## Getting Started

### Prerequisites

- **Node.js** 18+ with npm or yarn
- **Git** for version control
- **VS Code** (recommended) with Vue and TypeScript extensions
- Basic knowledge of Vue 3, TypeScript, and WebGL/GLSL

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/@wearesage-vue.git
cd @wearesage-vue
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development**
```bash
npm run dev
```

### Development Scripts

```bash
# Build the library
npm run build

# Run type checking
npm run typecheck

# Lint code
npm run lint

# Format code
npm run format

# Build and prepare for publishing
npm run prepublishOnly
```

## Development Environment

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "Vue.volar",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "vue.codeActions.enabled": true
}
```

### TypeScript Configuration

The project uses strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "nodenext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

## Project Structure

### Core Directories

```
src/
├── assets/          # Static assets (SVG icons, images)
├── classes/         # Core classes (AudioAnalyser, etc.)
├── components/      # Vue components organized by domain
├── composables/     # Vue composition functions
├── constants/       # Static constants and configurations
├── data/           # Static data files and datasets
├── stores/         # Pinia state management
├── styles/         # SCSS styling system
├── types/          # TypeScript type definitions
├── util/           # Utility functions
├── client.ts       # Main library entry point
└── vite.ts         # Vite configuration export
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `Button.vue`, `AudioAnalyser.vue`)
- **Composables**: camelCase with `use` prefix (e.g., `useAudioAnalyser.ts`)
- **Utilities**: camelCase (e.g., `colors.ts`, `arrays.ts`)
- **Types**: camelCase (e.g., `sketches.ts`, `audio.ts`)
- **Stores**: camelCase (e.g., `audio.ts`, `visualizer.ts`)

### Import/Export Patterns

Each domain directory includes an `index.ts` for organized exports:

```typescript
// src/components/common/index.ts
export { default as Button } from "./Button.vue";
export { default as Icon } from "./Icon.vue";
export { default as Toast } from "./Toast.vue";

// src/util/index.ts
export * from "./colors";
export * from "./arrays";
export * from "./numbers";
```

## Development Workflow

### 1. Feature Development

1. **Create a feature branch**
```bash
git checkout -b feature/awesome-new-component
```

2. **Develop the feature**
   - Add components, utilities, or stores
   - Follow established patterns and conventions
   - Add TypeScript types

3. **Test the feature**
   - Manual testing in development environment
   - Add unit tests if applicable
   - Verify TypeScript compilation

4. **Document the feature**
   - Update relevant documentation
   - Add JSDoc comments
   - Include usage examples

### 2. Code Review Process

1. **Self-review checklist**
   - [ ] Code follows project conventions
   - [ ] TypeScript types are properly defined
   - [ ] No console.log statements in production code
   - [ ] Documentation is updated
   - [ ] Manual testing completed

2. **Create pull request**
   - Clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes

3. **Address review feedback**
   - Respond to comments constructively
   - Make requested changes
   - Re-request review when ready

### 3. Release Process

1. **Version bump** (following semantic versioning)
2. **Build verification** (`npm run build`)
3. **Documentation update**
4. **Git tag creation**
5. **NPM publication**

## Component Development

### Component Structure

Follow this consistent structure for all Vue components:

```vue
<template>
  <div class="component-name">
    <!-- Template content -->
    <slot />
  </div>
</template>

<script setup lang="ts">
// Imports
import { computed, ref } from 'vue';
import type { ComponentProps } from '../types';

// Props interface
interface Props {
  modelValue?: string;
  disabled?: boolean;
  // ... other props
}

// Props with defaults
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  // ... other defaults
});

// Emits
interface Emits {
  'update:modelValue': [value: string];
  click: [];
}

const emit = defineEmits<Emits>();

// Reactive state
const isActive = ref(false);

// Computed properties
const classes = computed(() => ({
  'component-name--disabled': props.disabled,
  'component-name--active': isActive.value,
}));

// Methods
function handleClick() {
  emit('click');
}
</script>

<style lang="scss" scoped>
.component-name {
  @include existing-mixins;
  
  // Component styles
  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }
  
  &--active {
    transform: scale(1.05);
  }
}
</style>
```

### Component Guidelines

1. **Props Design**
   - Use TypeScript interfaces for props
   - Provide sensible defaults
   - Follow Vue 3 prop validation patterns

2. **Event Handling**
   - Use typed emits interface
   - Follow Vue naming conventions (`update:modelValue`, etc.)
   - Emit meaningful event data

3. **Styling**
   - Use scoped styles
   - Follow BEM-like naming conventions
   - Utilize existing SCSS mixins and variables

4. **Accessibility**
   - Include proper ARIA attributes
   - Support keyboard navigation
   - Provide screen reader support

### Example: Creating a New Component

```vue
<!-- src/components/common/Badge.vue -->
<template>
  <span 
    class="badge"
    :class="classes"
    role="status"
    :aria-label="ariaLabel"
  >
    <Icon v-if="icon" :name="icon" />
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Icon from './Icon.vue';

interface Props {
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
});

const classes = computed(() => [
  `badge--${props.variant}`,
  `badge--${props.size}`,
]);
</script>

<style lang="scss" scoped>
.badge {
  @include flex-row;
  @include gap(0.25);
  @include box(0.25 0.5, 0.125);
  
  font-size: var(--text-sm);
  font-weight: 500;
  border-radius: 9999px;
  
  &--default {
    background: var(--gray-100);
    color: var(--gray-800);
  }
  
  &--success {
    background: var(--green-100);
    color: var(--green-800);
  }
  
  // ... other variants
  
  &--sm {
    font-size: var(--text-xs);
    @include box(0.125 0.375, 0.0625);
  }
  
  // ... other sizes
}
</style>
```

Don't forget to export it:

```typescript
// src/components/common/index.ts
export { default as Badge } from "./Badge.vue";
```

## Adding Utilities

### Utility Structure

Utilities should be pure functions with clear TypeScript types:

```typescript
// src/util/example.ts

/**
 * Example utility function with JSDoc documentation
 * @param input - The input parameter
 * @param options - Optional configuration
 * @returns Processed result
 */
export function exampleUtil(
  input: string,
  options: ExampleOptions = {}
): string {
  const { transform = false } = options;
  
  // Implementation
  return transform ? input.toUpperCase() : input;
}

export interface ExampleOptions {
  transform?: boolean;
}

// Export types
export type { ExampleOptions };
```

### Utility Guidelines

1. **Pure Functions**
   - No side effects
   - Predictable outputs for given inputs
   - Easily testable

2. **TypeScript Types**
   - Strong typing for parameters and return values
   - Export interfaces and types
   - Use generics where appropriate

3. **Documentation**
   - JSDoc comments for all public functions
   - Include usage examples
   - Document edge cases

4. **Error Handling**
   - Validate inputs where necessary
   - Throw meaningful errors
   - Handle edge cases gracefully

### Example: Adding Color Utilities

```typescript
// src/util/colorAdvanced.ts

/**
 * Convert RGB color to HSV color space
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)  
 * @param b - Blue component (0-255)
 * @returns HSV color object
 */
export function rgbToHsv(r: number, g: number, b: number): HSVColor {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = max === 0 ? 0 : diff / max;
  let v = max;
  
  if (diff !== 0) {
    switch (max) {
      case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
      case g: h = (b - r) / diff + 2; break;
      case b: h = (r - g) / diff + 4; break;
    }
    h /= 6;
  }
  
  return { h: h * 360, s: s * 100, v: v * 100 };
}

export interface HSVColor {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

/**
 * Create a color palette from a base color
 * @param baseColor - Base hex color
 * @param count - Number of colors to generate
 * @returns Array of hex colors
 */
export function generatePalette(baseColor: string, count: number = 5): string[] {
  // Implementation...
  return [];
}

// Re-export from main colors utility
export * from './colors';
```

Update the main utility index:

```typescript
// src/util/index.ts
export * from "./colorAdvanced";
```

## Store Development

### Store Structure

Use Pinia with the composition API pattern:

```typescript
// src/stores/example.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useExample = defineStore('example', () => {
  // State
  const items = ref<ExampleItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Getters (computed)
  const itemCount = computed(() => items.value.length);
  const hasItems = computed(() => items.value.length > 0);
  
  // Actions
  async function fetchItems() {
    loading.value = true;
    error.value = null;
    
    try {
      // Fetch logic
      const response = await fetch('/api/items');
      items.value = await response.json();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading.value = false;
    }
  }
  
  function addItem(item: ExampleItem) {
    items.value.push(item);
  }
  
  function removeItem(id: string) {
    const index = items.value.findIndex(item => item.id === id);
    if (index > -1) {
      items.value.splice(index, 1);
    }
  }
  
  function $reset() {
    items.value = [];
    loading.value = false;
    error.value = null;
  }
  
  return {
    // State
    items,
    loading,
    error,
    
    // Getters
    itemCount,
    hasItems,
    
    // Actions
    fetchItems,
    addItem,
    removeItem,
    $reset,
  };
});

interface ExampleItem {
  id: string;
  name: string;
  // ... other properties
}
```

### Store Guidelines

1. **Composition API Pattern**
   - Use `ref()` for primitive state
   - Use `computed()` for derived state
   - Group related functionality

2. **Error Handling**
   - Include error state
   - Handle async operation errors
   - Provide meaningful error messages

3. **Reset Functionality**
   - Implement `$reset()` method
   - Reset to initial state
   - Useful for testing and cleanup

4. **TypeScript Integration**
   - Strong typing for all state
   - Define interfaces for complex types
   - Export types for external use

## Testing

### Testing Strategy

1. **Unit Tests** - Critical utilities and composables
2. **Component Tests** - Key interactive components  
3. **Integration Tests** - Store interactions
4. **Manual Testing** - Visual components and WebGL features

### Testing Tools

```json
{
  "devDependencies": {
    "vitest": "^latest",
    "@vue/test-utils": "^latest",
    "@testing-library/vue": "^latest",
    "jsdom": "^latest"
  }
}
```

### Example Tests

```typescript
// tests/util/colors.test.ts
import { describe, it, expect } from 'vitest';
import { hexToRgb, rgbToHex } from '../../src/util/colors';

describe('Color Utilities', () => {
  describe('hexToRgb', () => {
    it('converts hex to RGB correctly', () => {
      expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
      expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
      expect(hexToRgb('#0000ff')).toEqual([0, 0, 255]);
    });
    
    it('handles hex without hash', () => {
      expect(hexToRgb('ff0000')).toEqual([255, 0, 0]);
    });
    
    it('returns [-1, -1, -1] for invalid hex', () => {
      expect(hexToRgb('invalid')).toEqual([-1, -1, -1]);
    });
  });
});
```

```typescript
// tests/components/Button.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Button from '../../src/components/common/Button.vue';

describe('Button', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me'
      }
    });
    
    expect(wrapper.text()).toBe('Click me');
  });
  
  it('emits click event', async () => {
    const wrapper = mount(Button);
    await wrapper.trigger('click');
    
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
```

## Documentation

### Documentation Standards

1. **JSDoc Comments**
   - All public functions and classes
   - Include parameter descriptions
   - Document return values
   - Add usage examples

2. **Component Documentation**
   - Props descriptions
   - Event documentation
   - Slot descriptions
   - Usage examples

3. **README Updates**
   - Keep main README current
   - Update feature lists
   - Include new examples

### JSDoc Examples

```typescript
/**
 * Clamps a number between min and max values
 * 
 * @param value - The number to clamp
 * @param min - The minimum value (default: 0)
 * @param max - The maximum value (default: 1)
 * @returns The clamped value
 * 
 * @example
 * ```typescript
 * clamp(1.5, 0, 1); // Returns 1
 * clamp(-0.5, 0, 1); // Returns 0
 * clamp(0.5, 0, 1); // Returns 0.5
 * ```
 */
export function clamp(value: number, min: number = 0, max: number = 1): number {
  return Math.min(Math.max(value, min), max);
}
```

## Build and Release

### Build Process

The library uses `tsup` for building:

```typescript
// tsup.config.ts
export default defineConfig({
  entry: ["src/client.ts", "src/vite.ts"],
  format: ["esm"],
  dts: true,           // Generate declaration files
  clean: true,         // Clean dist before build
  external: [          // Don't bundle these dependencies
    "vue", 
    "vite", 
    "@vitejs/plugin-vue", 
    "pinia", 
    "vue-router"
  ],
  onSuccess: async () => {
    // Copy source directories for direct imports
    // This enables @wearesage/vue/components/Button imports
  },
});
```

### Package.json Exports

```json
{
  "exports": {
    ".": {
      "types": "./src/client.d.mts",
      "default": "./src/client.ts"
    },
    "./vite": {
      "types": "./src/vite.d.mts", 
      "default": "./src/vite.ts"
    },
    "./components/*": "./src/components/*",
    "./stores/*": "./src/stores/*",
    "./util/*": "./src/util/*",
    "./sass": "./src/styles/_index.scss"
  }
}
```

### Release Checklist

- [ ] Version bump in package.json
- [ ] Update CHANGELOG.md
- [ ] Run `npm run build` successfully
- [ ] Run `npm run typecheck` successfully  
- [ ] Test in example project
- [ ] Update documentation if needed
- [ ] Create git tag
- [ ] Publish to npm

## Contributing Guidelines

### Code Style

1. **TypeScript**
   - Use strict mode
   - Prefer interfaces over types
   - Use meaningful variable names

2. **Vue 3**
   - Use Composition API with `<script setup>`
   - Prefer `ref()` and `reactive()` appropriately
   - Use TypeScript with props and emits

3. **Formatting**
   - Use Prettier for consistent formatting
   - 2-space indentation
   - Trailing commas where valid

### Git Workflow

1. **Branch Naming**
   - `feature/description-of-feature`
   - `bugfix/description-of-fix`
   - `docs/description-of-docs`

2. **Commit Messages**
   - Use conventional commits format
   - `feat: add new audio source support`
   - `fix: resolve shader compilation issue`
   - `docs: update API reference`

3. **Pull Requests**
   - Clear, descriptive titles
   - Reference related issues
   - Include testing notes
   - Add screenshots for UI changes

### Code Review Guidelines

**For Authors:**
- Self-review before requesting review
- Provide context and reasoning
- Be responsive to feedback
- Test thoroughly

**For Reviewers:**
- Be constructive and helpful
- Focus on code quality and maintainability
- Ask questions for clarification
- Approve when satisfied

### Issue Templates

**Bug Report:**
- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots if applicable

**Feature Request:**
- Clear description of the feature
- Use case and motivation
- Proposed API (if applicable)
- Additional context

### Getting Help

- Check existing documentation first
- Search existing issues
- Create detailed issue descriptions
- Use appropriate labels
- Be patient and respectful

## Development Tips

### Performance Considerations

1. **Bundle Size**
   - Keep dependencies minimal
   - Use tree-shaking friendly exports
   - Avoid large third-party libraries

2. **Runtime Performance**
   - Use `shallowRef` for complex objects
   - Minimize reactive overhead
   - Optimize WebGL operations

3. **Development Experience**
   - Fast hot-reload
   - Clear error messages
   - Good TypeScript integration

### Debugging

1. **Vue DevTools**
   - Install Vue DevTools browser extension
   - Use for component and store inspection
   - Monitor performance

2. **Browser DevTools**
   - Use console for WebGL debugging
   - Network tab for asset loading
   - Performance tab for optimization

3. **TypeScript**
   - Use strict mode for better error catching
   - Enable all strict flags
   - Use proper type annotations

---

This development guide provides everything needed to contribute effectively to the `@wearesage/vue` project. Following these guidelines ensures consistency, quality, and maintainability across the codebase.