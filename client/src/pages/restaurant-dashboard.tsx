import { useRestaurantAuth } from "@/hooks/use-restaurant-auth";
import { useQuery } from "@tanstack/react-query";
import { Booking } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function RestaurantDashboard() {
  const { restaurant } = useRestaurantAuth();

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/restaurant/bookings", restaurant?.id],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Restaurant Dashboard</h1>
          <div className="text-sm text-muted-foreground">
            Welcome back, {restaurant?.name}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {bookings?.length || 0}
              </div>
            </CardContent>
          </Card>
          
          {/* Add more summary cards here */}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings && bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        Booking #{booking.id}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(booking.date).toLocaleString()}
                      </div>
                      <div className="text-sm">
                        Party size: {booking.partySize}
                      </div>
                    </div>
                    <Button variant="outline">
                      {booking.confirmed ? "Confirmed" : "Confirm"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No bookings yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
