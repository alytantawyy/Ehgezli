import { useCallback } from 'react';
import { useUserStore } from '../store/user-store';
import { useAuth } from './useAuth';

/**
 * Custom hook for user-related actions
 * Provides a convenient interface to the user store
 */
export function useUser() {
  // Get user state and actions from the store
  const {
    isLoading,
    error,
    updateUserProfile: storeUpdateUserProfile,
    deleteUserAccount,
    updateLocationPermission,
    getLocationPermissionStatus,
    clearError,
  } = useUserStore();

  // Get auth-related functions
  const { user, fetchProfile } = useAuth();

  /**
   * Update user profile and refresh user data
   */
  const updateUserProfile = useCallback(async (userData: any) => {
    try {
      await storeUpdateUserProfile(userData);
      // Refresh user data after update
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, [storeUpdateUserProfile, fetchProfile]);

  return {
    // State
    user,
    isLoading,
    error,
    
    // Actions
    updateUserProfile,
    deleteUserAccount,
    updateLocationPermission,
    getLocationPermissionStatus,
    clearError,
  };
}
