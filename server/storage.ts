import { 
  InsertUser, User, Restaurant, Booking, RestaurantBranch,
  mockRestaurants, RestaurantAuth, InsertRestaurantAuth,
  restaurantProfiles, restaurantBranches, bookings, users,
  type InsertRestaurantProfile, RestaurantProfile, restaurants, restaurantAuth
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurantBranches(restaurantId: number): Promise<RestaurantBranch[]>;
  createBooking(booking: Omit<Booking, "id" | "confirmed">): Promise<Booking>;
  getUserBookings(userId: number): Promise<(Booking & { restaurantName: string })[]>;
  getRestaurantBookings(restaurantId: number): Promise<Booking[]>;
  getRestaurantAuth(id: number): Promise<RestaurantAuth | undefined>;
  getRestaurantAuthByEmail(email: string): Promise<RestaurantAuth | undefined>;
  createRestaurantAuth(auth: InsertRestaurantAuth): Promise<RestaurantAuth>;
  createRestaurantProfile(profile: InsertRestaurantProfile): Promise<void>;
  sessionStore: session.Store;
  searchRestaurants(query: string, city?: string): Promise<Restaurant[]>;
  isRestaurantProfileComplete(restaurantId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  readonly sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15,
      errorLog: (err) => console.error('Session store error:', err)
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userWithDateBirthday = {
      ...insertUser,
      birthday: new Date(insertUser.birthday),
    };

    const [user] = await db.insert(users).values(userWithDateBirthday).returning();
    return user;
  }

  async getRestaurants(): Promise<Restaurant[]> {
    const registeredRestaurants = await db.select().from(restaurantAuth)
      .leftJoin(restaurantProfiles, eq(restaurantAuth.id, restaurantProfiles.restaurantId))
      .leftJoin(restaurantBranches, eq(restaurantAuth.id, restaurantBranches.restaurantId));

    const restaurantMap = new Map<number, Restaurant>();

    for (const record of registeredRestaurants) {
      const { restaurant_auth, restaurant_profiles, restaurant_branches } = record;

      if (!restaurant_auth || !restaurant_profiles) continue;

      if (!restaurantMap.has(restaurant_auth.id)) {
        console.log("Creating restaurant entry:", restaurant_auth.id); 
        restaurantMap.set(restaurant_auth.id, {
          id: restaurant_auth.id,
          authId: restaurant_auth.id,
          name: restaurant_auth.name,
          description: restaurant_profiles.about.slice(0, 100) + (restaurant_profiles.about.length > 100 ? '...' : ''),
          about: restaurant_profiles.about,
          logo: restaurant_profiles.logo || "",
          cuisine: restaurant_profiles.cuisine,
          locations: []
        });
      }

      const restaurant = restaurantMap.get(restaurant_auth.id)!;

      if (restaurant_branches) {
        console.log("Adding branch for restaurant:", restaurant_auth.id, restaurant_branches); 
        restaurant.locations.push({
          address: restaurant_branches.address,
          tablesCount: restaurant_branches.tablesCount,
          openingTime: restaurant_branches.openingTime,
          closingTime: restaurant_branches.closingTime,
          city: restaurant_branches.city as "Alexandria" | "Cairo"
        });
      }
    }

    return Array.from(restaurantMap.values());
  }

  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    try {
      // Get restaurant auth and profile data
      const [restaurantData] = await db.select()
        .from(restaurantAuth)
        .where(eq(restaurantAuth.id, id))
        .leftJoin(restaurantProfiles, eq(restaurantAuth.id, restaurantProfiles.restaurantId));

      if (!restaurantData?.restaurant_auth || !restaurantData.restaurant_profiles) {
        console.log("No restaurant found for id:", id);
        return undefined;
      }

      // Get branches data separately to ensure we get all branches
      const branches = await db
        .select()
        .from(restaurantBranches)
        .where(eq(restaurantBranches.restaurantId, id));

      console.log("Found branches for restaurant:", id, branches);

      const { restaurant_auth, restaurant_profiles } = restaurantData;

      // Map the data to the Restaurant type
      const restaurant: Restaurant = {
        id: restaurant_auth.id,
        authId: restaurant_auth.id,
        name: restaurant_auth.name,
        description: restaurant_profiles.about.slice(0, 100) + (restaurant_profiles.about.length > 100 ? '...' : ''),
        about: restaurant_profiles.about,
        logo: restaurant_profiles.logo || "",
        cuisine: restaurant_profiles.cuisine,
        locations: branches.map(branch => {
          console.log("Processing branch data:", {
            branchId: branch.id,
            city: branch.city,
            address: branch.address
          });
          return {
            address: branch.address,
            tablesCount: branch.tablesCount,
            seatsCount: branch.seatsCount,
            openingTime: branch.openingTime,
            closingTime: branch.closingTime,
            city: branch.city as "Alexandria" | "Cairo"
          };
        })
      };

      console.log("Mapped restaurant data:", restaurant);
      return restaurant;
    } catch (error) {
      console.error("Error in getRestaurant:", error);
      throw error;
    }
  }

  async getRestaurantBranches(restaurantId: number): Promise<RestaurantBranch[]> {
    try {
      const [restaurant] = await db
        .select()
        .from(restaurantAuth)
        .where(eq(restaurantAuth.id, restaurantId));

      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      const branches = await db
        .select()
        .from(restaurantBranches)
        .where(eq(restaurantBranches.restaurantId, restaurantId));

      console.log('Fetched branches from database:', branches);

      return branches.map(branch => ({
        id: branch.id,
        restaurantId: branch.restaurantId,
        address: branch.address,
        city: branch.city as "Alexandria" | "Cairo",
        tablesCount: branch.tablesCount,
        seatsCount: branch.seatsCount,
        openingTime: branch.openingTime,
        closingTime: branch.closingTime,
        reservationDuration: branch.reservationDuration || 120
      }));
    } catch (error) {
      console.error('Error fetching restaurant branches:', error);
      throw new Error('Failed to fetch restaurant branches');
    }
  }

  async createBooking(booking: Omit<Booking, "id" | "confirmed">): Promise<Booking> {
    try {
      const date = booking.date instanceof Date ? booking.date : new Date(booking.date);

      const [branch] = await db
        .select()
        .from(restaurantBranches)
        .where(eq(restaurantBranches.id, booking.branchId));

      if (!branch) {
        throw new Error('Restaurant branch not found');
      }

      const [newBooking] = await db.insert(bookings)
        .values({
          userId: booking.userId,
          branchId: booking.branchId,
          date: date,
          partySize: booking.partySize,
          confirmed: true 
        })
        .returning();

      return newBooking;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  async getUserBookings(userId: number): Promise<(Booking & { restaurantName: string })[]> {
    const bookingsWithRestaurants = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        branchId: bookings.branchId,
        date: bookings.date,
        partySize: bookings.partySize,
        confirmed: bookings.confirmed,
        restaurantName: restaurantAuth.name,
      })
      .from(bookings)
      .innerJoin(restaurantBranches, eq(bookings.branchId, restaurantBranches.id))
      .innerJoin(restaurantAuth, eq(restaurantBranches.restaurantId, restaurantAuth.id))
      .where(eq(bookings.userId, userId));

    return bookingsWithRestaurants;
  }

  async getRestaurantBookings(restaurantId: number): Promise<Booking[]> {
    try {
      console.log(`Fetching bookings for restaurant ${restaurantId}`);

      const [restaurant] = await db
        .select()
        .from(restaurantAuth)
        .where(eq(restaurantAuth.id, restaurantId));

      if (!restaurant) {
        console.log('Restaurant not found:', restaurantId);
        throw new Error('Restaurant not found');
      }

      const branches = await db
        .select()
        .from(restaurantBranches)
        .where(eq(restaurantBranches.restaurantId, restaurantId));

      console.log(`Found ${branches.length} branches for restaurant ${restaurantId}:`, branches);

      if (!branches.length) {
        console.log(`No branches found for restaurant ${restaurantId}`);
        return [];
      }

      const bookingsWithDetails = await db
        .select({
          id: bookings.id,
          userId: bookings.userId,
          branchId: bookings.branchId,
          date: bookings.date,
          partySize: bookings.partySize,
          confirmed: bookings.confirmed,
          user: {
            firstName: users.firstName,
            lastName: users.lastName
          },
          branch: {
            address: restaurantBranches.address,
            city: restaurantBranches.city
          }
        })
        .from(bookings)
        .innerJoin(
          restaurantBranches,
          and(
            eq(bookings.branchId, restaurantBranches.id),
            eq(restaurantBranches.restaurantId, restaurantId)
          )
        )
        .leftJoin(users, eq(bookings.userId, users.id));

      console.log(`Found ${bookingsWithDetails.length} bookings with details for restaurant ${restaurantId}:`, bookingsWithDetails);
      return bookingsWithDetails;
    } catch (error) {
      console.error('Error fetching restaurant bookings:', error);
      throw error;
    }
  }

  async getRestaurantAuth(id: number): Promise<RestaurantAuth | undefined> {
    const [auth] = await db.select().from(restaurantAuth).where(eq(restaurantAuth.id, id));
    return auth;
  }

  async getRestaurantAuthByEmail(email: string): Promise<RestaurantAuth | undefined> {
    const [auth] = await db.select().from(restaurantAuth).where(eq(restaurantAuth.email, email));
    return auth;
  }

  async createRestaurantAuth(auth: InsertRestaurantAuth): Promise<RestaurantAuth> {
    const [newAuth] = await db.insert(restaurantAuth)
      .values({ ...auth, verified: false, createdAt: new Date() })
      .returning();
    return newAuth;
  }

  async getRestaurantProfile(restaurantId: number): Promise<RestaurantProfile | undefined> {
    try {
      const [profile] = await db.select()
        .from(restaurantProfiles)
        .where(eq(restaurantProfiles.restaurantId, restaurantId));
      return profile;
    } catch (error) {
      console.error('Error fetching restaurant profile:', error);
      throw error;
    }
  }

  async isRestaurantProfileComplete(restaurantId: number): Promise<boolean> {
    try {
      const profile = await this.getRestaurantProfile(restaurantId);
      if (!profile) return false;

      const isComplete = Boolean(
        profile.isProfileComplete &&
        profile.about &&
        profile.cuisine &&
        profile.priceRange &&
        profile.logo
      );

      return isComplete;
    } catch (error) {
      console.error('Error checking profile completion:', error);
      return false;
    }
  }

  async createRestaurantProfile(profile: InsertRestaurantProfile): Promise<void> {
    try {
      console.log("Creating/updating restaurant profile with data:", profile);

      // First check if profile exists
      const existingProfile = await this.getRestaurantProfile(profile.restaurantId);

      if (existingProfile) {
        // If profile exists, update it
        await db.update(restaurantProfiles)
          .set({
            about: profile.about,
            cuisine: profile.cuisine,
            priceRange: profile.priceRange,
            logo: profile.logo,
            isProfileComplete: true,
            updatedAt: new Date()
          })
          .where(eq(restaurantProfiles.restaurantId, profile.restaurantId));
      } else {
        // If profile doesn't exist, insert new one
        await db.insert(restaurantProfiles).values({
          restaurantId: profile.restaurantId,
          about: profile.about,
          cuisine: profile.cuisine,
          priceRange: profile.priceRange,
          logo: profile.logo,
          isProfileComplete: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Update branches - first delete existing ones
      await db.delete(restaurantBranches)
        .where(eq(restaurantBranches.restaurantId, profile.restaurantId));

      // Then insert the new/updated branches
      const branchData = profile.branches.map(branch => ({
        restaurantId: profile.restaurantId,
        address: branch.address,
        city: branch.city,
        tablesCount: branch.tablesCount,
        seatsCount: branch.seatsCount,
        openingTime: branch.openingTime,
        closingTime: branch.closingTime,
        reservationDuration: 120 // Default 2 hours in minutes
      }));

      console.log("Inserting branch data:", branchData);

      await db.insert(restaurantBranches).values(branchData);

    } catch (error) {
      console.error('Error creating/updating restaurant profile:', error);
      throw error;
    }
  }

  async searchRestaurants(query: string, city?: string): Promise<Restaurant[]> {
    const restaurants = await this.getRestaurants();
    const normalizedQuery = query.toLowerCase().trim();

    return restaurants.filter(restaurant => {
      if (city) {
        const branchCities = restaurant.locations?.map(loc => loc.city) || [];
        if (!branchCities.includes(city as "Alexandria" | "Cairo")) {
          return false;
        }
      }

      if (!normalizedQuery) {
        return true;
      }

      const matchesName = restaurant.name.toLowerCase().includes(normalizedQuery);
      const matchesCuisine = restaurant.cuisine.toLowerCase().includes(normalizedQuery);
      const matchesLocation = restaurant.locations?.some(location => {
        const addressPart = location.address.split(',')[0].trim().toLowerCase();
        return addressPart.includes(normalizedQuery);
      });

      return matchesName || matchesCuisine || matchesLocation;
    });
  }
}

export const storage = new DatabaseStorage();