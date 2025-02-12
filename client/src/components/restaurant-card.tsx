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

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Card className="overflow-hidden">
      <div
        className="h-48 bg-cover bg-center"
        style={{ backgroundImage: `url(${restaurant.image})` }}
      />
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{restaurant.name}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {restaurant.priceRange}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{restaurant.description}</p>
        <p className="text-sm mt-2 font-medium">{restaurant.cuisine} Cuisine</p>
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
