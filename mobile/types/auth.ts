export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  gender: string;
  favoriteCuisines: string[];
  birthday?: string;
  nationality?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserLocation {
  id: number;
  userId: number;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

export interface Restaurant {
  id: number;
  email: string;
  name: string;
  about?: string;
  description?: string;
  cuisine?: string;
  priceRange?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RestaurantAuthResponse {
  restaurant: Restaurant;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  gender: string;
  birthday: string;
  nationality: string;
  favoriteCuisines: string[];
}

export interface RestaurantRegisterData {
  email: string;
  password: string;
  name: string;
  about?: string;
  description?: string;
  cuisine?: string;
  priceRange?: string;
  logo?: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ForgotPasswordData {
  email: string;
}   