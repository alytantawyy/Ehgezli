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
  } = useQuery<RestaurantAuth | null>({
    queryKey: ["/api/restaurant"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Add a query to check if the restaurant profile is complete
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/restaurant/profile", restaurant?.id],
    queryFn: async () => {
      if (!restaurant) return null;
      const res = await apiRequest("GET", `/api/restaurant/profile/${restaurant.id}`);
      return res.json();
    },
    enabled: !!restaurant,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/restaurant/login", credentials);
      return await res.json();
    },
    onSuccess: (restaurant: RestaurantAuth) => {
      queryClient.setQueryData(["/api/restaurant"], restaurant);
      // Invalidate the profile query to ensure we get fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/profile", restaurant.id] });
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
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/restaurant"], null);
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
        isProfileComplete: !!profile?.isProfileComplete,
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