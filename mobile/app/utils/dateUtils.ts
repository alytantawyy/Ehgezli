/**
 * Utility functions for date and time handling
 */

/**
 * Formats a UTC date string to local date and time
 * @param utcDateString - UTC date string (e.g., "2025-06-04T14:00:00.000Z")
 * @returns Object containing formatted date and time strings
 */
export const formatUTCToLocal = (utcDateString: string) => {
  const date = new Date(utcDateString);
  
  // Format date as "YYYY-MM-DD"
  const localDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).split('/').reverse().join('-');
  
  // Format time as "HH:MM AM/PM"
  const localTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  
  return {
    date: localDate,
    time: localTime,
    fullDateTime: `${localDate} at ${localTime}`,
  };
};

/**
 * Formats a booking time for display
 * @param booking - Booking object with startTime and endTime
 * @returns Formatted time range string
 */
export const formatBookingTime = (booking: { startTime: string; endTime: string }) => {
  const start = formatUTCToLocal(booking.startTime);
  const end = formatUTCToLocal(booking.endTime);
  
  return `${start.time} - ${end.time}`;
};

/**
 * Formats a date for display
 * @param dateString - Date string in any valid format
 * @returns Formatted date string (e.g., "June 5, 2025")
 */
export const formatDateForDisplay = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Checks if a date is today
 * @param dateString - Date string to check
 * @returns Boolean indicating if the date is today
 */
export const isToday = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * Converts local date and time to UTC format for API requests
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timeString - Time string in HH:MM format (24-hour)
 * @returns ISO string in UTC format (with Z suffix)
 */
export const convertLocalToUTC = (dateString: string, timeString: string): string => {
  // Create a date object from the local date and time
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Parse the date string (YYYY-MM-DD)
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create a date object in local timezone
  // Note: month is 0-indexed in JavaScript Date
  const localDate = new Date(year, month - 1, day, hours, minutes);
  
  // Convert to ISO string which will be in UTC
  const utcString = localDate.toISOString();
  
  console.log(`Converting local date ${dateString} ${timeString} to UTC: ${utcString}`);
  
  return utcString;
};
