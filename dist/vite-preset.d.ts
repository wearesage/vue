import { type UserConfig } from "vite";
import { type SageViteConfig } from "./vite";
/**
 * One-liner Vite config for @wearesage/vue projects
 * Just like the static server - import and go!
 */
export declare function defineSageConfig(userConfig?: SageViteConfig): Promise<UserConfig>;
/**
 * Synchronous version with sensible defaults
 */
export declare function defineSageConfigSync(userConfig?: SageViteConfig): UserConfig;
