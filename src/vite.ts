import Vue from "@vitejs/plugin-vue";
import SVG from "vite-svg-loader";
import tsconfigPaths from "vite-tsconfig-paths";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { templateCompilerOptions } from "@tresjs/core";
import { type CSSOptions, type PluginOption, type UserConfig, type ResolveOptions } from "vite";
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
  // Allow passing through Vite config options for the sync version
  plugins?: PluginOption[];
  css?: CSSOptions;
  optimizeDeps?: any;
  resolve?: ResolveOptions;
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

// Router functionality removed to avoid build complexity
// If you need router, import sageRouter directly from the source file
export async function getPluginsWithSageRouter(): Promise<PluginOption[]> {
  throw new Error("Router functionality has been removed from vite utilities. Import sageRouter directly if needed.");
}

export async function createSagePluginsWithRouter(config: SageViteConfig = {}): Promise<PluginOption[]> {
  // For now, just return the base plugins without router
  console.warn("Router functionality temporarily disabled. Using base plugins only.");
  return createSagePlugins(config);
}

export const resolve: any = {
  alias: {
    '@wearesage/sass': '@wearesage/sass'
  }
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
