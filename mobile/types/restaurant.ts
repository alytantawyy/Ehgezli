import { RestaurantBranch } from "./branch";

// Core restaurant data
export interface Restaurant {
  id: number;
  name: string;
  email: string;
  about?: string;
  description?: string;
  cuisine?: string;
  priceRange?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
  branches?: RestaurantBranch[];
}

// Response from /api/restaurant/detailed/:restaurantId
export interface DetailedRestaurantResponse {
  profile: {
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
  };
  user: {
    id: number;
    email: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  branches: {
    id: number;
    restaurantId: number;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
  }[];
}

// Restaurant profile update data
export interface UpdateRestaurantData {
  name?: string;
  about?: string;
  description?: string;
  cuisine?: string;
  priceRange?: string;
  logo?: string;
}
