import apiClient from './api-client';
import { User, UserLocation } from '../types/user';

interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
}

// Get the current user's profile
export const getUserProfile = async (): Promise<User> => {
  const { data } = await apiClient.get<User>('/user');
  return data;
};

// Update the current user's profile
export const updateUserProfile = async (userData: UpdateUserData): Promise<User> => {
  const { data } = await apiClient.put<User>('/user', userData);
  return data;
};

// Delete user account
export const deleteUserAccount = async (): Promise<void> => {
  await apiClient.delete('/user');
};

// Update location permission status in database (without sending coordinates)
export const updateLocationPermission = async (granted: boolean): Promise<void> => {
  try {
    await apiClient.put('/user/location-permission', { locationPermissionGranted: granted });
  } catch (error) {
    console.error('Error updating location permission:', error);
  }
};

// Get user location permission status from database
export const getLocationPermissionStatus = async (): Promise<boolean> => {
  try {
    const { data } = await apiClient.get('/user/location-permission');
    return data.locationPermissionGranted || false;
  } catch (error) {
    console.error('Error getting location permission status:', error);
    return false;
  }
};
