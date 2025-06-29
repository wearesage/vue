export * from "./stores";
export * from "./composables";
export * from "./util";
export * from "./components";
export * from "./classes";

import { createApp as createVueApp } from "vue";
import Tres from "@tresjs/core";
import { createPinia } from "pinia";
import { createRouter, createWebHistory, type NavigationGuardNext, type RouteLocationNormalized } from "vue-router";

export type AuthGuard = (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => void;
export interface AuthGuardConfig {
  requiresAuth?: AuthGuard;
  requiresAdmin?: AuthGuard;
  [key: string]: any;
}

export type AppConfig = {
  target?: string;
  guards?: AuthGuardConfig;
};

export function createApp(App: any, routes: any, options?: AppConfig) {
  const { target = "#app", guards } = options || {};

  const pinia = createPinia();
  const router = createRouter({ history: createWebHistory(), routes });

  if (guards) {
    router.beforeEach((to, from, next) => {
      if (to.meta?.requiresAuth && guards.requiresAuth) return guards.requiresAuth(to, from, next);
      if (to.meta?.requiresAdmin && guards.requiresAdmin) return guards.requiresAdmin(to, from, next);

      for (const [metaKey, guardFn] of Object.entries(guards)) {
        if (to.meta?.[metaKey] && typeof guardFn === "function") return guardFn(to, from, next);
      }

      next();
    });
  }

  const app = createVueApp(App);

  app.use(pinia);
  app.use(router);
  app.use(Tres);
  app.mount(target);

  return { app, router, pinia };
}
