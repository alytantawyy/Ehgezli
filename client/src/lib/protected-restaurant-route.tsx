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
  const { restaurant, isLoading } = useRestaurantAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // Always redirect to auth if not authenticated
  if (!restaurant) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // For routes that don't require profile (like profile setup),
  // render them directly
  if (!requiresProfile) {
    return <Route path={path} component={Component} />;
  }

  // For all other routes, show the dashboard if profile is not set up
  if (path !== "/restaurant/dashboard" && !restaurant.hasProfile) {
    return (
      <Route path={path}>
        <Redirect to="/restaurant/profile-setup" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}