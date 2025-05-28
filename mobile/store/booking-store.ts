import { create } from 'zustand';
import { BookingWithDetails, Booking, CreateBookingData, UpdateBookingData } from '../types/booking';
import {
  getBookingById,
  getUserBookings,
  createBooking,
  updateBooking,
  deleteBooking} from '../api/booking';

interface BookingState {
  // Data
  userBookings: BookingWithDetails[];
  selectedBooking: BookingWithDetails | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchUserBookings: () => Promise<BookingWithDetails[]>;
  fetchBookingById: (id: number) => Promise<BookingWithDetails | null>;
  createNewBooking: (bookingData: CreateBookingData) => Promise<Booking | null>;
  updateExistingBooking: (id: number, bookingData: UpdateBookingData) => Promise<Booking | null>;
  cancelBooking: (id: number) => Promise<boolean>;
  clearError: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  // Data
  userBookings: [],
  selectedBooking: null,
  loading: false,
  error: null,
  
  // Fetch user bookings
  fetchUserBookings: async () => {
    try {
      set({ loading: true, error: null });
      const bookings = await getUserBookings();
      set({ userBookings: bookings, loading: false });
      return bookings;
    } catch (error: any) {
      console.error('Error fetching user bookings:', error);
      set({ 
        error: error.message || 'Failed to fetch bookings', 
        loading: false 
      });
      return [];
    }
  },
  
  // Fetch a booking by ID
  fetchBookingById: async (id: number) => {
    try {
      set({ loading: true, error: null });
      const booking = await getBookingById(id);
      set({ selectedBooking: booking, loading: false });
      return booking;
    } catch (error: any) {
      console.error(`Error fetching booking ${id}:`, error);
      set({ 
        error: error.message || 'Failed to fetch booking details', 
        loading: false 
      });
      return null;
    }
  },
  
  // Create a new booking
  createNewBooking: async (bookingData: CreateBookingData) => {
    try {
      set({ loading: true, error: null });
      const newBooking = await createBooking(bookingData);
      // Refresh user bookings to include the new booking
      get().fetchUserBookings();
      set({ loading: false });
      return newBooking;
    } catch (error: any) {
      console.error('Error creating booking:', error);
      set({ 
        error: error.message || 'Failed to create booking', 
        loading: false 
      });
      return null;
    }
  },
  
  // Update an existing booking
  updateExistingBooking: async (id: number, bookingData: UpdateBookingData) => {
    try {
      set({ loading: true, error: null });
      const updatedBooking = await updateBooking(id, bookingData);
      // Refresh user bookings to include the updated booking
      get().fetchUserBookings();
      set({ loading: false });
      return updatedBooking;
    } catch (error: any) {
      console.error(`Error updating booking ${id}:`, error);
      set({ 
        error: error.message || 'Failed to update booking', 
        loading: false 
      });
      return null;
    }
  },
  
  // Cancel a booking
  cancelBooking: async (id: number) => {
    try {
      set({ loading: true, error: null });
      await deleteBooking(id);
      // Remove the cancelled booking from the state
      const updatedBookings = get().userBookings.filter(booking => booking.id !== id);
      set({ userBookings: updatedBookings, loading: false });
      return true;
    } catch (error: any) {
      console.error(`Error cancelling booking ${id}:`, error);
      set({ 
        error: error.message || 'Failed to cancel booking', 
        loading: false 
      });
      return false;
    }
  },
  
  // Clear error
  clearError: () => set({ error: null }),
}));
