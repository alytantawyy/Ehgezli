import apiClient from './api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterData, 
  RestaurantAuthResponse,
  RestaurantRegisterData,
  ResetPasswordData,
  ForgotPasswordData,
  PasswordUpdateData
} from '../types/auth';
import { User } from '@/types/user';
import { RestaurantUser } from '@/types/restaurantUser';




// User authentication
export const login = async (credentials: LoginCredentials): Promise<User> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
  await AsyncStorage.setItem('auth_token', data.token);
  return data.user;
};

export const register = async (userData: RegisterData): Promise<User> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', userData);
  await AsyncStorage.setItem('auth_token', data.token);
  return data.user;
};

// Password reset flow for users
export const forgotPassword = async (forgotPasswordData: ForgotPasswordData): Promise<void> => {
  await apiClient.post('/auth/password-reset', forgotPasswordData);
};

export const validateResetToken = async (token: string): Promise<boolean> => {
  const { data } = await apiClient.post('/auth/validate-password-reset-token', { token });
  return data.valid;
};

export const resetPassword = async (resetPasswordData: ResetPasswordData): Promise<void> => {
  await apiClient.post('/auth/mark-password-reset-token-as-used', resetPasswordData);
};

export const updateUserPassword = async (passwordData: PasswordUpdateData): Promise<void> => {
  await apiClient.post('/auth/update-user-password', passwordData);
};

// Restaurant authentication
export const restaurantLogin = async (credentials: LoginCredentials): Promise<RestaurantUser> => {
  const { data } = await apiClient.post<RestaurantAuthResponse>('/auth/restaurant-login', credentials);
  await AsyncStorage.setItem('auth_token', data.token);
  return data.restaurant;
};

export const restaurantRegister = async (restaurantData: RestaurantRegisterData): Promise<RestaurantUser> => {
  const { data } = await apiClient.post<RestaurantAuthResponse>('/auth/restaurant-register', restaurantData);
  await AsyncStorage.setItem('auth_token', data.token);
  return data.restaurant;
};

// Password reset flow for restaurants
export const restaurantForgotPassword = async (forgotPasswordData: ForgotPasswordData): Promise<void> => {
  await apiClient.post('/auth/restaurant-password-reset', forgotPasswordData);
};

export const validateRestaurantResetToken = async (token: string): Promise<boolean> => {
  const { data } = await apiClient.post('/auth/validate-restaurant-password-reset-token', { token });
  return data.valid;
};

export const restaurantResetPassword = async (resetPasswordData: ResetPasswordData): Promise<void> => {
  await apiClient.post('/auth/mark-restaurant-password-reset-token-as-used', resetPasswordData);
};

export const updateRestaurantPassword = async (passwordData: PasswordUpdateData): Promise<void> => {
  await apiClient.post('/auth/update-restaurant-password', passwordData);
};

// Verify token is valid
export const verifyToken = async (): Promise<boolean> => {
  try {
    await apiClient.get('/auth/verify-token');
    return true;
  } catch (error) {
    await AsyncStorage.removeItem('auth_token');
    return false;
  }
};
