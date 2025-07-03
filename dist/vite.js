import Vue from "@vitejs/plugin-vue";
import SVG from "vite-svg-loader";
import tsconfigPaths from "vite-tsconfig-paths";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { templateCompilerOptions } from "@tresjs/core";
const AUTO_IMPORTED_LIBS = [`vue`, `vue/macros`, `pinia`];
const AUTO_IMPORTED_DIRS = ["assets", "classes", "composables", "constants", "data", "stores", "styles", "types", "util"];
const SILENCED_SCSS_DEPRECATIONS = [`mixed-decls`, `legacy-js-api`, `color-functions`, `global-builtin`, `import`];
export const plugins = [
    tsconfigPaths(),
    Vue(templateCompilerOptions),
    SVG(),
];
export function createSagePlugins(config = {}) {
    const { autoImport = true, components = true, autoImportDirs = AUTO_IMPORTED_DIRS, } = config;
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
export async function getPluginsWithSageRouter() {
    const { sageRouter } = await import("./router/vite-plugin-sage-router");
    return [
        sageRouter({
            pagesDir: "src/pages",
            outputFile: "src/routes.generated.ts",
        }),
        ...plugins,
    ];
}
export async function createSagePluginsWithRouter(config = {}) {
    const { sageRouter } = await import("./router/vite-plugin-sage-router");
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
export const resolve = {
    alias: {
        '@wearesage/sass': '@wearesage/sass'
    }
};
export const css = {
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
export async function createSageConfig(userConfig = {}) {
    const hasRouter = userConfig.router === true || typeof userConfig.router === 'object';
    const pluginsFn = hasRouter ? createSagePluginsWithRouter : createSagePlugins;
    const plugins = await pluginsFn(userConfig);
    // Handle API proxy
    const serverConfig = {
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
