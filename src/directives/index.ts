// Export all custom directives
export * from "./admin";
import { installAdminDirective } from "./admin";

// Install function for all directives
export function installDirectives(app: any) {
  installAdminDirective(app);
}

// Vue plugin format for automatic installation
export const DirectivesPlugin = {
  install(app: any) {
    installDirectives(app);
  }
};