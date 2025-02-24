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
import { useMutation } from "@tanstack/react-query";
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
import { useEffect, useState, useRef } from "react";
import { WebSocketMessage, SeatAvailabilityUpdate } from "@shared/schema";

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

interface AvailabilityMap {
  [key: string]: {
    [key: string]: number;
  };
}

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
  const [availabilityMap, setAvailabilityMap] = useState<AvailabilityMap>({});
  const socketRef = useRef<WebSocket | null>(null);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      partySize: 2,
    },
  });

  // WebSocket connection setup
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data) as WebSocketMessage;
      if (message.type === 'seatAvailability' && message.branchId === branchId) {
        setAvailabilityMap(prev => ({
          ...prev,
          [message.date]: {
            ...(prev[message.date] || {}),
            [message.time]: message.availableSeats
          }
        }));
      }
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [branchId]);

  // Update time slots when date changes
  useEffect(() => {
    const selectedDate = form.getValues("date");
    if (selectedDate) {
      const slots = generateTimeSlots(openingTime, closingTime, selectedDate);
      setTimeSlots(slots);
    }
  }, [openingTime, closingTime, form.watch("date")]);

  // Fetch branch information
  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}/branches`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch branches');
        const branches = await response.json();
        if (branches[branchIndex]) {
          setBranchId(branches[branchIndex].id);
        }
      } catch (error) {
        console.error('Error fetching branch:', error);
      }
    };
    fetchBranch();
  }, [restaurantId, branchIndex]);

  // Check if a time slot is available
  const isTimeSlotAvailable = (date: Date, time: string, partySize: number) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const availability = availabilityMap[dateStr]?.[time];
    return typeof availability === 'number' && availability >= partySize;
  };

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      try {
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

        // Check availability before submitting
        if (!isTimeSlotAvailable(data.date, data.time, data.partySize)) {
          throw new Error('No available seats for this time slot');
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
                      disabled={!branchId}
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
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const hasAvailability = Object.values(availabilityMap[dateStr] || {}).some(seats => seats > 0);
                      return date < today || !hasAvailability;
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
                      const isAvailable = form.getValues("date") && 
                        isTimeSlotAvailable(
                          form.getValues("date"),
                          time,
                          form.getValues("partySize") || 2
                        );
                      return (
                        <SelectItem
                          key={time}
                          value={time}
                          disabled={!isAvailable}
                          className={!isAvailable ? "opacity-50" : ""}
                        >
                          {time} {!isAvailable && "(No availability)"}
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
                    // Re-check availability when party size changes
                    const date = form.getValues("date");
                    const time = form.getValues("time");
                    if (date && time) {
                      const isAvailable = isTimeSlotAvailable(date, time, value);
                      if (!isAvailable) {
                        form.setValue("time", "");
                      }
                    }
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
          disabled={bookingMutation.isPending}
        >
          {bookingMutation.isPending ? "Submitting..." : "Submit Booking"}
        </Button>
      </form>
    </Form>
  );
}