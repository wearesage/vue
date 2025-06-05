import { createApp as createVueApp } from "vue";
import Tres from "@tresjs/core";
import { createPinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";

export function createApp(App: any, routes, target = "#app") {
  const pinia = createPinia();
  const router = createRouter({ history: createWebHistory(), routes });
  const app = createVueApp(App);

  app.use(pinia);
  app.use(router);
  app.use(Tres);
  app.mount(target);

  return app;
}
