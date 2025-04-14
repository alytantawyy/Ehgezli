import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser, loginUser, logoutUser, registerUser, User } from '../shared/api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        // User is not logged in, which is fine
        console.log('No active session found');
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
      // This stores the token in SecureStore
      await loginUser(email, password);
      
      // Now fetch the user data using the stored token
      const userData = await getCurrentUser();
      
      // Set the user state with the fetched data
      setUser(userData);
    } catch (err: any) {
      // Handle the structured error from loginUser
      if (err.type && err.message) {
        setError(err.message);
        
        // We can add specific handling for different error types if needed
        switch (err.type) {
          case 'auth_error':
            // This is already handled with the default message
            break;
          case 'rate_limit':
            // Could trigger a countdown timer or other UI feedback
            break;
          case 'network_error':
            // Could trigger network status check
            break;
          default:
            // Default handling for other error types
            break;
        }
      } else {
        // Fallback for unexpected error format
        setError('An unexpected error occurred. Please try again.');
      }
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
      await logoutUser();
      setUser(null);
    } catch (err) {
      setError('Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
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
