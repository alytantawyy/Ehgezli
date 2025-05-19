import apiClient from './api-client';
import { 
  Booking, 
  BookingWithDetails, 
  CreateBookingData,
  UpdateBookingData,
  TimeSlot,
  BookingStatus
} from '../types/booking';
import { BookingSettings, BookingOverride } from '../types/restaurant';

// Create a new booking
export const createBooking = async (bookingData: CreateBookingData): Promise<Booking> => {
  const { data } = await apiClient.post<Booking>('/booking', bookingData);
  return data;
};

// Get all bookings for the current user
export const getUserBookings = async (): Promise<BookingWithDetails[]> => {
  const { data } = await apiClient.get<BookingWithDetails[]>('/booking');
  return data;
};

// Get a specific booking by ID
export const getBookingById = async (bookingId: number): Promise<BookingWithDetails> => {
  const { data } = await apiClient.get<BookingWithDetails>(`/booking/${bookingId}`);
  return data;
};

// Update a booking
export const updateBooking = async (bookingId: number, updateData: UpdateBookingData): Promise<Booking> => {
  const { data } = await apiClient.put<Booking>(`/booking/${bookingId}`, updateData);
  return data;
};

// Delete a booking
export const deleteBooking = async (bookingId: number): Promise<void> => {
  await apiClient.delete(`/booking/${bookingId}`);
};

// Change booking status (for restaurant owners)
export const changeBookingStatus = async (bookingId: number, status: BookingStatus): Promise<Booking> => {
  const { data } = await apiClient.put<Booking>(`/booking/change-status/${bookingId}`, { status });
  return data;
};

// Get all bookings for a branch (restaurant owners only)
export const getBookingsForBranch = async (branchId: number): Promise<BookingWithDetails[]> => {
  const { data } = await apiClient.get<BookingWithDetails[]>(`/booking/branch/${branchId}`);
  return data;
};

// Get booking settings for a branch
export const getBookingSettings = async (branchId: number): Promise<BookingSettings> => {
  const { data } = await apiClient.get<BookingSettings>(`/booking/settings/${branchId}`);
  return data;
};

// Update booking settings for a branch (restaurant owners only)
export const updateBookingSettings = async (branchId: number, settings: Partial<BookingSettings>): Promise<BookingSettings> => {
  const { data } = await apiClient.put<BookingSettings>(`/booking/settings/${branchId}`, settings);
  return data;
};

// Get booking overrides for a branch
export const getBookingOverrides = async (branchId: number): Promise<BookingOverride[]> => {
  const { data } = await apiClient.get<BookingOverride[]>(`/booking/overrides/${branchId}`);
  return data;
};

// Get a specific booking override
export const getBookingOverride = async (overrideId: number): Promise<BookingOverride> => {
  const { data } = await apiClient.get<BookingOverride>(`/booking/override/${overrideId}`);
  return data;
};

// Create a booking override (restaurant owners only)
export const createBookingOverride = async (branchId: number, override: Omit<BookingOverride, 'id' | 'branchId' | 'createdAt' | 'updatedAt'>): Promise<BookingOverride> => {
  const { data } = await apiClient.post<BookingOverride>(`/booking/branch/${branchId}/override`, override);
  return data;
};

// Update a booking override (restaurant owners only)
export const updateBookingOverride = async (overrideId: number, override: Partial<BookingOverride>): Promise<BookingOverride> => {
  const { data } = await apiClient.put<BookingOverride>(`/booking/override/${overrideId}`, override);
  return data;
};

// Delete a booking override (restaurant owners only)
export const deleteBookingOverride = async (overrideId: number): Promise<void> => {
  await apiClient.delete(`/booking/override/${overrideId}`);
};
