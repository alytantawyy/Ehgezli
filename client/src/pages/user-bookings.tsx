import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Booking } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookingWithRestaurant extends Booking {
  restaurantName: string;
}

export default function UserBookings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: bookings, isLoading } = useQuery<BookingWithRestaurant[]>({
    queryKey: ["/api/bookings"],
    queryFn: async () => {
      const response = await fetch("/api/bookings");
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel booking');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const now = new Date();

  // Separate and sort bookings
  const upcomingBookings = bookings
    ?.filter(booking => new Date(booking.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  const previousBookings = bookings
    ?.filter(booking => new Date(booking.date) <= now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  const BookingTable = ({ bookings, showCancelButton = false }: { bookings: BookingWithRestaurant[], showCancelButton?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Restaurant</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Party Size</TableHead>
          <TableHead>Status</TableHead>
          {showCancelButton && <TableHead className="w-[100px]">Action</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>{booking.restaurantName}</TableCell>
            <TableCell>{format(new Date(booking.date), "PPP")}</TableCell>
            <TableCell>{format(new Date(booking.date), "p")}</TableCell>
            <TableCell>{booking.partySize}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-sm ${
                !booking.confirmed 
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}>
                {!booking.confirmed ? "Cancelled" : "Confirmed"}
              </span>
            </TableCell>
            {showCancelButton && booking.confirmed && (
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel this booking?')) {
                      cancelBookingMutation.mutate(booking.id);
                    }
                  }}
                  disabled={cancelBookingMutation.isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>

      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Upcoming Bookings</h2>
          {upcomingBookings.length > 0 ? (
            <BookingTable bookings={upcomingBookings} showCancelButton={true} />
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-lg text-muted-foreground">No upcoming bookings</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Previous Bookings</h2>
          {previousBookings.length > 0 ? (
            <BookingTable bookings={previousBookings} />
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-lg text-muted-foreground">No previous bookings</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}