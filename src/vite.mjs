import Vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import SVG from "vite-svg-loader";
import VueRouter from "unplugin-vue-router/vite";
import { VueRouterAutoImports } from "unplugin-vue-router";
import tsconfigPaths from "vite-tsconfig-paths";
import { templateCompilerOptions } from "@tresjs/core";

const AUTO_IMPORTED_LIBS = [`vue`, `vue/macros`, `pinia`, VueRouterAutoImports];
const AUTO_IMPORTED_DIRS = ["assets", "classes", "composables", "constants", "data", "stores", "styles", "types", "util"];
const SILENCED_SCSS_DEPRECATIONS = [`mixed-decls`, `legacy-js-api`, `color-functions`, `global-builtin`, `import`];

export const plugins = [
  tsconfigPaths(),
  VueRouter({
    routeBlockLang: `yaml`,
  }),
  Vue(templateCompilerOptions),
  SVG(),
  AutoImport({
    imports: AUTO_IMPORTED_LIBS,
    dts: `auto-imports.d.ts`,
  }),
];

export const css = {
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