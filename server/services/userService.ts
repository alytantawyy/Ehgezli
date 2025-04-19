import { db } from "@server/db/db";
import { users} from "@server/db/schema";
import { eq } from "drizzle-orm";
import { InsertUser, User } from "@server/db/schema";


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

//--- Get User by ID ---

export const getUserById = async (id: number): Promise<User | undefined> => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) {
    throw new Error(`User with id ${id} not found`);
  }
  return user;
};

//--- Create User ---

export const createUser = async (user: InsertUser): Promise<User> => {
  const [createdUser] = await db.insert(users).values(user).returning();
  if (!createdUser) {
    throw new Error('Failed to create user');
  }
  return createdUser;
};

//--- Update User Profile ---

export const updateUserProfile = async (
  userId: number,
  profileData: {
    firstName: string;
    lastName: string;
    city: string;
    gender: string;
    favoriteCuisines: string[];
  }
): Promise<void> => {
  await db.update(users)
    .set(profileData)
    .where(eq(users.id, userId));
  if (!await db.select().from(users).where(eq(users.id, userId))) {
    throw new Error(`User with id ${userId} not found`);
  }
};

export const updateUserLocation = async (
    userId: number, 
    locationData: {
      lastLatitude: number;
      lastLongitude: number;
      locationUpdatedAt: Date;
      locationPermissionGranted: boolean;
    }
  ): Promise<void> => {
    await db.update(users)
      .set({
        lastLatitude: locationData.lastLatitude,
        lastLongitude: locationData.lastLongitude,
        locationUpdatedAt: locationData.locationUpdatedAt,
        locationPermissionGranted: locationData.locationPermissionGranted
      })
      .where(eq(users.id, userId));
    if (!await db.select().from(users).where(eq(users.id, userId))) {
      throw new Error(`User with id ${userId} not found`);
    }
  };


