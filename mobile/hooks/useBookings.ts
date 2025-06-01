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
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, formatString);
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
        // Extract just the time portion from the ISO string
        const timePart = timeString.split('T')[1];
        // Remove any milliseconds and timezone info
        const cleanTime = timePart.split('.')[0].replace('Z', '');
        // Extract hours and minutes
        const [hours, minutes] = cleanTime.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
      
      // Handle HH:MM format
      if (timeString.match(/^\d{1,2}:\d{2}$/)) {
        // Convert 24-hour format to 12-hour format with AM/PM
        const [hours, minutes] = timeString.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
      
      // If we have a date string, try to use it with the time
      if (dateString) {
        try {
          // Create a proper ISO date-time string
          const dateTimeString = `${dateString.split('T')[0]}T${timeString}`;
          const date = new Date(dateTimeString);
          
          if (!isNaN(date.getTime())) {
            return format(date, formatString);
          }
        } catch (e) {
          console.error('Error parsing date-time:', e);
        }
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
      return booking && booking.timeSlot && booking.timeSlot.date && booking.branch;
    });
    
    console.log(`Valid bookings after structure check: ${validBookings.length}`);
    
    const now = new Date();
    // Reset hours to start of day for fair comparison
    now.setHours(0, 0, 0, 0);
    console.log(`Current date for comparison: ${now.toISOString()}`);
    
    let filtered;
    
    // Apply filter
    switch (filter) {
      case 'upcoming':
        filtered = validBookings.filter(booking => {
          // For upcoming, include all bookings that aren't explicitly in the past
          if (!booking.timeSlot?.date) return false; // Skip if no date
          
          try {
            const bookingDate = new Date(booking.timeSlot.date);
            // Reset hours to start of day for fair comparison
            bookingDate.setHours(0, 0, 0, 0);
            
            // For upcoming, include bookings with today's date or future dates
            const isToday = bookingDate.toDateString() === now.toDateString();
            const isFuture = bookingDate > now;
            
            console.log(`Booking date: ${bookingDate.toISOString()}, isToday: ${isToday}, isFuture: ${isFuture}`);
            
            return isToday || isFuture;
          } catch (error) {
            console.error('Error comparing dates:', error);
            return false; // Exclude by default if there's an error
          }
        });
        break;
      case 'past':
        filtered = validBookings.filter(booking => {
          // For past, only include bookings with valid dates in the past
          if (!booking.timeSlot?.date) return false;
          
          try {
            const bookingDate = new Date(booking.timeSlot.date);
            // Reset hours to start of day for fair comparison
            bookingDate.setHours(0, 0, 0, 0);
            
            // For past, exclude bookings with today's date
            return bookingDate < now && bookingDate.toDateString() !== now.toDateString();
          } catch (error) {
            return false; // Exclude by default if there's an error
          }
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
      // If either booking doesn't have a date, handle gracefully
      if (!a.timeSlot?.date && !b.timeSlot?.date) return 0;
      if (!a.timeSlot?.date) return 1; // No date sorts to end
      if (!b.timeSlot?.date) return -1; // No date sorts to start
      
      try {
        const dateA = new Date(a.timeSlot.date);
        const dateB = new Date(b.timeSlot.date);
        
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
    return new Date(booking.timeSlot.date) < new Date();
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
