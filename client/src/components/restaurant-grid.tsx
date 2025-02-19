import { useQuery } from "@tanstack/react-query";
import { Restaurant } from "@shared/schema";
import { RestaurantCard } from "./restaurant-card";
import { Skeleton } from "@/components/ui/skeleton";

interface RestaurantGridProps {
  searchQuery?: string;
  cityFilter?: string;
  cuisineFilter?: string;
  priceFilter?: string;
}

export function RestaurantGrid({ searchQuery, cityFilter, cuisineFilter, priceFilter }: RestaurantGridProps) {
  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants", searchQuery, cityFilter, cuisineFilter, priceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (cityFilter && cityFilter !== 'all') params.append("city", cityFilter);
      if (cuisineFilter && cuisineFilter !== 'all') params.append("cuisine", cuisineFilter);
      if (priceFilter && priceFilter !== 'all') params.append("priceRange", priceFilter);

      const url = `/api/restaurants${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch restaurants");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        ))}
      </div>
    );
  }

  // Create an array of all branches and filter by city if needed
  const branches = restaurants?.flatMap((restaurant) =>
    restaurant.locations.map((location, index) => ({
      restaurant,
      branchIndex: index,
      city: location.city
    }))
  ).filter(branch => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = branch.restaurant.name.toLowerCase().includes(query);
      const matchesCuisine = branch.restaurant.cuisine.toLowerCase().includes(query);
      const matchesLocation = branch.restaurant.locations[branch.branchIndex].address.toLowerCase().includes(query);
      if (!matchesName && !matchesCuisine && !matchesLocation) {
        return false;
      }
    }

    // Apply city filter
    if (cityFilter && cityFilter !== 'all') {
      if (branch.city !== cityFilter) {
        return false;
      }
    }

    // Apply cuisine filter
    if (cuisineFilter && cuisineFilter !== 'all') {
      if (branch.restaurant.cuisine !== cuisineFilter) {
        return false;
      }
    }

    // Apply price range filter
    if (priceFilter && priceFilter !== 'all') {
      if (branch.restaurant.priceRange !== priceFilter) {
        return false;
      }
    }

    return true;
  }) || [];

  if (branches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No restaurant branches found
          {searchQuery ? " matching your search" : ""}
          {cityFilter && cityFilter !== 'all' ? ` in ${cityFilter}` : ""}
          {cuisineFilter && cuisineFilter !== 'all' ? ` serving ${cuisineFilter} cuisine` : ""}
          {priceFilter && priceFilter !== 'all' ? ` in ${priceFilter} price range` : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {branches.map(({ restaurant, branchIndex }) => (
        <RestaurantCard
          key={`${restaurant.id}-${branchIndex}`}
          restaurant={restaurant}
          branchIndex={branchIndex}
        />
      ))}
    </div>
  );
}
