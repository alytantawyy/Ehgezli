/**
 * BookingForm Component
 * This component handles restaurant table reservations.
 * It lets users pick a date, time, and number of people for their booking.
 */

// Import form handling and validation libraries
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Restaurant } from "@shared/schema";

// Import UI components from our design system
import { Button } from "@/components/ui/button";
import confetti from 'canvas-confetti'; // For celebration effects when booking succeeds
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// Import data management and notification tools
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Import date picker component
import { Calendar } from "@/components/ui/calendar";

// Import popup menu components for the calendar
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Import dropdown menu components for time selection
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import icons
import { CalendarIcon } from "lucide-react";
import { ClockIcon } from "lucide-react";
import { Users } from "lucide-react";

// Import utility functions
import { format, startOfToday, parse, parseISO } from "date-fns";

// Import React hooks
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

// Import API request function
import { apiRequest } from "@/lib/queryClient";

// Define the shape of data we expect from the form
const bookingSchema = z.object({
  date: z.date({
    required_error: "Please select a date", // Error message if date is missing
  }),
  time: z.string({
    required_error: "Please select a time", // Error message if time is missing
  }),
  partySize: z.number()
    .min(1, "Party size must be at least 1") // Can't book for 0 people
    .max(20, "Party size cannot exceed 20") // Restaurant limit
});

// TypeScript type generated from our schema
type BookingFormData = z.infer<typeof bookingSchema>;

// Define what a time slot looks like (for the dropdown)
interface TimeSlot {
  time: string;         // e.g., "18:00"
  available: boolean;   // whether this slot can be booked
  availableSeats: number; // how many seats are free at this time
}

// Type for the availability response
interface AvailabilityResponse {
  [time: string]: number;
}

// Function to generate time slots
const generateTimeSlots = async (
  openingTime: string,
  closingTime: string,
  bookingDate: Date | undefined,
  restaurantId: number,
  branchId: number | null
): Promise<TimeSlot[]> => {
  if (!bookingDate || !branchId) {
    console.log('Missing required parameters:', { bookingDate, branchId });
    return [];
  }

  try {
    const dateStr = format(bookingDate, 'yyyy-MM-dd');
    console.log('Fetching availability for:', { restaurantId, branchId, dateStr });

    const availability = await apiRequest<AvailabilityResponse>(
      'GET',
      `/api/restaurant/${restaurantId}/branch/${branchId}/availability?date=${dateStr}`
    );

    console.log('Received availability data:', availability);

    const slots: TimeSlot[] = Object.entries(availability).map(([time, availableSeats]) => ({
      time,
      available: availableSeats > 0,
      availableSeats
    }));

    slots.sort((a, b) => {
      const [aHours, aMinutes] = a.time.split(':').map(Number);
      const [bHours, bMinutes] = b.time.split(':').map(Number);
      const aTotal = aHours * 60 + aMinutes;
      const bTotal = bHours * 60 + bMinutes;
      return aTotal - bTotal;
    });

    console.log('Generated time slots:', slots);
    return slots;
  } catch (error) {
    console.error('Error generating time slots:', error);
    throw error;
  }
};

// Props for the BookingForm component
interface BookingFormProps {
  restaurantId: number;
  branchIndex: number;
  openingTime: string;
  closingTime: string;
}

