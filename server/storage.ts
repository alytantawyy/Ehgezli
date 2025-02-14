import { 
  InsertUser, User, Restaurant, Booking, RestaurantBranch,
  mockRestaurants, RestaurantAuth, InsertRestaurantAuth,
  restaurantProfiles, restaurantBranches, bookings, users,
  type InsertRestaurantProfile, RestaurantProfile, restaurants, restaurantAuth
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurantBranches(restaurantId: number): Promise<RestaurantBranch[]>;
  createBooking(booking: Omit<Booking, "id" | "confirmed">): Promise<Booking>;
  getUserBookings(userId: number): Promise<Booking[]>;
  getRestaurantBookings(restaurantId: number): Promise<Booking[]>;
  getRestaurantAuth(id: number): Promise<RestaurantAuth | undefined>;
  getRestaurantAuthByEmail(email: string): Promise<RestaurantAuth | undefined>;
  createRestaurantAuth(auth: InsertRestaurantAuth): Promise<RestaurantAuth>;
  createRestaurantProfile(profile: InsertRestaurantProfile): Promise<void>;
  getRestaurantProfile(restaurantId: number): Promise<RestaurantProfile | undefined>;
  sessionStore: session.Store;
  searchRestaurants(query: string, city?: string): Promise<Restaurant[]>;
}

export class DatabaseStorage implements IStorage {
  readonly sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
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
    // Convert the birthday string to a Date object before inserting
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
    const [restaurantData] = await db.select()
      .from(restaurantAuth)
      .where(eq(restaurantAuth.id, id))
      .leftJoin(restaurantProfiles, eq(restaurantAuth.id, restaurantProfiles.restaurantId))
      .leftJoin(restaurantBranches, eq(restaurantAuth.id, restaurantBranches.restaurantId));

    if (!restaurantData?.restaurant_auth || !restaurantData.restaurant_profiles || !restaurantData.restaurant_branches) {
      return undefined;
    }

    const { restaurant_auth, restaurant_profiles, restaurant_branches } = restaurantData;

    return {
      id: restaurant_auth.id,
      authId: restaurant_auth.id,
      name: restaurant_auth.name,
      description: restaurant_profiles.about.slice(0, 100) + (restaurant_profiles.about.length > 100 ? '...' : ''),
      about: restaurant_profiles.about,
      logo: restaurant_profiles.logo || "",
      cuisine: restaurant_profiles.cuisine,
      locations: [{
        address: restaurant_branches.address,
        tablesCount: restaurant_branches.tablesCount,
        openingTime: restaurant_branches.openingTime,
        closingTime: restaurant_branches.closingTime,
        city: restaurant_branches.city as "Alexandria" | "Cairo"
      }]
    };
  }

  async getRestaurantBranches(restaurantId: number): Promise<RestaurantBranch[]> {
    return db.select().from(restaurantBranches).where(eq(restaurantBranches.restaurantId, restaurantId));
  }

  async createBooking(booking: Omit<Booking, "id" | "confirmed">): Promise<Booking> {
    // Convert the date to a Date object if it's not already
    const date = booking.date instanceof Date ? booking.date : new Date(booking.date);

    // Create the booking with validated data
    const [newBooking] = await db.insert(bookings)
      .values({
        userId: booking.userId,
        branchId: booking.branchId,
        date: date,
        partySize: booking.partySize,
        confirmed: false
      })
      .returning();

    return newBooking;
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async getRestaurantBookings(restaurantId: number): Promise<Booking[]> {
    const bookingsWithBranches = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        branchId: bookings.branchId,
        date: bookings.date,
        partySize: bookings.partySize,
        confirmed: bookings.confirmed
      })
      .from(bookings)
      .innerJoin(
        restaurantBranches,
        eq(bookings.branchId, restaurantBranches.id)
      )
      .where(eq(restaurantBranches.restaurantId, restaurantId));

    return bookingsWithBranches;
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
    const [profile] = await db.select()
      .from(restaurantProfiles)
      .where(eq(restaurantProfiles.restaurantId, restaurantId));
    return profile;
  }

  async createRestaurantProfile(profile: InsertRestaurantProfile): Promise<void> {
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

    // Delete existing branches and insert new ones
    await db.delete(restaurantBranches)
      .where(eq(restaurantBranches.restaurantId, profile.restaurantId));

    await db.insert(restaurantBranches).values(
      profile.branches.map(branch => ({
        restaurantId: profile.restaurantId,
        address: branch.address,
        city: branch.city,
        tablesCount: branch.tablesCount,
        seatsCount: branch.seatsCount,
        openingTime: branch.openingTime,
        closingTime: branch.closingTime,
        reservationDuration: 120 // Default 2 hours in minutes
      }))
    );
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