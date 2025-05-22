import { useEffect } from 'react';
import { useAuthStore } from '../store/auth-store';
import { useRouter, useSegments } from 'expo-router';
import { verifyToken } from '../api/auth';

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
    clearError 
  } = useAuthStore();
  
  const router = useRouter();
  const segments = useSegments();

  // Check if the user is authenticated and redirect if needed
  useEffect(() => {
    // Check if the current route is an auth route
    const isAuthRoute = [
      'auth',
      'forgot-password',
      'reset-password',
      'register'
    ].includes(segments[0] || '');
    
    const isRestaurantGroup = segments[0] === 'restaurant/(tabs)' as any;
    const isUserGroup = segments[0] === 'user/(tabs)' as any;

    if (!user && !isAuthRoute) {
      // Redirect to login if not authenticated and not in auth route
      router.replace('/auth' as any);
    } else if (user) {
      if (userType === 'user' && !isUserGroup && !isAuthRoute) {
        // Redirect user to user tabs
        router.replace('/user/(tabs)' as any);
      } else if (userType === 'restaurant' && !isRestaurantGroup && !isAuthRoute) {
        // Redirect restaurant to restaurant tabs
        router.replace('/restaurant/(tabs)' as any);
      }
    }
  }, [user, userType, segments]);

  // Check for stored token on app start
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await verifyToken();
        if (token) {
          // If we have a token, we should fetch the user profile
          // This would be implemented in a real app
          // For now, we'll just redirect to the appropriate screen
        }
      } catch (error) {
        console.error('Failed to check auth token', error);
      }
    };
    
    checkToken();
  }, []);

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
  };
}
