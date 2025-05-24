import { useEffect } from 'react';
import { useAuthStore } from '../store/auth-store';
import { useRouter, useSegments } from 'expo-router';
import { verifyToken } from '../api/auth';
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
    clearError 
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
        const isValid = await verifyToken();
        if (isValid) {
          // Token is valid, but we need to fetch the user data
          // This should be implemented in the auth store
          console.log('Valid token found, fetching user profile...');
          // Call a function to fetch the user profile based on the token
          // For example: await authStore.fetchUserProfile();
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
