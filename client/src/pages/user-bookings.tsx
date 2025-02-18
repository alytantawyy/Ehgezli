import { useQuery } from "@tanstack/react-query";
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
import { ArrowLeft } from "lucide-react";

interface BookingWithRestaurant extends Booking {
  restaurantName: string;
}

export default function UserBookings() {
  const { data: bookings, isLoading } = useQuery<BookingWithRestaurant[]>({
    queryKey: ["/api/bookings"],
    queryFn: async () => {
      const response = await fetch("/api/bookings");
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
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

  const BookingTable = ({ bookings }: { bookings: BookingWithRestaurant[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Restaurant</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Party Size</TableHead>
          <TableHead>Status</TableHead>
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
                booking.confirmed 
                  ? "bg-green-100 text-green-800" 
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {booking.confirmed ? "Confirmed" : "Pending"}
              </span>
            </TableCell>
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
            <BookingTable bookings={upcomingBookings} />
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