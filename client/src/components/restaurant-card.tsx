import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardContent className="p-6">
        <div className="relative h-48 w-full mb-4">
          {restaurant.profile?.logo && (
            <img
              src={restaurant.profile.logo}
              alt={restaurant.name}
              className="w-full h-full object-cover rounded-md"
            />
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold">{restaurant.name}</h3>
          <p className="text-sm font-medium text-muted-foreground">{restaurant.profile?.cuisine} Cuisine</p>
          <p className="text-sm text-muted-foreground">Price Range: {restaurant.profile?.priceRange}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{branch.address}</span>
          </div>
          <p className="text-sm font-medium">City: {branch.city}</p>
          {children}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          variant="outline"
          size="icon"
          onClick={handleSaveRestaurant}
        >
          <Bookmark className="h-5 w-5" fill={savedStatus ? "currentColor" : "none"} />
        </Button>
      </CardFooter>
    </Card>
  );
}