export * from "./stores";
export * from "./composables";
export * from "./util";
export * from "./components";
export * from "./classes";
export * from "./router";

import { createApp as createVueApp } from "vue";
import Tres from "@tresjs/core";
import { createPinia } from "pinia";
import { createSageRouter } from "./router";
import { appInitializationPlugin } from "./plugins";

export type AppConfig = {
  target?: string;
  routes?: any;
};

export async function createApp(App: any, options?: AppConfig) {
  const { target = "#app", routes } = options || {};

  const pinia = createPinia();

  // Initialize core services via Pinia plugin
  pinia.use(appInitializationPlugin);

  // Use provided routes
  const routesModule = routes;

  const router = await createSageRouter(routesModule);

  const app = createVueApp(App);

  app.use(pinia);
  app.use(Tres);
  app.mount(target);

  // Initialize router (sets up event listeners, etc.)
  console.log("🔥 Sage Router initialized!");

  return { app, router, pinia };
}
