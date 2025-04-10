import { format, parse, addMinutes } from 'date-fns';

/**
 * Generates time slots based on the current time
 * Uses the same algorithm as the server for consistency
 */
export const generateTimeSlots = async (currentTime?: Date): Promise<string[]> => {
  // Always use local generation since we've standardized the algorithm
  return generateLocalTimeSlots(currentTime);
};

/**
 * Generates time slots locally as a fallback
 * This matches the server implementation
 */
export const generateLocalTimeSlots = (currentTime?: Date): string[] => {
  // Use current time if not provided
  const now = currentTime || new Date();
  
  // Calculate a time that's 2 hours from now (default dining time)
  const targetTime = addMinutes(now, 2 * 60);
  
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
export const formatTimeWithAMPM = (time: string | undefined): string => {
  // Handle undefined or empty time strings
  if (time === undefined || time === null || time === '') {
    console.warn('formatTimeWithAMPM received undefined or empty time string');
    return 'N/A'; // Return a default value
  }
  
  try {
    // Check if time is a string before trying to use string methods
    if (typeof time !== 'string') {
      console.warn(`formatTimeWithAMPM received non-string value: ${typeof time}`);
      return 'N/A';
    }
    
    // Check if time follows the expected format (HH:mm) without using regex or split
    if (time.length < 3 || !time.includes(':')) {
      console.warn(`formatTimeWithAMPM received invalid time format: ${time}`);
      return time; // Return the original string if it doesn't match the expected format
    }
    
    // Manually extract hours and minutes to validate
    const colonIndex = time.indexOf(':');
    const hours = time.substring(0, colonIndex);
    const minutes = time.substring(colonIndex + 1);
    
    if (isNaN(Number(hours)) || isNaN(Number(minutes))) {
      console.warn(`formatTimeWithAMPM received invalid time components: hours=${hours}, minutes=${minutes}`);
      return time;
    }
    
    try {
      const parsedTime = parse(time, 'HH:mm', new Date());
      if (isNaN(parsedTime.getTime())) {
        console.warn(`formatTimeWithAMPM failed to parse time: ${time}`);
        return time; // Return the original string if parsing fails
      }
      
      return format(parsedTime, 'hh:mm a');
    } catch (parseError) {
      console.error('Error parsing time:', parseError);
      return time;
    }
  } catch (error) {
    console.error('Error formatting time with AM/PM:', error);
    return String(time); // Convert to string as a last resort
  }
};

/**
 * Formats a date to display only month and day (e.g., "Mar 29")
 */
export const formatDateShort = (date: Date): string => {
  return format(date, 'MMM d');
};
