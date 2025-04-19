import { db } from "@server/db/db";
import { restaurantProfiles, InsertRestaurantProfile, RestaurantProfile } from "@server/db/schema";
import { eq } from "drizzle-orm";

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



