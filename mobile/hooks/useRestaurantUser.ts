import { useRestaurantUserStore } from '../store/restaurantUser-store';

export function useRestaurantUser() {
  const { isLoading, error, updateProfile, clearError } = useRestaurantUserStore();
  
  return {
    isLoading,
    error,
    updateProfile,
    clearError
  };
}