// BookingForm component
export function BookingForm({ restaurantId, branchIndex, openingTime, closingTime }: BookingFormProps) {
  const { toast } = useToast();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const mountedRef = useRef(true);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  // Get URL parameters
  const urlDate = searchParams.get('date');
  const urlTime = searchParams.get('time');
  const urlGuests = searchParams.get('partySize');
  
  // Check if we have preselected date and time from URL
  const hasPreselectedSlot = Boolean(urlDate && urlTime);

  console.log('DEBUG - URL parameters:', { urlDate, urlTime, urlGuests, hasPreselectedSlot });
  console.log('DEBUG - Current URL:', window.location.href);

  // Initialize form with default values
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      date: urlDate ? parseISO(urlDate) : new Date(),
      time: urlTime || "18:00",
      partySize: urlGuests ? parseInt(urlGuests) : 2,
    }
  });

  console.log('DEBUG - Form initialized with:', form.getValues());

  // Force the time value to be set correctly from URL
  useEffect(() => {
    if (urlTime && hasPreselectedSlot) {
      console.log('DEBUG - Setting time from URL:', urlTime);
      // Use setTimeout to ensure this runs after form initialization
      setTimeout(() => {
        form.setValue('time', urlTime);
        console.log('DEBUG - Time value set to:', urlTime);
        console.log('DEBUG - Form values after setting time:', form.getValues());
      }, 0);
    }
  }, [form, urlTime, hasPreselectedSlot]);

  // Reset form with correct values when URL parameters change
  useEffect(() => {
    if (hasPreselectedSlot) {
      console.log('DEBUG - Resetting form with URL values');
      form.reset({
        date: urlDate ? parseISO(urlDate) : new Date(),
        time: urlTime || "18:00",
        partySize: urlGuests ? parseInt(urlGuests) : 2,
      });
    }
  }, [form, urlDate, urlTime, urlGuests, hasPreselectedSlot]);

  // Function to trigger confetti celebration
  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      spread: 360,
      ticks: 50,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  // Fetch branch information when component mounts
  useEffect(() => {
    const fetchBranch = async () => {
      if (!mountedRef.current) return;
      
      try {
        console.log('Fetching branch information:', { restaurantId, branchIndex });
        const restaurant = await apiRequest<Restaurant>('GET', `/api/restaurant/${restaurantId}`);
        
        if (!mountedRef.current) return;
        
        console.log('Received restaurant:', restaurant);
        if (restaurant.branches?.[branchIndex]) {
          setBranchId(restaurant.branches[branchIndex].id);
        } else {
          throw new Error('Branch not found');
        }
      } catch (error) {
        console.error('Error fetching branch:', error);
        if (mountedRef.current) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to load branch information",
            variant: "destructive",
          });
        }
      }
    };
    fetchBranch();
  }, [restaurantId, branchIndex, toast]);

  // Update time slots when date changes
  useEffect(() => {
    const updateTimeSlots = async () => {
      const selectedDate = form.getValues("date");
      console.log('Updating time slots:', { selectedDate, branchId });

      if (selectedDate && branchId) {
        setIsLoadingSlots(true);
        try {
          const slots = await generateTimeSlots(
            openingTime,
            closingTime,
            selectedDate,
            restaurantId,
            branchId
          );
          
          if (!mountedRef.current) return;
          
          setTimeSlots(slots);

          const currentTime = form.getValues("time");
          if (currentTime) {
            const isTimeStillAvailable = slots.some(
              slot => slot.time === currentTime && slot.available
            );
            if (!isTimeStillAvailable) {
              form.setValue("time", "", { shouldValidate: true });
            }
          }
        } catch (error) {
          console.error('Error updating time slots:', error);
          if (mountedRef.current) {
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "Failed to load time slots",
              variant: "destructive",
            });
            setTimeSlots([]);
            form.setValue("time", "", { shouldValidate: true });
          }
        } finally {
          if (mountedRef.current) {
            setIsLoadingSlots(false);
          }
        }
      } else {
        setTimeSlots([]);
        form.setValue("time", "", { shouldValidate: true });
      }
    };
    updateTimeSlots();
  }, [form.watch("date"), branchId, openingTime, closingTime, restaurantId, toast]);

  // Mutation to create a new booking
  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      if (!branchId) {
        throw new Error('Invalid branch selection');
      }

      const bookingDate = new Date(
        data.date.getFullYear(),
        data.date.getMonth(),
        data.date.getDate(),
        parseInt(data.time.split(':')[0]),
        parseInt(data.time.split(':')[1])
      );

      const selectedTimeSlot = timeSlots.find(slot => slot.time === data.time);
      if (!selectedTimeSlot?.available || selectedTimeSlot.availableSeats < data.partySize) {
        throw new Error('Not enough seats available for this time slot');
      }

      return await apiRequest('POST', '/api/bookings', {
        branchId,
        date: bookingDate.toISOString(),
        partySize: data.partySize,
      });
    },
    onSuccess: () => {
      if (!mountedRef.current) return;
      
      triggerConfetti();
      toast({
        title: "Success!",
        description: "Your booking has been confirmed",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant", restaurantId] });
      setLocation("/bookings");
    },
    onError: (error) => {
      if (!mountedRef.current) return;
      
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to create booking",
        variant: "destructive",
      });
    }
  });

  // Add a state to track popover open status for debugging
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [timePopoverOpen, setTimePopoverOpen] = useState(false);
  
  // Debug function for click events
  const debugClick = (element: string) => {
    console.log(`DEBUG - ${element} clicked at ${new Date().toISOString()}`);
  };

  // Handle form submission
  async function onSubmit(data: BookingFormData) {
    console.log('Submitting booking:', data);
    await bookingMutation.mutateAsync(data);
  }

  return (
    // The main form component that handles validation and submission
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Date Selection Field */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild onClick={() => {
                  debugClick('Date popover trigger');
                }}>
                  <FormControl>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "MMM d")
                      ) : (
                        <span>Select date</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < startOfToday()} // Can't book in the past
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Time Selection Field */}
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => {
            console.log('DEBUG - Time field rendering:', { 
              fieldValue: field.value, 
              hasPreselectedSlot, 
              timeSlots: timeSlots.length,
              urlTime
            });
            return (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <Popover open={timePopoverOpen} onOpenChange={setTimePopoverOpen}>
                  <PopoverTrigger asChild onClick={() => {
                    debugClick('Time popover trigger');
                  }}>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <ClockIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(parse(field.value, 'HH:mm', new Date()), "h:mm a")
                        ) : (
                          <span>Select time</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-60 p-0" align="start">
                    <ScrollArea className="h-80">
                      <div className="grid grid-cols-1 gap-1 p-2">
                        {timeSlots.map((slot) => (
                          <Button
                            key={slot.time}
                            variant={field.value === slot.time ? "default" : "ghost"}
                            className="justify-start font-normal"
                            disabled={!slot.available}
                            onClick={() => field.onChange(slot.time)}
                          >
                            {format(parse(slot.time, 'HH:mm', new Date()), "h:mm a")}
                            {slot.availableSeats > 0 && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                {slot.availableSeats} seats
                              </span>
                            )}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {/* Party Size Field */}
        <FormField
          control={form.control}
          name="partySize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Party Size</FormLabel>
              <Select
                onValueChange={(value) => {
                  console.log('Party size changed to:', value);
                  field.onChange(parseInt(value));
                }}
                onOpenChange={(open) => console.log('Party size dropdown open state:', open)}
                value={field.value.toString()}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="People" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'person' : 'people'}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full"
          disabled={bookingMutation.isPending}
        >
          {bookingMutation.isPending ? "Booking..." : (hasPreselectedSlot ? "Confirm Reservation" : "Book Now")}
        </Button>
      </form>
    </Form>
  );
}