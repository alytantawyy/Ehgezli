import { format, parse, addMinutes } from 'date-fns';

/**
 * Generates default time slots based on current time + 5 hours
 * This matches the server implementation mentioned in the memories
 */
export const generateTimeSlots = (currentTime?: Date): string[] => {
  // Use current time if not provided
  const now = currentTime || new Date();
  
  // Calculate a time that's 5 hours from now (default dining time)
  const targetTime = addMinutes(now, 5 * 60);
  
  // Extract hours and minutes
  const hours = targetTime.getHours();
  const minutes = targetTime.getMinutes();
  
  // Round to nearest 30 minute interval
  const roundedMinutes = Math.round(minutes / 30) * 30;
  const roundedHours = hours + Math.floor((roundedMinutes) / 60);
  const finalMinutes = roundedMinutes % 60;
  
  // Create the base time (middle slot)
  const baseTime = new Date(targetTime);
  baseTime.setHours(roundedHours);
  baseTime.setMinutes(finalMinutes);
  
  // Generate 3 slots: 30 minutes before, base time, and 30 minutes after
  const beforeTime = addMinutes(baseTime, -30);
  const afterTime = addMinutes(baseTime, 30);
  
  return [
    format(beforeTime, 'HH:mm'),
    format(baseTime, 'HH:mm'),
    format(afterTime, 'HH:mm')
  ];
};

/**
 * Formats a time string from 24-hour format to 12-hour format with AM/PM
 */
export const formatTimeWithAMPM = (time: string): string => {
  const parsedTime = parse(time, 'HH:mm', new Date());
  return format(parsedTime, 'hh:mm a');
};

/**
 * Formats a date to display only month and day (e.g., "Mar 29")
 */
export const formatDateShort = (date: Date): string => {
  return format(date, 'MMM d');
};
