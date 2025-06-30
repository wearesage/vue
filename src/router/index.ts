// 🔥 Sage Router - The router that doesn't suck!

export { sageRouter } from './vite-plugin-sage-router'
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