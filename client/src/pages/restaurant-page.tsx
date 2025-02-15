import { useQuery } from "@tanstack/react-query";
import { Restaurant } from "@shared/schema";
import { useRoute, useLocation } from "wouter";
import { BookingForm } from "@/components/booking-form";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Clock, MapPin, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
      const response = await fetch(`/api/restaurants/${restaurantId}`);
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

  if (!restaurant || !restaurant.locations?.[branchIndex]) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Restaurant Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested restaurant or branch could not be found.</p>
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

  const branch = restaurant.locations[branchIndex];

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
            {restaurant.logo && (
              <div
                className="h-64 rounded-lg bg-cover bg-center mb-6"
                style={{ backgroundImage: `url(${restaurant.logo})` }}
              />
            )}

            <h1 className="text-3xl font-bold mb-4">{restaurant.name}</h1>

            <div className="flex gap-4 mb-6">
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{branch.address}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm">{branch.openingTime} - {branch.closingTime}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <DollarSign className="h-4 w-4 mr-1" />
                <span className="text-sm">$$</span>
              </div>
            </div>

            <p className="text-muted-foreground mb-6">
              {restaurant.about || restaurant.description}
            </p>
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