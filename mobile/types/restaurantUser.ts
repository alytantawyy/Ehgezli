export interface RestaurantUser {
  verified: boolean;
  id: number;
  restaurantId: number;
  about: string;
  description: string;
  cuisine: string;
  priceRange: string;
  logo: string;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

// For updating restaurant user profile
export interface UpdateRestaurantUserData {
  email?: string;
  name?: string;
  about?: string;
  description?: string;
  cuisine?: string;
  priceRange?: string;
  logo?: string;
}