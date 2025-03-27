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

// Import utility functions
import { format, startOfToday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

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

  const [formData, setFormData] = useState<BookingFormData>({
    date: urlDate ? parseISO(urlDate) : new Date(), // Provide default date if none in URL
    time: urlTime || "18:00", // Default to 6:00 PM if no time provided
    partySize: urlGuests ? parseInt(urlGuests) : 2,
  });

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

  // Initialize form with default values
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: formData,
  });

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

  // Handle form submission
  async function onSubmit(data: BookingFormData) {
    console.log('Submitting booking:', data);
    await bookingMutation.mutateAsync(data);
  }

  const hasPreselectedSlot = Boolean(urlDate && urlTime);

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
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={hasPreselectedSlot}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time</FormLabel>
              <Select
                disabled={isLoadingSlots || timeSlots.length === 0 || hasPreselectedSlot}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem
                      key={slot.time}
                      value={slot.time}
                      disabled={!slot.available}
                    >
                      {slot.time} ({slot.availableSeats} seats available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Party Size Field */}
        <FormField
          control={form.control}
          name="partySize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Party Size</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  disabled={hasPreselectedSlot}
                />
              </FormControl>
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