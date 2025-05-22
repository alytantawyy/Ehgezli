import { create } from 'zustand';
import { User, Restaurant } from '../types/auth';
import { 
  login, 
  register, 
  restaurantLogin,
  restaurantRegister
} from '../api/auth';
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
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set: any) => ({
  user: null,
  userType: null,
  isLoading: false,
  error: null,
  
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await login({ email, password });
      set({ user, userType: 'user', isLoading: false });
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
      const restaurant = await restaurantLogin({ email, password });
      set({ user: restaurant, userType: 'restaurant', isLoading: false });
    } catch (error) {
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
      set({ user, userType: 'user', isLoading: false });
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
      set({ user: restaurant, userType: 'restaurant', isLoading: false });
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
  
  clearError: () => set({ error: null }),
}));
