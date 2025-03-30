import { useQuery } from "@tanstack/react-query";
import { RestaurantWithAvailability, AvailableSlot } from "@shared/schema";
import { RestaurantCard } from "./restaurant-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { format, parse } from "date-fns";

interface RestaurantGridProps {
  searchQuery?: string;
  cityFilter?: string;
  cuisineFilter?: string;
  priceFilter?: string;
  date?: Date;
  time?: string;
  partySize?: number;
  showSavedOnly?: boolean;
}

export function RestaurantGrid({
  searchQuery,
  cityFilter,
  cuisineFilter,
  priceFilter,
  date,
  time,
  partySize,
  showSavedOnly = false
}: RestaurantGridProps) {
  console.log("[RestaurantGrid] rendering", { showSavedOnly });
  const [, setLocation] = useLocation();

  // Query for all restaurants with availability
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

  // Query for saved restaurants when showSavedOnly is true
  const { data: savedRestaurants, isLoading: isSavedLoading } = useQuery<{ restaurantId: number; branchIndex: number }[]>({
    queryKey: ["/api/saved-restaurants"],
    queryFn: async () => {
      const response = await fetch("/api/saved-restaurants", { credentials: 'include' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch saved restaurants");
      }
      return response.json();
    },
    enabled: showSavedOnly // Only run this query when showSavedOnly is true
  });

  // Loading state
  if (isLoading || (showSavedOnly && isSavedLoading)) {
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

  // Filter restaurants based on saved status if needed
  let displayedRestaurants = restaurants || [];
  
  if (showSavedOnly && savedRestaurants) {
    // Create a map of saved restaurant IDs and branch indexes for quick lookup
    const savedMap = new Map();
    savedRestaurants.forEach(saved => {
      savedMap.set(`${saved.restaurantId}-${saved.branchIndex}`, true);
    });
    
    // Filter the restaurants to only include saved ones
    displayedRestaurants = displayedRestaurants.filter(restaurant => {
      // Keep the restaurant if any of its branches are saved
      return restaurant.branches.some((_, branchIndex) => {
        return savedMap.has(`${restaurant.id}-${branchIndex}`);
      });
    });

    // For each restaurant, only keep the saved branches
    displayedRestaurants = displayedRestaurants.map(restaurant => ({
      ...restaurant,
      branches: restaurant.branches.filter((_, branchIndex) => {
        return savedMap.has(`${restaurant.id}-${branchIndex}`);
      })
    }));
  }

  if (!displayedRestaurants?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {showSavedOnly 
            ? "You haven't saved any restaurants yet." 
            : "No restaurants found matching your criteria."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {displayedRestaurants.map((restaurant) => 
        restaurant.branches.map((branch, branchIndex) => {
          const slots = branch.availableSlots || [];
          return (
            <div key={`${restaurant.id}-${branchIndex}`} className="w-full max-w-[600px] mx-auto">
              <RestaurantCard
                restaurant={restaurant}
                branchIndex={branchIndex}
                date={date}
                time={time}
                partySize={partySize}
              >
                {slots.length > 0 && (
                  <div className="flex justify-center gap-3 mt-4">
                    {slots.map((slot: AvailableSlot) => {
                      const time = parse(slot.time, 'HH:mm', new Date());
                      return (
                        <Button
                          key={`${branch.id}-${slot.time}`}
                          size="sm"
                          variant="ehgezli"
                          className="px-4 py-1.5 h-auto rounded font-medium text-sm min-w-[90px]"
                          onClick={(e) => {
                            // Stop propagation to prevent card click when clicking the time slot button
                            e.stopPropagation();
                            setLocation(
                              `/restaurant/${restaurant.id}?date=${date?.toISOString()}&time=${slot.time}&partySize=${partySize}&branch=${branchIndex}`
                            );
                          }}
                        >
                          {format(time, 'h:mm a')}
                        </Button>
                      );
                    })}
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
