/**
 * Socket V2 Composables
 * 
 * Clean, simplified socket patterns that replace 1,503 lines of competing complexity.
 * 
 * Architecture:
 * - Pattern 1: User Activity Broadcasting (useUserActivity)
 * - Pattern 2: Homepage Globe with ultra-compressed coordinates (useHomepageGlobe)  
 * - Pattern 3: Targeted messaging with wallet/source rooms (useTargetedMessaging)
 */

export { useUserActivity } from './useUserActivity';
export { useHomepageGlobe } from './useHomepageGlobe';
export { useTargetedMessaging } from './useTargetedMessaging';

// Re-export types for convenience
export type {
  ActivityType,
  AudioSource,
  CurrentPage,
  UserStateField,
  UserStatus
} from '@wearesage/shared';