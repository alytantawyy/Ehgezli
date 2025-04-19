/*
 * Branch Service Functions:
 * - getRestaurantBranches
 * - getRestaurantBranchById
 * - createRestaurantBranch
 * - updateRestaurantBranch
 * - deleteRestaurantBranch
 * - getRestaurantBranchAvailability
 * - formatTime
 */

import { db } from "@server/db/db";
import { eq, and, inArray } from "drizzle-orm";
import { restaurantBranches, RestaurantBranch, InsertRestaurantBranch, timeSlots, bookings } from "@server/db/schema"; 
import { getBookingSettings } from "./bookingService";
import { formatTime } from "@server/utils/date";

// ==================== Branch Service ====================

//--- Get Restaurant Branches ---

export const getRestaurantBranches = async (restaurantId: number): Promise<RestaurantBranch[]> => {
  const branches = await db.select().from(restaurantBranches).where(eq(restaurantBranches.restaurantId, restaurantId));
  if (!branches) {
    throw new Error(`No branches found for restaurantId ${restaurantId}`);
  }
  return branches;
};

//--- Get Restaurant Branch by ID ---

export const getRestaurantBranchById = async (branchId: number, restaurantId: number): Promise<RestaurantBranch | undefined> => {
  const [branch] = await db
    .select()
    .from(restaurantBranches)
    .where(
      and(
        eq(restaurantBranches.id, branchId),
        eq(restaurantBranches.restaurantId, restaurantId)
      )
    );
  if (!branch) {
    throw new Error(`Branch with id ${branchId} not found`);
  }
  return branch;
};

//--- Create Restaurant Branch --- 

export const createRestaurantBranch = async (branch: InsertRestaurantBranch): Promise<RestaurantBranch> => {
  const [newBranch] = await db
    .insert(restaurantBranches)
    .values(branch)
    .returning();
  if (!newBranch) {
    throw new Error('Failed to create branch');
  }
  return newBranch;
};

//--- Update Restaurant Branch ---

export const updateRestaurantBranch = async (branchId: number, restaurantId: number, branch: InsertRestaurantBranch): Promise<RestaurantBranch> => {
  const [updatedBranch] = await db
    .update(restaurantBranches)
    .set(branch)
    .where(
      and(
        eq(restaurantBranches.id, branchId),
        eq(restaurantBranches.restaurantId, restaurantId)
      )
    )
    .returning();
  if (!updatedBranch) {
    throw new Error(`Branch with id ${branchId} not found`);
  }
  return updatedBranch;
};

//--- Delete Restaurant Branch ---

export const deleteRestaurantBranch = async (branchId: number, restaurantId: number): Promise<void> => {
  const result = await db
    .delete(restaurantBranches)
    .where(
      and(
        eq(restaurantBranches.id, branchId),
        eq(restaurantBranches.restaurantId, restaurantId)
      )
    );
  if (!result) {
    throw new Error(`Branch with id ${branchId} not found`);
  }
};



//--- Get Restaurant Branch Availability ---

export const getRestaurantBranchAvailability = async (branchId: number, date: Date) => {
    const settings = await getBookingSettings(branchId);
    if (!settings) {
      throw new Error(`No settings found for branchId ${branchId}`);
    }
  
    // Get all time slots for this branch on the given date
    const slots = await db
      .select()
      .from(timeSlots)
      .where(
        and(
          eq(timeSlots.branchId, branchId),
          eq(timeSlots.date, date) // ensure `date` has no time component
        )
      );
  
    // Get all bookings for those time slots
    const slotIds = slots.map(slot => slot.id);
    const branchBookings = await db
      .select()
      .from(bookings)
      .where(inArray(bookings.timeSlotId, slotIds));
  
    const availability: Record<string, number> = {};
  
    for (const slot of slots) {
      const bookingsForSlot = branchBookings.filter((b: any) => b.timeSlotId === slot.id);
      const bookedSeats = bookingsForSlot.reduce((sum: number, b: any) => sum + b.partySize, 0);
      const bookedTables = bookingsForSlot.reduce((sum: number, b: any) => sum + b.tables, 0);
  
      const maxSeats = slot.maxSeats ?? settings.maxSeatsPerSlot;
      const maxTables = slot.maxTables ?? settings.maxTablesPerSlot;
  
      // Calculate available seats and tables    
      availability[formatTime(slot.startTime.toString())] = Math.max(0, maxSeats - bookedSeats, maxTables - bookedTables);
    }

    return availability;
  };




  
    
  
  
