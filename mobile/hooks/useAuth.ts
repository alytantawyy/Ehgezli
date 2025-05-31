import { useEffect } from 'react';
import { useAuthStore } from '../store/auth-store';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthRoute, UserRoute, RestaurantRoute } from '../types/navigation';

export function useAuth() {
  const { 
    user, 
    userType, 
    login, 
    restaurantLogin, 
    register, 
    restaurantRegister,
    logout, 
    isLoading, 
    error, 
    clearError,
    fetchProfile 
  } = useAuthStore();
  
  const router = useRouter();
  const segments = useSegments();

  // Check if the user is authenticated and redirect if needed
  useEffect(() => {
    // Skip redirection if still loading
    if (isLoading) return;
    
    // Check if the current route is an auth route
    const isAuthRoute = segments[0] === 'auth';
    
    // Simple redirection logic
    if (!user && !isAuthRoute) {
      // User is logged out but not on auth screen - redirect to auth
      // Use setTimeout to ensure navigation happens after mounting
      setTimeout(() => {
        router.replace(AuthRoute.login);
      }, 0);
    } else if (user && isAuthRoute) {
      // User is logged in but still on auth screen - redirect to appropriate dashboard
      setTimeout(() => {
        if (userType === 'restaurant') {
          router.replace(RestaurantRoute.tabs);
        } else {
          router.replace(UserRoute.tabs);
        }
      }, 0);
    }
  }, [user, userType, isLoading, segments, router]);

  // Check for stored token on app start
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        
        if (token) {
          // Use the fetchProfile function from the auth store
          // This will properly check userType before making API calls
          await fetchProfile();
        }
      } catch (error) {
        console.error('Error checking token:', error);
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('userType');
      }
    };
    
    checkToken();
  }, [fetchProfile]);

  return {
    user,
    userType,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    restaurantLogin,
    register,
    restaurantRegister,
    logout,
    clearError,
    fetchProfile
  };
}
