import apiClient from './api-client';
import { Restaurant, RestaurantFilter } from '../types/restaurant';

// Get all restaurants with optional filtering
export const getRestaurants = async (filters?: RestaurantFilter) => {
  const { data } = await apiClient.get<Restaurant[]>('/restaurants', { params: filters });
  return data;
};

// Search restaurants
export const searchRestaurants = async (searchParams: any) => {
  const { data } = await apiClient.post<Restaurant[]>('/restaurant/search', searchParams);
  return data;
};

// Get detailed restaurant by ID
export const getDetailedRestaurant = async (restaurantId: number) => {
  const { data } = await apiClient.get<Restaurant>(`/restaurant/detailed/${restaurantId}`);
  return data;
};

// Update restaurant profile (restaurant owners only)
export const updateRestaurantProfile = async (profileData: Partial<Restaurant>) => {
  const { data } = await apiClient.put<Restaurant>('/restaurant', profileData);
  return data;
};

// Get restaurant profile (restaurant owners only)
export const getRestaurantProfile = async () => {
  const { data } = await apiClient.get<Restaurant>('/restaurant');
  return data;
};
