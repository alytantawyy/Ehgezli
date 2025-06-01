import { useEffect } from 'react';
import { useAuthStore } from '../store/auth-store';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthRoute, UserRoute, RestaurantRoute } from '../types/navigation';
import { clearAuthState } from '../api/api-client';

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
        // Clear any existing errors first
        clearError();
        
        // Get both token and userType from AsyncStorage
        const token = await AsyncStorage.getItem('auth_token');
        const storedUserType = await AsyncStorage.getItem('userType');
        
        console.log('Initial auth check - Token exists:', !!token, 'User type:', storedUserType);
        
        if (!token || !storedUserType) {
          // If either token or userType is missing, clear auth state
          console.log('Missing token or userType, clearing auth state');
          await clearAuthState();
          return;
        }
        
        // Only attempt to fetch profile if we have both token and userType
        if (token && storedUserType) {
          try {
            // Use the fetchProfile function from the auth store
            await fetchProfile();
          } catch (error) {
            console.error('Error fetching profile during initialization:', error);
            // Clear auth state on profile fetch error
            await clearAuthState();
          }
        }
      } catch (error) {
        console.error('Error checking token:', error);
        await clearAuthState();
      }
    };
    
    checkToken();
  }, [fetchProfile, clearError]);

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
