import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { nextTick } from 'vue';
import { useAuth } from '../../stores/auth';

/**
 * Route guard for pages that require authentication
 * 
 * Usage in main.ts:
 * ```typescript
 * import { authGuard } from './router/guards/authGuard';
 * 
 * createApp(App, routes, {
 *   guards: {
 *     requiresAuth: authGuard
 *   }
 * });
 * ```
 */
export async function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const auth = useAuth();
  
  // Wait for auth initialization to complete
  await auth.authReady;
  
  // Ensure reactive state has propagated
  await nextTick();
  
  // Check if user is authenticated
  if (auth.isAuthenticated) {
    // User is authenticated, allow navigation
    next();
  } else {
    // User is not authenticated, redirect to home
    console.log('🚫 Access denied - redirecting to home');
    next({ name: 'Homepage' });
  }
}