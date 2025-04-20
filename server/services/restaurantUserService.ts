/*
 * Restaurant User Service Functions:
 * - getRestaurantUser
 * - getRestaurantUserByEmail
 * - createRestaurantUser
 * - updateRestaurantUser
 * - deleteRestaurantUser
 */

import { db } from "@server/db/db";
import { restaurantUsers} from "@server/db/schema";
import { eq } from "drizzle-orm";
import { InsertRestaurantUser, RestaurantUser } from "@server/db/schema";

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

//--- Delete Restaurant User ---

export const deleteRestaurantUser = async (userId: number): Promise<void> => {
  const deletedUser = await db.delete(restaurantUsers).where(eq(restaurantUsers.id, userId));
  if (!deletedUser) {
    throw new Error(`Restaurant user with id ${userId} not found`);
  }
};
