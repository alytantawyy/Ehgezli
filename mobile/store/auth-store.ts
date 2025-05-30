import { create } from 'zustand';
import { User, Restaurant } from '../types/auth';
import { 
  login, 
  register, 
  restaurantLogin,
  restaurantRegister,
} from '../api/auth';
import {getUserProfile, } from '../api/user';
import {getRestaurantUserProfile} from '../api/restaurantUser'
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserType = 'user' | 'restaurant' | null;

interface AuthState {
  user: User | Restaurant | null;
  userType: UserType;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  restaurantLogin: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  restaurantRegister: (restaurantData: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userType: null,
  isLoading: false,
  error: null,
  
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await login({ email, password });
      set({ user: user as unknown as User | Restaurant, userType: 'user', isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Login failed', 
        isLoading: false 
      });
    }
  },
  
  restaurantLogin: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Starting restaurant login...');
      const restaurant = await restaurantLogin({ email, password });
      console.log('Restaurant login successful:', restaurant);
      
      // Get the token from AsyncStorage to confirm it was saved
      const token = await AsyncStorage.getItem('auth_token');
      console.log('Auth token available after login:', !!token, token ? token.substring(0, 20) + '...' : 'none');
      
      console.log('Setting userType to restaurant');
      set({ user: restaurant as unknown as User | Restaurant, userType: 'restaurant', isLoading: false });
      await AsyncStorage.setItem('userType', 'restaurant');
      
      console.log('User state after login:', get().user, 'userType:', get().userType);
    } catch (error) {
      console.error('Restaurant login failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Restaurant login failed', 
        isLoading: false 
      });
    }
  },
  
  register: async (userData: any) => {
    set({ isLoading: true, error: null });
    try {
      const user = await register(userData);
      set({ user: user as unknown as User | Restaurant, userType: 'user', isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Registration failed', 
        isLoading: false 
      });
    }
  },

  restaurantRegister: async (restaurantData: any) => {
    set({ isLoading: true, error: null });
    try {
      const restaurant = await restaurantRegister(restaurantData);
      set({ user: restaurant as unknown as User | Restaurant, userType: 'restaurant', isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Restaurant registration failed', 
        isLoading: false 
      });
    }
  },
  
  logout: async () => {
    set({ isLoading: true });
    try {
      // Clear the auth token from AsyncStorage
      await AsyncStorage.removeItem('auth_token');
      set({ user: null, userType: null, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Logout failed', 
        isLoading: false 
      });
    }
  },
  
  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('Starting fetch profile...');
      // Get the current userType from the store state
      const state = get();
      const userType = state.userType;
      
      let user;
      
      if (userType === 'restaurant') {
        // Fetch restaurant user profile
        user = await getRestaurantUserProfile();
      } else {
        // Fetch regular user profile
        user = await getUserProfile();
      }
      
      console.log('Fetch profile successful:', user);
      set({ user: user as unknown as User | Restaurant, isLoading: false });
      console.log('User state after fetch profile:', get().user, 'userType:', get().userType);
    } catch (error) {
      console.error('Fetch profile failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch profile', 
        isLoading: false 
      });
    }
  },
  
  clearError: () => set({ error: null }),
}));
