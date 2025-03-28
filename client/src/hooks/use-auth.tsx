import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  logout: () => void;
};

type LoginData = {
  email: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 30000, 
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      return await apiRequest<SelectUser>("POST", "/api/login", credentials);
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
      // Note: Don't clear data here, wait for onSuccess
    },
    onSuccess: () => {
      // Clear all auth-related queries
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "Successfully logged out",
      });
      // Force reload to clear all state
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const validatedData = insertUserSchema.parse(data);
      return await apiRequest<SelectUser>("POST", "/api/register", validatedData);
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: "Welcome to Ehgezli!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logout = () => logoutMutation.mutate();

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        error,
        isLoading,
        loginMutation,
        logoutMutation,
        registerMutation,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}