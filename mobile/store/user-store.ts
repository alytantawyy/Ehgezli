import { create } from 'zustand';
import { User } from '../types/user';
import * as userApi from '../api/user';

interface UserState {
  isLoading: boolean;
  error: string | null;
  
  // User profile actions
  updateUserProfile: (userData: any) => Promise<User>;
  deleteUserAccount: () => Promise<void>;
  
  // Location related actions
  updateLocationPermission: (granted: boolean) => Promise<void>;
  getLocationPermissionStatus: () => Promise<boolean>;
  
  // Error handling
  clearError: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  isLoading: false,
  error: null,
  
  // Update user profile
  updateUserProfile: async (userData: any) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await userApi.updateUserProfile(userData);
      set({ isLoading: false });
      return updatedUser;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to update profile', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Delete user account
  deleteUserAccount: async () => {
    set({ isLoading: true, error: null });
    try {
      await userApi.deleteUserAccount();
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to delete account', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Update location permission
  updateLocationPermission: async (granted: boolean) => {
    set({ isLoading: true, error: null });
    try {
      await userApi.updateLocationPermission(granted);
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to update location permission', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Get location permission status
  getLocationPermissionStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const status = await userApi.getLocationPermissionStatus();
      set({ isLoading: false });
      return status;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to get location permission status', 
        isLoading: false 
      });
      return false;
    }
  },
  
  // Clear error
  clearError: () => set({ error: null }),
}));
