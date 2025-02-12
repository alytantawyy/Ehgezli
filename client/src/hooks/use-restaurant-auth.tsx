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
    isLoading,
  } = useQuery<RestaurantAuth | null>({
    queryKey: ["/api/restaurant"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/restaurant/login", credentials);
      return await res.json();
    },
    onSuccess: (restaurant: RestaurantAuth) => {
      queryClient.setQueryData(["/api/restaurant"], restaurant);
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
