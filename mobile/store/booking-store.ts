import { create } from 'zustand';
import { format } from 'date-fns';
import { BookingWithDetails, Booking, CreateBookingData, UpdateBookingData } from '../types/booking';
import {
  getBookingById,
  getUserBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  getBookingsForBranch,
  getBookingsForBranchOnDate,
  createGuestReservation} from '../api/booking';

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
  getBookingsForBranchOnDate: (branchId: number, date: string) => Promise<BookingWithDetails[]>;
  createReservationForCustomer: (reservationData: {
    customerName: string;
    phoneNumber: string;
    partySize: number;
    reservationTime: string;
    branchId: number;
    notes?: string;
    status: string;
    timeSlotId: number;
  }) => Promise<Booking | null>;
  createGuestReservation: (reservationData: {
    customerName: string;
    phoneNumber: string;
    partySize: number;
    timeSlotId: number;
    notes?: string;
  }) => Promise<Booking | null>;
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
  
  // Get bookings for a branch on a specific date
  getBookingsForBranchOnDate: async (branchId: number, date: string) => {
    try {
      set({ loading: true, error: null });
      
      // Validate inputs
      if (!branchId) {
        throw new Error('Branch ID is required');
      }
      
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error('Valid date in YYYY-MM-DD format is required');
      }
      
      // Call the API to get bookings for the branch on the specified date
      const bookings = await getBookingsForBranchOnDate(branchId, date);
      set({ loading: false });
      return bookings;
    } catch (error: any) {
      console.error(`Error fetching bookings for branch ${branchId} on ${date}:`, error);
      set({ 
        error: error.message || 'Failed to fetch branch bookings', 
        loading: false 
      });
      return [];
    }
  },
  
  // Create a reservation for a customer (for restaurant staff)
  createReservationForCustomer: async (reservationData: {
    customerName: string;
    phoneNumber: string;
    partySize: number;
    reservationTime: string;
    branchId: number;
    notes?: string;
    status: string;
    timeSlotId: number;
  }) => {
    try {
      set({ loading: true, error: null });
      
      // Transform the data to match what createGuestReservation expects
      const guestData = {
        guestName: reservationData.customerName,
        guestPhone: reservationData.phoneNumber,
        timeSlotId: reservationData.timeSlotId,
        partySize: reservationData.partySize,
        specialRequests: reservationData.notes
      };
      
      const newBooking = await createGuestReservation(guestData);
      
      // Refresh bookings
      get().fetchUserBookings();
      set({ loading: false });
      return newBooking;
    } catch (error: any) {
      console.error('Error creating reservation for customer:', error);
      set({ 
        error: error.message || 'Failed to create reservation', 
        loading: false 
      });
      return null;
    }
  },
  
  // Create a guest reservation
  createGuestReservation: async (reservationData: {
    customerName: string;
    phoneNumber: string;
    partySize: number;
    timeSlotId: number;
    notes?: string;
  }) => {
    try {
      set({ loading: true, error: null });
      
      // Format the data to match what the API expects
      const apiData = {
        guestName: reservationData.customerName,
        guestPhone: reservationData.phoneNumber,
        timeSlotId: reservationData.timeSlotId,
        partySize: reservationData.partySize,
        specialRequests: reservationData.notes
      };
      
      const newBooking = await createGuestReservation(apiData);
      
      // Refresh bookings
      get().getBookingsForBranchOnDate(109, format(new Date(), 'yyyy-MM-dd'));
      
      set({ loading: false });
      return newBooking;
    } catch (error: any) {
      console.error('Error creating guest reservation:', error);
      set({ 
        error: error.message || 'Failed to create guest reservation', 
        loading: false 
      });
      return null;
    }
  },
  
  // Clear error
  clearError: () => set({ error: null }),
}));
