import { type CSSOptions, type PluginOption, type UserConfig, type ResolveOptions } from "vite";
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
    plugins?: PluginOption[];
    css?: CSSOptions;
    optimizeDeps?: any;
    resolve?: ResolveOptions;
}
export declare const plugins: PluginOption[];
export declare function createSagePlugins(config?: SageViteConfig): Promise<PluginOption[]>;
export declare function getPluginsWithSageRouter(): Promise<PluginOption[]>;
export declare function createSagePluginsWithRouter(config?: SageViteConfig): Promise<PluginOption[]>;
export declare const resolve: any;
export declare const css: CSSOptions;
export declare const optimizeDeps: {
    include: string[];
};
export declare function createSageConfig(userConfig?: SageViteConfig): Promise<UserConfig>;
