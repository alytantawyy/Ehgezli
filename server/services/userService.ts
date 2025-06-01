/*
 * User Service Functions:
 * - getUser
 * - getUserByEmail
 * - getUserById
 * - createUser
 * - updateUserProfile
 * - getUserLocation
 * - updateUserLocation
 * - deleteUser
 * - getUserByResetToken
 */

import { db } from "@server/db/db";
import { userPasswordResetTokens, users} from "@server/db/schema";
import { eq } from "drizzle-orm";
import { InsertUser, User } from "@server/db/schema";
import { hashPassword } from "./authService";

// Define our own UserLocation type that matches the current schema
type UserLocation = {
  locationPermissionGranted: boolean | null;
};

// ==================== User Service ====================

//--- Get User ---

export const getUser = async (id: number): Promise<User | undefined> => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) {
    throw new Error(`User with id ${id} not found`);
  }
  return user;
};

//--- Get User by Email ---

export const getUserByEmail = async (email: string): Promise<User | undefined> => {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    throw new Error(`User with email ${email} not found`);
  }
  return user;
};

//--- Update User Profile ---

export const updateUserProfile = async (
  userId: number,
  profileData: {
    email?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    nationality?: string;
    gender?: string;
    favoriteCuisines?: string[];
  }
): Promise<User> => {
  const [updatedUser] = await db.update(users)
    .set(profileData)
    .where(eq(users.id, userId))
    .returning();
  if (!updatedUser) {
    throw new Error(`User with id ${userId} not found`);
  }
  return updatedUser;
};

//--- Get User Location ---

export const getUserLocation = async (userId: number): Promise<{
  locationPermissionGranted: boolean | null;
} | undefined> => {
    const [location] = await db
    .select({
      locationPermissionGranted: users.locationPermissionGranted,
    })
    .from(users)
    .where(eq(users.id, userId));
  
  if (!location) {
    return undefined;
  }
  return {
    locationPermissionGranted: location.locationPermissionGranted ?? false
  };
};

//--- Update User Location ---

export const updateUserLocation = async (
    userId: number, 
    locationData: {
      locationPermissionGranted: boolean;
    }
  ): Promise<{ locationPermissionGranted: boolean | null }> => {
    const [updatedLocation] = await db.update(users)
      .set({
        locationPermissionGranted: locationData.locationPermissionGranted
      })
      .where(eq(users.id, userId))
      .returning();
    if (!updatedLocation) {
      throw new Error(`User with id ${userId} not found`);
    }
    // Handle potential null value by defaulting to false
    return { locationPermissionGranted: updatedLocation.locationPermissionGranted ?? false };
  };

  //--- Delete User ---

  export const deleteUser = async (userId: number): Promise<void> => {
    await db.delete(users).where(eq(users.id, userId));
    if (!await db.select().from(users).where(eq(users.id, userId))) {
      throw new Error(`User with id ${userId} not found`);
    }
  };

  //--Get User By Reset Token--

  export const getUserByResetToken = async (token: string): Promise<User | undefined> => {
    const [user] = await db
      .select()
      .from(users)
      .innerJoin(userPasswordResetTokens, eq(userPasswordResetTokens.userId, users.id))
      .where(eq(userPasswordResetTokens.token, token));
    return user?.users;
  };
    
    
