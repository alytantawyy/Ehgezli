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
import { MapPin } from "lucide-react";

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
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
        </CardTitle>
        <p className="text-sm font-medium text-muted-foreground">{restaurant.cuisine} Cuisine</p>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{restaurant.description}</p>
        <div className="space-y-2">
          <p className="text-sm font-semibold">Branches:</p>
          {restaurant.locations?.map((location, index) => (
            <div key={index} className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{location.address}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/restaurant/${restaurant.id}`}>
            Book a Table
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}