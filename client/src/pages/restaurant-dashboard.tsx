import { useRestaurantAuth } from "@/hooks/use-restaurant-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Booking, Restaurant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, Settings } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// Update Booking interface to include user info
interface BookingWithUser extends Booking {
  user?: {
    firstName: string;
    lastName: string;
  };
}

export default function RestaurantDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { restaurant: auth, logoutMutation } = useRestaurantAuth();

  // Fetch complete restaurant data including locations
  const { data: restaurant, isLoading: isRestaurantLoading } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", auth?.id],
    queryFn: async () => {
      if (!auth?.id) throw new Error("No restaurant ID");
      const response = await fetch(`/api/restaurants/${auth.id}`);
      if (!response.ok) throw new Error('Failed to fetch restaurant');
      return response.json();
    },
    enabled: !!auth?.id,
  });

  // Update type for bookings to include user info
  const { data: bookings, isLoading: isBookingsLoading } = useQuery<BookingWithUser[]>({
    queryKey: ["/api/restaurant/bookings", auth?.id],
    queryFn: async () => {
      if (!auth?.id) throw new Error("No restaurant ID");
      const response = await fetch(`/api/restaurant/bookings/${auth.id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch bookings');
      }
      return response.json();
    },
    enabled: !!auth?.id,
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await fetch(`/api/restaurant/bookings/${bookingId}/cancel`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel booking');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/bookings", auth?.id] });
      toast({
        title: "Booking Cancelled",
        description: "The booking has been cancelled successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = isRestaurantLoading || isBookingsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Filter for upcoming bookings and sort by date
  const now = new Date();
  const upcomingBookings = bookings
    ?.filter(booking => new Date(booking.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  const todayBookings = upcomingBookings
    .filter(booking => format(new Date(booking.date), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Restaurant Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Welcome back, {auth?.name}
            </div>
            <Button 
              variant="outline" 
              asChild
            >
              <Link to="/restaurant/profile">
                <Settings className="h-4 w-4 mr-2" />
                My Restaurant
              </Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Today's Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {todayBookings.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {upcomingBookings.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {restaurant?.locations?.reduce((sum, loc) => sum + loc.tablesCount, 0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Latest Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBookings && upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : `Booking #${booking.id}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(booking.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                      </div>
                      <div className="text-sm">
                        Party size: {booking.partySize}
                      </div>
                    </div>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to cancel this booking?')) {
                          cancelBookingMutation.mutate(booking.id);
                        }
                      }}
                      disabled={!booking.confirmed || cancelBookingMutation.isPending}
                    >
                      {booking.confirmed ? "Cancel Booking" : "Cancelled"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming bookings
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}