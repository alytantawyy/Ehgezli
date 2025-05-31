import apiClient, { clearAuthState } from './api-client';
import { RestaurantUser } from '../types/restaurantUser';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get restaurant user profile
export const getRestaurantUserProfile = async (): Promise<RestaurantUser> => {
  try {
    // Check if we're logged in as a restaurant before making this call
    const userType = await AsyncStorage.getItem('userType');
    if (userType !== 'restaurant') {
      console.error('Error fetching restaurant profile: Not logged in as a restaurant');
      await clearAuthState(); // Clear auth state if not logged in as a restaurant
      throw new Error('Not logged in as a restaurant');
    }
    
    const { data } = await apiClient.get<RestaurantUser>('/restaurant-user');
    return data;
  } catch (error) {
    console.error('Error fetching restaurant profile:', error);
    // Clear auth state for authentication errors
    if (error instanceof Error && 
        (error.message.includes('Unauthorized') || 
         error.message.includes('not found'))) {
      await clearAuthState();
    }
    throw error;
  }
};

// Update restaurant user profile
export const updateRestaurantUserProfile = async (profileData: Partial<RestaurantUser>): Promise<RestaurantUser> => {
  try {
    const { data } = await apiClient.put<RestaurantUser>('/restaurant-user', profileData);
    return data;
  } catch (error) {
    console.error('Error updating restaurant profile:', error);
    // Clear auth state for authentication errors
    if (error instanceof Error && 
        (error.message.includes('Unauthorized') || 
         error.message.includes('not found'))) {
      await clearAuthState();
    }
    throw error;
  }
};

// Delete restaurant user account
export const deleteRestaurantUserAccount = async (): Promise<void> => {
  try {
    await apiClient.delete('/restaurant-user');
  } catch (error) {
    console.error('Error deleting restaurant account:', error);
    // Clear auth state for authentication errors
    if (error instanceof Error && 
        (error.message.includes('Unauthorized') || 
         error.message.includes('not found'))) {
      await clearAuthState();
    }
    throw error;
  }
};

// Change restaurant user password
export const changeRestaurantUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    await apiClient.post('/restaurant-user/change-password', {
      currentPassword,
      newPassword
    });
  } catch (error) {
    console.error('Error changing restaurant password:', error);
    // Clear auth state for authentication errors
    if (error instanceof Error && 
        (error.message.includes('Unauthorized') || 
         error.message.includes('not found'))) {
      await clearAuthState();
    }
    throw error;
  }
};