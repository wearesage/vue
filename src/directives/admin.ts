import { Directive, DirectiveBinding } from "vue";
import { useAdmin } from "../composables/auth/useAdmin";

/**
 * v-admin directive for conditional rendering based on admin status
 * 
 * Usage:
 * - `v-admin` - Show element only if user is admin
 * - `v-admin="true"` - Show element only if user is admin  
 * - `v-admin="false"` - Hide element if user is admin (show to non-admins)
 * - `v-admin="'wallet'"` - Check wallet address only (instant)
 * - `v-admin="'role'"` - Check role only (server-verified)
 * 
 * Examples:
 * ```vue
 * <AdminPanel v-admin />
 * <UserContent v-admin="false" />
 * <QuickAdminIcon v-admin="'wallet'" />
 * <ServerVerifiedAdminArea v-admin="'role'" />
 * ```
 */
export const vAdmin: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    updateVisibility(el, binding);
  },
  
  updated(el: HTMLElement, binding: DirectiveBinding) {
    updateVisibility(el, binding);
  }
};

function updateVisibility(el: HTMLElement, binding: DirectiveBinding) {
  const { isAdmin, isAdminWallet, isAdminRole } = useAdmin();
  
  let shouldShow = false;
  const value = binding.value;
  
  // Determine which check to perform
  if (value === undefined || value === true) {
    // Default: full admin check (wallet + role + authenticated)
    shouldShow = isAdmin.value;
  } else if (value === false) {
    // Inverted: show to non-admins only
    shouldShow = !isAdmin.value;
  } else if (value === 'wallet') {
    // Wallet-only check (instant, no auth required)
    shouldShow = isAdminWallet.value;
  } else if (value === 'role') {
    // Role-only check (server-verified, requires auth)
    shouldShow = isAdminRole.value;
  } else if (typeof value === 'boolean') {
    // Explicit boolean value
    shouldShow = value ? isAdmin.value : !isAdmin.value;
  } else {
    console.warn(`v-admin: Invalid value "${value}". Use true/false/'wallet'/'role' or no value.`);
    shouldShow = isAdmin.value; // Default fallback
  }
  
  // Apply visibility
  if (shouldShow) {
    el.style.removeProperty('display');
    el.removeAttribute('hidden');
  } else {
    el.style.display = 'none';
    el.setAttribute('hidden', '');
  }
}

/**
 * Install function for the directive
 */
export function installAdminDirective(app: any) {
  app.directive('admin', vAdmin);
}