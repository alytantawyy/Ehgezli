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
import { format, startOfToday, addHours, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

// Add proper types for the API responses
interface Booking {
  id: number;
  date: string;
  partySize: number;
  confirmed: boolean;
  completed: boolean;
}

interface Branch {
  id: number;
  seatsCount: number;
  tablesCount: number;
  reservationDuration: number;
}

const generateTimeSlots = (openingTime: string, closingTime: string, bookingDate?: Date) => {
  if (!openingTime || !closingTime) return [];

  const slots: string[] = [];
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


const bookingSchema = z.object({
  date: z.date(),
  time: z.string(),
  partySize: z.number().min(1, "Party size must be at least 1").max(20, "Party size cannot exceed 20")
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  restaurantId: number;
  branchIndex: number;
  openingTime: string;
  closingTime: string;
}

export function BookingForm({ restaurantId, branchIndex, openingTime, closingTime }: BookingFormProps) {
  const { toast } = useToast();
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [availableSeats, setAvailableSeats] = useState<{ [key: string]: number }>({});

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      partySize: 2,
    },
  });

  // Fetch branch information and bookings
  const { data: branch } = useQuery({
    queryKey: ["/api/restaurants", restaurantId, "branches", branchIndex],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${restaurantId}/branches`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch branches');
      const branches = await response.json();
      if (branches[branchIndex]) {
        setBranchId(branches[branchIndex].id);
        return branches[branchIndex];
      }
      throw new Error('Branch not found');
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ["/api/restaurant/bookings", restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/restaurant/bookings/${restaurantId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
    enabled: !!restaurantId,
  });

  // Update the calculateAvailableSeats function to properly handle the 2-hour window
  const calculateAvailableSeats = (date: Date, timeStr: string) => {
    if (!branch || !bookings) return 0;

    const [hours, minutes] = timeStr.split(':').map(Number);
    const selectedDateTime = new Date(date);
    selectedDateTime.setHours(hours, minutes, 0, 0);

    // Calculate the window based on the reservation duration
    const halfDuration = branch.reservationDuration / 2; // Convert to hours
    const windowStart = new Date(selectedDateTime);
    const windowEnd = new Date(selectedDateTime);
    windowStart.setHours(windowStart.getHours() - (halfDuration / 60));
    windowEnd.setHours(windowEnd.getHours() + (halfDuration / 60));

    const relevantBookings = bookings.filter((booking: Booking) => {
      if (!booking.confirmed || booking.completed) return false;

      const bookingDateTime = new Date(booking.date);
      const bookingEnd = new Date(bookingDateTime);
      bookingEnd.setMinutes(bookingEnd.getMinutes() + branch.reservationDuration * 60); //Fixed minutes calculation

      // Check if booking overlaps with our reservation window
      return (
        (bookingDateTime <= windowEnd && bookingEnd >= windowStart) ||
        (bookingDateTime >= windowStart && bookingDateTime <= windowEnd)
      );
    });

    const seatsOccupied = relevantBookings.reduce((sum: number, booking: Booking) => sum + booking.partySize, 0);
    return branch.seatsCount - seatsOccupied;
  };

  // Update time slots and available seats when date changes
  useEffect(() => {
    const selectedDate = form.getValues("date");
    if (selectedDate && branch) {
      const slots = generateTimeSlots(openingTime, closingTime, selectedDate);
      const seatsPerSlot: { [key: string]: number } = {};

      slots.forEach(slot => {
        seatsPerSlot[slot] = calculateAvailableSeats(selectedDate, slot);
      });

      setTimeSlots(slots);
      setAvailableSeats(seatsPerSlot);

      // Reset time if current selection has no availability
      const currentTime = form.getValues("time");
      if (currentTime && seatsPerSlot[currentTime] < form.getValues("partySize")) {
        form.setValue("time", "");
      }
    }
  }, [openingTime, closingTime, form.watch("date"), branch, bookings]);

  // Check if the selected time has enough seats for the party size
  const hasAvailability = (time: string) => {
    const partySize = form.getValues("partySize");
    return availableSeats[time] >= partySize;
  };

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      try {
        if (!branchId) {
          throw new Error('Invalid branch selection');
        }

        // Verify availability one last time before booking
        const selectedTime = data.time;
        if (!hasAvailability(selectedTime)) {
          throw new Error('No availability for the selected time and party size');
        }

        const bookingDate = new Date(
          data.date.getFullYear(),
          data.date.getMonth(),
          data.date.getDate(),
          parseInt(data.time.split(':')[0]),
          parseInt(data.time.split(':')[1])
        );

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

  // Update party size effect
  useEffect(() => {
    const partySize = form.watch("partySize");
    const currentTime = form.getValues("time");
    if (currentTime && availableSeats[currentTime] < partySize) {
      form.setValue("time", "");
    }
  }, [form.watch("partySize")]);

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
                    onSelect={field.onChange}
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
                  {timeSlots.length > 0 ? (
                    timeSlots.map((time) => {
                      const available = hasAvailability(time);
                      const seats = availableSeats[time];
                      return (
                        <SelectItem
                          key={time}
                          value={time}
                          disabled={!available}
                          className={cn(!available && "text-muted-foreground")}
                        >
                          {time} {available ? `(${seats} seats available)` : "(No availability)"}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem key="no-slots" value="no-slots" disabled>
                      Select a date first
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
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    field.onChange(value);
                  }}
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
            !form.getValues("time") ||
            !form.getValues("date") ||
            !hasAvailability(form.getValues("time"))
          }
        >
          {bookingMutation.isPending ? "Submitting..." : "Submit Booking"}
        </Button>
      </form>
    </Form>
  );
}