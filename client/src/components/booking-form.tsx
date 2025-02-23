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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useEffect, useState, useCallback } from "react";

interface AvailabilityResponse {
  branchId: number;
  date: string;
  availability: { [timeSlot: string]: number };
  totalSeats: number;
  reservationDuration: number;
}

interface WebSocketMessage {
  type: 'new_booking' | 'booking_cancelled' | 'connection_established' | 'heartbeat';
  data: any;
}

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

const generateTimeSlots = (openingTime: string, closingTime: string) => {
  if (!openingTime || !closingTime) return [];

  const slots: string[] = [];
  const [openHour, openMinute] = openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = closingTime.split(':').map(Number);

  for (let hour = openHour; hour < closeHour; hour++) {
    for (let minute of [0, 30]) {
      if (hour === openHour && minute < openMinute) continue;
      if (hour === closeHour && minute > closeMinute) continue;

      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

export function BookingForm({ restaurantId, branchIndex, openingTime, closingTime }: BookingFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [branchId, setBranchId] = useState<number | null>(null);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      partySize: 2,
    },
  });

  // Reset form and clear branch ID when restaurant or branch changes
  useEffect(() => {
    form.reset({ partySize: 2 });
    setBranchId(null);
    // Clear availability data for the previous branch
    if (branchId) {
      queryClient.removeQueries({ queryKey: ["/api/restaurants", restaurantId, "availability", branchId] });
    }
  }, [branchIndex, restaurantId]);

  // Get branch information
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

  // Fetch availability data
  const { data: availabilityData } = useQuery<AvailabilityResponse>({
    queryKey: ["/api/restaurants", restaurantId, "availability", branchId, form.watch("date")?.toISOString()],
    queryFn: async () => {
      if (!branchId || !form.watch("date")) return null;
      const response = await fetch(
        `/api/restaurants/${restaurantId}/branches/${branchId}/availability?date=${form.watch("date").toISOString()}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch availability');
      return response.json();
    },
    enabled: !!branchId && !!form.watch("date"),
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!branchId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        if (message.type === 'new_booking' || message.type === 'booking_cancelled') {
          console.log('Received WebSocket update:', message);
          // Invalidate all availability queries for this branch
          queryClient.invalidateQueries({
            queryKey: ["/api/restaurants", restaurantId, "availability", branchId]
          });
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [branchId, restaurantId]);

  // Update time slots when date changes
  useEffect(() => {
    if (form.watch("date")) {
      const slots = generateTimeSlots(openingTime, closingTime);
      setTimeSlots(slots);
      // Reset time selection when date changes
      form.setValue("time", "");
    }
  }, [openingTime, closingTime, form.watch("date")]);

  // Check if the selected time has enough seats for the party size
  const hasAvailability = useCallback((time: string) => {
    if (!availabilityData?.availability) return false;
    const partySize = form.getValues("partySize");
    return availabilityData.availability[time] >= partySize;
  }, [availabilityData, form]);

  // Reset time selection if selected time becomes unavailable
  useEffect(() => {
    const currentTime = form.getValues("time");
    if (currentTime && !hasAvailability(currentTime)) {
      form.setValue("time", "");
    }
  }, [form.watch("partySize"), availabilityData]);

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      try {
        if (!branchId) {
          throw new Error('Invalid branch selection');
        }

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

        const response = await fetch('/api/bookings', {
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

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create booking');
        }

        return response.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('An unexpected error occurred');
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ 
        queryKey: ["/api/restaurants", restaurantId, "availability", branchId] 
      });

      toast({
        title: "Booking Submitted",
        description: "Your booking request has been submitted successfully.",
      });

      // Reset form
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
                      // Reset time when date changes
                      form.setValue("time", "");
                    }}
                    disabled={(date) => {
                      const today = startOfToday();
                      return date < today;
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
                      const seats = availabilityData?.availability[time] || 0;
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