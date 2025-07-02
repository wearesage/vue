import { computed } from "vue";
import { useAuth } from "../../stores/auth";
import { UserRole } from "@wearesage/shared";
import { VITE_ADMIN_WALLET } from "../../constants/env";

/**
 * Admin detection composable with dual verification strategy
 * Provides reactive admin status checking with both wallet and role verification
 */
export function useAdmin() {
  const auth = useAuth();

  /**
   * Check if current user's wallet address matches the admin wallet
   * This is instant client-side detection
   */
  const isAdminWallet = computed(() => {
    return auth.walletAddress === VITE_ADMIN_WALLET;
  });

  /**
   * Check if current user has admin role from server
   * This is server-authoritative role detection
   */
  const isAdminRole = computed(() => {
    return auth.user?.role === UserRole.ADMIN;
  });

  /**
   * Comprehensive admin check - requires BOTH wallet and role verification
   * This is the bulletproof admin detection that matches backend security
   */
  const isAdmin = computed(() => {
    return auth.isAuthenticated && isAdminWallet.value && isAdminRole.value;
  });

  /**
   * Quick wallet-only check for instant UI feedback
   * Use this for immediate visual changes before auth completes
   */
  const isLikelyAdmin = computed(() => {
    return isAdminWallet.value;
  });

  /**
   * Check if current user is authenticated as admin
   * Requires full authentication + admin verification
   */
  const isAuthenticatedAdmin = computed(() => {
    return auth.isAuthenticated && isAdmin.value;
  });

  /**
   * Admin wallet address for comparison/display
   */
  const adminWallet = computed(() => VITE_ADMIN_WALLET);

  /**
   * Check if a specific wallet address is the admin wallet
   */
  const isWalletAdmin = (walletAddress: string): boolean => {
    return walletAddress === VITE_ADMIN_WALLET;
  };

  /**
   * Get admin status with detailed breakdown for debugging
   */
  const getAdminStatus = computed(() => {
    return {
      isAdmin: isAdmin.value,
      isAuthenticated: auth.isAuthenticated,
      isAdminWallet: isAdminWallet.value,
      isAdminRole: isAdminRole.value,
      currentWallet: auth.walletAddress,
      adminWallet: VITE_ADMIN_WALLET,
      userRole: auth.user?.role,
      expectedRole: UserRole.ADMIN,
    };
  });

  return {
    // Primary admin checks
    isAdmin,
    isAuthenticatedAdmin,
    
    // Component checks
    isAdminWallet,
    isAdminRole,
    isLikelyAdmin,
    
    // Utility
    adminWallet,
    isWalletAdmin,
    getAdminStatus,
  };
}