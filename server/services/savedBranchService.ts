/*
 * Saved Branch Service Functions:
 * - getUserSavedBranches
 * - saveBranch
 * - removeSavedBranch
 * - getSavedBranchIds
 */

import { db } from "@server/db/db";
import { RestaurantBranch, restaurantBranches, savedBranches} from "@server/db/schema";
import { and, eq } from "drizzle-orm";

// ==================== Saved Branch Service ====================

//--Get User Saved Branches--

export const getUserSavedBranches = async (userId: number): Promise<RestaurantBranch[]> => {
  const userSavedBranches = await db
    .select()
    .from(savedBranches)
    .innerJoin(restaurantBranches, eq(savedBranches.branchId, restaurantBranches.id))
    .where(eq(savedBranches.userId, userId));
  return userSavedBranches.map(record => record.restaurant_branches);
};

  //--Save Branch--

  export const saveBranch = async (userId: number, branchId: number): Promise<void> => {
    const savedBranch = await db.insert(savedBranches).values({ userId, branchId });
    if (!savedBranch) {
      throw new Error(`Failed to save branch ${branchId} for user ${userId}`);
    }
  };

  //--Remove Saved Branch--

  export const removeSavedBranch = async (userId: number, branchId: number): Promise<boolean> => {
    const result = await db.delete(savedBranches).where(and(eq(savedBranches.userId, userId), eq(savedBranches.branchId, branchId)));
    if (!result) {
      throw new Error(`Failed to remove branch ${branchId} for user ${userId}`);
    }
    return true;
  };

    //--Get Saved Branch IDs--

    export const getSavedBranchIds = async (userId: number): Promise<number[]> => {
      const result = await db   
        .select()
        .from(savedBranches)
        .where(eq(savedBranches.userId, userId));
      if (!result) {
        return [];
      }
      return result.map(row => row.branchId);
    };

    
