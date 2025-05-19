import apiClient from './api-client';
import { Restaurant } from '../types/auth';

interface UpdateRestaurantUserData {
  email?: string;
  name?: string;
  about?: string;
  description?: string;
  cuisine?: string;
  priceRange?: string;
}

// Get restaurant user profile
export const getRestaurantUserProfile = async (): Promise<Restaurant> => {
  const { data } = await apiClient.get<Restaurant>('/restaurant-user');
  return data;
};

// Update restaurant user profile
export const updateRestaurantUserProfile = async (profileData: UpdateRestaurantUserData): Promise<Restaurant> => {
  const { data } = await apiClient.put<Restaurant>('/restaurant-user', profileData);
  return data;
};

// Delete restaurant user account
export const deleteRestaurantUserAccount = async (): Promise<void> => {
  await apiClient.delete('/restaurant-user');
};
