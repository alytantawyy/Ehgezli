import { useQuery } from "@tanstack/react-query";
import { RestaurantWithAvailability, AvailableSlot } from "@shared/schema";
import { RestaurantCard } from "./restaurant-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { format, parse } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

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
  const { user } = useAuth();

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

  // Query for saved restaurants - always fetch this for ordering
  const { data: savedRestaurants, isLoading: isSavedLoading } = useQuery<{ restaurantId: number; branchIndex: number }[]>({
    queryKey: ["/api/saved-restaurants"],
    queryFn: async () => {
      const response = await fetch("/api/saved-restaurants", { credentials: 'include' });
      if (!response.ok) {
        // If not logged in or other error, return empty array
        if (response.status === 401 || response.status === 403) {
          return [];
        }
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch saved restaurants");
      }
      return response.json();
    },
    enabled: !!user // Only run this query when user is logged in
  });

  // Query for user profile to get city and favorite cuisines
  const { data: userProfile } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const response = await fetch("/api/profile", { credentials: 'include' });
      if (!response.ok) {
        // If not logged in or other error, return null
        if (response.status === 401 || response.status === 403) {
          return null;
        }
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch user profile");
      }
      return response.json();
    },
    enabled: !!user // Only run this query when user is logged in
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
  } else if (savedRestaurants && userProfile) {
    // When not in saved-only mode, sort restaurants by priority:
    // 1. Saved restaurants first
    // 2. Restaurants in user's city
    // 3. Restaurants with user's preferred cuisines

    // Create a map of saved restaurant IDs and branch indexes for quick lookup
    const savedMap = new Map();
    savedRestaurants.forEach(saved => {
      // Use both restaurant ID and branch index as the key
      savedMap.set(`${saved.restaurantId}-${saved.branchIndex}`, true);
    });

    console.log("DEBUG - Saved restaurants:", savedRestaurants);
    console.log("DEBUG - Saved map:", [...savedMap.entries()]);
    console.log("DEBUG - User profile:", userProfile);

    const userCity = userProfile.city;
    const userCuisines = userProfile.favoriteCuisines || [];

    console.log("DEBUG - User city:", userCity);
    console.log("DEBUG - User cuisines:", userCuisines);
    console.log("DEBUG - Restaurants before sorting:", displayedRestaurants.map(r => ({ id: r.id, name: r.name })));

    // Sort restaurants based on priority
    displayedRestaurants = [...displayedRestaurants].sort((a, b) => {
      // Check if any branch of restaurant is saved
      const aHasSavedBranch = a.branches.some((_, branchIndex) => savedMap.has(`${a.id}-${branchIndex}`));
      const bHasSavedBranch = b.branches.some((_, branchIndex) => savedMap.has(`${b.id}-${branchIndex}`));

      console.log(`DEBUG - Comparing restaurants: ${a.id} (${a.name}) saved: ${aHasSavedBranch} vs ${b.id} (${b.name}) saved: ${bHasSavedBranch}`);

      // If one has a saved branch and the other doesn't, prioritize the one with the saved branch
      if (aHasSavedBranch && !bHasSavedBranch) return -1;
      if (!aHasSavedBranch && bHasSavedBranch) return 1;

      // If both have saved branches or both don't, check city
      const aInUserCity = a.branches.some(branch => branch.city === userCity);
      const bInUserCity = b.branches.some(branch => branch.city === userCity);

      console.log(`DEBUG - City match: ${a.id} (${a.name}) in user city: ${aInUserCity} vs ${b.id} (${b.name}) in user city: ${bInUserCity}`);

      // If one is in user's city and the other isn't, prioritize the one in user's city
      if (aInUserCity && !bInUserCity) return -1;
      if (!aInUserCity && bInUserCity) return 1;

      // If both are in user's city or both are not, check cuisines
      const aCuisine = a.profile?.cuisine || '';
      const bCuisine = b.profile?.cuisine || '';
      const aHasUserCuisine = userCuisines.includes(aCuisine);
      const bHasUserCuisine = userCuisines.includes(bCuisine);

      console.log(`DEBUG - Cuisine match: ${a.id} (${a.name}) cuisine: ${aCuisine} has user cuisine: ${aHasUserCuisine} vs ${b.id} (${b.name}) cuisine: ${bCuisine} has user cuisine: ${bHasUserCuisine}`);

      // If one has user's cuisine and the other doesn't, prioritize the one with user's cuisine
      if (aHasUserCuisine && !bHasUserCuisine) return -1;
      if (!aHasUserCuisine && bHasUserCuisine) return 1;

      // If all criteria are equal, maintain original order
      return 0;
    });

    console.log("DEBUG - Restaurants after sorting:", displayedRestaurants.map(r => ({ id: r.id, name: r.name })));
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
