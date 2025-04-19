import { useQuery, useMutation } from "@tanstack/react-query";
import { Booking } from "server/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Clock } from "lucide-react";
import { format, isBefore } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useRestaurantAuth } from "@/hooks/use-restaurant-auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BookingWithDetails extends Booking {
  user?: {
    firstName: string;
    lastName: string;
  } | null;
  branch: {
    address: string;
    city: string;
  };
}

export default function PreviousBookingsPage() {
  const { restaurant: auth } = useRestaurantAuth();
  const { toast } = useToast();

  const { data: bookings, isLoading } = useQuery<BookingWithDetails[]>({
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

  const cancelMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/bookings"] });
      toast({
        title: "Booking Cancelled",
        description: "The booking has been cancelled successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/restaurant/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-bold mb-6">Previous Bookings</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[100px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Filter for completed bookings
  const previousBookings = bookings?.filter(booking => 
    booking.completed || (!booking.confirmed && isBefore(new Date(booking.date), new Date()))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/restaurant/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Previous Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {previousBookings && previousBookings.length > 0 ? (
            <div className="space-y-4">
              {previousBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {booking.user ?
                        `${booking.user.firstName} ${booking.user.lastName}` :
                        `Guest Booking #${booking.id}`
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(booking.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                    </div>
                    <div className="text-sm">
                      Party size: {booking.partySize}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Branch: {booking.branch.address}, {booking.branch.city}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{booking.completed ? "Completed" : "Cancelled"}</span>
                    </div>
                    {!booking.completed && booking.confirmed && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => cancelMutation.mutate(booking.id)}
                        disabled={cancelMutation.isPending}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No previous bookings found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}