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
  const safeFormatDate = useCallback((dateString: string, formatString: string) => {
    try {
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
  const safeFormatTime = useCallback((dateString: string, timeString: string, formatString: string) => {
    try {
      // Make sure we have valid inputs
      if (!dateString || !timeString) {
        return 'Time not available';
      }
      
      // Create a proper ISO date-time string
      const dateTimeString = `${dateString}T${timeString}`;
      const date = new Date(dateTimeString);
      
      if (isNaN(date.getTime())) {
        return 'Invalid time';
      }
      
      return format(date, formatString);
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time';
    }
  }, []);

  // Filter and sort bookings
  const getFilteredAndSortedBookings = useCallback((filter: BookingFilter = 'upcoming', sortOrder: SortOrder = 'newest'): BookingWithDetails[] => {
    if (!userBookings || userBookings.length === 0) return [];
    
    const now = new Date();
    let filtered;
    
    // Apply filter
    switch (filter) {
      case 'upcoming':
        filtered = userBookings.filter(booking => new Date(booking.timeSlot.date) >= now);
        break;
      case 'past':
        filtered = userBookings.filter(booking => new Date(booking.timeSlot.date) < now);
        break;
      case 'all':
      default:
        filtered = [...userBookings];
        break;
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      const dateA = new Date(a.timeSlot.date);
      const dateB = new Date(b.timeSlot.date);
      
      return sortOrder === 'newest' 
        ? compareDesc(dateA, dateB) 
        : compareAsc(dateA, dateB);
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
