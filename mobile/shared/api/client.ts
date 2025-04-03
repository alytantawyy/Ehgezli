import axios from 'axios';
import { RestaurantWithAvailability, User, Booking } from '../types';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Determine the appropriate API URL based on the environment
const getApiUrl = () => {
  // For iOS simulator
  if (Platform.OS === 'ios') {
    return 'http://localhost:4000/api';
  }
  // For Android emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api';
  }
  // For web or Expo Go on physical device
  return 'http://localhost:4000/api';
};

// Base URL for API requests
const API_URL = getApiUrl();

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for maintaining session cookies
});

// Authentication APIs
export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const response = await apiClient.post('/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const registerUser = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<User> => {
  try {
    const response = await apiClient.post('/register', userData);
    return response.data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await apiClient.post('/logout');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get('/user/profile');
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

export const updateUserProfile = async (profileData: Partial<User>): Promise<User> => {
  try {
    const response = await apiClient.put('/user', profileData);
    return response.data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

// Restaurant APIs
export const getRestaurants = async (params: {
  search?: string;
  city?: string;
  cuisine?: string;
  priceRange?: string;
  date?: string;
  time?: string;
  partySize?: number;
}): Promise<RestaurantWithAvailability[]> => {
  try {
    console.log('[API] Getting restaurants with params:', params);
    const response = await apiClient.get('/restaurants/availability', { params });
    console.log('[API] Received restaurants:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get restaurants error:', error);
    throw error;
  }
};

export const getRestaurantById = async (id: number): Promise<RestaurantWithAvailability> => {
  try {
    const response = await apiClient.get(`/restaurants/${id}`);
    return response.data;
  } catch (error) {
    console.error('Get restaurant by id error:', error);
    throw error;
  }
};

// Saved Restaurants APIs
export const getSavedStatus = async (restaurantId: number, branchIndex: number): Promise<{ saved: boolean }> => {
  try {
    const response = await apiClient.get(`/saved-restaurants/${restaurantId}/${branchIndex}`);
    return response.data;
  } catch (error) {
    console.error('Get saved status error:', error);
    throw error;
  }
};

export const toggleSavedStatus = async (restaurantId: number, branchId: number): Promise<{ saved: boolean }> => {
  try {
    const response = await apiClient.post(`/saved-restaurants/${restaurantId}/${branchId}`);
    return response.data;
  } catch (error) {
    console.error('Toggle saved status error:', error);
    throw error;
  }
};

export const getSavedRestaurants = async (): Promise<RestaurantWithAvailability[]> => {
  try {
    console.log('[API] Getting saved restaurants');
    const response = await apiClient.get('/saved-restaurants');
    console.log('[API] Received saved restaurants:', response.data);
    
    // Transform the data to match the expected format
    // The API returns an array of saved restaurant records, but we need an array of restaurants
    if (Array.isArray(response.data)) {
      // Extract unique restaurants from the saved records
      const restaurantsMap = new Map();
      
      // Keep track of which branches are saved
      const savedBranches = new Map();
      
      response.data.forEach((savedItem) => {
        if (savedItem.restaurant && savedItem.restaurant.id) {
          const restaurant = savedItem.restaurant;
          const branchIndex = savedItem.branchIndex || 0;
          
          // Track this branch as saved
          const key = `${restaurant.id}-${branchIndex}`;
          savedBranches.set(key, true);
          
          // If we haven't seen this restaurant yet, add it to our map
          if (!restaurantsMap.has(restaurant.id)) {
            // Make sure branches is an array
            const branches = Array.isArray(restaurant.branches) ? [...restaurant.branches] : [];
            
            // Make sure each branch has the required properties
            branches.forEach((branch, index) => {
              if (!branch.slots) {
                branch.slots = [];
              }
              
              // Mark this branch as saved if it matches the saved branch index
              if (index === branchIndex) {
                (branch as any).isSaved = true;
              }
            });
            
            restaurantsMap.set(restaurant.id, {
              ...restaurant,
              branches
            });
          } else {
            // If we've already seen this restaurant, update the saved status of the branch
            const existingRestaurant = restaurantsMap.get(restaurant.id);
            if (existingRestaurant.branches[branchIndex]) {
              (existingRestaurant.branches[branchIndex] as any).isSaved = true;
            }
          }
        }
      });
      
      // Convert the map values to an array
      return Array.from(restaurantsMap.values());
    }
    
    return [];
  } catch (error) {
    console.error('Get saved restaurants error:', error);
    throw error;
  }
};

// Booking APIs
export const createBooking = async (bookingData: {
  restaurantId: number;
  branchId: number;
  date: string;
  time: string;
  partySize: number;
}): Promise<Booking> => {
  try {
    const response = await apiClient.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error('Create booking error:', error);
    throw error;
  }
};

export const getUserBookings = async (): Promise<Booking[]> => {
  try {
    const response = await apiClient.get('/bookings');
    return response.data;
  } catch (error) {
    console.error('Get user bookings error:', error);
    throw error;
  }
};

export const getDefaultTimeSlots = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get('/default-time-slots');
    return response.data;
  } catch (error) {
    console.error('Get default time slots error:', error);
    throw error;
  }
};

export default apiClient;
