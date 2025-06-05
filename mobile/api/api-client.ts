import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use environment variables with fallback mechanism
const API_URL = process.env.EXPO_PUBLIC_API_URL;
// Add a flag to track failed auth attempts
let authFailureCount = 0;

// Add a memory cache for the token to avoid AsyncStorage delays
let tokenCache: string | null = null;
// Add a memory cache for user type
let userTypeCache: string | null = null;

// Function to clear all auth state
export const clearAuthState = async () => {
  console.log('Clearing all auth state');
  tokenCache = null;
  userTypeCache = null;
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('userType');
  authFailureCount = 0;
};

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 30000, // Increased from 10000 to 30000 (30 seconds)
});

// Add request interceptor for auth token
apiClient.interceptors.request.use(async (config) => {
  try {
    // Check the memory cache first
    if (tokenCache) {
      console.log(`Using cached token for request: ${config.url}`);
      config.headers.Authorization = `Bearer ${tokenCache}`;
    } else {
      // Force token refresh on every request
      const token = await AsyncStorage.getItem('auth_token');
      console.log(`Retrieving token for request: ${config.url}, token exists: ${!!token}`);
      
      if (token) {
        console.log(`Adding auth token to request: ${config.url}`);
        config.headers.Authorization = `Bearer ${token}`;
        tokenCache = token; // Cache the token
      } else {
        console.log(`No auth token available for request: ${config.url}`);
      }
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle specific error cases
    if (error.response) {
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        console.log('Unauthorized error detected, clearing auth state');
        await clearAuthState();
      }
      
      // Handle 404 Not Found errors for user profile
      if (error.response.status === 404 && 
          (error.config.url.includes('/user') || 
           error.config.url.includes('/restaurant-user'))) {
        console.log('User not found error detected, clearing auth state');
        await clearAuthState();
      }
      
      // Handle 500 Internal Server Error with specific error message
      if (error.response.status === 500 && 
          error.response.data?.message === 'Internal Server Error' &&
          error.config.url.includes('/user')) {
        console.log('User-related server error detected, clearing auth state');
        await clearAuthState();
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
