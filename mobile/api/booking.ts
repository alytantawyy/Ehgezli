import apiClient from './api-client';
import { 
  Booking, 
  BookingWithDetails, 
  CreateBookingData,
  UpdateBookingData,
  BookingStatus,
} from '../types/booking';
import { BookingSettings, BookingOverride, CreateBookingOverrideData } from '../types/branch';

// Create a new booking
export const createBooking = async (bookingData: CreateBookingData): Promise<Booking> => {
  try {
    const { data } = await apiClient.post<Booking>('/booking', bookingData);
    return data;
  } catch (error: any) {
    console.error('Error creating booking:', error.response?.data || error.message);
    throw error;
  }
};

// Get all bookings for the current user
export const getUserBookings = async (): Promise<BookingWithDetails[]> => {
  try {
    const { data } = await apiClient.get<BookingWithDetails[]>('/booking');
    return data;
  } catch (error: any) {
    console.error('Error fetching user bookings:', error.response?.data || error.message);
    throw error;
  }
};

// Get a specific booking by ID
export const getBookingById = async (bookingId: number): Promise<BookingWithDetails> => {
  try {
    const { data } = await apiClient.get<BookingWithDetails>(`/booking/${bookingId}`);
    return data;
  } catch (error: any) {
    console.error(`Error fetching booking ${bookingId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Update a booking
export const updateBooking = async (bookingId: number, updateData: UpdateBookingData): Promise<Booking> => {
  try {
    const { data } = await apiClient.put<Booking>(`/booking/${bookingId}`, updateData);
    return data;
  } catch (error: any) {
    console.error(`Error updating booking ${bookingId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Delete a booking
export const deleteBooking = async (bookingId: number): Promise<void> => {
  try {
    await apiClient.delete(`/booking/${bookingId}`);
  } catch (error: any) {
    console.error(`Error deleting booking ${bookingId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Change booking status (for restaurant owners)
export const changeBookingStatus = async (bookingId: number, status: BookingStatus): Promise<Booking> => {
  try {
    const { data } = await apiClient.put<Booking>(`/booking/change-status/${bookingId}`, { status });
    return data;
  } catch (error: any) {
    console.error(`Error changing booking status ${bookingId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Get all bookings for a branch (restaurant owners only)
export const getBookingsForBranch = async (branchId: number): Promise<BookingWithDetails[]> => {
  try {
    const { data } = await apiClient.get<BookingWithDetails[]>(`/booking/branch/${branchId}`);
    return data;
  } catch (error: any) {
    console.error(`Error fetching bookings for branch ${branchId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Get bookings for a branch on a specific date (restaurant owners only)
export const getBookingsForBranchOnDate = async (branchId: number, date: string): Promise<BookingWithDetails[]> => {
  try {
    console.log(`Fetching bookings for branch ${branchId} on ${date}`);
    // Use the endpoint that returns bookings for a branch on a specific date
    const { data } = await apiClient.get<BookingWithDetails[]>(`/booking/branch/${branchId}/date/${date}`);
    console.log(`Successfully fetched ${data.length} bookings`);
    return data;
  } catch (error: any) {
    console.error(`Error fetching bookings for branch ${branchId} on ${date}:`, error.response?.data || error.message);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    throw error;
  }
};

// Get booking settings for a branch
export const getBookingSettings = async (branchId: number): Promise<BookingSettings> => {
  try {
    const { data } = await apiClient.get<BookingSettings>(`/booking/settings/${branchId}`);
    return data;
  } catch (error: any) {
    console.error(`Error fetching booking settings for branch ${branchId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Update booking settings for a branch (restaurant owners only)
export const updateBookingSettings = async (branchId: number, settings: Partial<BookingSettings>): Promise<BookingSettings> => {
  try {
    const { data } = await apiClient.put<BookingSettings>(`/booking/settings/${branchId}`, settings);
    return data;
  } catch (error: any) {
    console.error(`Error updating booking settings for branch ${branchId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Get booking overrides for a branch
export const getBookingOverrides = async (branchId: number): Promise<BookingOverride[]> => {
  try {
    const { data } = await apiClient.get<BookingOverride[]>(`/booking/overrides/${branchId}`);
    return data;
  } catch (error: any) {
    console.error(`Error fetching booking overrides for branch ${branchId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Get a specific booking override
export const getBookingOverride = async (overrideId: number): Promise<BookingOverride> => {
  try {
    const { data } = await apiClient.get<BookingOverride>(`/booking/override/${overrideId}`);
    return data;
  } catch (error: any) {
    console.error(`Error fetching booking override ${overrideId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Create a booking override (restaurant owners only)
export const createBookingOverride = async (branchId: number, override: CreateBookingOverrideData): Promise<BookingOverride> => {
  try {
    const { data } = await apiClient.post<BookingOverride>(`/booking/branch/${branchId}/override`, override);
    return data;
  } catch (error: any) {
    console.error(`Error creating booking override for branch ${branchId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Update a booking override (restaurant owners only)
export const updateBookingOverride = async (overrideId: number, override: Partial<BookingOverride>): Promise<BookingOverride> => {
  try {
    const { data } = await apiClient.put<BookingOverride>(`/booking/override/${overrideId}`, override);
    return data;
  } catch (error: any) {
    console.error(`Error updating booking override ${overrideId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Delete a booking override (restaurant owners only)
export const deleteBookingOverride = async (overrideId: number): Promise<void> => {
  try {
    await apiClient.delete(`/booking/override/${overrideId}`);
  } catch (error: any) {
    console.error(`Error deleting booking override ${overrideId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Create a booking using branch ID, date, time, and party size
export const createBookingWithTimeInfo = async (
  branchId: number,
  date: string,
  time: string,
  partySize: number,
  specialRequests?: string
): Promise<Booking> => {
  try {
    // First, get the time slot ID from the branch availability
    const { data: availabilityData } = await apiClient.get<any>(`/branch/${branchId}/availability/${date}`);
    
    // Find the time slot that matches our selected time
    const selectedTimeSlot = availabilityData.availableSlots.find(
      (slot: any) => slot.time === time
    );
    
    if (!selectedTimeSlot || !selectedTimeSlot.id) {
      throw new Error(`Could not find time slot for ${time} on ${date}`);
    }
    
    // Create the booking with the time slot ID
    const bookingData: CreateBookingData = {
      timeSlotId: selectedTimeSlot.id,
      partySize,
      specialRequests
    };
    
    // Call the existing createBooking function
    return await createBooking(bookingData);
  } catch (error: any) {
    console.error('Error creating booking with time info:', error.response?.data || error.message);
    throw error;
  }
};

// Create a reservation for a guest customer (for restaurant staff)
export const createGuestReservation = async (reservationData: {
  guestName: string;
  guestPhone: string;
  timeSlotId: number;
  partySize: number;
  specialRequests?: string;
}): Promise<Booking> => {
  try {
    console.log('Creating guest reservation with data:', reservationData);
    
    // Create the booking with the exact format the backend expects
    const bookingData = {
      guestName: reservationData.guestName,
      guestPhone: reservationData.guestPhone,
      timeSlotId: reservationData.timeSlotId,
      partySize: reservationData.partySize,
      specialRequests: reservationData.specialRequests
    };
    
    const { data } = await apiClient.post<Booking>('/booking', bookingData);
    return data;
  } catch (error: any) {
    console.error('Error creating guest reservation:', error.response?.data || error.message);
    throw error;
  }
};
