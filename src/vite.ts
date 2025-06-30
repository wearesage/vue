import Vue from "@vitejs/plugin-vue";
// import AutoImport from "unplugin-auto-import/vite"; // 💀 KILLED
import SVG from "vite-svg-loader";
import tsconfigPaths from "vite-tsconfig-paths";
import { templateCompilerOptions } from "@tresjs/core";
import { type CSSOptions, type PluginOption } from "vite";
import { type DeprecationOrId } from "sass";
// Note: sageRouter plugin import moved to avoid client-side bundling

const AUTO_IMPORTED_LIBS = [`vue`, `vue/macros`, `pinia`];
const AUTO_IMPORTED_DIRS: string[] = ["assets", "classes", "composables", "constants", "data", "stores", "styles", "types", "util"];
const SILENCED_SCSS_DEPRECATIONS: DeprecationOrId[] = [`mixed-decls`, `legacy-js-api`, `color-functions`, `global-builtin`, `import`];

export const plugins: PluginOption[] = [
  tsconfigPaths(),
  Vue(templateCompilerOptions),
  SVG(),
  // 💀 AUTO-IMPORTS KILLED - explicit imports only for Sage Router compatibility!
];

// Helper function to get plugins with Sage Router (avoiding client bundle pollution)
export async function getPluginsWithSageRouter(): Promise<PluginOption[]> {
  const { sageRouter } = await import("./router/vite-plugin-sage-router.ts");
  return [
    sageRouter({
      pagesDir: "src/pages",
      outputFile: "src/router/generated-routes.ts",
    }),
    ...plugins,
  ];
}

export const css: CSSOptions = {
  preprocessorOptions: {
    scss: {
      silenceDeprecations: SILENCED_SCSS_DEPRECATIONS,
      quietDeps: true,
      additionalData: `
        @use "sass:math";
        @use "@wearesage/vue/sass" as *;
      `,
    },
  },
};

export const optimizeDeps = {
  include: ["markdown-it", "vue-markdown-render", "highlight.js", "phone"],
};
