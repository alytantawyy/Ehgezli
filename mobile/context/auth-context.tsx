import React, { createContext, useContext, useState, useEffect } from 'react';
import { login, register, restaurantLogin, restaurantRegister } from '../api/auth';

type UserType = 'user' | 'restaurant' | null;

interface AuthContextType {
  user: any | null;
  userType: UserType;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  restaurantLogin: (credentials: { email: string; password: string }) => Promise<any>;
  restaurantRegister: (data: any) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userType: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  restaurantLogin: async () => {},
  restaurantRegister: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on mount
    const checkAuth = async () => {
      try {
        // Just set loading to false for now - don't attempt auto-login
        // TODO: Implement proper token-based auth checking when ready
        console.log('Auth check: No auto-login attempt');
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      // Add additional validation and logging
      if (!email || !password) {
        console.error('Empty credentials in handleLogin:', { email, password });
        throw new Error('Email and password are required');
      }
      
      console.log('Attempting login with:', { email, password: password ? '******' : undefined });
      const userData = await login({ email, password });
      setUser(userData);
      setUserType('user');
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleRegister = async (userData: any) => {
    try {
      const newUser = await register(userData);
      setUser(newUser);
      setUserType('user');
      return newUser;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const handleRestaurantLogin = async (credentials: { email: string; password: string }) => {
    try {
      // Add validation for restaurant login
      if (!credentials.email || !credentials.password) {
        console.error('Empty credentials in handleRestaurantLogin:', { email: credentials.email, password: credentials.password ? '******' : undefined });
        throw new Error('Email and password are required');
      }
      
      console.log('Attempting restaurant login with:', { email: credentials.email, password: credentials.password ? '******' : undefined });
      const userData = await restaurantLogin(credentials);
      setUser(userData);
      setUserType('restaurant');
      return userData;
    } catch (error) {
      console.error('Restaurant login error:', error);
      throw error;
    }
  };

  const handleRestaurantRegister = async (data: any) => {
    try {
      const newUser = await restaurantRegister(data);
      setUser(newUser);
      setUserType('restaurant');
      return newUser;
    } catch (error) {
      console.error('Restaurant register error:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUserType(null);
    // Implement any additional logout logic here
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        isLoading,
        login: handleLogin,
        register: handleRegister,
        restaurantLogin: handleRestaurantLogin,
        restaurantRegister: handleRestaurantRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
