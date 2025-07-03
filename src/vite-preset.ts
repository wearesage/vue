import { defineConfig, type UserConfig } from "vite";
import { createSageConfig, type SageViteConfig } from "./vite";

/**
 * One-liner Vite config for @wearesage/vue projects
 * Just like the static server - import and go!
 */
export function defineSageConfig(userConfig: SageViteConfig = {}): Promise<UserConfig> {
  return createSageConfig(userConfig);
}

/**
 * Synchronous version with sensible defaults
 */
export function defineSageConfigSync(userConfig: SageViteConfig = {}): UserConfig {
  const { plugins, css, optimizeDeps, resolve } = userConfig;
  
  return defineConfig({
    plugins: plugins || [],
    css: css || {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['mixed-decls', 'legacy-js-api', 'color-functions', 'global-builtin', 'import'],
          quietDeps: true,
          additionalData: `
            @use "sass:math";
            @use "@wearesage/sass" as *;
          `,
        },
      },
    },
    optimizeDeps: optimizeDeps || {
      include: ["markdown-it", "vue-markdown-render", "highlight.js", "phone"],
    },
    resolve: resolve || {
      alias: {
        '@wearesage/sass': '@wearesage/sass'
      }
    },
    server: {
      host: true,
      port: 3000,
    },
    build: {
      target: "es2022",
      sourcemap: true,
    },
  });
}