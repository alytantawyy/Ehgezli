import { addMinutes, format, isAfter, isSameDay, parseISO, set } from "date-fns";

export interface TimeSlot {
  label: string;
  value: string;
}

export function generateTimeSlots(selectedDate?: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = new Date();
  
  // Generate slots for all 24 hours, in 30-minute intervals
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const slotTime = set(selectedDate || now, { hours: hour, minutes: minute });
      const timeString = format(slotTime, "HH:mm");
      
      // If selected date is today, only show future times (with 30 min buffer)
      if (selectedDate && isSameDay(selectedDate, now)) {
        if (isAfter(slotTime, addMinutes(now, 30))) {
          slots.push({
            label: format(slotTime, "h:mm a"),
            value: timeString
          });
        }
      } else {
        // For future dates, show all slots
        slots.push({
          label: format(slotTime, "h:mm a"),
          value: timeString
        });
      }
    }
  }
  
  return slots;
}
