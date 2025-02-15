import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertRestaurantAuthSchema, RestaurantAuth, InsertRestaurantAuth } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type RestaurantAuthContextType = {
  restaurant: RestaurantAuth | null;
  isProfileComplete: boolean;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<RestaurantAuth, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<RestaurantAuth, Error, InsertRestaurantAuth>;
};

type LoginData = Pick<InsertRestaurantAuth, "email" | "password">;

export const RestaurantAuthContext = createContext<RestaurantAuthContextType | null>(null);

export function RestaurantAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Query for restaurant authentication status
  const {
    data: restaurant,
    error,
    isLoading: restaurantLoading,
    refetch: refetchRestaurant,
  } = useQuery<RestaurantAuth | null>({
    queryKey: ["/api/restaurant"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  // Query for restaurant profile completion status
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/restaurant/profile-status", restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return { isComplete: false };
      const res = await apiRequest("GET", `/api/restaurant/profile-status/${restaurant.id}`);
      return res.json();
    },
    enabled: !!restaurant,
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/restaurant/login", credentials);
      return await res.json();
    },
    onSuccess: (restaurant: RestaurantAuth) => {
      queryClient.setQueryData(["/api/restaurant"], restaurant);
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/profile-status", restaurant.id] });
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message.replace(/^\d+:\s*/, ''), // Remove status code prefix
        variant: "destructive",
      });
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertRestaurantAuth) => {
      const res = await apiRequest("POST", "/api/restaurant/register", credentials);
      return await res.json();
    },
    onSuccess: (restaurant: RestaurantAuth) => {
      queryClient.setQueryData(["/api/restaurant"], restaurant);
      toast({
        title: "Registration successful",
        description: "Let's set up your restaurant profile!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message.replace(/^\d+:\s*/, ''), // Remove status code prefix
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/restaurant"], null);
      queryClient.clear(); // Clear all queries from the cache
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message.replace(/^\d+:\s*/, ''), // Remove status code prefix
        variant: "destructive",
      });
      // Force refetch authentication status on logout error
      refetchRestaurant();
    },
  });

  return (
    <RestaurantAuthContext.Provider
      value={{
        restaurant: restaurant ?? null,
        isProfileComplete: profile?.isComplete ?? false,
        isLoading: restaurantLoading || (!!restaurant && profileLoading),
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