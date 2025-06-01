// import React, { createContext, useContext } from 'react';
// import { useAuthStore } from '../store/auth-store';

// type UserType = 'user' | 'restaurant' | null;

// interface AuthContextType {
//   user: any | null;
//   userType: UserType;
//   isLoading: boolean;
//   login: (email: string, password: string) => Promise<any>;
//   register: (userData: any) => Promise<any>;
//   restaurantLogin: (credentials: { email: string; password: string }) => Promise<any>;
//   restaurantRegister: (data: any) => Promise<any>;
//   logout: () => void;
//   error: string | null;
//   clearError: () => void;
// }

// const AuthContext = createContext<AuthContextType>({
//   user: null,
//   userType: null,
//   isLoading: true,
//   login: async () => {},
//   register: async () => {},
//   restaurantLogin: async () => {},
//   restaurantRegister: async () => {},
//   logout: () => {},
//   error: null,
//   clearError: () => {},
// });

// // This hook now simply forwards to the Zustand store
// export const useAuth = () => {
//   const store = useAuthStore();
//   return {
//     user: store.user,
//     userType: store.userType,
//     isLoading: store.isLoading,
//     login: store.login,
//     register: store.register,
//     restaurantLogin: store.restaurantLogin,
//     restaurantRegister: store.restaurantRegister,
//     logout: store.logout,
//     error: store.error,
//     clearError: store.clearError,
//   };
// };

// // This provider now just renders children without adding any state
// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   return children;
// };
