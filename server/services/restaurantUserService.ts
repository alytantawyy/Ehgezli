/*
 * Restaurant User Service Functions:
 * - getRestaurantUser
 * - getRestaurantUserByEmail
 * - createRestaurantUser
 * - updateRestaurantUser
 * - updateRestaurantUserDetails
 * - deleteRestaurantUser
 */

import { db } from "@server/db/db";
import { restaurantUsers, restaurantProfiles, restaurantBranches } from "@server/db/schema";
import { eq } from "drizzle-orm";
import { InsertRestaurantUser, RestaurantUser } from "@server/db/schema";
import { hashPassword } from "./authService";

// ==================== Restaurant User Service ====================

//--- Get Restaurant User ---

export const getRestaurantUser = async (id: number): Promise<RestaurantUser | undefined> => {
  const [restaurantUser] = await db.select().from(restaurantUsers).where(eq(restaurantUsers.id, id));
  if (!restaurantUser) {
    throw new Error(`Restaurant user with id ${id} not found`);
  }
  return restaurantUser;
};

//--- Get Restaurant User by Email ---

export const getRestaurantUserByEmail = async (email: string): Promise<RestaurantUser | undefined> => {
  const [restaurantUser] = await db.select().from(restaurantUsers).where(eq(restaurantUsers.email, email));
  if (!restaurantUser) {
    throw new Error(`Restaurant user with email ${email} not found`);
  }
  return restaurantUser;
};

//--- Create Restaurant User ---

export const createRestaurantUser = async (restaurantUser: InsertRestaurantUser): Promise<RestaurantUser> => {
  // Hash the password before storing it
  if (restaurantUser.password) {
    restaurantUser.password = await hashPassword(restaurantUser.password);
  }
  
  const [createdRestaurantUser] = await db.insert(restaurantUsers).values(restaurantUser).returning();
  if (!createdRestaurantUser) {
    throw new Error('Failed to create restaurant user');
  }
  return createdRestaurantUser;
};

//--- Update Restaurant User ---

export const updateRestaurantUser = async (userId: number, restaurantUser: InsertRestaurantUser): Promise<RestaurantUser> => {
  const [updatedRestaurantUser] = await db.update(restaurantUsers).set(restaurantUser).where(eq(restaurantUsers.id, userId)).returning();
  if (!updatedRestaurantUser) {
    throw new Error(`Failed to update restaurant user with id ${userId}`);
  }
  return updatedRestaurantUser;
};

//--- Update Restaurant User Details ---

export const updateRestaurantUserDetails = async (
  userId: number,
  details: {
    email?: string;
    name?: string;
  }
): Promise<RestaurantUser> => {
  const [updatedRestaurantUser] = await db.update(restaurantUsers)
    .set(details)
    .where(eq(restaurantUsers.id, userId))
    .returning();
  if (!updatedRestaurantUser) {
    throw new Error(`Failed to update restaurant user with id ${userId}`);
  }
  return updatedRestaurantUser;
};

//--- Delete Restaurant User ---

export const deleteRestaurantUser = async (userId: number): Promise<void> => {
  // First, delete the related restaurant profile
  try {
    await db.delete(restaurantProfiles)
      .where(eq(restaurantProfiles.restaurantId, userId));
      
    console.log(`Deleted restaurant profile for user ${userId}`);
  } catch (error) {
    console.error(`Error deleting restaurant profile: ${error}`);
    throw new Error(`Failed to delete restaurant profile for user ${userId}: ${error}`);
  }
  
  // Then, delete any restaurant branches
  try {
    await db.delete(restaurantBranches)
      .where(eq(restaurantBranches.restaurantId, userId));
      
    console.log(`Deleted restaurant branches for user ${userId}`);
  } catch (error) {
    console.error(`Error deleting restaurant branches: ${error}`);
    // Continue with deletion even if branches fail
  }
  
  // Finally, delete the restaurant user
  try {
    const result = await db.delete(restaurantUsers)
      .where(eq(restaurantUsers.id, userId));
      
    if (!result) {
      throw new Error(`Restaurant user with id ${userId} not found`);
    }
    
    console.log(`Deleted restaurant user ${userId}`);
  } catch (error) {
    console.error(`Error deleting restaurant user: ${error}`);
    throw new Error(`Failed to delete restaurant user ${userId}: ${error}`);
  }
};
