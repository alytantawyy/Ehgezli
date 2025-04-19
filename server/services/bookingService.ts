/*
 * Booking Service Functions:
 * - getBookingsForBranch
 * - getBookingsForBranchOnDate
 * - getBookingById
 * - getBookingByIdAndUserId
 * - getUserBookings
 * - getBookingSettings
 * - createBookingSettings
 * - createBooking
 * - updateBooking
 * - deleteBooking
 * - generateTimeSlots
 * - createBookingOverride
 * - getBookingOverride
 * - getBookingOverridesForBranch
 * - deleteBookingOverride
 * - updateBookingOverride
 * - changeBookingStatus
 */

import { db } from "@server/db/db";
import { eq, and } from "drizzle-orm";
import { Booking, InsertBooking, bookings, timeSlots, bookingSettings, BookingSettings, InsertBookingSettings, bookingOverrides, InsertBookingOverride, BookingOverride, BookingStatus, restaurantBranches, restaurantUsers, ExtendedBooking } from "@server/db/schema"; 

// ==================== Booking Service ====================

//--Get Bookings for Branch--   

export const getBookingsForBranch = async (branchId: number): Promise<Booking[]> => {
  const branchBookings = await db
    .select()
    .from(bookings)
    .innerJoin(timeSlots, eq(timeSlots.id, bookings.timeSlotId))
    .where(eq(timeSlots.branchId, branchId));

    if (!branchBookings) {
      return [];
    }
  return branchBookings.map(row => ({
    id: row.bookings.id,
    userId: row.bookings.userId,
    timeSlotId: row.bookings.timeSlotId,
    partySize: row.bookings.partySize,
    status: row.bookings.status,
    createdAt: row.bookings.createdAt,
    updatedAt: row.bookings.updatedAt
  }));
};

//--- Get Bookings for Branch on Date ---

export const getBookingsForBranchOnDate = async (branchId: number, date: Date): Promise<Booking[]> => {
  const branchBookings = await db
    .select()
    .from(bookings)
    .innerJoin(timeSlots, eq(timeSlots.id, bookings.timeSlotId))
    .where(
      and(
        eq(timeSlots.date, date),
        eq(timeSlots.branchId, branchId)
      )
    );

    if (!branchBookings) {
      return [];
    }
  
  return branchBookings.map(row => ({
    id: row.bookings.id,
    userId: row.bookings.userId,
    timeSlotId: row.bookings.timeSlotId,
    partySize: row.bookings.partySize,
    status: row.bookings.status,
    createdAt: row.bookings.createdAt,
    updatedAt: row.bookings.updatedAt
  }));
};

//--Get Booking by ID--

export const getBookingById = async (bookingId: number): Promise<Booking | undefined> => {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) {
    return undefined;
  }

  return booking;
};

//--Get Booking by ID and User ID--

export const getBookingByIdAndUserId = async (bookingId: number, userId: number): Promise<Booking | undefined> => {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.userId, userId)
      )
    );

  if (!booking) {
    return undefined;
  }

  return booking;
};

//--Get User Bookings--

export const getUserBookings = async (userId: number): Promise<ExtendedBooking[]> => {
    const userBookings = await db
        .select()
        .from(bookings)
        .innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
        .innerJoin(restaurantBranches, eq(timeSlots.branchId, restaurantBranches.id))
        .innerJoin(restaurantUsers, eq(restaurantBranches.restaurantId, restaurantUsers.id))
        .where(eq(bookings.userId, userId));
    
    if (!userBookings) {
        return [];
    }
    
    return userBookings.map(({ bookings, time_slots, restaurant_branches, restaurant_users }) => ({
        ...bookings,
        timeSlot: {
        startTime: time_slots.startTime,
        endTime: time_slots.endTime,
        date: time_slots.date,
        },
        branch: {
        id: restaurant_branches.id,
        restaurantName: restaurant_users.name,
        address: restaurant_branches.address,
        city: restaurant_branches.city,
        },
    }));
    };

//--Get Booking Settings--

