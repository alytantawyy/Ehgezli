import { useQuery } from "@tanstack/react-query";
import { RestaurantWithAvailability, AvailableSlot } from "@shared/schema";
import { RestaurantCard } from "./restaurant-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface RestaurantGridProps {
  searchQuery?: string;
  cityFilter?: string;
  cuisineFilter?: string;
  priceFilter?: string;
  date?: Date;
  time?: string;
  partySize?: number;
}

export function RestaurantGrid({
  searchQuery,
  cityFilter,
  cuisineFilter,
  priceFilter,
  date,
  time,
  partySize
}: RestaurantGridProps) {
  console.log("[RestaurantGrid] rendering");
  const [, setLocation] = useLocation();

  const { data: restaurants, isLoading } = useQuery<RestaurantWithAvailability[]>({
    queryKey: ["restaurants", searchQuery, cityFilter, cuisineFilter, priceFilter, date, time, partySize],
    queryFn: async () => {
      console.log("[RestaurantGrid] Fetching with search query:", searchQuery);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (cityFilter && cityFilter !== 'all') params.append("city", cityFilter);
      if (cuisineFilter && cuisineFilter !== 'all') params.append("cuisine", cuisineFilter);
      if (priceFilter && priceFilter !== 'all') params.append("priceRange", priceFilter);
      if (date) params.append("date", date.toISOString());
      if (time) params.append("time", time);
      
      console.log("[RestaurantGrid] Fetching with params:", params.toString());
      // Always include partySize (defaults to 2 if not provided)
      params.append("partySize", (partySize || 2).toString());

      console.log("[RestaurantGrid] Fetching with params:", params.toString());

      // Always use availability endpoint to get time slots
      const response = await fetch(`/api/restaurants/availability?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }
      return response.json();
    },
    staleTime: 0, // Ensure data is always considered stale and will refetch
    refetchOnWindowFocus: false // Prevent refetching when window regains focus
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!restaurants?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No restaurants found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {restaurants.map((restaurant) => 
        restaurant.branches.map((branch, branchIndex) => {
          const slots = branch.availableSlots || [];
          return (
            <div key={`${restaurant.id}-${branchIndex}`} className="w-full max-w-[600px] mx-auto">
              <RestaurantCard
                restaurant={restaurant}
                branchIndex={branchIndex}
              >
                {slots.length > 0 && (
                  <div className="flex justify-center gap-3 mt-4">
                    {slots.map((slot: AvailableSlot) => (
                      <Button
                        key={`${branch.id}-${slot.time}`}
                        size="sm"
                        variant="ehgezli"
                        className="px-4 py-1.5 h-auto rounded font-medium text-sm min-w-[90px]"
                        onClick={() => setLocation(
                          `/restaurant/${restaurant.id}?date=${date?.toISOString()}&time=${slot.time}&partySize=${partySize}&branch=${branchIndex}`
                        )}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                )}
              </RestaurantCard>
            </div>
          );
        })
      )}
    </div>
  );
}
