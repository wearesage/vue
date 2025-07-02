// 🔥 Sage Router - Client-side exports only!
// This file contains ONLY browser-safe exports

export { 
  createSageRouter, 
  useRoute, 
  useRouter, 
  debugRouter,
  type SageRouter,
  type SageRouteLocation 
} from './sage-router'
export { default as SageRouterView } from './SageRouterView.vue'
export { routes, matchRoute, extractParams, type SageRoute } from './generated-routes'