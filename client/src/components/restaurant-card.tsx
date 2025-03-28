import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, MapPin } from "lucide-react";
import { Restaurant } from "@shared/schema";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RestaurantCardProps {
  restaurant: Restaurant;
  branchIndex: number;
  children?: React.ReactNode;
}

export function RestaurantCard({
  restaurant,
  branchIndex,
  children
}: RestaurantCardProps) {
  const branch = restaurant.branches?.[branchIndex];
  const { toast } = useToast();

  if (!branch) return null;

  const [savedStatus, setSavedStatus] = useState(false);

  const handleSaveRestaurant = async () => {
    try {
      if (savedStatus) {
        await apiRequest("DELETE", `/api/saved-restaurants/${restaurant.id}/${branchIndex}`);
        setSavedStatus(false);
        toast({
          title: "Restaurant removed from saved list",
          variant: "default",
        });
      } else {
        await apiRequest("POST", "/api/saved-restaurants", {
          restaurantId: restaurant.id,
          branchIndex
        });
        setSavedStatus(true);
        toast({
          title: "Restaurant saved successfully",
          variant: "default",
        });
      }

      // Invalidate saved restaurants query
      await queryClient.invalidateQueries({ queryKey: ["/api/saved-restaurants"] });
    } catch (error) {
      console.error("Error saving restaurant:", error);
      toast({
        title: "Error",
        description: "Failed to save restaurant. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden h-full">
      <div className="relative h-[180px] w-full">
        {restaurant.profile?.logo ? (
          <img
            src={restaurant.profile.logo}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <div className="text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
            </div>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold leading-tight mb-1 truncate">{restaurant.name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {restaurant.profile?.cuisine} • {restaurant.profile?.priceRange} • {branch.city}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSaveRestaurant}
              className="ml-2 mt-[-4px] flex-shrink-0"
            >
              <Bookmark className="h-5 w-5" fill={savedStatus ? "currentColor" : "none"} />
            </Button>
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{branch.address}</span>
          </div>

          {/* Time slots */}
          {children}
        </div>
      </CardContent>
    </Card>
  );
}