import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { RestaurantAuth, InsertRestaurantAuth, Restaurant } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type RestaurantAuthContextType = {
  restaurant: (RestaurantAuth & Partial<Restaurant>) | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
};

type LoginData = Pick<InsertRestaurantAuth, "email" | "password">;

export const RestaurantAuthContext = createContext<RestaurantAuthContextType | null>(null);

export function RestaurantAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  console.log("RestaurantAuthProvider: Initializing");

  const {
    data: restaurant,
    error,
    isLoading,
  } = useQuery<RestaurantAuth & Partial<Restaurant> | null>({
    queryKey: ["/api/restaurant"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  console.log("RestaurantAuthProvider: Auth state:", { restaurant, error, isLoading });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      return apiRequest<RestaurantAuth>("POST", "/api/restaurant/login", credentials);
    },
    onSuccess: (restaurant) => {
      queryClient.setQueryData(["/api/restaurant"], restaurant);
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

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertRestaurantAuth) => {
      return apiRequest<RestaurantAuth>("POST", "/api/restaurant/register", credentials);
    },
    onSuccess: (restaurant) => {
      queryClient.setQueryData(["/api/restaurant"], restaurant);
      toast({
        title: "Registration successful",
        description: "Welcome to your restaurant dashboard!",
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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest<{ message: string }>("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/restaurant"], null);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
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
    },
  });

  return (
    <RestaurantAuthContext.Provider
      value={{
        restaurant: restaurant ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </RestaurantAuthContext.Provider>
  );
}

export function useRestaurantAuth() {
  const context = useContext(RestaurantAuthContext);
  if (!context) {
    throw new Error("useRestaurantAuth must be used within a RestaurantAuthProvider");
  }
  return context;
}