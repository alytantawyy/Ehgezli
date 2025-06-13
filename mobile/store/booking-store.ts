import { create } from 'zustand';
import { format } from 'date-fns';
import { BookingWithDetails, Booking, CreateBookingData, UpdateBookingData, BookingStatus } from '../types/booking';
import {
  getUserBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  getBookingsForBranch,
  getBookingsForBranchOnDate,
  getBookingSettings,
  updateBookingSettings,
  getBookingOverrides,
  getBookingOverride,
  createBookingOverride,
  updateBookingOverride,
  deleteBookingOverride,
  createGuestReservation,
  changeBookingStatus
} from '../api/booking';
import { BookingSettings, BookingOverride } from '../types/branch';
import { CreateBookingOverrideData } from '../types/booking';

interface BookingState {
  // Data
  userBookings: BookingWithDetails[];
  selectedBooking: BookingWithDetails | null;
  loading: boolean;
  error: string | null;
  
  // Booking Settings
  bookingSettings: BookingSettings | null;
  bookingOverrides: BookingOverride[];
  selectedOverride: BookingOverride | null;
  
  // Actions
  fetchUserBookings: () => Promise<BookingWithDetails[]>;
  fetchBookingById: (id: number) => Promise<BookingWithDetails | null>;
  createNewBooking: (bookingData: CreateBookingData) => Promise<Booking | null>;
  updateExistingBooking: (id: number, bookingData: UpdateBookingData) => Promise<Booking | null>;
  cancelBooking: (id: number) => Promise<boolean>;
  changeBookingStatus: (id: number, status: BookingStatus) => Promise<Booking | null>;
  getBookingsForBranch: (branchId: number) => Promise<BookingWithDetails[]>;
  getBookingsForBranchOnDate: (branchId: number, date: string | Date) => Promise<BookingWithDetails[]>;
  createReservationForCustomer: (reservationData: {
    customerName: string;
    phoneNumber: string;
    partySize: number;
    reservationTime: string;
    branchId: number;
    restaurantId: number;
    notes?: string;
    status: string;
    timeSlotId: number;
  }) => Promise<Booking | null>;
  createGuestReservation: (reservationData: {
    customerName: string;
    phoneNumber: string;
    partySize: number;
    timeSlotId: number;
    branchId: number;
    restaurantId: number;
    notes?: string;
  }) => Promise<Booking | null>;
  
  // Booking Settings Actions
  fetchBookingSettings: (branchId: number) => Promise<BookingSettings | null>;
  updateBranchBookingSettings: (branchId: number, settings: Partial<BookingSettings>) => Promise<BookingSettings | null>;
  
  // Booking Overrides Actions
  fetchBookingOverrides: (branchId: number) => Promise<BookingOverride[]>;
  fetchBookingOverride: (overrideId: number) => Promise<BookingOverride | null>;
  createNewBookingOverride: (branchId: number, override: CreateBookingOverrideData) => Promise<BookingOverride | null>;
  updateExistingBookingOverride: (overrideId: number, override: Partial<BookingOverride>) => Promise<BookingOverride | null>;
  deleteBookingOverride: (overrideId: number) => Promise<boolean>;
  
  clearError: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  // Data
  userBookings: [],
  selectedBooking: null,
  loading: false,
  error: null,
  
  // Booking Settings
  bookingSettings: null,
  bookingOverrides: [],
  selectedOverride: null,
  
