import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { bookings } from "../db/schema";

// Types based on the schema
export type Booking = InferSelectModel<typeof bookings>;
export type InsertBooking = InferInsertModel<typeof bookings>;

// Extended type for time slot availability
export interface TimeSlotAvailability {
  id: number;
  time: string;
  startTime: Date;
  endTime: Date;
  availableSeats: number;
  availableTables: number;
  isAvailable: boolean;
  overlappingBookingsCount?: number;
}

// Response type for branch availability
export interface BranchAvailabilityResponse {
  date: string;
  availableSlots: TimeSlotAvailability[];
  hasAvailability: boolean;
  closestAvailableSlot?: TimeSlotAvailability;
}

// Type for creating a new booking with explicit times
export interface CreateBookingRequest {
  userId?: number;
  branchId: number;
  restaurantId: number;
  timeSlotId: number;
  partySize: number;
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  // Optional explicit times (will be calculated if not provided)
  startTime?: Date;
  endTime?: Date;
}
