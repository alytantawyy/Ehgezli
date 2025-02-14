import { useRestaurantAuth } from "@/hooks/use-restaurant-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Booking, Restaurant, RestaurantBranch } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function RestaurantDashboard() {
  const { restaurant: auth, logoutMutation } = useRestaurantAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  // Fetch complete restaurant data including branches
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

  // Fetch bookings for all branches of this restaurant
  const { data: bookings, isLoading: isBookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/restaurant/bookings", auth?.id],
    queryFn: async () => {
      if (!auth?.id) throw new Error("No restaurant ID");
      console.log('Fetching bookings for restaurant:', auth.id);
      const response = await fetch(`/api/restaurant/bookings/${auth.id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch bookings');
      }
      const data = await response.json();
      console.log('Received bookings:', data);
      return data;
    },
    enabled: !!auth?.id,
  });

  // Mutation for confirming bookings
  const confirmBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await apiRequest(
        "POST",
        `/api/restaurant/bookings/${bookingId}/confirm`
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate bookings query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/bookings", auth?.id] });
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

  const now = new Date();
  const filteredBookings = bookings?.filter(booking => 
    !selectedBranchId || booking.branchId.toString() === selectedBranchId
  ) || [];

  const todayBookings = filteredBookings.filter(booking => 
    format(new Date(booking.date), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
  );

  const upcomingBookings = filteredBookings.filter(booking => 
    new Date(booking.date) > now
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const previousBookings = filteredBookings.filter(booking => 
    new Date(booking.date) < now
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group upcoming bookings by date
  const upcomingBookingsByDate = upcomingBookings.reduce((acc, booking) => {
    const date = format(new Date(booking.date), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

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
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select
            value={selectedBranchId}
            onValueChange={setSelectedBranchId}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Branches</SelectItem>
              {restaurant?.locations.map((location, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {location.address} ({location.city})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                {selectedBranchId 
                  ? restaurant?.locations[parseInt(selectedBranchId)]?.tablesCount
                  : restaurant?.locations?.reduce((sum, loc) => sum + loc.tablesCount, 0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Bookings Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(upcomingBookingsByDate).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(upcomingBookingsByDate).map(([date, bookings]) => (
                  <div key={date} className="space-y-4">
                    <h3 className="font-semibold">
                      {format(new Date(date), "EEEE, MMMM d, yyyy")}
                    </h3>
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
                              {format(new Date(booking.date), "h:mm a")}
                            </div>
                            <div className="text-sm">
                              Party size: {booking.partySize}
                            </div>
                          </div>
                          <Button 
                            variant={booking.confirmed ? "secondary" : "default"}
                            disabled={booking.confirmed || confirmBookingMutation.isPending}
                            onClick={() => confirmBookingMutation.mutate(booking.id)}
                          >
                            {booking.confirmed ? "Confirmed" : "Confirm"}
                          </Button>
                        </div>
                      ))}
                    </div>
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

        {/* Previous Bookings Section */}
        <Card>
          <CardHeader>
            <CardTitle>Previous Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {previousBookings.length > 0 ? (
              <div className="space-y-4">
                {previousBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        Booking #{booking.id}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(booking.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                      </div>
                      <div className="text-sm">
                        Party size: {booking.partySize}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {booking.confirmed ? "Confirmed" : "Not Confirmed"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No previous bookings
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}