  // Fetch user bookings
  fetchUserBookings: async () => {
    try {
      set({ loading: true, error: null });
      const rawBookings = await getUserBookings();
      
      console.log('🔍 API RESPONSE - Raw bookings count:', rawBookings.length);
      if (rawBookings.length > 0) {
        console.log('🔍 API RESPONSE - First booking:', JSON.stringify(rawBookings[0], null, 2));
        console.log('🔍 API RESPONSE - Date fields:', {
          date: rawBookings[0].date,
          startTime: rawBookings[0].startTime,
          endTime: rawBookings[0].endTime,
          timeSlot: rawBookings[0].timeSlot
        });
      }
      
      // Transform the API response to match the expected BookingWithDetails structure
      const transformedBookings = rawBookings.map(booking => {
        // Use type assertion to access properties not in the BookingWithDetails type
        const rawBooking = booking as any;
        
        // Create a proper date object from the API date string
        // Assuming the API returns dates in UTC format
        let bookingDate = rawBooking.date;
        let startTime = rawBooking.startTime;
        let endTime = rawBooking.endTime;
        
        // Log the raw date values for debugging
        console.log('🔍 PROCESSING - Raw date values:', {
          bookingId: rawBooking.id,
          bookingDate,
          startTime,
          endTime,
          timeSlotDate: rawBooking.timeSlot?.date
        });
        
        // Handle timezone conversion for display
        try {
          // For ISO date strings, use them directly without reconstruction
          // This avoids the invalid date string construction error
          const startDateTime = startTime; // Already in proper ISO format
          const endDateTime = endTime;   // Already in proper ISO format
          
          // Log the date strings
          console.log('🔍 PROCESSING - Using ISO date strings directly:', {
            bookingId: rawBooking.id,
            startDateTime,
            endDateTime
          });
          
          // Parse as UTC and format to local date string
          const localStartDate = new Date(startDateTime);
          
          // Log the local date for debugging
          console.log('🔍 PROCESSING - Local date:', {
            bookingId: rawBooking.id,
            localDate: format(localStartDate, 'yyyy-MM-dd')
          });
          
          // Use the local date for display
          if (!isNaN(localStartDate.getTime())) {
            bookingDate = format(localStartDate, 'yyyy-MM-dd');
            console.log(`🔍 PROCESSING - Converted date from ${rawBooking.date} to ${bookingDate}`);
          }
        } catch (e) {
          console.error('Error converting date/time to local timezone:', e);
        }
        
        // Create the expected structure with values from the API
        return {
          ...booking,
          // Use real timeSlot data from the API with timezone-adjusted date
          timeSlot: {
            date: bookingDate,
            startTime: startTime,
            endTime: endTime
          },
          // Add branch object with restaurant info from the API
          branch: {
            id: booking.branchId,
            restaurantName: rawBooking.restaurantName,
            address: rawBooking.branchAddress,
            city: rawBooking.branchCity
          }
        };
      });
      
      console.log('🔍 TRANSFORMED BOOKINGS - Count:', transformedBookings.length);
      if (transformedBookings.length > 0) {
        console.log('🔍 TRANSFORMED BOOKINGS - First booking:', JSON.stringify(transformedBookings[0], null, 2));
      }
      
      set({ userBookings: transformedBookings, loading: false });
      return transformedBookings;
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
      // Refresh user bookings to reflect the update
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
      // Refresh user bookings to remove the cancelled booking
      get().fetchUserBookings();
      set({ loading: false });
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
  
  // Change booking status
  changeBookingStatus: async (id: number, status: BookingStatus) => {
    try {
      set({ loading: true, error: null });
      const updatedBooking = await changeBookingStatus(id, status);
      
      // Refresh bookings to reflect the status change
      if (updatedBooking) {
        // If we're viewing a specific branch's bookings, refresh those
        const { selectedBooking } = get();
        if (selectedBooking && selectedBooking.branchId) {
          await get().getBookingsForBranchOnDate(selectedBooking.branchId, new Date());
        } else {
          // Otherwise refresh user bookings
          await get().fetchUserBookings();
        }
      }
      
      set({ loading: false });
      return updatedBooking;
    } catch (error: any) {
      console.error(`Error changing booking status ${id}:`, error);
      set({ 
        error: error.message || 'Failed to change booking status', 
        loading: false 
      });
      return null;
    }
  },
  
  // Get bookings for a branch
  getBookingsForBranch: async (branchId: number) => {
    try {
      set({ loading: true, error: null });
      const bookings = await getBookingsForBranch(branchId);
      set({ loading: false });
      return bookings;
    } catch (error: any) {
      console.error(`Error fetching bookings for branch ${branchId}:`, error);
      set({ 
        error: error.message || 'Failed to fetch branch bookings', 
        loading: false 
      });
      return [];
    }
  },
  
  // Get bookings for a branch on a specific date
  getBookingsForBranchOnDate: async (branchId: number, date: string | Date) => {
    try {
      set({ loading: true, error: null });
      // Format the date to match the API's expected format (if needed)
      let formattedDate = '';
      if (date instanceof Date) {
        formattedDate = format(date, 'yyyy-MM-dd');
      } else if (typeof date === 'string') {
        if (date.includes('/')) {
          // Convert from MM/DD/YYYY to YYYY-MM-DD if needed
          const parts = date.split('/');
          formattedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        } else {
          formattedDate = date; // Already in the correct format
        }
      }
      
      const bookings = await getBookingsForBranchOnDate(branchId, formattedDate);
      set({ loading: false });
      return bookings;
    } catch (error: any) {
      console.error(`Error fetching bookings for branch ${branchId} on date ${date}:`, error);
      set({ 
        error: error.message || 'Failed to fetch bookings for the selected date', 
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
    restaurantId: number;
    notes?: string;
    status: string;
    timeSlotId: number;
  }) => {
    try {
      set({ loading: true, error: null });
      
      // Format the data for the API
      const bookingData = {
        guestName: reservationData.customerName,
        guestPhone: reservationData.phoneNumber,
        partySize: reservationData.partySize,
        timeSlotId: reservationData.timeSlotId,
        branchId: reservationData.branchId,
        specialRequests: reservationData.notes || ''
      };
      
      const newBooking = await createGuestReservation({
        guestName: bookingData.guestName,
        guestPhone: bookingData.guestPhone,
        partySize: bookingData.partySize,
        timeSlotId: bookingData.timeSlotId,
        branchId: bookingData.branchId,
        restaurantId: reservationData.restaurantId,
        specialRequests: bookingData.specialRequests
      });
      set({ loading: false });
      return newBooking;
    } catch (error: any) {
      console.error('Error creating customer reservation:', error);
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
    branchId: number;
    restaurantId: number;
    notes?: string;
  }) => {
    try {
      set({ loading: true, error: null });
      
      // Format the data for the API
      const bookingData = {
        guestName: reservationData.customerName,
        guestPhone: reservationData.phoneNumber,
        partySize: reservationData.partySize,
        timeSlotId: reservationData.timeSlotId,
        branchId: reservationData.branchId,
        restaurantId: reservationData.restaurantId,
        specialRequests: reservationData.notes || ''
      };
      
      const newBooking = await createGuestReservation(bookingData);
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
  
  // Fetch booking settings for a branch
  fetchBookingSettings: async (branchId: number) => {
    try {
      set({ loading: true, error: null });
      const settings = await getBookingSettings(branchId);
      set({ bookingSettings: settings, loading: false });
      return settings;
    } catch (error: any) {
      console.error(`Error fetching booking settings for branch ${branchId}:`, error);
      set({ 
        error: error.message || 'Failed to fetch booking settings', 
        loading: false 
      });
      return null;
    }
  },
  
  // Update booking settings for a branch
  updateBranchBookingSettings: async (branchId: number, settings: Partial<BookingSettings>) => {
    try {
      set({ loading: true, error: null });
      const updatedSettings = await updateBookingSettings(branchId, settings);
      set({ bookingSettings: updatedSettings, loading: false });
      return updatedSettings;
    } catch (error: any) {
      console.error(`Error updating booking settings for branch ${branchId}:`, error);
      set({ 
        error: error.message || 'Failed to update booking settings', 
        loading: false 
      });
      return null;
    }
  },
  
  // Fetch booking overrides for a branch
  fetchBookingOverrides: async (branchId: number) => {
    try {
      set({ loading: true, error: null });
      const overrides = await getBookingOverrides(branchId);
      set({ bookingOverrides: overrides, loading: false });
      return overrides;
    } catch (error: any) {
      console.error(`Error fetching booking overrides for branch ${branchId}:`, error);
      set({ 
        error: error.message || 'Failed to fetch booking overrides', 
        loading: false 
      });
      return [];
    }
  },
  
  // Fetch a specific booking override
  fetchBookingOverride: async (overrideId: number) => {
    try {
      set({ loading: true, error: null });
      const override = await getBookingOverride(overrideId);
      set({ selectedOverride: override, loading: false });
      return override;
    } catch (error: any) {
      console.error(`Error fetching booking override ${overrideId}:`, error);
      set({ 
        error: error.message || 'Failed to fetch booking override', 
        loading: false 
      });
      return null;
    }
  },
  
  // Create a new booking override
  createNewBookingOverride: async (branchId: number, override: CreateBookingOverrideData) => {
    try {
      set({ loading: true, error: null });
      const newOverride = await createBookingOverride(branchId, override);
      // Refresh overrides list
      const overrides = await getBookingOverrides(branchId);
      set({ bookingOverrides: overrides, loading: false });
      return newOverride;
    } catch (error: any) {
      console.error(`Error creating booking override for branch ${branchId}:`, error);
      set({ 
        error: error.message || 'Failed to create booking override', 
        loading: false 
      });
      return null;
    }
  },
  
  // Update an existing booking override
  updateExistingBookingOverride: async (overrideId: number, override: Partial<BookingOverride>) => {
    try {
      set({ loading: true, error: null });
      const updatedOverride = await updateBookingOverride(overrideId, override);
      // Update the selected override if it's the one being updated
      if (get().selectedOverride?.id === overrideId) {
        set({ selectedOverride: updatedOverride });
      }
      // Refresh overrides list if we have a branch ID
      if (updatedOverride.branchId) {
        const overrides = await getBookingOverrides(updatedOverride.branchId);
        set({ bookingOverrides: overrides });
      }
      set({ loading: false });
      return updatedOverride;
    } catch (error: any) {
      console.error(`Error updating booking override ${overrideId}:`, error);
      set({ 
        error: error.message || 'Failed to update booking override', 
        loading: false 
      });
      return null;
    }
  },
  
  // Delete a booking override
  deleteBookingOverride: async (overrideId: number) => {
    try {
      set({ loading: true, error: null });
      // Store the branch ID before deleting the override
      const branchId = get().selectedOverride?.branchId;
      await deleteBookingOverride(overrideId);
      // Clear the selected override if it's the one being deleted
      if (get().selectedOverride?.id === overrideId) {
        set({ selectedOverride: null });
      }
      // Refresh overrides list if we have a branch ID
      if (branchId) {
        const overrides = await getBookingOverrides(branchId);
        set({ bookingOverrides: overrides });
      }
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error(`Error deleting booking override ${overrideId}:`, error);
      set({ 
        error: error.message || 'Failed to delete booking override', 
        loading: false 
      });
      return false;
    }
  },
  
  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
