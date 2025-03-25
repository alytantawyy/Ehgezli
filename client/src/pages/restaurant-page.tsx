import { useQuery } from "@tanstack/react-query";
import { Restaurant } from "@shared/schema";
import { useRoute, useLocation } from "wouter";
import { BookingForm } from "@/components/booking-form";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Clock, MapPin, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Assumed implementation of apiRequest function.  This needs to be adjusted based on your actual implementation.
async function apiRequest(method: string, url: string, body?: any) {
  const headers = {
    'Content-Type': 'application/json',
    // Add authentication headers here if needed.  e.g., 'Authorization': `Bearer ${token}`
  };

  const options: RequestInit = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  return response;
}


export default function RestaurantPage() {
  const [, params] = useRoute("/restaurant/:id");
  const [, setLocation] = useLocation();
  const restaurantId = parseInt(params?.id || "0");
  const branchIndex = parseInt(new URLSearchParams(window.location.search).get("branch") || "0");

  const { data: restaurant, isLoading, error } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", restaurantId],
    enabled: restaurantId > 0,
    retry: 1,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/restaurants/${restaurantId}`);
      if (!response.ok) throw new Error('Failed to fetch restaurant');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" asChild className="mb-8">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Restaurants
            </Link>
          </Button>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <Skeleton className="h-64 w-full mb-6" />
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Restaurant page error:', error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Restaurant</h2>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Restaurants
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!restaurant || !restaurant.branches?.[branchIndex]) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-xl text-destructive">Restaurant or branch not found</div>
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  const branch = restaurant.branches[branchIndex];

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div className="flex items-start gap-8">
          <div className="flex-1">
            {restaurant.profile?.logo && (
              <div
                className="w-full h-64 bg-center bg-cover rounded-lg"
                style={{ backgroundImage: `url(${restaurant.profile.logo})` }}
              />
            )}
            <div className="mt-6 space-y-4">
              <h1 className="text-4xl font-bold">{restaurant.name}</h1>
              <div className="flex items-center gap-4">
                <span className="text-sm">{restaurant.profile?.priceRange}</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">About</h2>
                <span className="text-foreground">{restaurant.profile?.about || restaurant.profile?.description}</span>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-6">Make a Reservation</h2>
            <BookingForm 
              restaurantId={restaurant.id}
              branchIndex={branchIndex}
              openingTime={branch.openingTime}
              closingTime={branch.closingTime}
            />
          </div>
        </div>
      </div>
    </div>
  );
}