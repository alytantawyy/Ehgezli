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

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'arrived' | 'completed';

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

export interface BookingWithDetails extends Booking {
  timeSlot: {
    startTime: string;
    endTime: string;
    date: string;
  };
  branch: {
    address: string;
    city: string;
    restaurantName: string;
  };
}

export interface CreateBookingData {
  timeSlotId: number;
  branchId: number;
  partySize: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string;
}

export interface UpdateBookingData {
  partySize?: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string;
  status?: BookingStatus;
}
