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
    // Skip redirection if still loading
    if (isLoading) return;
    
    // Check if the current route is an auth route
    const isAuthRoute = segments[0] === 'auth';
    
    // Debug logs
    console.log('Auth state:', { user, userType, isLoading, isAuthRoute, segments });
    
    // Simple redirection logic
    if (!user && !isAuthRoute) {
      // User is logged out but not on auth screen - redirect to auth
      console.log('Redirecting to auth screen');
      // Use setTimeout to ensure navigation happens after mounting
      setTimeout(() => {
        router.replace('/auth');
      }, 0);
    } else if (user && isAuthRoute) {
      // User is logged in but still on auth screen - redirect to appropriate dashboard
      console.log('User is authenticated, redirecting to dashboard', { userType });
      setTimeout(() => {
        if (userType === 'restaurant') {
          console.log('Redirecting to restaurant dashboard');
          router.replace('/restaurant/tabs' as any);
        } else {
          console.log('Redirecting to user dashboard');
          router.replace('/user/tabs' as any);
        }
      }, 0);
    }
  }, [user, userType, isLoading, segments, router]);

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
