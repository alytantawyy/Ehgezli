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
 * - generateTimeSlotsForDays
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
    updatedAt: row.bookings.updatedAt,
    guestName: row.bookings.guestName,
    guestPhone: row.bookings.guestPhone,
    guestEmail: row.bookings.guestEmail
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
    updatedAt: row.bookings.updatedAt,
    guestName: row.bookings.guestName,
    guestPhone: row.bookings.guestPhone,
    guestEmail: row.bookings.guestEmail
  }));
};

//--Get Booking by ID--

export const getBookingById = async (bookingId: number): Promise<(Booking & { restaurantId?: number }) | undefined> => {
  // Get booking with restaurant information
  const result = await db
    .select({
      booking: bookings,
      restaurantId: restaurantBranches.restaurantId
    })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
    .innerJoin(restaurantBranches, eq(timeSlots.branchId, restaurantBranches.id))
    .where(eq(bookings.id, bookingId));

  if (!result || result.length === 0) {
    return undefined;
  }

  // Return booking with restaurantId for authorization checks
  return {
    ...result[0].booking,
    restaurantId: result[0].restaurantId
  };
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

export const createBookingSettings = async (
  settings: InsertBookingSettings,
  tx?: any
): Promise<BookingSettings> => {
  // Use provided transaction or db directly
  const queryRunner = tx || db;
  
  const [newSettings] = await queryRunner
    .insert(bookingSettings)
    .values(settings)
    .returning();
    
  if (!newSettings) {
    throw new Error('Failed to create booking settings');
  }
  return newSettings;
};

//--Update Booking Settings--

export const updateBookingSettings = async (branchId: number, data: Partial<BookingSettings>): Promise<BookingSettings | undefined> => {
  const [updatedSettings] = await db
    .update(bookingSettings)
    .set(data)
    .where(eq(bookingSettings.branchId, branchId))
    .returning();

  if (!updatedSettings) {
    return undefined;
  }
  return updatedSettings;
};

//--Delete Booking Settings--

export const deleteBookingSettings = async (branchId: number): Promise<void> => {
  await db
    .delete(bookingSettings)
    .where(eq(bookingSettings.branchId, branchId));
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

  //--Delete Time Slots--

  export const deleteTimeSlots = async (branchId: number): Promise<void> => {
    await db
      .delete(timeSlots)
      .where(eq(timeSlots.branchId, branchId));

  }

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

/**
 * Helper function to create a date with no time component (set to midnight)
 */
const createDateWithNoTime = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Helper function to get just the date portion as a Date object
 */
const getDateOnly = (date: Date): Date => {
  return new Date(date.toISOString().split('T')[0]);
};

/**
 * Generates and saves time slots for multiple days based on booking settings
 * @param tx Database transaction object
 * @param branchId Branch ID to create time slots for
 * @param settings Booking settings to use for time slot generation
 * @param days Number of days to generate slots for
 * @returns Number of slots generated
 */
export const generateTimeSlotsForDays = async (
  tx: any,
  branchId: number,
  settings: BookingSettings,
  days: number
): Promise<number> => {
  const today = new Date();
  let slotsGenerated = 0;
  
  // Generate slots for each day
  for (let i = 0; i < days; i++) {
    try {
      // Create date with no time component
      const date = createDateWithNoTime(today);
      date.setDate(today.getDate() + i);
      
      // Get time slots for the day based on settings
      const slots = generateTimeSlots(
        settings.openTime,
        settings.closeTime,
        settings.interval
      );
      
      // Create time slot entries for each slot
      for (const slotTime of slots) {
        try {
          const [hours, minutes] = slotTime.split(':').map(Number);
          
          // Create startTime with the correct date and time
          const startTime = new Date(date);
          startTime.setHours(hours, minutes, 0, 0);
          
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + settings.interval);
          
          // Create time slot in database with date-only for the date field
          await tx
            .insert(timeSlots)
            .values({
              branchId: branchId,
              date: getDateOnly(date), // Store only the date portion
              startTime: startTime,
              endTime: endTime,
              maxSeats: settings.maxSeatsPerSlot ?? 0,
              maxTables: settings.maxTablesPerSlot ?? 0,
              isClosed: false
            });
            
          slotsGenerated++;
        } catch (slotError) {
          // Continue with other slots even if one fails
        }
      }
    } catch (dayError) {
      // Continue with other days even if one fails
    }
  }
  
  return slotsGenerated;
};
