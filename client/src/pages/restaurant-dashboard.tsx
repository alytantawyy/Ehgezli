import { useRestaurantAuth } from "@/hooks/use-restaurant-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Restaurant, BookingWithDetails as SchemaBookingWithDetails } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, LogOut, Settings, CalendarIcon, Clock, Menu,
  History, Calendar, MoreVertical
} from "lucide-react";
import { format, isSameDay, isAfter } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Calendar as Datepicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AddReservationModal } from "@/components/add-reservation-modal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CurrentlySeatedBooking } from "@/components/currently-seated-booking";
import { getCurrentTimeSlot, generateTimeSlots, getBookingsForSeatCalculation, getAvailableSeats } from "@/lib/utils/time-utils";
import { Input } from "@/components/ui/input";

export interface BookingWithDetails extends SchemaBookingWithDetails {}

function RestaurantDashboardContent() {
  // All hooks at the top level
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { restaurant: auth, logoutMutation } = useRestaurantAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Early return if no auth
  if (!auth) {
    setLocation('/auth');
    return null;
  }

  const { data: restaurant, isLoading: isRestaurantLoading, error: restaurantError } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", auth.id],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${auth.id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch restaurant');
      }
      return response.json();
    },
    enabled: !!auth.id,
    retry: 1
  });

  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["/api/restaurant/bookings", auth.id],
    queryFn: async () => {
      const response = await fetch(`/api/restaurant/bookings/${auth.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch bookings");
      const data = await response.json();
      // Transform dates to Date objects
      return data.map((booking: BookingWithDetails) => ({
        ...booking,
        date: new Date(booking.date),
        arrivedAt: booking.arrivedAt ? new Date(booking.arrivedAt) : null,
      }));
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await fetch(`/api/restaurant/bookings/${bookingId}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel booking');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/bookings", auth.id] });
      toast({
        title: "Booking Cancelled",
        description: "The booking has been cancelled successfully.",
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
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/bookings", auth.id] });
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

  const markBookingCompleteMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await fetch(`/api/restaurant/bookings/${bookingId}/complete`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark booking as complete');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/bookings", auth.id] });
      toast({
        title: "Booking Completed",
        description: "The booking has been marked as complete.",
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


  if (isRestaurantLoading || isLoadingBookings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (restaurantError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-xl text-destructive">Failed to load restaurant data</div>
        <div className="text-sm text-muted-foreground">{restaurantError.message}</div>
        <Button onClick={() => setLocation('/auth')}>Return to Login</Button>
      </div>
    );
  }

  if (!restaurant || !restaurant.locations) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-xl text-destructive">Restaurant data not found</div>
        <Button onClick={() => setLocation('/auth')}>Return to Login</Button>
      </div>
    );
  }

  const currentlySeatedBookings = bookings?.filter((booking: BookingWithDetails) => {
    // Only show bookings that have been manually marked as arrived and not completed
    if (!booking.arrived || !booking.confirmed || booking.completed) {
      return false;
    }

    // Apply branch filter if a specific branch is selected
    if (selectedBranch !== "all") {
      if (booking.branchId.toString() !== selectedBranch) {
        return false;
      }
    }

    return true;
  }).sort((a: BookingWithDetails, b: BookingWithDetails) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filteredBookings = bookings?.filter((booking: BookingWithDetails) => {
    // Skip completed bookings
    if (booking.completed) return false;

    // Apply branch filter if selected
    if (selectedBranch !== "all") {
      if (booking.branchId.toString() !== selectedBranch) {
        return false;
      }
    }

    // Apply time filter if selected
    if (selectedTime !== "all") {
      const bookingTime = format(booking.date, "HH:mm");
      if (bookingTime !== selectedTime) {
        return false;
      }
    }

    // Apply date filter if selected
    if (selectedDate) {
      if (!isSameDay(booking.date, selectedDate)) {
        return false;
      }
    }

    return true;
  }).sort((a: BookingWithDetails, b: BookingWithDetails) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingBookings = filteredBookings
    .filter((booking: BookingWithDetails) => {
      const now = new Date();
      // Include bookings from today onwards that haven't arrived yet
      return (!booking.arrived && (isSameDay(booking.date, now) || isAfter(booking.date, now)));
    })
    .sort((a: BookingWithDetails, b: BookingWithDetails) => a.date.getTime() - b.date.getTime());

  const futureBookings = bookings?.filter((booking: BookingWithDetails) => {
    // Skip unconfirmed, completed, or arrived bookings
    if (!booking.confirmed || booking.completed || booking.arrived) {
      return false;
    }

    const now = new Date();
    return isAfter(booking.date, now);
  }).sort((a: BookingWithDetails, b: BookingWithDetails) => a.date.getTime() - b.date.getTime()) || [];

  const filteredFutureBookings = futureBookings?.filter((booking: BookingWithDetails) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    const fullName = `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`.toLowerCase();

    return fullName.includes(searchLower);
  }) || [];

  const getTotalSeats = () => {
    if (!restaurant.locations) return 0;
    if (selectedBranch === "all") {
      return restaurant.locations.reduce((total, loc) => total + loc.seatsCount, 0);
    }
    const selectedLocation = restaurant.locations.find(
      loc => loc.id.toString() === selectedBranch
    );
    return selectedLocation?.seatsCount || 0;
  };

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
              Welcome back, {auth.name}
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="future">Future Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex">
              <AddReservationModal branches={restaurant.locations} />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <Select
                  value={selectedBranch}
                  onValueChange={setSelectedBranch}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedBranch === "all" ? "All Branches" :
                          restaurant.locations.find(loc => loc.id.toString() === selectedBranch)?.address || "Select Branch"}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {restaurant.locations.map((location) => (
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
                    <SelectValue>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        {selectedTime === "all" ? "Select Time" : selectedTime}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Times</SelectItem>
                    {getCurrentTimeSlot() && (
                      <SelectItem value={getCurrentTimeSlot()}>Now ({getCurrentTimeSlot()})</SelectItem>
                    )}
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
                      : `In ${restaurant.locations.find(loc => loc.id.toString() === selectedBranch)?.address}`}
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
                    {getAvailableSeats(selectedTime, selectedDate, bookings, selectedBranch, getTotalSeats())}
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
                    {upcomingBookings.map((booking: BookingWithDetails) => (
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
                    {currentlySeatedBookings.map((booking: BookingWithDetails) => (
                      <CurrentlySeatedBooking
                        key={booking.id}
                        booking={booking}
                        onMarkComplete={(bookingId) => markBookingCompleteMutation.mutate(bookingId)}
                        isMarkingComplete={markBookingCompleteMutation.isPending}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No customers currently seated
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="future" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Future Bookings</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="w-[300px]">
                    <Input
                      placeholder="Search by customer name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          {selectedBranch === "all" ? "All Branches" :
                            restaurant.locations.find(loc => loc.id.toString() === selectedBranch)?.address || "Select Branch"}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {restaurant.locations.map((location) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.address}, {location.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredFutureBookings.length > 0 ? (
                  <div className="space-y-4">
                    {filteredFutureBookings.map((booking: BookingWithDetails) => (
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
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No future bookings found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function RestaurantDashboard() {
  return (
    <ErrorBoundary>
      <RestaurantDashboardContent />
    </ErrorBoundary>
  );
}