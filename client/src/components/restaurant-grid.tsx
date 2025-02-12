import { useQuery } from "@tanstack/react-query";
import { Restaurant } from "@shared/schema";
import { RestaurantCard } from "./restaurant-card";
import { Skeleton } from "@/components/ui/skeleton";

interface RestaurantGridProps {
  searchQuery?: string;
  cityFilter?: string;
}

export function RestaurantGrid({ searchQuery, cityFilter }: RestaurantGridProps) {
  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants", searchQuery, cityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (cityFilter && cityFilter !== 'all') params.append("city", cityFilter);

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

  // Create an array of all branches
  const branches = restaurants?.flatMap((restaurant) => 
    restaurant.locations.map((_, index) => ({
      restaurant,
      branchIndex: index
    }))
  ).filter(branch => {
    if (!cityFilter || cityFilter === 'all') return true;
    const branchCity = branch.restaurant.locations[branch.branchIndex].address
      .split(',')
      .pop()
      ?.trim();
    return branchCity === cityFilter;
  }) || [];

  if (branches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No restaurant branches found
          {searchQuery ? " matching your search" : ""}
          {cityFilter && cityFilter !== 'all' ? ` in ${cityFilter}` : ""}
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