import Vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import SVG from "vite-svg-loader";
import VueRouter from "unplugin-vue-router/vite";
import { VueRouterAutoImports } from "unplugin-vue-router";
import tsconfigPaths from "vite-tsconfig-paths";
import { templateCompilerOptions } from "@tresjs/core";
import { type CSSOptions, type PluginOption } from "vite";
import { type DeprecationOrId } from "sass";

const AUTO_IMPORTED_LIBS = [`vue`, `vue/macros`, `pinia`, VueRouterAutoImports];
const AUTO_IMPORTED_DIRS: string[] = ["assets", "classes", "composables", "constants", "data", "stores", "styles", "types", "util"];
const SILENCED_SCSS_DEPRECATIONS: DeprecationOrId[] = [`mixed-decls`, `legacy-js-api`, `color-functions`, `global-builtin`, `import`];

export const plugins: PluginOption[] = [
  tsconfigPaths(),
  VueRouter({
    routeBlockLang: `yaml`,
  }),
  Vue(templateCompilerOptions),
  SVG(),
  AutoImport({
    imports: AUTO_IMPORTED_LIBS,
    // dirs: AUTO_IMPORTED_DIRS.map((dir) => `/Users/zach/dev/@wearesage-vue/src/${dir}`),
    dts: `auto-imports.d.ts`,
  }),
  // Components({
  //   dts: true,
  //   dirs: "/Users/zach/dev/@wearesage-vue/src/components",
  // }),
];

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
  include: ["markdown-it", "vue-markdown-render", "highlight.js"],
};
