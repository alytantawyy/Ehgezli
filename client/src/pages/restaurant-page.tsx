import { useQuery } from "@tanstack/react-query";
import { Restaurant } from "@shared/schema";
import { useRoute } from "wouter";
import { BookingForm } from "@/components/booking-form";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, MapPin, Clock, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RestaurantPage() {
  const [, params] = useRoute("/restaurant/:id");
  const restaurantId = parseInt(params?.id || "0");
  const branchIndex = parseInt(new URLSearchParams(window.location.search).get("branch") || "0");

  const { data: restaurant, isLoading } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", restaurantId],
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

  if (!restaurant || !restaurant.locations?.[branchIndex]) {
    return <div>Restaurant not found</div>;
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
            <div
              className="h-64 rounded-lg bg-cover bg-center mb-6"
              style={{ backgroundImage: `url(${restaurant.logo})` }}
            />

            <h1 className="text-3xl font-bold mb-4">{restaurant.name}</h1>

            <div className="flex gap-4 mb-6">
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{restaurant.cuisine} Cuisine</span>
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
              {restaurant.description}
            </p>

            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Additional Information</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Parking available</li>
                <li>• Wheelchair accessible</li>
                <li>• Outdoor seating</li>
                <li>• Takes reservations</li>
              </ul>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-6">Make a Reservation</h2>
            <BookingForm 
              restaurantId={restaurant.id} 
              openingTime={branch.openingTime} 
              closingTime={branch.closingTime}
            />
          </div>
        </div>
      </div>
    </div>
  );
}