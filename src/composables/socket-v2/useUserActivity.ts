import { computed } from "vue";
import { useUserState } from "../../stores/user-state";

/**
 * V2 User Activity Composable
 * 
 * Clean wrapper around existing user-state store for V2 compatibility.
 * user-state.ts already implements perfect V2 Activity Broadcasting pattern!
 */
export function useUserActivity() {
  const userState = useUserState();

  return {
    // State (read-only)
    currentPage: userState.currentPage,
    activityType: userState.activityType,
    audioSource: userState.audioSource,
    audioTrack: userState.audioTrack,
    audioPosition: userState.audioPosition,
    geoLocation: userState.geoLocation,
    deviceType: userState.deviceType,
    clientPlatform: userState.clientPlatform,
    currentShaderId: userState.currentShaderId,
    currentProjectId: userState.currentProjectId,
    
    // Computed helpers
    isOnHomepage: userState.isOnHomepage,
    
    // Actions - these already broadcast to V2 Activity Broadcasting pattern
    updateAudioState: userState.updateAudioState,
    updateActivity: userState.updateActivity,
    updateLocation: userState.updateLocation,
    updateShaderId: userState.updateShaderId,
    updateProjectId: userState.updateProjectId,
    updateClientPlatform: userState.updateClientPlatform,
    
    // Direct broadcast control
    broadcastUserState: userState.broadcastUserState,
    setUserOnline: userState.setUserOnline,
    setUserOffline: userState.setUserOffline,
  };
}