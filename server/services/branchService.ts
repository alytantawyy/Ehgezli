import { db } from "@server/db/db";
import { eq, and } from "drizzle-orm";
import { restaurantBranches, RestaurantBranch, InsertRestaurantBranch } from "@server/db/schema"; 

// ==================== Branch Service ====================

//--- Get Branch ---

export const getRestaurantBranches = async (restaurantId: number): Promise<RestaurantBranch[]> => {
  const branches = await db.select().from(restaurantBranches).where(eq(restaurantBranches.restaurantId, restaurantId));
  if (!branches) {
    throw new Error(`No branches found for restaurantId ${restaurantId}`);
  }
  return branches;
};

//--- Get Branch by ID ---

export const getBranchById = async (branchId: number, restaurantId: number): Promise<RestaurantBranch | undefined> => {
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

//--- Create Branch --- 

export const createBranch = async (branch: InsertRestaurantBranch): Promise<RestaurantBranch> => {
  const [newBranch] = await db
    .insert(restaurantBranches)
    .values(branch)
    .returning();
  if (!newBranch) {
    throw new Error('Failed to create branch');
  }
  return newBranch;
};

//--- Update Branch ---

export const updateBranch = async (branchId: number, restaurantId: number, branch: InsertRestaurantBranch): Promise<RestaurantBranch> => {
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

//--- Delete Branch ---

export const deleteBranch = async (branchId: number, restaurantId: number): Promise<void> => {
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



//--- Get Branch Availability ---

export const getBranchAvailability = async (branchId: number, date: Date) => {
    const settings = await getBookingSettings(branchId);
    const slots = generateTimeSlots(settings.openTime, settings.closeTime, settings.interval);
    const bookings = await getBookingsForBranchOnDate(branchId, date);
  
    const availability = {};
  
    for (const slot of slots) {
      const bookingsForSlot = bookings.filter(b => b.startTime === slot);
      const bookedSeats = bookingsForSlot.reduce((sum, b) => sum + b.partySize, 0);
  
      // Optional override logic here
  
      availability[slot] = Math.max(0, settings.maxSeatsPerSlot - bookedSeats);
    }
  
    return availability;
  };
  
  
  
 
  
    
  
  
