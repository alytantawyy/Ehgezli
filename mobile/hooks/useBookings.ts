import { useEffect, useCallback, useRef } from 'react';
import { useBookingStore } from '../store/booking-store';
import { format, compareDesc, compareAsc } from 'date-fns';
import { BookingWithDetails } from '../types/booking';

type SortOrder = 'newest' | 'oldest';
type BookingFilter = 'upcoming' | 'past' | 'all';

export const useBookings = () => {
  // Get state and actions from the booking store
  const {
    userBookings,
    selectedBooking,
    loading,
    error,
    fetchUserBookings,
    fetchBookingById,
    createNewBooking,
    updateExistingBooking,
    cancelBooking,
    clearError
  } = useBookingStore();

  // Track if we've already initialized
  const initialized = useRef(false);

  // Safe date formatting function to prevent invalid time errors
  const safeFormatDate = useCallback((dateString: string | undefined, formatString: string) => {
    try {
      if (!dateString) return 'Date not available';
      
      console.log(`FORMAT DATE - Input: "${dateString}", Format: "${formatString}"`);
      
      // Always create a new Date object from the ISO string
      // JavaScript's Date constructor automatically handles UTC to local conversion
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.log(`FORMAT DATE - Invalid date from: "${dateString}"`);
        return 'Invalid date';
      }
      
      // Get timezone info for debugging
      const tzOffset = date.getTimezoneOffset();
      const tzHours = Math.abs(Math.floor(tzOffset / 60));
      const tzMinutes = Math.abs(tzOffset % 60);
      const tzString = `${tzOffset <= 0 ? '+' : '-'}${tzHours.toString().padStart(2, '0')}:${tzMinutes.toString().padStart(2, '0')}`;
      
      // Format the date using date-fns
      const formatted = format(date, formatString);
      console.log(`FORMAT DATE - "${dateString}" -> Local: "${formatted}" (UTC${tzString})`);
      
      return formatted;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  }, []);

  // Safe time formatting function
  const safeFormatTime = useCallback((dateString: string | undefined, timeString: string | undefined, formatString: string) => {
    try {
      // Make sure we have valid inputs
      if (!timeString) {
        return 'Time not available';
      }
      
      // If timeString is an ISO date-time string (contains 'T' and possibly 'Z')
      if (timeString.includes('T')) {
        // This is already a full ISO datetime string, parse it directly
        const date = new Date(timeString);
        if (!isNaN(date.getTime())) {
          return format(date, formatString);
        }
        
        // Extract just the time portion from the ISO string as fallback
        const timePart = timeString.split('T')[1];
        // Remove any milliseconds and timezone info
        const cleanTime = timePart.split('.')[0].replace('Z', '');
        // Extract hours and minutes
        const [hours, minutes] = cleanTime.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
      
      // Handle HH:MM or HH:MM:SS format from database
      if (timeString.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
        // Extract hours and minutes, ignoring seconds if present
        const [hours, minutes] = timeString.split(':').map(Number);
        
        // If we have a date string, create a proper date object to handle timezone correctly
        if (dateString) {
          try {
            // Create a date object with the provided date and time
            // Assume the time is in UTC as stored in the database
            const dateObj = new Date(`${dateString.split('T')[0]}T${timeString}Z`);
            
            if (!isNaN(dateObj.getTime())) {
              // Format using date-fns which will respect the local timezone
              return format(dateObj, formatString);
            }
          } catch (e) {
            console.error('Error parsing date-time with timezone:', e);
          }
        }
        
        // Fallback to simple 12-hour conversion if date parsing fails
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
      
      return timeString; // Fallback to the raw time string
    } catch (error) {
      console.error('Error formatting time:', error, { dateString, timeString });
      return timeString || 'Invalid time';
    }
  }, []);

  // Filter and sort bookings
  const getFilteredAndSortedBookings = useCallback((filter: BookingFilter = 'upcoming', sortOrder: SortOrder = 'newest'): BookingWithDetails[] => {
    if (!userBookings || userBookings.length === 0) {
      console.log('No bookings to filter');
      return [];
    }
    
    console.log(`Filtering ${userBookings.length} bookings with filter: ${filter}`);
    
    // First, ensure all bookings have the expected structure
    const validBookings = userBookings.filter(booking => {
      // Filter out bookings with missing required data
      return booking && booking.branch && (booking.startTime || (booking.timeSlot && booking.timeSlot.date));
    });
    
    console.log(`Valid bookings after structure check: ${validBookings.length}`);
    
    const now = new Date();
    console.log(`Current date and time for comparison: ${now.toISOString()}`);
    
    let filtered;
    
    // Apply filter
    switch (filter) {
      case 'upcoming':
        filtered = validBookings.filter(booking => {
          // Use isBookingPast function to determine if booking is past or upcoming
          const isPast = isBookingPast(booking);
          console.log(`Booking #${booking.id} - isPast: ${isPast}`);
          return !isPast; // If it's not past, it's upcoming
        });
        break;
      case 'past':
        filtered = validBookings.filter(booking => {
          // Use isBookingPast function to determine if booking is past or upcoming
          const isPast = isBookingPast(booking);
          console.log(`Booking #${booking.id} - isPast: ${isPast}`);
          return isPast; // If it's past, include it in past filter
        });
        break;
      case 'all':
      default:
        filtered = validBookings;
        break;
    }
    
    console.log(`After filtering: ${filtered.length} bookings remain`);
    
    // Apply sorting with robust error handling
    return filtered.sort((a, b) => {
      // Prefer startTime over timeSlot.date for sorting
      const getDateForSorting = (booking: BookingWithDetails): Date => {
        if (booking.startTime) {
          return new Date(booking.startTime);
        }
        if (booking.timeSlot?.date) {
          return new Date(booking.timeSlot.date);
        }
        return new Date(0); // Default to epoch if no date available
      };
      
      try {
        const dateA = getDateForSorting(a);
        const dateB = getDateForSorting(b);
        
        // Handle invalid dates
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        
        return sortOrder === 'newest' 
          ? compareDesc(dateA, dateB) 
          : compareAsc(dateA, dateB);
      } catch (error) {
        console.warn('Error sorting bookings:', error);
        return 0; // Don't change order if there's an error
      }
    });
  }, [userBookings]);

  // Check if a booking is in the past
  const isBookingPast = useCallback((booking: BookingWithDetails): boolean => {
    const now = new Date();
    
    // Use startTime if available, fall back to timeSlot.date if not
    if (booking.startTime) {
      const bookingTime = new Date(booking.startTime);
      
      // Add extra logging to debug timezone issues
      const tzOffset = now.getTimezoneOffset();
      const tzHours = Math.abs(Math.floor(tzOffset / 60));
      const tzMinutes = Math.abs(tzOffset % 60);
      const tzString = `${tzOffset <= 0 ? '+' : '-'}${tzHours.toString().padStart(2, '0')}:${tzMinutes.toString().padStart(2, '0')}`;
      
      // Compare the full ISO strings to ensure accurate comparison
      const isPast = bookingTime.getTime() < now.getTime();
      
      console.log(`🕒 PAST CHECK - Booking #${booking.id}: 
        Raw startTime: ${booking.startTime}
        Parsed: ${format(bookingTime, 'yyyy-MM-dd HH:mm:ss')}
        Now: ${format(now, 'yyyy-MM-dd HH:mm:ss')} (UTC${tzString})
        Time diff (ms): ${bookingTime.getTime() - now.getTime()}
        Result: ${isPast ? 'PAST' : 'UPCOMING'}`);
      
      return isPast;
    }
    
    // Fall back to timeSlot.date and startTime if available
    if (booking.timeSlot && booking.timeSlot.date && booking.timeSlot.startTime) {
      // Combine date and time for accurate comparison
      const dateStr = booking.timeSlot.date.split('T')[0];
      const timeStr = booking.timeSlot.startTime.split('T')[1] || booking.timeSlot.startTime;
      const fullDateTimeStr = `${dateStr}T${timeStr}`;
      const bookingTime = new Date(fullDateTimeStr);
      
      // Compare the full ISO strings to ensure accurate comparison
      const isPast = bookingTime.getTime() < now.getTime();
      
      console.log(`🕒 PAST CHECK - Booking #${booking.id} (fallback): 
        Combined: ${fullDateTimeStr}
        Parsed: ${format(bookingTime, 'yyyy-MM-dd HH:mm:ss')}
        Now: ${format(now, 'yyyy-MM-dd HH:mm:ss')}
        Time diff (ms): ${bookingTime.getTime() - now.getTime()}
        Result: ${isPast ? 'PAST' : 'UPCOMING'}`);
      
      return isPast;
    }
    
    // If we can't determine the time, default to using just the date
    if (booking.timeSlot && booking.timeSlot.date) {
      const bookingDate = new Date(booking.timeSlot.date);
      // Set to end of day to avoid marking today's bookings as past
      bookingDate.setHours(23, 59, 59, 999);
      
      const isPast = bookingDate.getTime() < now.getTime();
      
      console.log(`🕒 PAST CHECK - Booking #${booking.id} (date only): 
        Date: ${booking.timeSlot.date}
        Parsed: ${format(bookingDate, 'yyyy-MM-dd HH:mm:ss')}
        Now: ${format(now, 'yyyy-MM-dd HH:mm:ss')}
        Result: ${isPast ? 'PAST' : 'UPCOMING'}`);
      
      return isPast;
    }
    
    return false;
  }, []);

  return {
    // State
    userBookings,
    selectedBooking,
    loading,
    error,
    
    // Actions
    fetchUserBookings,
    fetchBookingById,
    createNewBooking,
    updateExistingBooking,
    cancelBooking,
    clearError,
    
    // Helper functions
    getFilteredAndSortedBookings,
    safeFormatDate,
    safeFormatTime,
    isBookingPast
  };
};
