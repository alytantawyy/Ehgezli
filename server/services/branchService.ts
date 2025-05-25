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
import { eq, and, inArray, count } from "drizzle-orm";
import { restaurantBranches, RestaurantBranch, InsertRestaurantBranch, timeSlots, bookings, bookingSettings, BookingSettings, InsertBookingSettings, restaurantProfiles, RestaurantProfile, restaurantUsers, RestaurantSearchFilter } from "@server/db/schema"; 
import { getBookingSettings, generateTimeSlots, generateTimeSlotsForDays, createBookingSettings } from "./bookingService";
import { formatTime } from "@server/utils/date";
import { getDistance } from "@server/utils/location";

// ==================== Branch Service ====================

//--- Get Restaurant Branches ---

export const getRestaurantBranches = async (restaurantId: number): Promise<RestaurantBranch[]> => {
  const branches = await db.select().from(restaurantBranches).where(eq(restaurantBranches.restaurantId, restaurantId));
  if (!branches) {
    throw new Error(`No branches found for restaurantId ${restaurantId}`);
  }
  return branches;
};

//--Get All Branches--

export const getAllBranches = async (): Promise<any[]> => {
  const branches = await db
    .select({
      // Branch fields
      branchId: restaurantBranches.id,
      address: restaurantBranches.address,
      city: restaurantBranches.city,
      latitude: restaurantBranches.latitude,
      longitude: restaurantBranches.longitude,
      
      // Restaurant user fields
      restaurantId: restaurantUsers.id,
      restaurantName: restaurantUsers.name,
      
      // Restaurant profile fields
      cuisine: restaurantProfiles.cuisine,
      priceRange: restaurantProfiles.priceRange,
      logo: restaurantProfiles.logo
    })
    .from(restaurantBranches)
    .innerJoin(
      restaurantUsers,
      eq(restaurantBranches.restaurantId, restaurantUsers.id)
    )
    .innerJoin(
      restaurantProfiles,
      eq(restaurantUsers.id, restaurantProfiles.restaurantId)
    );
  
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

//--- Get Branch By Id (Public) ---

export const getBranchById = async (branchId: number): Promise<any | undefined> => {

    const branch = await db
      .select({
        // Branch fields
        branchId: restaurantBranches.id,
        address: restaurantBranches.address,
        city: restaurantBranches.city,
        latitude: restaurantBranches.latitude,
        longitude: restaurantBranches.longitude,
      
        // Restaurant user fields
        restaurantName: restaurantUsers.name,
        
        // Restaurant profile fields
        about: restaurantProfiles.about,
        description: restaurantProfiles.description,
        cuisine: restaurantProfiles.cuisine,
        priceRange: restaurantProfiles.priceRange,
        logo: restaurantProfiles.logo
    })
      .from(restaurantBranches)
      .innerJoin(restaurantUsers, eq(restaurantBranches.restaurantId, restaurantUsers.id))
      .innerJoin(restaurantProfiles, eq(restaurantUsers.id, restaurantProfiles.restaurantId))
      .where(eq(restaurantBranches.id, branchId));
      
    if (!branch) {
      throw new Error(`Branch with id ${branchId} not found`);
    }
    
    return branch;
};

//--- Create Restaurant Branch ---

export const createRestaurantBranch = async (
  branchData: InsertRestaurantBranch, 
  bookingSettingsData: Omit<InsertBookingSettings, 'branchId'>,
  generateDays: number
): Promise<{ branch: RestaurantBranch, settings: BookingSettings, slotsGenerated: number }> => {
  // Use a transaction to ensure all operations succeed or fail together
  return await db.transaction(async (tx) => {
    try {
      // 1. Create the branch
      const [branch] = await tx
        .insert(restaurantBranches)
        .values(branchData)
        .returning();
        
      if (!branch) {
        throw new Error('Failed to create branch');
      }
      
      // 2. Create booking settings
      const bookingSettingsWithBranchId = {
        ...bookingSettingsData,
        branchId: branch.id
      };
      
      const settings = await createBookingSettings(bookingSettingsWithBranchId, tx);
      
      // 3. Generate time slots for the specified number of days
      const slotsGenerated = await generateTimeSlotsForDays(
        tx,
        branch.id,
        settings,
        generateDays
      );
      
      return { branch, settings, slotsGenerated };
    } catch (error) {
      throw error; // Re-throw to ensure transaction is rolled back
    }
  });
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

  //--Search Branches with Filters--

export const searchBranches = async (
  filters: RestaurantSearchFilter
) => {
  const conditions = [];

  if (filters.city) {
    conditions.push(eq(restaurantBranches.city, filters.city));
  }

  if (filters.cuisine) {
    conditions.push(eq(restaurantProfiles.cuisine, filters.cuisine));
  }

  if (filters.priceRange) {
    conditions.push(eq(restaurantProfiles.priceRange, filters.priceRange));
  }

  // Start building base query with profile + branches + users
  const results = await db
    .select()
    .from(restaurantProfiles)
    .innerJoin(restaurantUsers, eq(restaurantProfiles.restaurantId, restaurantUsers.id))
    .innerJoin(restaurantBranches, eq(restaurantProfiles.restaurantId, restaurantBranches.restaurantId))
    .where(and(...conditions));

  // If date + time + partySize are provided, filter by availability
  let filteredResults = results;

  if (filters.date && filters.time && filters.partySize) {
    const date = new Date(`${filters.date}T00:00:00`);

    const slots = await db
      .select()
      .from(timeSlots)
      .where(
        and(
          eq(timeSlots.date, date),
          eq(timeSlots.startTime, new Date(`${filters.date}T${filters.time}`))
        )
      );

    const availableBranchIds = slots
      .filter(slot => (slot.maxSeats ?? 0) >= (filters.partySize ?? 0))
      .map(slot => slot.branchId);

    filteredResults = filteredResults.filter(r =>
      availableBranchIds.includes(r.restaurant_branches.id)
    );
  }

  // Optional: sort by distance if user location is available
  if (filters.userLatitude && filters.userLongitude) {
    filteredResults.sort((a, b) => {
      const distA = getDistance(
        filters.userLatitude!,
        filters.userLongitude!,
        parseFloat(String(a.restaurant_branches.latitude ?? "0")),
        parseFloat(String(a.restaurant_branches.longitude ?? "0"))
      );

      const distB = getDistance(
        filters.userLatitude!,
        filters.userLongitude!,
        parseFloat(String(b.restaurant_branches.latitude ?? "0")),
        parseFloat(String(b.restaurant_branches.longitude ?? "0"))
      );

      return distA - distB;
    });
  }

  return filteredResults;
};
