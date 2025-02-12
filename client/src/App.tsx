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
import RestaurantProfileSetup from "@/pages/restaurant-profile-setup";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/restaurant/:id" component={RestaurantPage} />
      <ProtectedRoute path="/restaurant/profile-setup" component={RestaurantProfileSetup} />
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