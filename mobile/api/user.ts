import apiClient, { clearAuthState } from './api-client';
import { User, UserLocation, UpdateUserData } from '../types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get the current user's profile
export const getUserProfile = async (): Promise<User> => {
  try {
    // Check if we're logged in as a user before making this call
    const userType = await AsyncStorage.getItem('userType');
    if (userType !== 'user') {
      console.error('Error fetching user profile: Not logged in as a user');
      await clearAuthState(); // Clear auth state if not logged in as a user
      throw new Error('Not logged in as a user');
    }
    
    const { data } = await apiClient.get<User>('/user');
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Clear auth state for authentication errors
    if (error instanceof Error && 
        (error.message.includes('Unauthorized') || 
         error.message.includes('not found') ||
         error.message.includes('Not logged in'))) {
      await clearAuthState();
    }
    throw error;
  }
};

// Update the current user's profile
export const updateUserProfile = async (userData: UpdateUserData): Promise<User> => {
  try {
    const { data } = await apiClient.put<User>('/user', userData);
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    // Clear auth state for authentication errors
    if (error instanceof Error && 
        (error.message.includes('Unauthorized') || 
         error.message.includes('not found'))) {
      await clearAuthState();
    }
    throw error;
  }
};

// Delete user account
export const deleteUserAccount = async (): Promise<void> => {
  try {
    await apiClient.delete('/user');
  } catch (error) {
    console.error('Error deleting user account:', error);
    // Clear auth state for authentication errors
    if (error instanceof Error && 
        (error.message.includes('Unauthorized') || 
         error.message.includes('not found'))) {
      await clearAuthState();
    }
    throw error;
  }
};

// Update location permission status in database (without sending coordinates)
export const updateLocationPermission = async (granted: boolean): Promise<void> => {
  try {
    // Check if we're logged in as a user before making this call
    const userType = await AsyncStorage.getItem('userType');
    if (userType !== 'user') {
      console.error('Error updating location permission: Not logged in as a user');
      await clearAuthState(); // Clear auth state if not logged in as a user
      return; // Just return instead of throwing to avoid app crashes
    }
    
    await apiClient.put('/user/location-permission', { locationPermissionGranted: granted });
  } catch (error) {
    console.error('Error updating location permission:', error);
    // Clear auth state for authentication errors
    if (error instanceof Error && 
        (error.message.includes('Unauthorized') || 
         error.message.includes('not found'))) {
      await clearAuthState();
    }
  }
};

// Get user location permission status from database
export const getLocationPermissionStatus = async (): Promise<boolean> => {
  try {
    // Check if we're logged in as a user before making this call
    const userType = await AsyncStorage.getItem('userType');
    if (userType !== 'user') {
      console.error('Error getting location permission status: Not logged in as a user');
      await clearAuthState(); // Clear auth state if not logged in as a user
      return false; // Return a default value instead of throwing
    }
    
    const { data } = await apiClient.get('/user/location-permission');
    return data.locationPermissionGranted || false;
  } catch (error) {
    console.error('Error getting location permission status:', error);
    // Clear auth state for authentication errors
    if (error instanceof Error && 
        (error.message.includes('Unauthorized') || 
         error.message.includes('not found'))) {
      await clearAuthState();
    }
    return false;
  }
};
