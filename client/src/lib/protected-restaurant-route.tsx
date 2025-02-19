import { useRestaurantAuth } from "@/hooks/use-restaurant-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRestaurantRoute({
  path,
  component: Component,
  requiresProfile = true,
}: {
  path: string;
  component: () => React.JSX.Element;
  requiresProfile?: boolean;
}) {
  const { restaurant, isProfileComplete, isLoading } = useRestaurantAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // Only redirect to auth if not authenticated and not loading
  if (!restaurant) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if profile is required and complete
  if (requiresProfile && !isProfileComplete) {
    return (
      <Route path={path}>
        <Redirect to="/restaurant/profile-setup" />
      </Route>
    );
  }

  // If we reach here, render the protected component
  return <Route path={path} component={Component} />;
}