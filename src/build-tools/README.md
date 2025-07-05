# Sage Build Tools

A TypeScript-powered build analysis and development toolchain integrated with Vite for the `@wearesage/vue` ecosystem.

## Features

- **Real-time TypeScript Analysis**: Uses ts-morph for deep AST analysis
- **File System Watching**: Instant feedback on code changes via Chokidar
- **Vite Plugin Integration**: Seamless development experience
- **WebSocket Updates**: Real-time analysis results in browser and terminal
- **Vue SFC Support**: Specialized analysis for Vue Single File Components
- **Cross-Package Analysis**: Monorepo-aware dependency tracking
- **Configurable Rules**: Extensible analysis rules system

## Quick Start

### Basic Vite Integration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { createSageConfig } from '@wearesage/vue/vite';
import { sageBuildTools } from '@wearesage/vue/build-tools';

export default defineConfig({
  ...await createSageConfig({
    autoImport: true,
    components: true,
  }),
  plugins: [
    // ... other plugins
    sageBuildTools({
      enabled: true,
      showInTerminal: true,
      showInBrowser: true,
      rules: [
        { name: 'unused-exports', enabled: true, severity: 'warning' },
        { name: 'circular-dependency', enabled: true, severity: 'error' },
        { name: 'component-naming', enabled: true, severity: 'warning' },
      ]
    })
  ]
});
```

### Convenience Helper

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { createSageConfigWithBuildTools } from '@wearesage/vue/build-tools';

export default defineConfig(
  await createSageConfigWithBuildTools(
    {
      autoImport: true,
      components: true,
    },
    {
      enabled: true,
      rules: [
        { name: 'unused-exports', enabled: true, severity: 'warning' },
        { name: 'type-annotation', enabled: true, severity: 'info' },
      ]
    }
  )
);
```

## Configuration Options

```typescript
interface SageBuildToolsPluginOptions {
  // Enable/disable the build tools plugin
  enabled?: boolean;
  
  // Root directory to analyze (default: process.cwd())
  rootDir?: string;
  
  // TypeScript configuration file path
  tsConfigPath?: string;
  
  // Directories to watch for changes
  watchDirs?: string[];
  
  // WebSocket port for real-time updates (default: 3001)
  websocketPort?: number;
  
  // Enable Vue SFC analysis (default: true)
  enableVueAnalysis?: boolean;
  
  // Enable cross-package analysis (default: true)
  enableCrossPackageAnalysis?: boolean;
  
  // Show analysis results in terminal (default: true)
  showInTerminal?: boolean;
  
  // Show analysis results in browser console (default: true)
  showInBrowser?: boolean;
  
  // Analysis rules configuration
  rules?: AnalysisRuleConfig[];
}
```

## Built-in Analysis Rules

### `unused-exports`
Detects exported functions, classes, and variables that are never imported.

```typescript
// ❌ Warning: Export 'unusedFunction' is never used
export function unusedFunction() {
  return 'This is never imported anywhere';
}

// ✅ OK: Export is used in other files
export function usedFunction() {
  return 'This is imported and used';
}
```

### `circular-dependency`
Identifies circular dependency chains between modules.

```typescript
// ❌ Error: Circular dependency detected
// fileA.ts imports fileB.ts
// fileB.ts imports fileA.ts
```

### `unused-imports`
Finds imported modules that are never referenced in the file.

```typescript
// ❌ Warning: Import 'unusedUtil' is never used
import { usedUtil, unusedUtil } from './utils';

console.log(usedUtil());
```

### `component-naming`
Enforces PascalCase naming convention for Vue components.

```typescript
// ❌ Warning: Vue component 'my-component' should use PascalCase naming
// File: my-component.vue

// ✅ OK: Proper PascalCase naming
// File: MyComponent.vue
```

### `type-annotation`
Suggests explicit type annotations for exported function parameters.

```typescript
// ❌ Info: Parameter 'data' should have explicit type annotation
export function processData(data) {
  return data.map(item => item.id);
}

// ✅ OK: Explicit type annotation
export function processData(data: DataItem[]) {
  return data.map(item => item.id);
}
```

## Programmatic Usage

```typescript
import { BuildOrchestrator } from '@wearesage/vue/build-tools';

const orchestrator = new BuildOrchestrator({
  rootDir: './src',
  tsConfigPath: './tsconfig.json',
  rules: [
    { name: 'unused-exports', enabled: true, severity: 'warning' }
  ]
});

// Initialize and start analysis
await orchestrator.initialize();

// Listen for analysis results
orchestrator.on('analysis:complete', (analysis) => {
  console.log('Analysis complete:', analysis.stats);
  analysis.results.forEach(result => {
    console.log(\`\${result.file}:\${result.line} - \${result.message}\`);
  });
});

// Clean up
await orchestrator.destroy();
```

## WebSocket Integration

The build tools automatically set up a WebSocket server for real-time updates. In the browser:

```javascript
// Auto-injected client provides real-time updates
// Access debugging API:
window.__sageBuildTools.getLastAnalysis();
window.__sageBuildTools.reconnect();
```

## Terminal Output

Analysis results are displayed in the terminal with clear formatting:

```
📊 Build Tools Analysis Results:
   Files analyzed: 23
   Errors: 0
   Warnings: 3
   Info: 2
   Analysis time: 150ms

📋 Issues found:

  📄 src/components/MyComponent.vue:
    ⚠️ Line 15: Export 'unusedProp' is never used (unused-exports)
    ℹ️ Line 8: Parameter 'data' should have explicit type annotation (type-annotation)
```

## Integration with Existing @wearesage/vue Projects

The build tools integrate seamlessly with the existing `@wearesage/vue` ecosystem:

```typescript
// Existing project using @wearesage/vue
import { createApp } from '@wearesage/vue';
import { routes } from 'vue-router/auto-routes';
import App from './App.vue';

// In vite.config.ts, just add the build tools plugin
import { sageBuildTools } from '@wearesage/vue/build-tools';

export default defineConfig({
  plugins: [
    // ... existing Sage Vue plugins
    sageBuildTools() // Automatic analysis during development
  ]
});
```

## Performance Considerations

- **Incremental Analysis**: Only re-analyzes changed files
- **WebSocket Batching**: Efficient real-time updates
- **Memory Optimization**: Uses ts-morph's efficient AST caching
- **Development Only**: Disabled in production builds by default
- **Configurable Rules**: Enable only the rules you need

## Extensibility

Create custom analysis rules:

```typescript
import { AnalysisRule, RuleContext, AnalysisResult } from '@wearesage/vue/build-tools';

export class CustomRule extends AnalysisRule {
  readonly name = 'custom-rule';

  async analyze(context: RuleContext): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    const { sourceFile } = context;
    
    // Your custom analysis logic here
    
    return results;
  }
}
```

## VS Code Alternative Vision

This build tools suite provides many capabilities traditionally handled by VS Code extensions:

- **Real-time Error Detection**: Faster than VS Code's TypeScript service
- **Custom Analysis Rules**: Beyond what ESLint/TSLint can provide
- **Project-wide Insights**: Cross-file dependency analysis
- **Performance Monitoring**: Built-in analysis timing
- **Integrated Development**: Works directly with your Vite dev server

The goal is to provide a comprehensive TypeScript development experience that leverages the power of static analysis and real-time feedback without requiring a heavyweight IDE.