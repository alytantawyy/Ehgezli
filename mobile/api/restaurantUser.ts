import apiClient from './api-client';
import { RestaurantUser } from '../types/restaurantUser';

// Get restaurant user profile
export const getRestaurantUserProfile = async (): Promise<RestaurantUser> => {
  const { data } = await apiClient.get<RestaurantUser>('/restaurant-user');
  return data;
};

// Update restaurant user profile
export const updateRestaurantUserProfile = async (profileData: Partial<RestaurantUser>): Promise<RestaurantUser> => {
  const { data } = await apiClient.put<RestaurantUser>('/restaurant-user', profileData);
  return data;
};

// Delete restaurant user account
export const deleteRestaurantUserAccount = async (): Promise<void> => {
  await apiClient.delete('/restaurant-user');
};

// Change restaurant user password
export const changeRestaurantUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await apiClient.post('/restaurant-user/change-password', {
    currentPassword,
    newPassword
  });
};