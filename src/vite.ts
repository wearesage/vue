import Vue from "@vitejs/plugin-vue";
import SVG from "vite-svg-loader";
import tsconfigPaths from "vite-tsconfig-paths";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { templateCompilerOptions } from "@tresjs/core";
import { type CSSOptions, type PluginOption, type AliasOptions, type UserConfig } from "vite";
import { type DeprecationOrId } from "sass";

const AUTO_IMPORTED_LIBS = [`vue`, `vue/macros`, `pinia`];
const AUTO_IMPORTED_DIRS: string[] = ["assets", "classes", "composables", "constants", "data", "stores", "styles", "types", "util"];
const SILENCED_SCSS_DEPRECATIONS: DeprecationOrId[] = [`mixed-decls`, `legacy-js-api`, `color-functions`, `global-builtin`, `import`];

export interface SageViteConfig {
  autoImport?: boolean;
  components?: boolean;
  router?: {
    pagesDir?: string;
    routesOutput?: string;
  } | boolean;
  autoImportDirs?: string[];
  apiProxy?: {
    target?: string;
    path?: string;
  };
}

export const plugins: PluginOption[] = [
  tsconfigPaths(),
  Vue(templateCompilerOptions),
  SVG(),
];

export function createSagePlugins(config: SageViteConfig = {}): Promise<PluginOption[]> {
  const {
    autoImport = true,
    components = true,
    autoImportDirs = AUTO_IMPORTED_DIRS,
  } = config;

  return Promise.resolve([
    ...plugins,
    ...(autoImport ? [
      AutoImport({
        imports: AUTO_IMPORTED_LIBS,
        dirs: autoImportDirs,
        dts: true,
      }),
    ] : []),
    ...(components ? [
      Components({
        dirs: ["src/components"],
        dts: true,
      }),
    ] : []),
  ]);
}

export async function getPluginsWithSageRouter(): Promise<PluginOption[]> {
  const { sageRouter } = await import("./router/vite-plugin-sage-router.ts");
  return [
    sageRouter({
      pagesDir: "src/pages",
      outputFile: "src/routes.generated.ts",
    }),
    ...plugins,
  ];
}

export async function createSagePluginsWithRouter(config: SageViteConfig = {}): Promise<PluginOption[]> {
  const { sageRouter } = await import("./router/vite-plugin-sage-router.ts");
  const basePlugins = await createSagePlugins(config);
  
  const routerConfig = typeof config.router === 'object' ? config.router : {};
  const pagesDir = routerConfig.pagesDir || "src/pages";
  const routesOutput = routerConfig.routesOutput || "src/routes.generated.ts";
  
  return [
    sageRouter({
      pagesDir,
      outputFile: routesOutput,
    }),
    ...basePlugins,
  ];
}

export const resolve: AliasOptions = {
  '@wearesage/sass': '@wearesage/sass'
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

// The magic: complete Vite config that "just works"
export async function createSageConfig(userConfig: SageViteConfig = {}): Promise<UserConfig> {
  const hasRouter = userConfig.router === true || typeof userConfig.router === 'object';
  const pluginsFn = hasRouter ? createSagePluginsWithRouter : createSagePlugins;
  const plugins = await pluginsFn(userConfig);
  
  // Handle API proxy
  const serverConfig: any = {
    host: true,
    port: 3000,
  };
  
  if (userConfig.apiProxy) {
    const { target = "http://localhost:2223", path = "/api" } = userConfig.apiProxy;
    serverConfig.proxy = {
      [path]: {
        target,
        changeOrigin: true,
        secure: false,
      }
    };
  }
  
  return {
    plugins,
    css,
    optimizeDeps,
    resolve,
    server: serverConfig,
    build: {
      target: "es2022",
      sourcemap: true,
    },
  };
}
