import { Directive, DirectiveBinding } from "vue";
import { useRoles } from "../composables/auth/useRoles";
import { UserRole } from "@wearesage/shared";

/**
 * v-role directive for conditional rendering based on user roles
 * 
 * Usage:
 * - `v-role="'admin'"` - Show element only if user is admin
 * - `v-role="'artist'"` - Show element only if user is artist
 * - `v-role="'subscriber'"` - Show element only if user is subscriber
 * - `v-role="'user'"` - Show element only if user is basic user
 * - `v-role="['artist', 'admin']"` - Show element if user has any of these roles
 * - `v-role="{ not: 'user' }"` - Show element if user is NOT basic user
 * - `v-role="{ any: ['artist', 'admin'] }"` - Show element if user has any of these roles
 * - `v-role="{ all: ['artist', 'admin'] }"` - Show element if user has all of these roles (unlikely but supported)
 * - `v-role="'paid'"` - Show element if user has paid tier (subscriber, artist, or admin)
 * - `v-role="'creator'"` - Show element if user is creator (artist or admin)
 * 
 * Examples:
 * ```vue
 * <ArtistPanel v-role="'artist'" />
 * <PremiumFeature v-role="'paid'" />
 * <AdminOrArtistContent v-role="['artist', 'admin']" />
 * <NonBasicUserContent v-role="{ not: 'user' }" />
 * <CreatorTools v-role="'creator'" />
 * ```
 */
export const vRole: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    updateVisibility(el, binding);
  },
  
  updated(el: HTMLElement, binding: DirectiveBinding) {
    updateVisibility(el, binding);
  }
};

function updateVisibility(el: HTMLElement, binding: DirectiveBinding) {
  const roles = useRoles();
  
  let shouldShow = false;
  const value = binding.value;
  
  if (!value) {
    console.warn("v-role: No value provided");
    shouldShow = false;
  } else if (typeof value === 'string') {
    shouldShow = checkStringRole(value, roles);
  } else if (Array.isArray(value)) {
    // Array of roles - user must have ANY of these roles
    shouldShow = value.some(role => checkStringRole(role, roles));
  } else if (typeof value === 'object') {
    shouldShow = checkObjectRole(value, roles);
  } else {
    console.warn(`v-role: Invalid value type "${typeof value}". Use string, array, or object.`);
    shouldShow = false;
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

function checkStringRole(role: string, roles: any): boolean {
  switch (role.toLowerCase()) {
    case 'user':
      return roles.isUser.value;
    case 'admin':
      return roles.isAdmin.value;
    case 'artist':
      return roles.isArtist.value;
    case 'subscriber':
      return roles.isSubscriber.value;
    case 'paid':
    case 'premium':
      return roles.isPaidTier.value;
    case 'creator':
      return roles.isCreator.value;
    case 'privileged':
      return roles.isPrivileged.value;
    default:
      console.warn(`v-role: Unknown role "${role}"`);
      return false;
  }
}

function checkObjectRole(obj: any, roles: any): boolean {
  if (obj.not) {
    // NOT logic - user must NOT have this role
    if (typeof obj.not === 'string') {
      return !checkStringRole(obj.not, roles);
    } else if (Array.isArray(obj.not)) {
      return !obj.not.some((role: string) => checkStringRole(role, roles));
    }
  }
  
  if (obj.any) {
    // ANY logic - user must have at least one of these roles
    if (Array.isArray(obj.any)) {
      return obj.any.some((role: string) => checkStringRole(role, roles));
    }
  }
  
  if (obj.all) {
    // ALL logic - user must have all of these roles
    if (Array.isArray(obj.all)) {
      return obj.all.every((role: string) => checkStringRole(role, roles));
    }
  }
  
  if (obj.role) {
    // Direct role check
    return checkStringRole(obj.role, roles);
  }
  
  console.warn("v-role: Invalid object structure. Use { not: 'role' }, { any: ['role1', 'role2'] }, { all: ['role1', 'role2'] }, or { role: 'role' }");
  return false;
}

/**
 * Install function for the directive
 */
export function installRoleDirective(app: any) {
  app.directive('role', vRole);
}