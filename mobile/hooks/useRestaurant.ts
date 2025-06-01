import { useEffect, useState } from 'react';
import { useRestaurantStore } from '../store/restaurant-store';
import { useAuthStore } from '../store/auth-store';

export function useRestaurant() {
  const { restaurant, isLoading, error, fetchRestaurantDetails, clearError } = useRestaurantStore();
  const { user, userType } = useAuthStore();
  const [initialized, setInitialized] = useState(false);
  
  // Fetch restaurant details when the hook is initialized or when the user changes
  useEffect(() => {
    const fetchRestaurantData = async () => {
      // Only proceed if we're logged in as a restaurant user
      if (userType === 'restaurant' && user) {
        try {
          // Get the restaurant ID from the user object
          if ('id' in user) {
            await fetchRestaurantDetails(user.id);
          } else {
            console.error('Cannot determine restaurant ID from user object:', user);
          }
        } catch (error) {
          console.error('Error in useRestaurant hook:', error);
        } finally {
          setInitialized(true);
        }
      } else {
        setInitialized(true);
      }
    };
    
    if (!initialized) {
      fetchRestaurantData();
    }
  }, [user, userType, fetchRestaurantDetails, initialized]);
  
  // Function to manually refresh restaurant data
  const refreshRestaurantData = async () => {
    if (userType === 'restaurant' && user && 'id' in user) {
      try {
        await fetchRestaurantDetails(user.id);
      } catch (error) {
        console.error('Error refreshing restaurant data:', error);
      }
    }
  };
  
  return {
    restaurant,
    isLoading,
    error,
    clearError,
    refreshRestaurantData,
    initialized
  };
}
