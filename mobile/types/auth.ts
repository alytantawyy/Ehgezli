import { Restaurant } from "./restaurant";
import { User } from "./user";
import { RestaurantUser } from "./restaurantUser";

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RestaurantAuthResponse {
  restaurantUser: RestaurantUser;
  restaurantProfile?: any;
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

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
}

export { Restaurant, User };
