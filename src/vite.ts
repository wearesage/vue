import Vue from "@vitejs/plugin-vue";
// import AutoImport from "unplugin-auto-import/vite"; // 💀 KILLED
import SVG from "vite-svg-loader";
import tsconfigPaths from "vite-tsconfig-paths";
import { templateCompilerOptions } from "@tresjs/core";
import { type CSSOptions, type PluginOption, type AliasOptions } from "vite";
import { type DeprecationOrId } from "sass";
// import { nodePolyfills } from "vite-plugin-node-polyfills"; // 💀 KILLED - Reown can figure its own shit out
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
// Note: sageRouter plugin import moved to avoid client-side bundling

const AUTO_IMPORTED_LIBS = [`vue`, `vue/macros`, `pinia`];
const AUTO_IMPORTED_DIRS: string[] = ["assets", "classes", "composables", "constants", "data", "stores", "styles", "types", "util"];
const SILENCED_SCSS_DEPRECATIONS: DeprecationOrId[] = [`mixed-decls`, `legacy-js-api`, `color-functions`, `global-builtin`, `import`];

export const plugins: PluginOption[] = [
  tsconfigPaths(),
  Vue(templateCompilerOptions),
  SVG(),
  // nodePolyfills removed - if Reown needs Node APIs in the browser, that's a Reown problem
  // 💀 AUTO-IMPORTS KILLED - explicit imports only for Sage Router compatibility!
];

// Helper function to get plugins with Sage Router (avoiding client bundle pollution)
export async function getPluginsWithSageRouter(): Promise<PluginOption[]> {
  // Import directly from the plugin file, NOT through router/index.ts
  const { sageRouter } = await import("./router/vite-plugin-sage-router.ts");
  return [
    sageRouter({
      pagesDir: "src/pages",
      outputFile: "src/routes.generated.ts",
    }),
    ...plugins,
  ];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const resolveConfig: AliasOptions = {
  '@wearesage/sass': resolve(__dirname, '../../sass/src/index.scss'),
};

export const css: CSSOptions = {
  preprocessorOptions: {
    scss: {
      silenceDeprecations: SILENCED_SCSS_DEPRECATIONS,
      quietDeps: true,
      additionalData: `
        @use "sass:math";
        @use "@wearesage/sass" as *;
      `,
    },
  },
};

export const optimizeDeps = {
  include: ["markdown-it", "vue-markdown-render", "highlight.js", "phone"],
};
