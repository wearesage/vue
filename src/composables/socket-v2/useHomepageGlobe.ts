import { computed } from "vue";
import { useGlobalActiveUsers } from "../spaces/useGlobalActiveUsers";

/**
 * V2 Homepage Globe Composable
 * 
 * Clean wrapper around existing useGlobalActiveUsers for V2 compatibility.
 * useGlobalActiveUsers already implements perfect V2 Homepage Globe pattern!
 * 
 * This is the ONLY place in the app that needs ALL users' locations globally
 * for globe visualization on the homepage.
 * 
 * Features:
 * - ✅ Uses homepage:join/leave events 
 * - ✅ Ultra-compressed 8-bit coordinate packing (87% memory savings)
 * - ✅ Proper subscription management & cleanup
 * - ✅ Handles reconnection seamlessly
 * - ✅ Only listens when on homepage (performance optimization)
 * 
 * Note: When V2 service is enabled, just needs event name changed from 
 * 'active-space:global-update' to 'globe:update' in useGlobalActiveUsers
 */
export function useHomepageGlobe() {
  const globalUsers = useGlobalActiveUsers();

  return {
    // State (read-only)
    totalUsers: globalUsers.totalUsers,
    locations: globalUsers.locations,
    activities: globalUsers.activities,
    joined: globalUsers.joined,
    
    // Computed helpers
    isActive: computed(() => globalUsers.joined.value),
    hasLocations: computed(() => globalUsers.locations.value.length > 0),
    locationCount: computed(() => globalUsers.locations.value.length),
    
    // Activity breakdown
    activitySummary: computed(() => {
      const activities = globalUsers.activities.value;
      const total = Object.values(activities).reduce((sum, count) => sum + count, 0);
      
      return {
        total,
        breakdown: activities,
        topActivity: Object.entries(activities).sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown'
      };
    }),
    
    // Geographic helpers
    locationBounds: computed(() => {
      const locs = globalUsers.locations.value;
      if (locs.length === 0) return null;
      
      const lats = locs.map(l => l.lat);
      const lngs = locs.map(l => l.lng);
      
      return {
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
        minLng: Math.min(...lngs),
        maxLng: Math.max(...lngs),
        centerLat: (Math.min(...lats) + Math.max(...lats)) / 2,
        centerLng: (Math.min(...lngs) + Math.max(...lngs)) / 2
      };
    })
  };
}