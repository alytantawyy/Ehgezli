import { db } from "@server/db/db";
import { eq, and } from "drizzle-orm";
import { Booking, InsertBooking, bookings, timeSlots } from "@server/db/schema"; 

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

//--- Get Bookings for User ---

export const getBookingsForUser = async (userId: number): Promise<Booking[]> => {
  const userBookings = await db
    .select()
    .from(bookings)
    .where(eq(bookings.userId, userId));

    if (!userBookings) {
      return [];
    }
  return userBookings;
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





