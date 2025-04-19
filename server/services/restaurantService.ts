/*
 * Restaurant Service Functions:
 * - getRestaurantProfile
 * - createRestaurantProfile
 * - updateRestaurantProfile
 * - deleteRestaurantProfile
 * - getDetailedRestaurant
 * - getRestaurantUserByResetToken
 */

import { db } from "@server/db/db";
import { restaurantProfiles, InsertRestaurantProfile, RestaurantProfile, restaurantBranches, restaurantUsers, RestaurantUser, restaurantPasswordResetTokens, Restaurant, RestaurantSearchFilter, timeSlots } from "@server/db/schema";
import { getDistance } from "@server/utils/distance";
import { eq, and, or, ilike } from "drizzle-orm";

// ==================== Restaurant Service ====================



//--- Get Restaurant Profile ---

export const getRestaurantProfile = async (restaurantId: number): Promise<RestaurantProfile | undefined> => {
  const [profile] = await db.select().from(restaurantProfiles).where(eq(restaurantProfiles.restaurantId, restaurantId));
  if (!profile) {
    throw new Error(`Restaurant profile with restaurantId ${restaurantId} not found`);
  }
  return profile;
};

//--- Create Restaurant Profile ---

export const createRestaurantProfile = async (profile: InsertRestaurantProfile): Promise<RestaurantProfile> => {
  const [createdProfile] = await db.insert(restaurantProfiles).values(profile).returning();
  if (!createdProfile) {
    throw new Error('Failed to create restaurant profile');
  }
  return createdProfile;
};

//--- Update Restaurant Profile ---

export const updateRestaurantProfile = async (restaurantId: number, profileData: { 
  about: string;
  description: string;
  cuisine: string;
  priceRange: string;
  logo: string;
}): Promise<void> => {
  await db.update(restaurantProfiles)
    .set(profileData)
    .where(eq(restaurantProfiles.restaurantId, restaurantId));
  if (!await db.select().from(restaurantProfiles).where(eq(restaurantProfiles.restaurantId, restaurantId))) {
    throw new Error(`Restaurant profile with restaurantId ${restaurantId} not found`);
  }
};

//--- Delete Restaurant Profile ---

export const deleteRestaurantProfile = async (restaurantId: number): Promise<void> => {
  await db.delete(restaurantProfiles).where(eq(restaurantProfiles.restaurantId, restaurantId));
};

//--Get Detailed Restaurant--

export const getDetailedRestaurant = async (restaurantId: number): Promise<{ profile: RestaurantProfile; user: RestaurantUser } | undefined> => {
  const [profile] = await db
    .select()
    .from(restaurantProfiles)
    .innerJoin(restaurantUsers, eq(restaurantProfiles.restaurantId, restaurantUsers.id))
    .where(eq(restaurantProfiles.restaurantId, restaurantId));
  if (!profile) {
    throw new Error(`Restaurant profile with restaurantId ${restaurantId} not found`);
  }
  return { profile: profile.restaurant_profiles, user: profile.restaurant_users };
};

//--Get Restaurant User By Reset Token--

export const getRestaurantUserByResetToken = async (token: string): Promise<RestaurantUser | undefined> => {
  const [user] = await db
    .select()
    .from(restaurantUsers)
    .innerJoin(restaurantPasswordResetTokens, eq(restaurantPasswordResetTokens.restaurantId, restaurantUsers.id))
    .where(eq(restaurantPasswordResetTokens.token, token));
  return user?.restaurant_users;
};
  

//--Search Restaurants with Filters--

export const searchRestaurants = async (
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

