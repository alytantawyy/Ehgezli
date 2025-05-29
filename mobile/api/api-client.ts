import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your computer's actual IP address instead of localhost
// This allows mobile devices on the same network to connect
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.2.64.32:4000/api';
// Example: const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:4000/api';

// Add a flag to track failed auth attempts
let authFailureCount = 0;
const MAX_AUTH_FAILURES = 3;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 10000,
});

// Add request interceptor for auth token
apiClient.interceptors.request.use(async (config) => {
  // Don't retry auth endpoints if we've had multiple failures
  if (config.url?.includes('/auth/verify-token') && authFailureCount >= MAX_AUTH_FAILURES) {
    return Promise.reject(new Error('Auth verification disabled after multiple failures'));
  }
  
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
  }
  
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Track auth failures
    if (error.config?.url?.includes('/auth/verify-token') || error.response?.status === 401) {
      authFailureCount++;
      
      if (authFailureCount >= MAX_AUTH_FAILURES) {
        AsyncStorage.removeItem('auth_token');
      }
    }
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized (could trigger logout)
      AsyncStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
