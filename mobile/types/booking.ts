/**
 * Booking Types
 * 
 * Shared types for booking entities used across user and restaurant sections
 */

// Basic booking status types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'arrived' | 'completed';

// Base booking interface
export interface Booking {
  id: number;
  userId: number;
  timeSlotId: number;
  branchId: number;
  partySize: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

// Time slot information
export interface TimeSlot {
  id: number;
  branchId: number;
  date: string;
  startTime: string;
  endTime: string;
  maxSeats: number;
  maxTables: number;
  bookedSeats: number;
  bookedTables: number;
  createdAt: string;
  updatedAt: string;
}

// Branch information
export interface Branch {
  id: number;
  restaurantId: number;
  name: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  capacity: number;
  openingHours: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

// Restaurant information
export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  cuisine: string;
  priceRange: string;
  logoUrl?: string;
  coverImageUrl?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

// Extended booking with related entities for user view
export interface BookingWithDetails extends Booking {
  timeSlot: {
    startTime: string;
    endTime: string;
    date: string;
  };
  branch: {
    id: number;
    restaurantName: string;
    address: string;
    city: string;
  };
}

// Extended booking with customer details for restaurant view
export interface BookingWithCustomer extends Booking {
  timeSlot: {
    startTime: string;
    endTime: string;
    date: string;
  };
  branch: {
    name: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  customerName: string; // Computed from user or guest name
}

// Data for creating a new booking
export interface CreateBookingData {
  timeSlotId: number;
  partySize: number;
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  specialRequests?: string;
}

// Data for updating an existing booking
export interface UpdateBookingData {
  partySize?: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string;
  status?: BookingStatus;
}

// Data for creating a booking override
export interface CreateBookingOverrideData {
  date: string;
  startTime: string;
  endTime: string;
  overrideType: string;
  newMaxSeats?: number;
  newMaxTables?: number;
  note?: string;
}
