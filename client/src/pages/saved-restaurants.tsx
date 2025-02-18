import { useQuery } from "@tanstack/react-query";
import { Restaurant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { RestaurantCard } from "@/components/restaurant-card";
import { Skeleton } from "@/components/ui/skeleton";

interface SavedRestaurant {
  restaurantId: number;
  branchIndex: number;
  restaurant: Restaurant;
}

export default function SavedRestaurantsPage() {
  const { data: savedRestaurants, isLoading } = useQuery<SavedRestaurant[]>({
    queryKey: ["/api/saved-restaurants"],
    queryFn: async () => {
      const response = await fetch("/api/saved-restaurants", {
        credentials: 'include' // Add this to ensure cookies are sent
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch saved restaurants");
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <h1 className="text-2xl font-bold mb-6">Saved Restaurants</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>

      <h1 className="text-2xl font-bold mb-6">Saved Restaurants</h1>

      {savedRestaurants && savedRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedRestaurants.map((saved) => (
            <RestaurantCard
              key={`${saved.restaurantId}-${saved.branchIndex}`}
              restaurant={saved.restaurant}
              branchIndex={saved.branchIndex}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">
            You haven't saved any restaurants yet
          </p>
          <Button asChild>
            <Link to="/">Browse Restaurants</Link>
          </Button>
        </div>
      )}
    </div>
  );
}