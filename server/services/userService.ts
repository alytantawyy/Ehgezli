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
import { UserLocation, userPasswordResetTokens, users} from "@server/db/schema";
import { eq } from "drizzle-orm";
import { InsertUser, User } from "@server/db/schema";
import { hashPassword } from "./authService";


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
  lastLatitude: number;
  lastLongitude: number;
  locationUpdatedAt: Date;
  locationPermissionGranted: boolean;
} | undefined> => {
    const [location] = await db
    .select({
      lastLatitude: users.lastLatitude,
      lastLongitude: users.lastLongitude,
      locationUpdatedAt: users.locationUpdatedAt,
      locationPermissionGranted: users.locationPermissionGranted,
    })
    .from(users)
    .where(eq(users.id, userId));
  
  if (!location) {
    return undefined;
  }
  return {
    lastLatitude: location.lastLatitude ?? 0,
    lastLongitude: location.lastLongitude ?? 0,
    locationUpdatedAt: location.locationUpdatedAt ?? new Date(),
    locationPermissionGranted: location.locationPermissionGranted ?? false
  };
};

//--- Update User Location ---

export const updateUserLocation = async (
    userId: number, 
    locationData: {
      lastLatitude: number;
      lastLongitude: number;
      locationUpdatedAt: Date;
      locationPermissionGranted: boolean;
    }
  ): Promise<UserLocation> => {
    const [updatedLocation] = await db.update(users)
      .set({
        lastLatitude: locationData.lastLatitude,
        lastLongitude: locationData.lastLongitude,
        locationUpdatedAt: locationData.locationUpdatedAt,
        locationPermissionGranted: locationData.locationPermissionGranted
      })
      .where(eq(users.id, userId))
      .returning();
    if (!updatedLocation) {
      throw new Error(`User with id ${userId} not found`);
    }
    return updatedLocation;
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
    
    
