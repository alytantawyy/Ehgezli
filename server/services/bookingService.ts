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
import { Booking, InsertBooking, bookings, timeSlots, bookingSettings, BookingSettings, InsertBookingSettings, bookingOverrides, InsertBookingOverride, BookingOverride, BookingStatus, restaurantBranches, restaurantUsers, ExtendedBooking, users, restaurantProfiles } from "@server/db/schema"; 

// ==================== Booking Service ====================

// Define a type for the extended booking with user information
export type BookingWithUser = Booking & {
  user?: { 
    firstName: string; 
    lastName: string;
  } | null;
  restaurantId?: number;
};

//--Get Bookings for Branch--   

export const getBookingsForBranch = async (branchId: number): Promise<BookingWithUser[]> => {
  const branchBookings = await db
    .select({
      booking: bookings,
      timeSlot: timeSlots,
      user: users
    })
    .from(bookings)
    .innerJoin(timeSlots, eq(timeSlots.id, bookings.timeSlotId))
    .leftJoin(users, eq(users.id, bookings.userId))
    .where(eq(timeSlots.branchId, branchId));

    if (!branchBookings || branchBookings.length === 0) {
      return [];
    }
  
  return branchBookings.map(row => ({
    id: row.booking.id,
    userId: row.booking.userId,
    restaurantId: row.booking.restaurantId,
    branchId: row.booking.branchId,
    startTime: row.booking.startTime,
    endTime: row.booking.endTime,
    timeSlotId: row.booking.timeSlotId,
    partySize: row.booking.partySize,
    status: row.booking.status,
    createdAt: row.booking.createdAt,
    updatedAt: row.booking.updatedAt,
    guestName: row.booking.guestName,
    guestPhone: row.booking.guestPhone,
    guestEmail: row.booking.guestEmail,
    // Include user information if available
    user: row.user ? {
      firstName: row.user.firstName,
      lastName: row.user.lastName
    } : null
  }));
};

//--- Get Bookings for Branch on Date ---

export const getBookingsForBranchOnDate = async (branchId: number, date: Date): Promise<BookingWithUser[]> => {
  const branchBookings = await db
    .select({
      booking: bookings,
      timeSlot: timeSlots,
      user: users
    })
    .from(bookings)
    .innerJoin(timeSlots, eq(timeSlots.id, bookings.timeSlotId))
    .leftJoin(users, eq(users.id, bookings.userId))
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
    id: row.booking.id,
    userId: row.booking.userId,
    restaurantId: row.booking.restaurantId,
    branchId: row.booking.branchId,
    startTime: row.booking.startTime,
    endTime: row.booking.endTime,
    timeSlotId: row.booking.timeSlotId,
    partySize: row.booking.partySize,
    status: row.booking.status,
    createdAt: row.booking.createdAt,
    updatedAt: row.booking.updatedAt,
    guestName: row.booking.guestName,
    guestPhone: row.booking.guestPhone,
    guestEmail: row.booking.guestEmail,
    user: row.user ? {
      firstName: row.user.firstName,
      lastName: row.user.lastName
    } : null
  }));
};

//--Get Booking by ID--

export const getBookingById = async (bookingId: number): Promise<BookingWithUser | undefined> => {
  // Get booking with restaurant information
  const result = await db
    .select({
      booking: bookings,
      restaurantId: restaurantBranches.restaurantId,
      user: users
    })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
    .innerJoin(restaurantBranches, eq(timeSlots.branchId, restaurantBranches.id))
    .leftJoin(users, eq(bookings.userId, users.id))
    .where(eq(bookings.id, bookingId));

  if (!result || result.length === 0) {
    return undefined;
  }

  // Return booking with restaurantId for authorization checks and user information
  return {
    ...result[0].booking,
    restaurantId: result[0].restaurantId,
    user: result[0].user ? {
      firstName: result[0].user.firstName,
      lastName: result[0].user.lastName
    } : null
  };
};

//--Get Booking by ID and User ID--

