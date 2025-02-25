import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import confetti from 'canvas-confetti';
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
    // Format date as ISO string but only include the date part
    const dateStr = format(bookingDate, 'yyyy-MM-dd');
    console.log('Fetching availability for:', { restaurantId, branchId, dateStr });

    const response = await fetch(
      `/api/restaurants/${restaurantId}/branches/${branchId}/availability?date=${dateStr}`,
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

    let currentTime = new Date();
    currentTime.setHours(openHour, openMinute, 0, 0);
    currentTime.setDate(bookingDate.getDate()); //Added to set correct date
    currentTime.setMonth(bookingDate.getMonth()); //Added to set correct month
    currentTime.setFullYear(bookingDate.getFullYear()); //Added to set correct year


    const endTime = new Date();
    endTime.setHours(closeHour, closeMinute, 0, 0);
    endTime.setDate(bookingDate.getDate()); //Added to set correct date
    endTime.setMonth(bookingDate.getMonth()); //Added to set correct month
    endTime.setFullYear(bookingDate.getFullYear()); //Added to set correct year

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
    throw error;
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
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

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
        } else {
          throw new Error('Branch not found');
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
        setIsLoadingSlots(true);
        try {
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
        } catch (error) {
          console.error('Error updating time slots:', error);
          toast({
            title: "Error",
            description: "Failed to load available time slots. Please try again.",
            variant: "destructive",
          });
          setTimeSlots([]);
          form.setValue("time", "", { shouldValidate: true });
        } finally {
          setIsLoadingSlots(false);
        }
      } else {
        setTimeSlots([]);
        form.setValue("time", "", { shouldValidate: true });
      }
    };
    updateTimeSlots();
  }, [form.watch("date"), branchId, openingTime, closingTime, restaurantId, toast]);

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
      toast({
        title: "Booking Confirmed",
        description: "You're booking is confirmed, have fun! :)",
      });
      triggerConfetti();
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
                  ) : isLoadingSlots ? (
                    <SelectItem value="loading" disabled>
                      Loading available times...
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