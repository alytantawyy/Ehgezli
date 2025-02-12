import { useQuery } from "@tanstack/react-query";
import { Restaurant } from "@shared/schema";
import { RestaurantCard } from "./restaurant-card";
import { Skeleton } from "@/components/ui/skeleton";

interface RestaurantGridProps {
  searchQuery?: string;
}

export function RestaurantGrid({ searchQuery }: RestaurantGridProps) {
  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants", searchQuery],
    queryFn: async () => {
      const url = searchQuery
        ? `/api/restaurants?q=${encodeURIComponent(searchQuery)}`
        : "/api/restaurants";
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

  if (restaurants?.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No restaurants found{searchQuery ? " matching your search" : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {restaurants?.map((restaurant) => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
}