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

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/restaurant/profile-status", restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return { isComplete: false };
      const res = await apiRequest("GET", `/api/restaurant/profile-status/${restaurant.id}`);
      if (!res.ok) {
        console.error('Failed to fetch profile status:', await res.text());
        throw new Error("Failed to fetch profile status");
      }
      return res.json();
    },
    enabled: !!restaurant,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('Attempting restaurant login...');
      const res = await apiRequest("POST", "/api/restaurant/login", credentials);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message || "Login failed");
      }
      return res.json();
    },
    onSuccess: (restaurant: RestaurantAuth) => {
      console.log('Restaurant login successful:', restaurant.id);
      queryClient.setQueryData(["/api/restaurant"], restaurant);
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/profile-status", restaurant.id] });
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    },
    onError: (error: Error) => {
      console.error('Restaurant login failed:', error);
      toast({
        title: "Login failed",
        description: error.message.replace(/^\d+:\s*/, ''),
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertRestaurantAuth) => {
      console.log('Attempting restaurant registration...');
      const res = await apiRequest("POST", "/api/restaurant/register", credentials);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Registration failed" }));
        throw new Error(errorData.message || "Registration failed");
      }
      return res.json();
    },
    onSuccess: (restaurant: RestaurantAuth) => {
      console.log('Restaurant registration successful:', restaurant.id);
      queryClient.setQueryData(["/api/restaurant"], restaurant);
      toast({
        title: "Registration successful",
        description: "Let's set up your restaurant profile!",
      });
    },
    onError: (error: Error) => {
      console.error('Restaurant registration failed:', error);
      toast({
        title: "Registration failed",
        description: error.message.replace(/^\d+:\s*/, ''),
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('Attempting restaurant logout...');
      const res = await apiRequest("POST", "/api/logout");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Logout failed" }));
        throw new Error(errorData.message || "Logout failed");
      }
    },
    onSuccess: () => {
      console.log('Restaurant logout successful');
      queryClient.setQueryData(["/api/restaurant"], null);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      console.error('Restaurant logout failed:', error);
      toast({
        title: "Logout failed",
        description: error.message.replace(/^\d+:\s*/, ''),
        variant: "destructive",
      });
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