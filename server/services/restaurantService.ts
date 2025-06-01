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
import { restaurantProfiles, InsertRestaurantProfile, RestaurantProfile, restaurantBranches, restaurantUsers, RestaurantUser, restaurantPasswordResetTokens, Restaurant, RestaurantSearchFilter, timeSlots, CreateRestaurantInput } from "@server/db/schema";
import { getDistance } from "@server/utils/location";
import { eq, and } from "drizzle-orm";
import { registerRestaurantUser } from "./authService";

// ==================== Restaurant Service ====================



//--- Get Restaurant Profile ---

export const getRestaurantProfile = async (restaurantId: number): Promise<RestaurantProfile | undefined> => {
  const [profile] = await db.select().from(restaurantProfiles).where(eq(restaurantProfiles.restaurantId, restaurantId));
  if (!profile) {
    throw new Error(`Restaurant profile with restaurantId ${restaurantId} not found`);
  }
  return profile;
};

//--Get All Restaurants--

export const getRestaurants = async (): Promise<RestaurantProfile[]> => {
  const restaurants = await db.select().from(restaurantProfiles);
  return restaurants;
};

//--Create Restaurant Profile--

export const createRestaurantProfile = async (profile: InsertRestaurantProfile): Promise<RestaurantProfile> => {
  const [createdProfile] = await db.insert(restaurantProfiles).values(profile).returning();
  if (!createdProfile) {
    throw new Error('Failed to create restaurant profile');
  }
  return createdProfile;
};

//--- Create Restaurant ---

export const createRestaurant = async (restaurant: CreateRestaurantInput): Promise<RestaurantProfile> => {

    const restaurantUser = await registerRestaurantUser({ email: restaurant.email, password: restaurant.password, name: restaurant.name });
    const restaurantProfile = await createRestaurantProfile({ restaurantId: restaurantUser.id, about: restaurant.about, description: restaurant.description, cuisine: restaurant.cuisine, priceRange: restaurant.priceRange, logo: restaurant.logo });
    
    return restaurantProfile;
};

//--- Update Restaurant Profile ---

export const updateRestaurantProfile = async (
    restaurantId: number,
    profileData: {
      about: string;
      description: string;
      cuisine: string;
      priceRange: string;
      logo: string;
    }
  ): Promise<RestaurantProfile> => {
    const [updatedProfile] = await db.update(restaurantProfiles)
      .set(profileData)
      .where(eq(restaurantProfiles.restaurantId, restaurantId))
      .returning();
    if (!updatedProfile) {
      throw new Error(`Restaurant profile with restaurantId ${restaurantId} not found`);
    }
    return updatedProfile;
  };

//---Update Restaurant---

export const updateRestaurant = async (restaurantId: number, restaurantData: { 
  about: string;
  description: string;
  cuisine: string;
  priceRange: string;
  logo: string;
  email: string;
  password: string;
  name: string;
}): Promise<{ user: RestaurantUser; profile: RestaurantProfile }> => {
  const updatedUser = await registerRestaurantUser(restaurantData);
  const updatedProfile = await updateRestaurantProfile(restaurantId, restaurantData);
  
  return { user: updatedUser, profile: updatedProfile };
};


//--Get Detailed Restaurant--

export const getDetailedRestaurant = async (restaurantId: number): Promise<{ profile: RestaurantProfile; user: Omit<RestaurantUser, 'password' | 'verified'>; branches: any[] } | undefined> => {
  // First get the restaurant profile and user
  const [profileData] = await db
    .select()
    .from(restaurantProfiles)
    .innerJoin(restaurantUsers, eq(restaurantProfiles.restaurantId, restaurantUsers.id))
    .where(eq(restaurantProfiles.restaurantId, restaurantId));
  
  if (!profileData) {
    throw new Error(`Restaurant profile with restaurantId ${restaurantId} not found`);
  }
  
  // Then get the branches separately
  const branches = await db
    .select()
    .from(restaurantBranches)
    .where(eq(restaurantBranches.restaurantId, restaurantId));
  
  // Remove the password from the user object
  const { password, verified, ...userWithoutPassword } = profileData.restaurant_users;
  
  return { 
    profile: profileData.restaurant_profiles, 
    user: userWithoutPassword, 
    branches: branches 
  };
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
  

