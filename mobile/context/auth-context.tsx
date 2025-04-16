import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser, loginUser, logoutUser, registerUser, User, getCurrentRestaurant, RestaurantUser, loginRestaurant, getAuthToken, decodeJWT, clearAuthToken } from '../shared/api/client';

interface AuthContextType {
  user: User | RestaurantUser | null;
  isLoading: boolean;
  error: string | null;
  isRestaurant: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsRestaurant: (email: string, password: string) => Promise<void>;
  register: (userData: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    password: string;
    gender: string;
    birthday: string; // ISO date string
    city: string;
    cuisines: string[];
  }) => Promise<User>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | RestaurantUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRestaurant, setIsRestaurant] = useState(false);

  // Check for existing session on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Get the auth token first
        const token = await getAuthToken();
        
        if (!token) {
          console.log('No auth token found');
          setUser(null);
          setIsRestaurant(false);
          setIsLoading(false);
          return;
        }
        
        // Decode the token to determine user type
        const decodedToken = decodeJWT(token) as { id: number; type: string } | null;
        console.log('Auth context - Decoded token:', JSON.stringify(decodedToken));
        
        if (!decodedToken) {
          console.log('Failed to decode token');
          setUser(null);
          setIsRestaurant(false);
          setIsLoading(false);
          return;
        }
        
        // Check token type
        if (decodedToken.type === 'restaurant') {
          console.log('Token is for restaurant user, fetching restaurant data');
          const restaurantData = await getCurrentRestaurant();
          if (restaurantData) {
            setUser(restaurantData);
            setIsRestaurant(true);
          } else {
            // Failed to get restaurant data
            setUser(null);
            setIsRestaurant(false);
          }
        } else {
          console.log('Token is for regular user, fetching user data');
          const userData = await getCurrentUser();
          if (userData) {
            setUser(userData);
            setIsRestaurant(false);
          } else {
            // Failed to get user data
            setUser(null);
            setIsRestaurant(false);
          }
        }
      } catch (err) {
        // Error during authentication check
        console.error('Error checking auth status:', err);
        setUser(null);
        setIsRestaurant(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await loginUser(email, password);
      const userData = await getCurrentUser();
      setUser(userData);
      setIsRestaurant(false);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsRestaurant = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await loginRestaurant(email, password);
      const restaurantData = await getCurrentRestaurant();
      setUser(restaurantData);
      setIsRestaurant(true);
    } catch (err: any) {
      setError(err.message || 'Failed to login as restaurant');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    password: string;
    gender: string;
    birthday: string; // ISO date string
    city: string;
    cuisines: string[];
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      // Register the user - the updated registerUser function now handles updating the profile with cuisines
      const response = await registerUser(userData);
      
      // Get the user data from the response or fetch it explicitly
      let userToSet = response.user;
      
      // If no user data in response, fetch it explicitly
      if (!userToSet) {
        userToSet = await getCurrentUser();
        
        if (!userToSet) {
          throw new Error('Failed to load user data after registration');
        }
      }
      
      // Ensure favorite cuisines are included in the user object
      const userWithCuisines = {
        ...userToSet,
        favoriteCuisines: userData.cuisines
      };
      
      // Set the user in the auth context
      setUser(userWithCuisines);
      
      // Return the user data so the caller knows registration is complete
      return userWithCuisines;
    } catch (err) {
      setError('Registration failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Clear the auth token first
      await clearAuthToken();
      // Then update the state
      setUser(null);
      setIsRestaurant(false);
    } catch (err) {
      setError('Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      if (isRestaurant) {
        const restaurantData = await getCurrentRestaurant();
        setUser(restaurantData);
      } else {
        const userData = await getCurrentUser();
        setUser(userData);
      }
    } catch (err) {
      setError('Failed to refresh user data');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    isRestaurant,
    login,
    loginAsRestaurant,
    register,
    logout,
    clearError,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
