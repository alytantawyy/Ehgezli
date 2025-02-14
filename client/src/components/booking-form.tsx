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
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const bookingSchema = z.object({
  date: z.date(),
  time: z.string(),
  partySize: z.number().min(1, "Party size must be at least 1").max(20, "Party size cannot exceed 20")
});

type BookingFormData = z.infer<typeof bookingSchema>;

const generateTimeSlots = (openingTime: string, closingTime: string) => {
  const slots = [];
  const [openHour, openMinute] = openingTime.split(':').map(Number);
  const [closeHour, closeMinute] = closingTime.split(':').map(Number);

  let lastSlotHour = closeHour;
  let lastSlotMinute = closeMinute;
  if (lastSlotMinute >= 60) {
    lastSlotHour += Math.floor(lastSlotMinute / 60);
    lastSlotMinute = lastSlotMinute % 60;
  }
  lastSlotHour = lastSlotHour - 1; // One hour before closing

  for (let hour = openHour; hour <= lastSlotHour; hour++) {
    for (let minute of [0, 30]) {
      if (hour === openHour && minute < openMinute) continue;
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
  const timeSlots = generateTimeSlots(openingTime, closingTime);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      partySize: 2,
      time: timeSlots[Math.floor(timeSlots.length / 2)],
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      try {
        // Check if user is logged in
        const userResponse = await fetch('/api/user');
        if (!userResponse.ok) {
          throw new Error('Please log in to make a booking');
        }

        let user;
        try {
          user = await userResponse.json();
        } catch (e) {
          throw new Error('Invalid user data received');
        }

        // Get branch information
        const branchResponse = await fetch(`/api/restaurants/${restaurantId}/branches`);
        if (!branchResponse.ok) {
          throw new Error('Unable to fetch restaurant branch information');
        }

        let branches;
        try {
          const responseText = await branchResponse.text();
          if (!responseText) {
            throw new Error('Empty response received from server');
          }
          branches = JSON.parse(responseText);
        } catch (e) {
          console.error('Branch data parsing error:', e);
          throw new Error('Invalid branch data format received from server');
        }

        if (!Array.isArray(branches)) {
          throw new Error('Invalid branch data format: expected an array');
        }

        if (branches.length === 0) {
          throw new Error('No branches available for this restaurant');
        }

        const branch = branches[branchIndex];
        if (!branch?.id) {
          throw new Error('Selected branch is not available');
        }

        // Create the booking
        const bookingDate = new Date(
          data.date.getFullYear(),
          data.date.getMonth(),
          data.date.getDate(),
          parseInt(data.time.split(':')[0]),
          parseInt(data.time.split(':')[1])
        );

        const bookingData = {
          branchId: branch.id,
          userId: user.id,
          date: bookingDate.toISOString(),
          partySize: data.partySize,
        };

        const bookingResponse = await apiRequest("POST", "/api/bookings", bookingData);
        if (!bookingResponse.ok) {
          const errorText = await bookingResponse.text();
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || 'Failed to create booking');
          } catch {
            throw new Error(errorText || 'Failed to create booking');
          }
        }

        let bookingResult;
        try {
          const bookingText = await bookingResponse.text();
          if (!bookingText) {
            throw new Error('Empty booking response received');
          }
          bookingResult = JSON.parse(bookingText);
        } catch (e) {
          throw new Error('Invalid booking response received from server');
        }

        return bookingResult;
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
                    disabled={(date) =>
                      date < new Date() || date > new Date(2025, 10, 1)
                    }
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
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
          disabled={bookingMutation.isPending}
        >
          {bookingMutation.isPending ? "Booking..." : "Book Now"}
        </Button>
      </form>
    </Form>
  );
}