import { ref, computed, watch, type Ref } from "vue";

// Dynamic import will be set by createSageRouter
let routes: any[] = [];
let matchRoute: any = () => null;
let extractParams: any = () => ({});
let SageRoute: any;

// Global router state
const currentPath = ref(window.location.pathname);
const currentQuery = ref(new URLSearchParams(window.location.search));
const currentHash = ref(window.location.hash);

// Listen to browser navigation
window.addEventListener("popstate", () => {
  currentPath.value = window.location.pathname;
  currentQuery.value = new URLSearchParams(window.location.search);
  currentHash.value = window.location.hash;
});

export interface SageRouteLocation {
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  hash: string;
  meta: Record<string, any>;
  name?: string;
  matched: SageRoute | null;
}

export interface SageRouter {
  currentRoute: Ref<SageRouteLocation>;
  push: (path: string, query?: Record<string, string>) => void;
  replace: (path: string, query?: Record<string, string>) => void;
  back: () => void;
  forward: () => void;
  go: (delta: number) => void;
  cleanQuery: (keysToRemove: string | string[]) => void;
}

// Current route computed
const currentRoute = computed((): SageRouteLocation => {
  const path = currentPath.value;
  const matched = matchRoute(path);
  const params = matched ? extractParams(matched.path, path) : {};
  const query = Object.fromEntries(currentQuery.value.entries());
  const hash = currentHash.value;

  return {
    path,
    params,
    query,
    hash,
    meta: matched?.meta || {},
    name: matched?.name,
    matched,
  };
});

// Navigation functions
function navigate(path: string, query?: Record<string, string>, replace = false) {
  const url = new URL(path, window.location.origin);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const method = replace ? "replaceState" : "pushState";
  history[method]({}, "", url.toString());

  // Update reactive state
  currentPath.value = url.pathname;
  currentQuery.value = url.searchParams;
  currentHash.value = url.hash;
}

function push(path: string, query?: Record<string, string>) {
  navigate(path, query, false);
}

function replace(path: string, query?: Record<string, string>) {
  navigate(path, query, true);
}

function back() {
  history.back();
}

function forward() {
  history.forward();
}

function go(delta: number) {
  history.go(delta);
}

function cleanQuery(keysToRemove: string | string[]) {
  const keys = Array.isArray(keysToRemove) ? keysToRemove : [keysToRemove];
  const newQuery = new URLSearchParams(currentQuery.value);
  
  keys.forEach(key => newQuery.delete(key));
  
  const url = new URL(currentPath.value, window.location.origin);
  url.search = newQuery.toString();
  
  history.replaceState({}, "", url.toString());
  
  // Update reactive state
  currentQuery.value = newQuery;
}

// Create router instance
export async function createSageRouter(routesModule?: any): Promise<SageRouter> {
  // If routes are provided, use them; otherwise try dynamic import
  if (routesModule) {
    routes = routesModule.routes;
    matchRoute = routesModule.matchRoute;
    extractParams = routesModule.extractParams;
    console.log("🔥 Sage Router: Loaded", routes.length, "routes from parameter");
  } else {
    // Fallback: try to dynamically import generated routes
    try {
      const generatedRoutes = await import("./generated-routes.js").catch(() =>
        import("../router/generated-routes.js").catch(() => import("/src/router/generated-routes.js"))
      );
      routes = generatedRoutes.routes;
      matchRoute = generatedRoutes.matchRoute;
      extractParams = generatedRoutes.extractParams;
      console.log("🔥 Sage Router: Loaded", routes.length, "routes via dynamic import");
    } catch (error) {
      console.warn("⚠️ Sage Router: Could not load generated routes:", error);
      routes = [];
    }
  }

  // Update global router object after routes are loaded
  if (typeof window !== "undefined") {
    (window as any).__SAGE_ROUTER__.routes = routes;
  }

  return {
    currentRoute,
    push,
    replace,
    back,
    forward,
    go,
    cleanQuery,
  };
}

// Composables for component usage
export function useRoute(): Ref<SageRouteLocation> {
  return currentRoute;
}

export function useRouter(): Omit<SageRouter, "currentRoute"> {
  return {
    push,
    replace,
    back,
    forward,
    go,
    cleanQuery,
  };
}

// Debug helpers
export function debugRouter() {
  console.log("🔍 Sage Router Debug:");
  console.log("Current Route:", currentRoute.value);
  console.log("Available Routes:", routes);
  console.log("Path:", currentPath.value);
  console.log("Query:", Object.fromEntries(currentQuery.value));
  console.log("Hash:", currentHash.value);
}

// Export for global access
if (typeof window !== "undefined") {
  (window as any).__SAGE_ROUTER__ = {
    currentRoute,
    push,
    replace,
    back,
    forward,
    go,
    cleanQuery,
    debug: debugRouter,
    routes,
  };
}
