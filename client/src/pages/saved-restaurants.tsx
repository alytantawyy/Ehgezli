import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Restaurant, RestaurantBranch, AvailableSlot } from "server/db/schema";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, CalendarIcon, Users } from "lucide-react";
import { RestaurantCard } from "@/components/restaurant-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { format, parse, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { generateTimeSlots } from "@/utils/time-slots";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SavedRestaurant {
  id: number;
  restaurantId: number;
  branchIndex: number;
  restaurant: Restaurant & {
    branches: (RestaurantBranch & {
      availableSlots?: AvailableSlot[];
    })[];
  };
}

export default function SavedRestaurantsPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>("19:00");
  const [partySize, setPartySize] = useState(2);
  const queryClient = useQueryClient();

  const { data: savedRestaurants, isLoading } = useQuery<SavedRestaurant[]>({
    queryKey: ["/api/saved-restaurants"],
    queryFn: async () => {
      const response = await fetch("/api/saved-restaurants", {
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch saved restaurants");
      }
      return response.json();
    }
  });

  // Generate time slots for the selector
  const timeSlots = generateTimeSlots();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <h1 className="text-2xl font-bold mb-6">Saved Restaurants</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>

      <h1 className="text-2xl font-bold mb-6">Saved Restaurants</h1>

      {/* Date, Time, and Party Size Selectors */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Date Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "MMM d") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Time Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {time ? format(parse(time, "HH:mm", new Date()), "h:mm a") : <span>Select time</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-0" align="start">
            <ScrollArea className="h-80">
              <div className="grid grid-cols-1 gap-1 p-2">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.value}
                    variant={time === slot.value ? "default" : "ghost"}
                    className="justify-start font-normal"
                    onClick={() => {
                      setTime(slot.value);
                    }}
                  >
                    {slot.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Party Size Selector */}
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <Input
            type="number"
            value={partySize}
            onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
            className="w-16"
            min="1"
            max="20"
          />
          {/* <span className="text-sm text-muted-foreground">People</span> */}
        </div>
      </div>

      {savedRestaurants && savedRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedRestaurants.map((saved) => (
            <RestaurantCard
              key={`${saved.restaurantId}-${saved.branchIndex}`}
              restaurant={saved.restaurant}
              branchIndex={saved.branchIndex}
            >
              {/* Time slot buttons */}
              {saved.restaurant.branches && saved.restaurant.branches[saved.branchIndex]?.availableSlots ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {saved.restaurant.branches[saved.branchIndex].availableSlots!
                    .slice(0, 3)
                    .map((slot: AvailableSlot) => (
                      <Button
                        key={slot.time}
                        variant="outline"
                        className="flex-1 py-1 h-auto text-sm"
                        asChild
                      >
                        <Link
                          to={`/book/${saved.restaurant.id}/${saved.branchIndex}?date=${date?.toISOString()}&time=${slot.time}&partySize=${partySize}`}
                        >
                          {format(parse(slot.time, "HH:mm", new Date()), "h:mm a")}
                        </Link>
                      </Button>
                    ))}
                </div>
              ) : null}
            </RestaurantCard>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">
            You haven't saved any restaurants yet
          </p>
          <Button asChild>
            <Link to="/">Browse Restaurants</Link>
          </Button>
        </div>
      )}
    </div>
  );
}