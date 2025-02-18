import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Restaurant } from "@shared/schema";
import { Link } from "wouter";
import { MapPin, Bookmark } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RestaurantBranchCardProps {
  restaurant: Restaurant;
  branchIndex: number;
}

export function RestaurantCard({ restaurant, branchIndex }: RestaurantBranchCardProps) {
  const branch = restaurant.locations?.[branchIndex];
  const { toast } = useToast();

  if (!branch) return null;

  const { data: savedStatus } = useQuery({
    queryKey: ['/api/saved-restaurants', restaurant.id, branchIndex],
    queryFn: async () => {
      const response = await fetch(`/api/saved-restaurants/${restaurant.id}/${branchIndex}`);
      if (!response.ok) return false;
      return response.json();
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/saved-restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restaurantId: restaurant.id, branchIndex }),
      });
      if (!response.ok) throw new Error('Failed to save restaurant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-restaurants'] });
      toast({
        title: "Restaurant Saved",
        description: "This restaurant has been added to your saved list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save restaurant. Please try again.",
        variant: "destructive",
      });
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/saved-restaurants/${restaurant.id}/${branchIndex}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to unsave restaurant');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-restaurants'] });
      toast({
        title: "Restaurant Removed",
        description: "This restaurant has been removed from your saved list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove restaurant. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveToggle = () => {
    if (savedStatus) {
      unsaveMutation.mutate();
    } else {
      saveMutation.mutate();
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="h-48 bg-muted flex items-center justify-center">
        {restaurant.logo ? (
          <img
            src={restaurant.logo}
            alt={`${restaurant.name} logo`}
            className="h-full w-full object-contain p-4"
          />
        ) : (
          <div className="text-muted-foreground">No logo available</div>
        )}
      </div>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{restaurant.name}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSaveToggle}
            disabled={saveMutation.isPending || unsaveMutation.isPending}
            className={savedStatus ? "text-primary" : ""}
          >
            <Bookmark className="h-5 w-5" fill={savedStatus ? "currentColor" : "none"} />
          </Button>
        </CardTitle>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{restaurant.cuisine} Cuisine</p>
          <p className="text-sm text-muted-foreground">Price Range: {restaurant.priceRange}</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{restaurant.description}</p>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{branch.address}</span>
          </div>
          <p className="text-sm font-medium">City: {branch.city}</p>
          <p className="text-sm">Tables: {branch.tablesCount}</p>
          <p className="text-sm">Opening Hours: {branch.openingTime} - {branch.closingTime}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/restaurant/${restaurant.id}?branch=${branchIndex}`}>
            Book a Table
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}