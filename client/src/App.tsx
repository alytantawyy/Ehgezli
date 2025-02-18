import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { RestaurantAuthProvider } from "@/hooks/use-restaurant-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import RestaurantPage from "@/pages/restaurant-page";
import RestaurantDashboard from "@/pages/restaurant-dashboard";
import RestaurantProfileSetup from "@/pages/restaurant-profile-setup";
import UserBookings from "@/pages/user-bookings";
import SavedRestaurants from "@/pages/saved-restaurants";
import PreviousBookings from "@/pages/previous-bookings";
import { ProtectedRoute } from "./lib/protected-route";
import { ProtectedRestaurantRoute } from "./lib/protected-restaurant-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRestaurantRoute 
        path="/restaurant/profile-setup" 
        component={RestaurantProfileSetup}
        requiresProfile={false}
      />
      <ProtectedRestaurantRoute
        path="/restaurant/profile"
        component={RestaurantProfileSetup}
      />
      <ProtectedRestaurantRoute
        path="/restaurant/dashboard"
        component={RestaurantDashboard}
      />
      <ProtectedRestaurantRoute
        path="/restaurant/previous-bookings"
        component={PreviousBookings}
      />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/restaurant/:id" component={RestaurantPage} />
      <ProtectedRoute path="/bookings" component={UserBookings} />
      <ProtectedRoute path="/saved-restaurants" component={SavedRestaurants} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RestaurantAuthProvider>
          <Router />
          <Toaster />
        </RestaurantAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;