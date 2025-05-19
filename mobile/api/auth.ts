import apiClient from './api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterData, 
  User, 
  RestaurantAuthResponse,
  Restaurant,
  RestaurantRegisterData,
  ResetPasswordData,
  ForgotPasswordData
} from '../types/auth';

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

export const logout = async (): Promise<void> => {
  await AsyncStorage.removeItem('auth_token');
};

export const forgotPassword = async (forgotPasswordData: ForgotPasswordData): Promise<void> => {
  await apiClient.post('/auth/forgot-password', forgotPasswordData);
};

export const resetPassword = async (resetPasswordData: ResetPasswordData): Promise<void> => {
  await apiClient.post('/auth/reset-password', resetPasswordData);
};

// Restaurant authentication
export const restaurantLogin = async (credentials: LoginCredentials): Promise<Restaurant> => {
  const { data } = await apiClient.post<RestaurantAuthResponse>('/auth/restaurant-login', credentials);
  await AsyncStorage.setItem('auth_token', data.token);
  return data.restaurant;
};

export const restaurantRegister = async (restaurantData: RestaurantRegisterData): Promise<Restaurant> => {
  const { data } = await apiClient.post<RestaurantAuthResponse>('/auth/restaurant-register', restaurantData);
  await AsyncStorage.setItem('auth_token', data.token);
  return data.restaurant;
};

export const restaurantForgotPassword = async (forgotPasswordData: ForgotPasswordData): Promise<void> => {
  await apiClient.post('/auth/restaurant-forgot-password', forgotPasswordData);
};

export const restaurantResetPassword = async (resetPasswordData: ResetPasswordData): Promise<void> => {
  await apiClient.post('/auth/restaurant-reset-password', resetPasswordData);
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

// Update user password
export const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await apiClient.post('/auth/update-user-password', {
    currentPassword,
    newPassword
  });
};

// Update restaurant password
export const updateRestaurantPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await apiClient.post('/auth/update-restaurant-password', {
    currentPassword,
    newPassword
  });
};