export const getBookingByIdAndUserId = async (bookingId: number, userId: number): Promise<BookingWithUser | undefined> => {
  const result = await db
    .select({
      booking: bookings,
      user: users
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.userId, userId)
      )
    );

  if (!result || result.length === 0) {
    return undefined;
  }

  return {
    ...result[0].booking,
    user: result[0].user ? {
      firstName: result[0].user.firstName,
      lastName: result[0].user.lastName
    } : null
  };
};

//--Get User Bookings--

export const getUserBookings = async (userId: number): Promise<BookingWithUser[]> => {
    const userBookings = await db
        .select({
            booking: bookings,
            timeSlot: timeSlots,
            branch: restaurantBranches,
            restaurant: restaurantUsers,
            user: users
        })
        .from(bookings)
        .innerJoin(timeSlots, eq(bookings.timeSlotId, timeSlots.id))
        .innerJoin(restaurantBranches, eq(timeSlots.branchId, restaurantBranches.id))
        .innerJoin(restaurantUsers, eq(restaurantBranches.restaurantId, restaurantUsers.id))
        .innerJoin(restaurantProfiles, eq(restaurantUsers.id, restaurantProfiles.restaurantId))
        .leftJoin(users, eq(bookings.userId, users.id))
        .where(eq(bookings.userId, userId));
    
    if (!userBookings || userBookings.length === 0) {
        return [];
    }

    return userBookings.map(row => ({
        id: row.booking.id,
        userId: row.booking.userId,
        branchId: row.booking.branchId,
        timeSlotId: row.booking.timeSlotId,
        startTime: row.timeSlot.startTime,
        endTime: row.timeSlot.endTime,  
        date: row.timeSlot.date,
        partySize: row.booking.partySize,
        status: row.booking.status,
        createdAt: row.booking.createdAt,
        updatedAt: row.booking.updatedAt,
        guestName: row.booking.guestName,
        guestPhone: row.booking.guestPhone,
        guestEmail: row.booking.guestEmail,
        // Include user information
        user: row.user ? {
            firstName: row.user.firstName,
            lastName: row.user.lastName
        } : null,
        // Include restaurant information for the extended booking details
        restaurantId: row.branch.restaurantId,
        branchAddress: row.branch.address,
        branchCity: row.branch.city,
        restaurantName: row.restaurant.name,
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

// Extended type to include startTime and endTime
type ExtendedInsertBooking = InsertBooking & {
  startTime?: Date;
  endTime?: Date;
};

export const createBooking = async (booking: InsertBooking): Promise<Booking> => {
  try {
    // Get the time slot to determine start and end times
    const [timeSlot] = await db
      .select()
      .from(timeSlots)
      .where(eq(timeSlots.id, booking.timeSlotId));
    
    if (!timeSlot) {
      throw new Error(`Time slot with ID ${booking.timeSlotId} not found`);
    }
    
    // Get the booking settings for this branch to determine reservation duration
    const settings = await getBookingSettings(timeSlot.branchId);
    
    // Calculate end time based on reservation duration
    const startTime = new Date(timeSlot.startTime);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + (settings?.interval || 90));
    
    // Add start and end times to the booking using the extended type
    const bookingWithTimes: ExtendedInsertBooking = {
      ...booking,
      startTime: startTime,
      endTime: endTime
    };
    
    // Insert the booking
    const [newBooking] = await db
      .insert(bookings)
      .values(bookingWithTimes as any) // Type assertion to bypass type checking
      .returning();
    
    if (!newBooking) {
      throw new Error('Failed to create booking');
    }
    
    return newBooking;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
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
    // Use a fixed 30-minute interval for time slot generation
    const slotIntervalMinutes = 30; // Fixed 30-minute interval for all restaurants
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
  
      // Use the fixed interval for slot generation
      current = new Date(current.getTime() + slotIntervalMinutes * 60000);
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
  ): Promise<BookingWithUser | undefined> => {
    // Update the booking status
    await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, bookingId));
    
    // Fetch the updated booking with user information
    return getBookingById(bookingId);
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