export const getBookingSettings = async (branchId: number): Promise<BookingSettings | undefined> => {
  const [settings] = await db
    .select()
    .from(bookingSettings)
    .where(eq(bookingSettings.branchId, branchId));

  if (!settings) {
    return undefined;
  }
  return settings;
};

//--Create Booking Settings--

export const createBookingSettings = async (settings: InsertBookingSettings): Promise<BookingSettings> => {
  const [newSettings] = await db
    .insert(bookingSettings)
    .values(settings)
    .returning();
  if (!newSettings) {
    throw new Error('Failed to create booking settings');
  }
  return newSettings;
};

//--- Create Booking ---

export const createBooking = async (booking: InsertBooking): Promise<Booking> => {
  const [newBooking] = await db
    .insert(bookings)
    .values(booking)
    .returning();
  if (!newBooking) {
    throw new Error('Failed to create booking');
  }
  return newBooking;
};

//--- Update Booking ---

export const updateBooking = async (bookingId: number, data: Partial<Booking>): Promise<Booking | undefined> => {
  const [updatedBooking] = await db
    .update(bookings)
    .set(data)
    .where(eq(bookings.id, bookingId))
    .returning();

  if (!updatedBooking) {
    return undefined;
  }
  return updatedBooking;
};  

//--- Delete Booking ---

export const deleteBooking = async (bookingId: number): Promise<void> => {
  await db
    .delete(bookings)
    .where(eq(bookings.id, bookingId));
    
};  

  //--Generate Time Slots--

  export const generateTimeSlots = (openTime: string, closeTime: string, intervalMinutes: number): string[] => {

    const slots: string[] = [];
  
    const [openHour, openMinute] = openTime.split(":").map(Number);
    const [closeHour, closeMinute] = closeTime.split(":").map(Number);
  
    let current = new Date();
    current.setHours(openHour, openMinute, 0, 0);
  
    const end = new Date();
    end.setHours(closeHour, closeMinute, 0, 0);
  
    while (current < end) {
      const time = current.toTimeString().slice(0, 5); // "HH:mm"
      slots.push(time);
  
      current = new Date(current.getTime() + intervalMinutes * 60000); // advance by interval
    }
  
    return slots;
  };

  //--Create Booking Override--

  export const createBookingOverride = async (override: InsertBookingOverride): Promise<BookingOverride> => {
    const [newOverride] = await db
      .insert(bookingOverrides)
      .values(override)
      .returning();
    if (!newOverride) {
      throw new Error('Failed to create booking override');
    }
    return newOverride;
  };

  //--Get Booking Override--

  export const getBookingOverride = async (overrideId: number): Promise<BookingOverride | undefined> => {
    const [override] = await db
      .select()
      .from(bookingOverrides)
      .where(eq(bookingOverrides.id, overrideId));
  
    if (!override) {
      return undefined;
    }
    return override;
  };    

  //--Get Booking Overrides for Branch--

  export const getBookingOverridesForBranch = async (branchId: number): Promise<BookingOverride[]> => {
    const overrides = await db
      .select()
      .from(bookingOverrides)
      .where(eq(bookingOverrides.branchId, branchId));
  
    return overrides;
  };

  //--Delete Booking Override--

  export const deleteBookingOverride = async (overrideId: number): Promise<void> => {
    await db
      .delete(bookingOverrides)
      .where(eq(bookingOverrides.id, overrideId));
  };

  //--Update Booking Override--

  export const updateBookingOverride = async (overrideId: number, data: Partial<BookingOverride>): Promise<BookingOverride | undefined> => {
    const [updatedOverride] = await db
      .update(bookingOverrides)
      .set(data)
      .where(eq(bookingOverrides.id, overrideId))
      .returning();
  
    if (!updatedOverride) {
      return undefined;
    }
    return updatedOverride;
  };


//--Change Booking Status--
export const changeBookingStatus = async (
    bookingId: number,
    status: BookingStatus
  ): Promise<Booking | undefined> => {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, bookingId))
      .returning();
  
    return updatedBooking;
  };
