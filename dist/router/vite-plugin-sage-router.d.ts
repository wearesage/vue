import type { Plugin } from 'vite';
export interface SageRouterOptions {
    pagesDir?: string;
    outputFile?: string;
    extensions?: string[];
}
export declare function sageRouter(options?: SageRouterOptions): Plugin;
