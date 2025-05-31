import { create } from 'zustand';
import { getDetailedRestaurant } from '../api/restaurant';
import { Restaurant } from '../types/restaurant';

interface RestaurantState {
  restaurant: Restaurant | null;
  isLoading: boolean;
  error: string | null;
  fetchRestaurantDetails: (restaurantId: number) => Promise<void>;
  clearError: () => void;
}

export const useRestaurantStore = create<RestaurantState>((set) => ({
  restaurant: null,
  isLoading: false,
  error: null,
  
  fetchRestaurantDetails: async (restaurantId: number) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Fetching detailed restaurant with ID:', restaurantId);
      const detailedRestaurant = await getDetailedRestaurant(restaurantId);
      
      // Transform the detailed restaurant response into the Restaurant format
      const restaurant: Restaurant = {
        id: detailedRestaurant.user.id,
        name: detailedRestaurant.user.name,
        email: detailedRestaurant.user.email,
        about: detailedRestaurant.profile.about,
        description: detailedRestaurant.profile.description,
        cuisine: detailedRestaurant.profile.cuisine,
        priceRange: detailedRestaurant.profile.priceRange,
        logo: detailedRestaurant.profile.logo,
        createdAt: detailedRestaurant.user.createdAt,
        updatedAt: detailedRestaurant.user.updatedAt,
        branches: detailedRestaurant.branches.map((branch) => ({
          id: branch.id,
          restaurantId: branch.restaurantId,
          restaurantName: detailedRestaurant.user.name,
          address: branch.address,
          city: branch.city,
          latitude: branch.latitude,
          longitude: branch.longitude
        }))
      };
      
      set({ restaurant, isLoading: false });
      console.log('Restaurant details fetched successfully:', restaurant);
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch restaurant details', 
        isLoading: false 
      });
    }
  },
  
  clearError: () => set({ error: null }),
}));
