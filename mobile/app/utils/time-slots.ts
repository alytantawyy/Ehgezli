import { format, addMinutes } from 'date-fns';

/**
 * Gets the base time for generating time slots
 * Handles special cases for late night hours (10 PM to 6 AM)
 */
export const getBaseTime = (currentTime?: Date): Date => {
  // Use current time if not provided
  const now = currentTime || new Date();
  
  // Special handling for late night hours (10 PM to 6 AM)
  let baseTime;
  const currentHour = now.getHours();
  
  if (currentHour >= 22 || currentHour < 6) {
    // If it's late night, use noon the next day as the base time instead of now + 2 hours
    
    // Create a new date for tomorrow at noon
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0, 0);
    
    baseTime = tomorrow;
  } else {
    // Normal case: add 2 hours to current time
    baseTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  }
  
  // Round down to nearest 30 mins
  const minutes = baseTime.getMinutes();
  const roundedMinutes = Math.floor(minutes / 30) * 30;
  baseTime.setMinutes(roundedMinutes);
  
  return baseTime;
};

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
 * Default behavior: 2 hours from current time, rounded down to nearest 30 mins
 * (or noon next day for late night hours)
 */
export const generateLocalTimeSlots = (currentTime?: Date): string[] => {
  // Get the base time using our centralized function
  const baseTime = getBaseTime(currentTime);
  
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
 * Generates time slots based on a specific time
 * Creates slots at the specified time, 30 mins after, and 1 hour after
 * Used when user explicitly selects a time
 */
export const generateTimeSlotsFromTime = (selectedTime: Date): string[] => {
  // Use the selected time as the base
  const baseTime = new Date(selectedTime);
  
  // Generate slots: at the selected time, 30 minutes after, and 60 minutes after
  const atTime = new Date(baseTime);
  const thirtyMinAfter = new Date(baseTime.getTime() + 30 * 60 * 1000);
  const sixtyMinAfter = new Date(baseTime.getTime() + 60 * 60 * 1000);
  
  // Format as HH:mm
  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return [formatTime(atTime), formatTime(thirtyMinAfter), formatTime(sixtyMinAfter)];
};

/**
 * Formats a time string from 24-hour format to 12-hour format with AM/PM
 * or returns the original if it's already in 12-hour format
 * @param time The time string to format
 * @param forceFormat If true, will attempt to format even if already in 12-hour format
 */
export const formatTimeWithAMPM = (time: string | undefined, forceFormat: boolean = false): string => {
  if (!time) return '';
  
  try {
    // Check if time is already in 12-hour format with AM/PM
    if (!forceFormat && (time.includes('AM') || time.includes('PM'))) {
      console.log(`Time already in 12-hour format: ${time}`);
      return time; // Return as is if already in 12-hour format
    }
    
    // Check if time is in the expected 24-hour format (HH:mm)
    if (!/^\d{1,2}:\d{2}$/.test(time)) {
      // Don't warn for times that include AM/PM as they're already formatted
      if (!time.includes('AM') && !time.includes('PM')) {
        console.warn(`Invalid time format: ${time}`);
      }
      return time; // Return the original if it's not in the expected format
    }
    
    // Manually parse the time to avoid date-fns errors
    const [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    // Validate hours and minutes
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn(`Invalid time values: hours=${hours}, minutes=${minutes}`);
      return time;
    }
    
    // Convert to 12-hour format
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert 0 to 12
    
    // Format the time
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return time; // Return the original if parsing fails
  }
};

/**
 * Formats a date to display only month and day (e.g., "Mar 29")
 */
export const formatDateShort = (date: Date): string => {
  return format(date, 'MMM d');
};

/**
 * Formats a base time for display in the UI (12-hour with AM/PM)
 */
export const getDefaultTimeForDisplay = (currentTime?: Date): string => {
  const baseTime = getBaseTime(currentTime);
  return format(baseTime, 'h:mm a');
};

/**
 * Fetches available time slots from the backend and returns the 3 closest to the selected time
 * @param branchId The branch ID to fetch availability for
 * @param date The date in YYYY-MM-DD format
 * @param selectedTime The user's selected time (optional)
 * @returns Array of 3 closest available time slots in HH:mm format
 */
export const fetchAvailableTimeSlots = async (
  branchId: number,
  date: string,
  selectedTime?: string
): Promise<string[]> => {
  try {
    // DEBUG: Log request parameters
    console.log('🔍 Fetching time slots with params:', { branchId, date, selectedTime });
    
    // Import dynamically to avoid circular dependencies
    const { getBranchAvailability } = await import('@/api/branch');
    
    // Fetch all available slots for this branch and date
    const availability = await getBranchAvailability(branchId, date);
    
    // DEBUG: Log response data
    console.log('📅 Availability response:', JSON.stringify(availability, null, 2));
    
    // If no slots are available, return empty array
    if (!availability.hasAvailability || !availability.availableSlots || availability.availableSlots.length === 0) {
      console.log('❌ No available slots found');
      return [];
    }
    
    // Extract just the time strings from available slots
    const availableTimes = availability.availableSlots
      .filter(slot => slot.isAvailable)
      .map(slot => slot.time);
    
    console.log('✅ Available times:', availableTimes);
    
    // If no available times after filtering, return empty array
    if (availableTimes.length === 0) {
      console.log('❌ No available slots after filtering');
      return [];
    }
    
    // If no selected time, return the first 3 available slots (or fewer if less than 3)
    if (!selectedTime) {
      const result = availableTimes.slice(0, 3);
      console.log('🕒 Returning first 3 available slots:', result);
      return result;
    }
    
    // Find the 3 closest available slots to the selected time
    const result = findClosestTimeSlots(availableTimes, selectedTime, 3);
    console.log('🕒 Returning', result.length, 'closest slots to', selectedTime, ':', result);
    return result;
  } catch (error) {
    console.error('❌ Error fetching available time slots:', error);
    return [];
  }
};

/**
 * Finds the closest available time slots to a selected time
 * @param availableTimes Array of available times in HH:mm format
 * @param selectedTime The selected time in HH:mm format
 * @returns Array of the 3 closest available times
 */
export const findClosestTimeSlots = (availableTimes: string[], selectedTime: string, numSlots: number = 3): string[] => {
  if (availableTimes.length === 0) return [];
  if (availableTimes.length <= numSlots) return availableTimes;
  
  // Convert all times to minutes since midnight for easier comparison
  const selectedMinutes = timeToMinutes(selectedTime);
  
  // Sort available times by proximity to selected time
  const sortedTimes = [...availableTimes].sort((a, b) => {
    const aDiff = Math.abs(timeToMinutes(a) - selectedMinutes);
    const bDiff = Math.abs(timeToMinutes(b) - selectedMinutes);
    return aDiff - bDiff;
  });
  
  // Return the numSlots closest times
  return sortedTimes.slice(0, numSlots);
};

/**
 * Converts a time string (HH:mm) to minutes since midnight
 */
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Add a default export to prevent Expo Router from treating this as a route
export default {
  getBaseTime,
  generateLocalTimeSlots,
  generateTimeSlotsFromTime,
  formatTimeWithAMPM,
  formatDateShort,
  getDefaultTimeForDisplay,
  fetchAvailableTimeSlots,
  findClosestTimeSlots
};
