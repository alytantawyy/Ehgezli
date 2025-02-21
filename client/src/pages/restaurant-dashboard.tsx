import { useRestaurantAuth } from "@/hooks/use-restaurant-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Booking, Restaurant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, Settings, CalendarIcon, Clock, Menu, History, Calendar, MoreVertical } from "lucide-react";
import { format, isBefore, isSameDay, addHours, isWithinInterval } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Calendar as Datepicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AddReservationModal } from "@/components/add-reservation-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BookingWithDetails extends Booking {
  user?: {
    firstName: string;
    lastName: string;
  } | null;
  branch: {
    address: string;
    city: string;
  };
  arrived: boolean; // Added: arrived is now a required field
}

const generateTimeSlots = (openingTime: string, closingTime: string, bookingDate?: Date) => {
  if (!openingTime || !closingTime) return [];

  const slots = [];
  const [openHour, openMinute] = openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = closingTime.split(':').map(Number);

  let startHour = openHour;
  let startMinute = openMinute;

  const now = new Date();
  if (bookingDate &&
    bookingDate.getDate() === now.getDate() &&
    bookingDate.getMonth() === now.getMonth() &&
    bookingDate.getFullYear() === now.getFullYear()) {
    startHour = now.getHours();
    startMinute = now.getMinutes();

    if (startMinute > 30) {
      startHour += 1;
      startMinute = 0;
    } else if (startMinute > 0) {
      startMinute = 30;
    }

    if (startHour < openHour || (startHour === openHour && startMinute < openMinute)) {
      startHour = openHour;
      startMinute = openMinute;
    }
  }

  let lastSlotHour = closeHour;
  let lastSlotMinute = closeMinute;

  // Don't allow bookings in the last hour
  lastSlotHour = lastSlotHour - 1;

  for (let hour = startHour; hour <= lastSlotHour; hour++) {
    for (let minute of [0, 30]) {
      if (hour === openHour && minute < openMinute) continue;
      if (hour === lastSlotHour && minute > lastSlotMinute) continue;
      if (hour === startHour && minute < startMinute) continue;

      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

export default function RestaurantDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { restaurant: auth, logoutMutation } = useRestaurantAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const now = new Date();

  useEffect(() => {
    if (!auth) {
      setLocation('/auth');
      return;
    }
  }, [auth, setLocation]);

  const { data: restaurant, isLoading: isRestaurantLoading } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", auth?.id],
    queryFn: async () => {
      if (!auth?.id) throw new Error("No restaurant ID");
      const response = await fetch(`/api/restaurants/${auth.id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch restaurant');
      return response.json();
    },
    enabled: !!auth?.id,
  });

  const { data: bookings, isLoading: isBookingsLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/restaurant/bookings", auth?.id],
    queryFn: async () => {
      if (!auth?.id) throw new Error("No restaurant ID");
      const response = await fetch(`/api/restaurant/bookings/${auth.id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch bookings');
      }
      return response.json();
    },
    enabled: !!auth?.id,
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await fetch(`/api/restaurant/bookings/${bookingId}/cancel`, {
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

  const markPartyArrivedMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await fetch(`/api/restaurant/bookings/${bookingId}/arrive`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark party as arrived');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/bookings", auth?.id] });
      toast({
        title: "Party Marked as Arrived",
        description: "The booking has been moved to Currently Seated.",
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

  useEffect(() => {
    if (restaurant?.locations && selectedBranch !== "all") {
      const selectedLocation = restaurant.locations.find(
        loc => loc.id.toString() === selectedBranch
      );
      if (selectedLocation) {
        const slots = generateTimeSlots(
          selectedLocation.openingTime,
          selectedLocation.closingTime,
          selectedDate
        );
        setTimeSlots(slots);
        if (selectedTime !== "all" && !slots.includes(selectedTime)) {
          setSelectedTime("all");
        }
      }
    }
  }, [selectedDate, selectedBranch, restaurant, selectedTime]);

  const isLoading = isRestaurantLoading || isBookingsLoading;

  if (!auth) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const filteredBookings = bookings?.filter(booking => {
    const bookingDate = new Date(booking.date);
    if (bookingDate < now) {
      return false;
    }

    if (selectedDate && !isSameDay(new Date(booking.date), selectedDate)) {
      return false;
    }

    if (selectedTime !== "all") {
      const bookingTime = format(new Date(booking.date), 'HH:mm');
      if (bookingTime !== selectedTime) {
        return false;
      }
    }

    if (selectedBranch !== "all") {
      if (booking.branchId.toString() !== selectedBranch) {
        return false;
      }
    }

    return true;
  }) || [];

  const upcomingBookings = filteredBookings
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getTotalSeats = () => {
    if (!restaurant?.locations) return 0;
    if (selectedBranch === "all") {
      return restaurant.locations.reduce((total, loc) => total + loc.seatsCount, 0);
    }
    const selectedLocation = restaurant.locations.find(
      loc => loc.id.toString() === selectedBranch
    );
    return selectedLocation?.seatsCount || 0;
  };

  const currentlySeatedBookings = filteredBookings
    .filter(booking => {
      const bookingTime = new Date(booking.date);
      const endTime = addHours(bookingTime, 2); // Assuming 2-hour dining duration
      return (
        isSameDay(bookingTime, now) &&
        booking.confirmed &&
        (isWithinInterval(now, { start: bookingTime, end: endTime }) || booking.arrived)
      );
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col justify-between h-[calc(100vh-120px)] py-4">
                  <div>
                    <Button
                      variant="ghost"
                      asChild
                      className="w-full justify-start mb-2"
                    >
                      <Link to="/restaurant/previous-bookings">
                        <History className="h-4 w-4 mr-2" />
                        Previous Bookings
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      asChild
                      className="w-full justify-start mb-2"
                    >
                      <Link to="/restaurant/profile">
                        <Settings className="h-4 w-4 mr-2" />
                        My Restaurant
                      </Link>
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="w-full justify-start text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-3xl font-bold text-primary">Restaurant Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Welcome back, {auth?.name}
            </div>
            <div className="hidden lg:flex gap-4">
              <Button
                variant="outline"
                asChild
              >
                <Link to="/restaurant/previous-bookings">
                  <History className="h-4 w-4 mr-2" />
                  Previous Bookings
                </Link>
              </Button>
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
                variant="ghost"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex">
            <AddReservationModal
              branches={restaurant?.locations || []}
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <Select
                value={selectedBranch}
                onValueChange={setSelectedBranch}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Branch">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedBranch === "all" ? "All Branches" :
                        restaurant?.locations?.find(loc => loc.id.toString() === selectedBranch)?.address || "Select Branch"}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {restaurant?.locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.address}, {location.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Datepicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={selectedTime}
                onValueChange={setSelectedTime}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Time">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      {selectedTime === "all" ? "Select Time" : selectedTime}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Times</SelectItem>
                  {timeSlots.length > 0 ? (
                    timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-slots" disabled>
                      No available time slots
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {(selectedDate || selectedTime !== "all" || selectedBranch !== "all") && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedDate(undefined);
                    setSelectedTime("all");
                    setSelectedBranch("all");
                  }}
                  className="px-2"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Bookings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedDate && selectedTime === "all" && `Bookings on ${format(selectedDate, "MMMM d, yyyy")}`}
                  {selectedTime !== "all" && `Bookings at ${selectedTime}${selectedDate ? ` on ${format(selectedDate, "MMMM d, yyyy")}` : ''}`}
                  {!selectedDate && selectedTime === "all" && "Total upcoming bookings"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {filteredBookings.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Seats</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedBranch === "all"
                    ? "Across all branches"
                    : `In ${restaurant?.locations?.find(loc => loc.id.toString() === selectedBranch)?.address}`}
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {getTotalSeats()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Seats</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {(!selectedDate || selectedTime === "all")
                    ? "Select date and time to view availability"
                    : `On ${format(selectedDate, "MMMM d, yyyy")} at ${selectedTime}`}
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(!selectedDate || selectedTime === "all")
                    ? "-"
                    : getTotalSeats() - (filteredBookings.reduce((sum, booking) => sum + booking.partySize, 0))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Latest Bookings</CardTitle>
              {selectedDate && (
                <span className="text-sm text-muted-foreground">
                  Showing bookings for {format(selectedDate, "MMMM d, yyyy")}
                </span>
              )}
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
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                if (window.confirm('Are you sure you want to cancel this booking?')) {
                                  cancelBookingMutation.mutate(booking.id);
                                }
                              }}
                              className="text-destructive"
                            >
                              Cancel Booking
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => markPartyArrivedMutation.mutate(booking.id)}
                            >
                              Party Arrived
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedDate ? "No bookings for this date" : "No upcoming bookings"}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Currently Seated</CardTitle>
              <span className="text-sm text-muted-foreground">
                Showing active bookings for today
              </span>
            </CardHeader>
            <CardContent>
              {currentlySeatedBookings && currentlySeatedBookings.length > 0 ? (
                <div className="space-y-4">
                  {currentlySeatedBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                    >
                      <div>
                        <div className="font-medium">
                          {booking.user ?
                            `${booking.user.firstName} ${booking.user.lastName}` :
                            `Guest Booking #${booking.id}`
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Seated at: {format(new Date(booking.date), "h:mm a")}
                        </div>
                        <div className="text-sm">
                          Party size: {booking.partySize}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Branch: {booking.branch.address}, {booking.branch.city}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">
                          Currently Seated
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No customers currently seated
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}