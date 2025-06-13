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
    console.error('❌ ERROR in createBooking base function:', error.response?.data || error.message);
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
    // Log local timezone information for debugging
    const localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzOffset = new Date().getTimezoneOffset() / -60;
    const offsetStr = tzOffset >= 0 ? `UTC+${tzOffset}` : `UTC${tzOffset}`;
    
    console.log(`📅 Creating booking with local timezone: ${localTZ} (${offsetStr})`);
    console.log(`📅 Selected date: ${date}, time: ${time}`);
    
    // Convert local date and time to UTC for API request
    const { convertLocalToUTC } = require('../app/utils/dateUtils');
    const utcDateString = convertLocalToUTC(date, time);
    
    // Extract just the date part from the UTC string for the API request
    const utcDate = utcDateString.split('T')[0];
    console.log(`📅 Converted to UTC date: ${utcDate}`);
    
    // First, get the time slot ID from the branch availability
    const { data: availabilityData } = await apiClient.get<any>(`/branch/${branchId}/availability/${utcDate}`);
    
    console.log(`📅 Available slots: ${JSON.stringify(availabilityData.availableSlots.map((s: any) => s.time))}`);
    
    // Find the time slot that matches our selected time
    // We need to be flexible with the matching to account for timezone differences
    let selectedTimeSlot = availabilityData.availableSlots.find(
      (slot: any) => slot.time === time
    );
    
    // If exact match not found, try to find the closest time slot
    if (!selectedTimeSlot) {
      console.log(`⚠️ Exact time match not found for ${time}, looking for closest match...`);
      
      // Convert selected time to minutes for comparison
      const [selectedHours, selectedMinutes] = time.split(':').map(Number);
      const selectedTotalMinutes = selectedHours * 60 + selectedMinutes;
      
      // Find the closest time slot
      const slotsWithDistance = availabilityData.availableSlots.map((slot: any) => {
        const [slotHours, slotMinutes] = slot.time.split(':').map(Number);
        const slotTotalMinutes = slotHours * 60 + slotMinutes;
        const distance = Math.abs(slotTotalMinutes - selectedTotalMinutes);
        return { ...slot, distance };
      });
      
      // Sort by distance and get the closest one
      slotsWithDistance.sort((a: any, b: any) => a.distance - b.distance);
      selectedTimeSlot = slotsWithDistance[0];
      
      if (selectedTimeSlot) {
        console.log(`✅ Found closest time slot: ${selectedTimeSlot.time} (distance: ${selectedTimeSlot.distance} minutes)`);
      }
    }
    
    if (!selectedTimeSlot || !selectedTimeSlot.id) {
      console.error(`❌ ERROR: Could not find time slot for ${time} on ${utcDate}`);
      throw new Error(`Could not find time slot for ${time} on ${utcDate}`);
    }
    
    // Get branch details to extract the restaurant ID
    const { data: branchDetails } = await apiClient.get<any>(`/branch/${branchId}`);
    
    // The API returns an array, so we need to get the first item
    if (!branchDetails || !branchDetails[0] || !branchDetails[0].restaurantId) {
      console.error(`❌ ERROR: Could not find restaurant ID for branch ${branchId}`, branchDetails);
      throw new Error(`Could not find restaurant ID for branch ${branchId}`);
    }
    
    const restaurantId = branchDetails[0].restaurantId;
    
    // Create the booking with the time slot ID, branch ID, and restaurant ID
    const bookingData: CreateBookingData = {
      timeSlotId: selectedTimeSlot.id,
      partySize,
      specialRequests,
      branchId,
      restaurantId
    };
    
    console.log(`📝 Creating booking with time slot ID: ${selectedTimeSlot.id} (${selectedTimeSlot.time})`);
    
    // Call the existing createBooking function
    const result = await createBooking(bookingData);
    
    // Log the time conversion for clarity
    if (result.startTime && result.endTime) {
      const localStartTime = new Date(result.startTime).toLocaleString();
      const localEndTime = new Date(result.endTime).toLocaleString();
      console.log(`✅ Booking created with start time: ${result.startTime} (local: ${localStartTime})`);
      console.log(`✅ Booking created with end time: ${result.endTime} (local: ${localEndTime})`);
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ ERROR creating booking with time info:', error.response?.data || error.message);
    throw error;
  }
};

// Create a reservation for a guest customer (for restaurant staff)
export const createGuestReservation = async (reservationData: {
  guestName: string;
  guestPhone: string;
  timeSlotId: number;
  partySize: number;
  branchId: number;
  restaurantId: number;
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
      branchId: reservationData.branchId,
      restaurantId: reservationData.restaurantId,
      specialRequests: reservationData.specialRequests
    };
    
    const { data } = await apiClient.post<Booking>('/booking', bookingData);
    return data;
  } catch (error: any) {
    console.error('Error creating guest reservation:', error.response?.data || error.message);
    throw error;
  }
};
