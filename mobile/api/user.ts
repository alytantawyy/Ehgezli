import apiClient from './api-client';
import { User, UserLocation } from '../types/auth';

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

// Get user location
export const getUserLocation = async (): Promise<UserLocation | null> => {
  try {
    const { data } = await apiClient.get<UserLocation>('/user/location');
    return data;
  } catch (error) {
    return null;
  }
};

// Update user location
export const updateUserLocation = async (location: Omit<UserLocation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<UserLocation> => {
  const { data } = await apiClient.put<UserLocation>('/user/location', location);
  return data;
};
