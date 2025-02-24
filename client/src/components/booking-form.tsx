import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const bookingSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  time: z.string({
    required_error: "Please select a time",
  }),
  partySize: z.number().min(1, "Party size must be at least 1").max(20, "Party size cannot exceed 20")
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface TimeSlot {
  time: string;
  available: boolean;
  availableSeats: number;
}

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
    console.log('Fetching availability for:', { 
      restaurantId, 
      branchId, 
      date: bookingDate.toISOString() 
    });

    const response = await fetch(
      `/api/restaurants/${restaurantId}/branches/${branchId}/availability?date=${bookingDate.toISOString()}`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      console.error('Failed to fetch availability:', response.status, response.statusText);
      throw new Error('Failed to fetch availability');
    }

    const availability = await response.json();
    console.log('Received availability data:', availability);

    const slots: TimeSlot[] = [];
    const [openHour, openMinute] = openingTime.split(':').map(Number);
    const [closeHour, closeMinute] = closingTime.split(':').map(Number);

    let currentTime = new Date(bookingDate);
    currentTime.setHours(openHour, openMinute, 0, 0);

    const endTime = new Date(bookingDate);
    endTime.setHours(closeHour, closeMinute, 0, 0);

    // If booking is for today, start from current time
    const now = new Date();
    if (
      bookingDate.getDate() === now.getDate() &&
      bookingDate.getMonth() === now.getMonth() &&
      bookingDate.getFullYear() === now.getFullYear()
    ) {
      let startHour = now.getHours();
      let startMinute = now.getMinutes();

      // Round up to the next 30-minute slot
      if (startMinute > 30) {
        startHour += 1;
        startMinute = 0;
      } else if (startMinute > 0) {
        startMinute = 30;
      }

      currentTime.setHours(startHour, startMinute, 0, 0);
    }

    while (currentTime < endTime) {
      const timeSlot = format(currentTime, 'HH:mm');
      const availableSeats = availability[timeSlot] || 0;

      slots.push({
        time: timeSlot,
        available: availableSeats > 0,
        availableSeats
      });

      // Move to next time slot (30 minutes)
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    console.log('Generated time slots:', slots);
    return slots;
  } catch (error) {
    console.error('Error generating time slots:', error);
    return [];
  }
};

interface BookingFormProps {
  restaurantId: number;
  branchIndex: number;
  openingTime: string;
  closingTime: string;
}

export function BookingForm({ restaurantId, branchIndex, openingTime, closingTime }: BookingFormProps) {
  const { toast } = useToast();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [branchId, setBranchId] = useState<number | null>(null);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      partySize: 2,
    },
  });

  // Fetch branch information
  useEffect(() => {
    const fetchBranch = async () => {
      try {
        console.log('Fetching branch information:', { restaurantId, branchIndex });
        const response = await fetch(`/api/restaurants/${restaurantId}/branches`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch branches');
        }

        const branches = await response.json();
        console.log('Received branches:', branches);

        if (branches[branchIndex]) {
          setBranchId(branches[branchIndex].id);
        }
      } catch (error) {
        console.error('Error fetching branch:', error);
        toast({
          title: "Error",
          description: "Failed to load branch information. Please try again.",
          variant: "destructive",
        });
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
        const slots = await generateTimeSlots(
          openingTime,
          closingTime,
          selectedDate,
          restaurantId,
          branchId
        );
        setTimeSlots(slots);

        // Clear time selection if the previously selected time is no longer available
        const currentTime = form.getValues("time");
        if (currentTime) {
          const isTimeStillAvailable = slots.some(
            slot => slot.time === currentTime && slot.available
          );
          if (!isTimeStillAvailable) {
            form.setValue("time", "", { shouldValidate: true });
          }
        }
      } else {
        setTimeSlots([]);
        form.setValue("time", "", { shouldValidate: true });
      }
    };
    updateTimeSlots();
  }, [form, openingTime, closingTime, branchId, restaurantId]);

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      try {
        if (!branchId) {
          throw new Error('Invalid branch selection');
        }

        // Create the booking date
        const bookingDate = new Date(
          data.date.getFullYear(),
          data.date.getMonth(),
          data.date.getDate(),
          parseInt(data.time.split(':')[0]),
          parseInt(data.time.split(':')[1])
        );

        // Check if there are enough seats available
        const selectedTimeSlot = timeSlots.find(slot => slot.time === data.time);
        if (!selectedTimeSlot?.available || selectedTimeSlot.availableSeats < data.partySize) {
          throw new Error('Not enough seats available for this time slot');
        }

        const bookingResponse = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            branchId,
            date: bookingDate.toISOString(),
            partySize: data.partySize,
          }),
        });

        if (!bookingResponse.ok) {
          const errorData = await bookingResponse.json().catch(() => ({ message: 'Failed to create booking' }));
          throw new Error(errorData.message || 'Failed to create booking');
        }

        return bookingResponse.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('An unexpected error occurred');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking Submitted",
        description: "Your booking request has been submitted successfully.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => bookingMutation.mutate(data))}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
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
                    onSelect={(date) => {
                      field.onChange(date);
                      // Clear time when date changes
                      form.setValue("time", "", { shouldValidate: true });
                    }}
                    disabled={(date) => {
                      const today = startOfToday();
                      return date < today || date > new Date(2025, 10, 1);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {!form.getValues("date") ? (
                    <SelectItem value="no-date" disabled>
                      Please select a date first
                    </SelectItem>
                  ) : timeSlots.length > 0 ? (
                    timeSlots.map((slot) => (
                      <SelectItem
                        key={slot.time}
                        value={slot.time}
                        disabled={!slot.available}
                        className={cn(
                          !slot.available && "text-muted-foreground opacity-50"
                        )}
                      >
                        {slot.time} {slot.available ? 
                          `(${slot.availableSeats} seats available)` : 
                          '(No seats available)'}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-slots" disabled>
                      No available time slots
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="partySize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Party Size</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={
            bookingMutation.isPending || 
            !form.formState.isValid || 
            !form.getValues("time") || 
            !form.getValues("date")
          }
        >
          {bookingMutation.isPending ? "Submitting..." : "Submit Booking"}
        </Button>
      </form>
    </Form>
  );
}