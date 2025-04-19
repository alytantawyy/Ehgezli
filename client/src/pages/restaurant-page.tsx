import { useQuery } from "@tanstack/react-query";
import { Restaurant } from "server/db/schema";
import { useRoute, useLocation } from "wouter";
import { BookingForm } from "@/components/booking-form";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Clock, MapPin, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

async function apiRequest(method: string, url: string, body?: any) {
  console.log('[Debug] Making request:', { method, url });
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include', // Important for auth
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log('[Debug] Request options:', options);
  const response = await fetch(url, options);
  
  console.log('[Debug] Response headers:', {
    contentType: response.headers.get("content-type"),
    status: response.status,
    statusText: response.statusText
  });
  
  // Check if response is JSON
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const responseText = await response.text();
    console.error('[Debug] Non-JSON response:', responseText);
    throw new Error('Server returned non-JSON response');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Server error' }));
    console.error('[Debug] Error response:', errorData);
    throw new Error(errorData.message || 'Failed to fetch data');
  }

  const data = await response.json();
  console.log('[Debug] Success response:', data);
  return data;
}

export default function RestaurantPage() {
  const [, params] = useRoute("/restaurant/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const restaurantId = parseInt(params?.id || "0");
  const branchIndex = parseInt(new URLSearchParams(window.location.search).get("branch") || "0");
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const { data: restaurant, isLoading, error } = useQuery<Restaurant>({
    queryKey: ["/api/restaurant", restaurantId],
    enabled: restaurantId > 0,
    retry: (failureCount, error) => {
      // Don't retry on non-JSON responses
      if (error?.message === 'Server returned non-JSON response') {
        return false;
      }
      return failureCount < 2;
    },
    queryFn: async () => {
      try {
        return await apiRequest("GET", `/api/restaurant/${restaurantId}`);
      } catch (error) {
        if (!mountedRef.current) return null;
        console.error('Error fetching restaurant:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load restaurant",
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-8">
            <Button variant="ghost" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <Skeleton className="h-64 w-full mb-6" />
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !restaurant || !restaurant.branches?.[branchIndex]) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Restaurant</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Restaurant or branch not found"}
          </p>
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const branch = restaurant.branches[branchIndex];

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            {/* Restaurant Logo */}
            {restaurant.profile?.logo && (
              <div
                className="w-full h-64 bg-center bg-cover rounded-lg"
                style={{ backgroundImage: `url(${restaurant.profile.logo})` }}
              />
            )}

            <div className="mt-6 space-y-4">
              {/* Restaurant Name */}
              <h1 className="text-4xl font-bold">{restaurant.name}</h1>

              {/* Cuisine & Price Range */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{restaurant.profile?.cuisine}</span>
                <span>•</span>
                <span>{restaurant.profile?.priceRange}</span>
              </div>

              {/* About / Description */}
              {restaurant.profile?.about || restaurant.profile?.description ? (
                <div>
                  <h2 className="text-lg font-semibold">About</h2>
                  <p className="text-foreground">
                    {restaurant.profile?.about || restaurant.profile?.description}
                  </p>
                </div>
              ) : null}

              {/* Address (with icon) */}
              {branch.address && (
                <div>
                  <h2 className="text-lg font-semibold">Address</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {/* Use an icon for location */}
                    <MapPin className="h-4 w-4" />
                    <span>{branch.address}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-6">Make a Reservation</h2>
            <BookingForm 
              restaurantId={restaurant.id}
              branchIndex={branchIndex}
              openingTime={branch.openingTime}
              closingTime={branch.closingTime}
            />
          </div>
        </div>
      </div>
    </div>
  );
}