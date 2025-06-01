import { create } from 'zustand';
import { updateRestaurantUserProfile } from '../api/restaurantUser';
import { RestaurantUser, UpdateRestaurantUserData } from '../types/restaurantUser';

interface RestaurantUserState {
  isLoading: boolean;
  error: string | null;
  updateProfile: (profileData: UpdateRestaurantUserData) => Promise<RestaurantUser>;
  clearError: () => void;
}

export const useRestaurantUserStore = create<RestaurantUserState>((set) => ({
  isLoading: false,
  error: null,
  
  updateProfile: async (profileData: UpdateRestaurantUserData) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Updating restaurant profile with data:', profileData);
      const updatedProfile = await updateRestaurantUserProfile(profileData);
      set({ isLoading: false });
      console.log('Restaurant profile updated successfully:', updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating restaurant profile:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update restaurant profile', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  clearError: () => set({ error: null }),
}));
