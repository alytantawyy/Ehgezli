import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Define types for our data models
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  city?: string;
  gender?: string;
  favoriteCuisines?: string[];
}

export interface Restaurant {
  id: number;
  name: string;
  description: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  imageUrl: string;
  branches: Branch[];
}

export interface Branch {
  id: number;
  location: string;
  address: string;
  slots: string[];
}

export interface Booking {
  id: number;
  restaurantId: number;
  restaurantName: string;
  branchId: number;
  branchLocation: string;
  date: string;
  time: string;
  partySize: number;
  status: 'confirmed' | 'pending' | 'cancelled';
}

// Base API URL - replace with your actual API endpoint
const API_BASE_URL = 'https://api.ehgezli.com';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth functions
export const loginUser = async (email: string, password: string) => {
  try {
    // For development, return mock data
    // In production, uncomment the API call
    // const response = await api.post('/auth/login', { email, password });
    // return response.data;
    
    // Mock response
    await SecureStore.setItemAsync('authToken', 'mock-token-123');
    return {
      user: {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: email,
        city: 'Cairo',
        gender: 'male',
        favoriteCuisines: ['Italian', 'Japanese']
      },
      token: 'mock-token-123'
    };
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
}) => {
  try {
    // For development, return mock data
    // const response = await api.post('/auth/register', userData);
    // return response.data;
    
    // Mock response
    await SecureStore.setItemAsync('authToken', 'mock-token-123');
    return {
      user: {
        id: 1,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
      },
      token: 'mock-token-123'
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await SecureStore.deleteItemAsync('authToken');
    // In production: await api.post('/auth/logout');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = await SecureStore.getItemAsync('authToken');
    if (!token) return null;
    
    // For development, return mock data
    // const response = await api.get('/auth/me');
    // return response.data;
    
    // Mock response
    return {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      city: 'Cairo',
      gender: 'male',
      favoriteCuisines: ['Italian', 'Japanese']
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// Restaurant functions
export const getRestaurants = async (): Promise<Restaurant[]> => {
  try {
    // For development, return mock data
    // const response = await api.get('/restaurants');
    // return response.data;
    
    // Mock response
    return [
      {
        id: 1,
        name: 'Bella Italia',
        description: 'Authentic Italian cuisine',
        cuisine: 'Italian',
        priceRange: '$$',
        rating: 4.5,
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
        branches: [
          {
            id: 1,
            location: 'Downtown',
            address: '123 Main St',
            slots: ['12:00', '13:00', '14:00', '18:00', '19:00', '20:00']
          },
          {
            id: 2,
            location: 'Uptown',
            address: '456 Oak Ave',
            slots: ['12:30', '13:30', '14:30', '18:30', '19:30', '20:30']
          }
        ]
      },
      {
        id: 2,
        name: 'Sakura Sushi',
        description: 'Fresh Japanese sushi',
        cuisine: 'Japanese',
        priceRange: '$$$',
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c',
        branches: [
          {
            id: 3,
            location: 'City Center',
            address: '789 Elm St',
            slots: ['12:00', '13:00', '14:00', '18:00', '19:00', '20:00']
          }
        ]
      }
    ];
  } catch (error) {
    console.error('Get restaurants error:', error);
    return [];
  }
};

export const getRestaurantById = async (id: number): Promise<Restaurant | null> => {
  try {
    // For development, return mock data
    // const response = await api.get(`/restaurants/${id}`);
    // return response.data;
    
    // Mock data
    const restaurants = await getRestaurants();
    return restaurants.find(r => r.id === id) || null;
  } catch (error) {
    console.error(`Get restaurant ${id} error:`, error);
    return null;
  }
};

// Bookings functions
export const createBooking = async (bookingData: {
  restaurantId: number;
  branchId: number;
  date: string;
  time: string;
  partySize: number;
}): Promise<Booking> => {
  try {
    // For development, return mock data
    // const response = await api.post('/bookings', bookingData);
    // return response.data;
    
    // Get restaurant name for the mock
    const restaurant = await getRestaurantById(bookingData.restaurantId);
    const branch = restaurant?.branches.find(b => b.id === bookingData.branchId);
    
    // Mock response
    return {
      id: Math.floor(Math.random() * 1000),
      restaurantId: bookingData.restaurantId,
      restaurantName: restaurant?.name || 'Unknown Restaurant',
      branchId: bookingData.branchId,
      branchLocation: branch?.location || 'Unknown Location',
      date: bookingData.date,
      time: bookingData.time,
      partySize: bookingData.partySize,
      status: 'confirmed'
    };
  } catch (error) {
    console.error('Create booking error:', error);
    throw error;
  }
};

export const getUserBookings = async (): Promise<Booking[]> => {
  try {
    // For development, return mock data
    // const response = await api.get('/bookings/me');
    // return response.data;
    
    // Mock response
    return [
      {
        id: 101,
        restaurantId: 1,
        restaurantName: 'Bella Italia',
        branchId: 1,
        branchLocation: 'Downtown',
        date: '2025-04-10',
        time: '19:00',
        partySize: 2,
        status: 'confirmed'
      },
      {
        id: 102,
        restaurantId: 2,
        restaurantName: 'Sakura Sushi',
        branchId: 3,
        branchLocation: 'City Center',
        date: '2025-04-15',
        time: '20:00',
        partySize: 4,
        status: 'pending'
      }
    ];
  } catch (error) {
    console.error('Get user bookings error:', error);
    return [];
  }
};

// User profile functions
export const updateUserProfile = async (profileData: {
  firstName: string;
  lastName: string;
  city: string;
  gender: string;
  favoriteCuisines: string[];
}): Promise<User> => {
  try {
    // For development, return mock data
    // const response = await api.put('/users/profile', profileData);
    // return response.data;
    
    // Mock response
    return {
      id: 1,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      email: 'john.doe@example.com',
      city: profileData.city,
      gender: profileData.gender,
      favoriteCuisines: profileData.favoriteCuisines
    };
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

// Saved restaurants functions
export const getSavedRestaurants = async (): Promise<Restaurant[]> => {
  try {
    // For development, return mock data
    // const response = await api.get('/saved-restaurants');
    // return response.data;
    
    // Mock response - just return a subset of all restaurants
    const allRestaurants = await getRestaurants();
    return [allRestaurants[0]];
  } catch (error) {
    console.error('Get saved restaurants error:', error);
    return [];
  }
};

export const getSavedStatus = async (restaurantId: number): Promise<boolean> => {
  try {
    // For development, return mock data
    // const response = await api.get(`/saved-restaurants/${restaurantId}/status`);
    // return response.data.saved;
    
    // Mock response
    const savedRestaurants = await getSavedRestaurants();
    return savedRestaurants.some(r => r.id === restaurantId);
  } catch (error) {
    console.error(`Get saved status for restaurant ${restaurantId} error:`, error);
    return false;
  }
};

export const toggleSavedStatus = async (restaurantId: number): Promise<boolean> => {
  try {
    // For development, return mock data
    // const currentStatus = await getSavedStatus(restaurantId);
    // if (currentStatus) {
    //   await api.delete(`/saved-restaurants/${restaurantId}`);
    //   return false;
    // } else {
    //   await api.post('/saved-restaurants', { restaurantId });
    //   return true;
    // }
    
    // Mock response - just toggle the current status
    const currentStatus = await getSavedStatus(restaurantId);
    return !currentStatus;
  } catch (error) {
    console.error(`Toggle saved status for restaurant ${restaurantId} error:`, error);
    throw error;
  }
};