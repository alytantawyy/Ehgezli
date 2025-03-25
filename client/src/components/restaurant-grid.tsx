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
    queryKey: ["restaurants", searchQuery, cityFilter, cuisineFilter, priceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (cityFilter && cityFilter !== 'all') params.append("city", cityFilter);
      if (cuisineFilter && cuisineFilter !== 'all') params.append("cuisine", cuisineFilter);
      if (priceFilter && priceFilter !== 'all') params.append("priceRange", priceFilter);

      const url = `/api/restaurants${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch restaurants' }));
        throw new Error(error.message || 'Failed to fetch restaurants');
      }
      
      return response.json();
    },
    retry: 1, // Only retry once
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
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

  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No restaurants found
        </p>
      </div>
    );
  }

  // Flatten restaurants into branch cards
  const branchCards = restaurants?.flatMap((restaurant) =>
    restaurant.branches?.map((branch, index) => ({
      restaurant,
      branchIndex: index,
    })) || []
  ) || [];

  if (branchCards.length === 0) {
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
      {branchCards.map(({ restaurant, branchIndex }) => (
        <RestaurantCard
          key={`${restaurant.id}-${branchIndex}`}
          restaurant={restaurant}
          branchIndex={branchIndex}
        />
      ))}
    </div>
  );
}
