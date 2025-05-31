import apiClient, { clearAuthState } from './api-client';
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
import { Alert } from 'react-native';

// User authentication
export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    if (data && data.token) {
      console.log('Saving auth token to AsyncStorage:', data.token.substring(0, 20) + '...');
      await AsyncStorage.setItem('auth_token', data.token);
      
      // Update the token cache in api-client
      if (typeof window !== 'undefined') {
        // @ts-ignore - accessing the module's cache variable
        require('./api-client').tokenCache = data.token;
      }
      
      // Verify token was saved
      const savedToken = await AsyncStorage.getItem('auth_token');
      console.log('Token saved successfully:', !!savedToken);
      
      return data.user;
    } else {
      Alert.alert(
        'Login Failed',
        'Invalid email or password. Please try again.',
        [{ text: 'OK', style: 'cancel' }]
      );
      throw new Error('Invalid login response');
    }
  } catch (error) {
    console.error('Login API error:', error);
    // Show alert for network or server errors
    Alert.alert(
      'Login Failed',
      'Invalid email or password. Please try again.',
      [{ text: 'OK', style: 'cancel' }]
    );
    throw error;
  }
};

export const register = async (userData: RegisterData): Promise<User> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', userData);
  console.log('Saving auth token to AsyncStorage:', data.token.substring(0, 20) + '...');
  await AsyncStorage.setItem('auth_token', data.token);
  
  // Update the token cache in api-client
  if (typeof window !== 'undefined') {
    // @ts-ignore - accessing the module's cache variable
    require('./api-client').tokenCache = data.token;
  }
  
  // Verify token was saved
  const savedToken = await AsyncStorage.getItem('auth_token');
  console.log('Token saved successfully:', !!savedToken);
  
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
  try {
    const { data } = await apiClient.post<RestaurantAuthResponse>('/auth/restaurant-login', credentials);
    
    console.log('Restaurant login API response:', data);
    
    if (data && data.token) {
      console.log('Saving auth token to AsyncStorage:', data.token.substring(0, 20) + '...');
      await AsyncStorage.setItem('auth_token', data.token);
      
      // Update the token cache in api-client
      if (typeof window !== 'undefined') {
        // @ts-ignore - accessing the module's cache variable
        require('./api-client').tokenCache = data.token;
      }
      
      // Verify token was saved
      const savedToken = await AsyncStorage.getItem('auth_token');
      console.log('Token saved successfully:', !!savedToken);
      
      // TEMPORARY: Add verified field for testing if it doesn't exist
      // This should be removed once the backend properly implements this field
      if (data.restaurant && data.restaurant.verified === undefined) {
        // For testing: set to false to simulate unverified restaurant
        // In production, this should come from the backend
        data.restaurant.verified = false;
      }
      
      return data.restaurant;
    } else {
      Alert.alert(
        'Login Failed',
        'Invalid email or password. Please try again.',
        [{ text: 'OK', style: 'cancel' }]
      );
      throw new Error('Invalid login response');
    }
  } catch (error) {
    console.error('Restaurant login API error:', error);
    // Show alert for network or server errors
    Alert.alert(
      'Login Failed',
      'Invalid email or password. Please try again.',
      [{ text: 'OK', style: 'cancel' }]
    );
    throw error;
  }
};

export const restaurantRegister = async (restaurantData: RestaurantRegisterData): Promise<RestaurantUser> => {
  const { data } = await apiClient.post<RestaurantAuthResponse>('/auth/restaurant-register', restaurantData);
  console.log('Saving auth token to AsyncStorage:', data.token.substring(0, 20) + '...');
  await AsyncStorage.setItem('auth_token', data.token);
  
  // Update the token cache in api-client
  if (typeof window !== 'undefined') {
    // @ts-ignore - accessing the module's cache variable
    require('./api-client').tokenCache = data.token;
  }
  
  // Verify token was saved
  const savedToken = await AsyncStorage.getItem('auth_token');
  console.log('Token saved successfully:', !!savedToken);
  
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
