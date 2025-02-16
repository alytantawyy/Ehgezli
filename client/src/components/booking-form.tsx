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
  date: z.date(),
  time: z.string(),
  partySize: z.number().min(1, "Party size must be at least 1").max(20, "Party size cannot exceed 20")
});

type BookingFormData = z.infer<typeof bookingSchema>;

const generateTimeSlots = (openingTime: string, closingTime: string, bookingDate?: Date) => {
  const slots = [];
  const [openHour, openMinute] = openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = closingTime.split(':').map(Number);

  let startHour = openHour;
  let startMinute = openMinute;

  // If booking is for today, start from current time
  const now = new Date();
  if (bookingDate &&
      bookingDate.getDate() === now.getDate() &&
      bookingDate.getMonth() === now.getMonth() &&
      bookingDate.getFullYear() === now.getFullYear()) {
    startHour = now.getHours();
    startMinute = now.getMinutes();

    // Round up to the next 30-minute slot
    if (startMinute > 30) {
      startHour += 1;
      startMinute = 0;
    } else if (startMinute > 0) {
      startMinute = 30;
    }
  }

  let lastSlotHour = closeHour;
  let lastSlotMinute = closeMinute;
  if (lastSlotMinute >= 60) {
    lastSlotHour += Math.floor(lastSlotMinute / 60);
    lastSlotMinute = lastSlotMinute % 60;
  }
  lastSlotHour = lastSlotHour - 1; // One hour before closing

  for (let hour = startHour; hour <= lastSlotHour; hour++) {
    for (let minute of [0, 30]) {
      if (hour === startHour && minute < startMinute) continue;
      if (hour === lastSlotHour && minute > lastSlotMinute) continue;

      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

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

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      partySize: 2,
    },
  });

  // Fetch branch information
  const { data: branches } = useQuery({
    queryKey: ['/api/restaurants', restaurantId, 'branches'],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${restaurantId}/branches`);
      if (!response.ok) throw new Error('Failed to fetch branches');
      return response.json();
    },
  });

  // Set the branchId when branches data is available
  useEffect(() => {
    if (branches && branches[branchIndex]) {
      setBranchId(branches[branchIndex].id);
    }
  }, [branches, branchIndex]);

  // Check availability when date, time, and party size are selected
  const { data: availability, isLoading: checkingAvailability } = useQuery({
    queryKey: [
      '/api/restaurants/availability',
      branchId,
      form.watch('date'),
      form.watch('time'),
      form.watch('partySize'),
    ],
    queryFn: async () => {
      const date = form.watch('date');
      const time = form.watch('time');
      const partySize = form.watch('partySize');

      if (!branchId || !date || !time || !partySize) return null;

      const bookingDate = new Date(date);
      const [hours, minutes] = time.split(':').map(Number);
      bookingDate.setHours(hours, minutes);

      const response = await fetch(
        `/api/restaurants/availability/${branchId}?` +
        new URLSearchParams({
          date: bookingDate.toISOString(),
          partySize: partySize.toString(),
        })
      );

      if (!response.ok) throw new Error('Failed to check availability');
      return response.json();
    },
    enabled: Boolean(
      branchId &&
      form.watch('date') &&
      form.watch('time') &&
      form.watch('partySize')
    ),
  });

  // Update time slots when date changes
  useEffect(() => {
    const selectedDate = form.getValues("date");
    if (selectedDate) {
      const slots = generateTimeSlots(openingTime, closingTime, selectedDate);
      setTimeSlots(slots);
    }
  }, [openingTime, closingTime, form.watch("date")]);

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      try {
        if (!branchId) {
          throw new Error('Invalid branch selection');
        }

        // Create the booking
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
        title: "Booking Confirmed",
        description: "Your table has been reserved successfully.",
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

  const isSlotAvailable = availability?.isAvailable ?? false;
  const availabilityInfo = availability ? (
    <div className="text-sm text-muted-foreground mb-4">
      {isSlotAvailable ? (
        `${availability.availableSeats} seats available`
      ) : (
        `Not enough seats available for party of ${form.watch('partySize')}`
      )}
    </div>
  ) : null;

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
                    timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))
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
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {availabilityInfo}

        <Button
          type="submit"
          className="w-full"
          disabled={
            bookingMutation.isPending ||
            checkingAvailability ||
            !isSlotAvailable
          }
        >
          {bookingMutation.isPending ? "Booking..." : "Book Now"}
        </Button>
      </form>
    </Form>
  );
}