import { computed } from "vue";
import { useAuth } from "../../stores/auth";
import { UserRole } from "@wearesage/shared";
import { VITE_ADMIN_WALLET } from "../../constants/env";

/**
 * Comprehensive role detection composable
 * Provides reactive role status checking for all user roles
 */
export function useRoles() {
  const auth = useAuth();

  /**
   * Individual role checks
   */
  const isUser = computed(() => {
    return auth.isAuthenticated && auth.user?.role === UserRole.USER;
  });

  const isAdmin = computed(() => {
    return auth.isAuthenticated && 
           auth.walletAddress === VITE_ADMIN_WALLET && 
           auth.user?.role === UserRole.ADMIN;
  });

  const isArtist = computed(() => {
    return auth.isAuthenticated && auth.user?.role === UserRole.ARTIST;
  });

  const isSubscriber = computed(() => {
    return auth.isAuthenticated && auth.user?.role === UserRole.SUBSCRIBER;
  });

  /**
   * Compound role checks
   */
  const isPaidTier = computed(() => {
    return auth.isAuthenticated && [UserRole.SUBSCRIBER, UserRole.ARTIST, UserRole.ADMIN].includes(auth.user?.role);
  });

  const isArtistOrAdmin = computed(() => {
    return auth.isAuthenticated && [UserRole.ARTIST, UserRole.ADMIN].includes(auth.user?.role);
  });

  const isCreator = computed(() => {
    return auth.isAuthenticated && [UserRole.ARTIST, UserRole.ADMIN].includes(auth.user?.role);
  });

  const isPrivileged = computed(() => {
    return auth.isAuthenticated && [UserRole.SUBSCRIBER, UserRole.ARTIST, UserRole.ADMIN].includes(auth.user?.role);
  });

  /**
   * Role information
   */
  const currentRole = computed(() => {
    if (!auth.isAuthenticated || !auth.user?.role) return null;
    return auth.user.role;
  });

  const currentRoleName = computed(() => {
    if (!auth.isAuthenticated || !auth.user?.role) return null;
    const roleNames = {
      [UserRole.USER]: "USER",
      [UserRole.ADMIN]: "ADMIN", 
      [UserRole.ARTIST]: "ARTIST",
      [UserRole.SUBSCRIBER]: "SUBSCRIBER"
    };
    return roleNames[auth.user.role] || "UNKNOWN";
  });

  /**
   * Permission checks
   */
  const canCreateShaders = computed(() => {
    return isArtistOrAdmin.value;
  });

  const canAccessPremiumFeatures = computed(() => {
    return isPaidTier.value;
  });

  const canModerateContent = computed(() => {
    return isAdmin.value;
  });

  const canManageUsers = computed(() => {
    return isAdmin.value;
  });

  const canPublishToGallery = computed(() => {
    return isArtistOrAdmin.value;
  });

  const canParticipateInBattles = computed(() => {
    return isArtistOrAdmin.value;
  });

  const canAccessAdvancedAudio = computed(() => {
    return isPaidTier.value;
  });

  /**
   * Utility functions
   */
  const hasRole = (role: UserRole): boolean => {
    return auth.isAuthenticated && auth.user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return auth.isAuthenticated && roles.includes(auth.user?.role);
  };

  const getRoleStatus = computed(() => {
    return {
      isAuthenticated: auth.isAuthenticated,
      currentRole: currentRole.value,
      currentRoleName: currentRoleName.value,
      roleChecks: {
        isUser: isUser.value,
        isAdmin: isAdmin.value,
        isArtist: isArtist.value,
        isSubscriber: isSubscriber.value,
      },
      compoundChecks: {
        isPaidTier: isPaidTier.value,
        isArtistOrAdmin: isArtistOrAdmin.value,
        isCreator: isCreator.value,
        isPrivileged: isPrivileged.value,
      },
      permissions: {
        canCreateShaders: canCreateShaders.value,
        canAccessPremiumFeatures: canAccessPremiumFeatures.value,
        canModerateContent: canModerateContent.value,
        canManageUsers: canManageUsers.value,
        canPublishToGallery: canPublishToGallery.value,
        canParticipateInBattles: canParticipateInBattles.value,
        canAccessAdvancedAudio: canAccessAdvancedAudio.value,
      },
    };
  });

  return {
    // Individual role checks
    isUser,
    isAdmin,
    isArtist,
    isSubscriber,
    
    // Compound role checks
    isPaidTier,
    isArtistOrAdmin,
    isCreator,
    isPrivileged,
    
    // Role information
    currentRole,
    currentRoleName,
    
    // Permission checks
    canCreateShaders,
    canAccessPremiumFeatures,
    canModerateContent,
    canManageUsers,
    canPublishToGallery,
    canParticipateInBattles,
    canAccessAdvancedAudio,
    
    // Utility functions
    hasRole,
    hasAnyRole,
    getRoleStatus,
  };
}