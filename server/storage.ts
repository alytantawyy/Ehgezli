// Import all the types and database tables we need
// These come from our shared schema file that both client and server use
import { 
  InsertUser, User, RestaurantBranch, RestaurantAuth, InsertRestaurantAuth,
  restaurantProfiles, restaurantBranches, bookings, users,
  restaurantAuth, RestaurantProfile, Location, ExtendedBooking, 
  branchUnavailableDates, BranchUnavailableDate, InsertBranchUnavailableDates,
  savedRestaurants, passwordResetTokens, restaurantPasswordResetTokens,
  type InsertRestaurantProfile
} from "@shared/schema";

// Import our database connection
import { db, pool } from "./db";

// Import helper functions from Drizzle ORM for writing SQL queries
import { eq, and, gt, sql, desc, inArray, or, ilike, type SQL } from "drizzle-orm";

// Import session handling packages
import session from "express-session";  // For managing user sessions
import connectPg from "connect-pg-simple";  // For storing sessions in PostgreSQL
import * as crypto from 'crypto';  // For generating secure tokens

// Create a PostgreSQL session store
// This lets us store session data in our database instead of memory
const PostgresSessionStore = connectPg(session);

// Define an interface that describes all the database operations our app can do
// This is like a contract that says "here are all the things we can do with our data"
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;  // Find a user by their ID
  getUserByEmail(email: string): Promise<User | undefined>;  // Find a user by their email
  createUser(user: InsertUser): Promise<User>;  // Create a new user

  // Restaurant operations
  getRestaurants(filters?: { 
    search?: string;
    city?: string;
    cuisine?: string;
    priceRange?: string;
  }): Promise<RestaurantAuth[]>;  // Get all restaurants
  getRestaurant(id: number): Promise<(RestaurantAuth & { profile?: RestaurantProfile, branches: RestaurantBranch[] }) | undefined>;  // Find a restaurant by ID
  getRestaurantBranches(restaurantId: number): Promise<RestaurantBranch[]>;  // Get all branches of a restaurant

  // Booking operations
  createBooking(booking: Omit<ExtendedBooking, "id" | "confirmed">): Promise<ExtendedBooking>;  // Create a new booking
  getUserBookings(userId: number): Promise<ExtendedBooking[]>;  // Get all bookings for a user
  getRestaurantBookings(restaurantId: number): Promise<ExtendedBooking[]>;  // Get all bookings for a restaurant
  getBookingById(bookingId: number): Promise<ExtendedBooking | undefined>;  // Get booking by ID
  getBookingByIdAndRestaurant(bookingId: number, restaurantId: number): Promise<ExtendedBooking | undefined>;  // Get booking by ID and restaurant ID
  getBookingByIdAndUser(bookingId: number, userId: number): Promise<ExtendedBooking | undefined>;  // Get booking by ID and user ID
  markBookingArrived(bookingId: number, arrivedAt: Date): Promise<ExtendedBooking | undefined>;  // Mark booking as arrived
  markBookingComplete(bookingId: number): Promise<ExtendedBooking | undefined>;  // Mark booking as complete
  cancelBooking(bookingId: number): Promise<ExtendedBooking | undefined>;  // Cancel booking

  // Restaurant authentication operations
  getRestaurantAuth(id: number): Promise<RestaurantAuth | undefined>;  // Get restaurant login info by ID
  getRestaurantAuthByEmail(email: string): Promise<RestaurantAuth | undefined>;  // Get restaurant login info by email
  createRestaurantAuth(auth: InsertRestaurantAuth): Promise<RestaurantAuth>;  // Create new restaurant login
  createRestaurantProfile(profile: InsertRestaurantProfile): Promise<void>;  // Create restaurant profile

  // Session management
  sessionStore: session.Store;  // Get the session store
  setSessionStore(store: session.Store): void;  // Set the session store

  // Additional restaurant operations
  searchRestaurants(query: string, city?: string): Promise<RestaurantAuth[]>;  // Search for restaurants
  isRestaurantProfileComplete(restaurantId: number): Promise<boolean>;  // Check if profile is complete

  // Password reset operations for users
  createPasswordResetToken(userId: number): Promise<string>;  // Create reset token
  validatePasswordResetToken(token: string): Promise<number | null>;  // Check if token is valid
  markPasswordResetTokenAsUsed(token: string): Promise<void>;  // Mark token as used
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;  // Update password

  // Password reset operations for restaurants
  createRestaurantPasswordResetToken(restaurantId: number): Promise<string>;
  validateRestaurantPasswordResetToken(token: string): Promise<number | null>;
  markRestaurantPasswordResetTokenAsUsed(token: string): Promise<void>;
  updateRestaurantPassword(restaurantId: number, hashedPassword: string): Promise<void>;

  // Branch operations
  getBranchById(branchId: number, restaurantId: number): Promise<RestaurantBranch | undefined>;
  getBranchAvailability(branchId: number, date: Date): Promise<{ tablesCount: number, bookingsCount: number } | undefined>;
  isRestaurantSaved(userId: number, restaurantId: number, branchIndex: number): Promise<boolean>;
  removeSavedRestaurant(userId: number, restaurantId: number, branchIndex: number): Promise<boolean>;
  getDetailedRestaurantData(restaurantId: number): Promise<RestaurantAuth & { profile?: RestaurantProfile } | undefined>;
}

// This class implements all the database operations defined in IStorage
export class DatabaseStorage implements IStorage {
  // Store the session management system
  private _sessionStore: session.Store;

  constructor() {
    // Set up session storage in PostgreSQL when this class is created
    this._sessionStore = new PostgresSessionStore({
      pool,  // Database connection pool
      tableName: 'session',  // Table name for storing sessions
      createTableIfMissing: true,  // Create the table if it doesn't exist
      pruneSessionInterval: 60 * 15,  // Clean up old sessions every 15 minutes
      errorLog: (err) => console.error('Session store error:', err)  // Log any errors
    });
  }

  // Getter method to access the session store
  get sessionStore(): session.Store {
    return this._sessionStore;
  }

  // Setter method to update the session store
  setSessionStore(store: session.Store): void {
    this._sessionStore = store;
  }

  // Find a restaurant's login info by their email address
  async getRestaurantAuthByEmail(email: string): Promise<RestaurantAuth | undefined> {
    try {
      // Use Drizzle ORM to make a SELECT query
      // The [auth] destructuring takes the first result (if any)
      const [auth] = await db
        .select()  // SELECT *
        .from(restaurantAuth)  // FROM restaurant_auth
        .where(eq(restaurantAuth.email, email));  // WHERE email = ?
      return auth;  // Return the found restaurant or undefined
    } catch (error) {
      // If anything goes wrong, log it and return undefined
      console.error('Error getting restaurant by email:', error);
      return undefined;
    }
  }

  // Find a restaurant's login info by their ID
  async getRestaurantAuth(id: number): Promise<RestaurantAuth | undefined> {
    try {
      // Similar to getRestaurantAuthByEmail but searches by ID instead
      const [auth] = await db
        .select()
        .from(restaurantAuth)
        .where(eq(restaurantAuth.id, id));
      return auth;
    } catch (error) {
      console.error('Error getting restaurant by id:', error);
      return undefined;
    }
  }

  // Find a user by their ID
  async getUser(id: number): Promise<User | undefined> {
    // Simple SELECT query to find a user by ID
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // Find a user by their email address
  async getUserByEmail(email: string): Promise<User | undefined> {
    // Similar to getUser but searches by email instead
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Create a new user in the database
  async createUser(insertUser: InsertUser): Promise<User> {
    // Convert the birthday string to a Date object
    const userWithDateBirthday = {
      ...insertUser,
      birthday: new Date(insertUser.birthday),
    };

    // INSERT INTO users ... RETURNING *
    const [user] = await db.insert(users).values(userWithDateBirthday).returning();
    return user;
  }

  // Get all restaurants with their profiles and branches
  async getRestaurants(filters?: { 
    search?: string;
    city?: string;
    cuisine?: string;
    priceRange?: string;
  }): Promise<RestaurantAuth[]> {
    try {
      const conditions: SQL<unknown>[] = [];
      
      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        const searchCondition = or(
          ilike(restaurantAuth.name, searchTerm),
          ilike(restaurantProfiles.about, searchTerm),
          ilike(restaurantProfiles.cuisine, searchTerm)
        ) as SQL<unknown>;
        conditions.push(searchCondition);
      }
      
      if (filters?.city) {
        const cityCondition = eq(restaurantBranches.city, filters.city as "Alexandria" | "Cairo") as SQL<unknown>;
        conditions.push(cityCondition);
      }
      
      if (filters?.cuisine) {
        const cuisineCondition = eq(restaurantProfiles.cuisine, filters.cuisine) as SQL<unknown>;
        conditions.push(cuisineCondition);
      }
      
      if (filters?.priceRange) {
        const priceCondition = eq(restaurantProfiles.priceRange, filters.priceRange) as SQL<unknown>;
        conditions.push(priceCondition);
      }

      // Execute query with all conditions
      const query = db
        .select({
          restaurant: restaurantAuth,
          profile: restaurantProfiles,
          branches: restaurantBranches
        })
        .from(restaurantAuth)
        .leftJoin(
          restaurantProfiles,
          eq(restaurantAuth.id, restaurantProfiles.restaurantId)
        )
        .leftJoin(
          restaurantBranches,
          eq(restaurantAuth.id, restaurantBranches.restaurantId)
        );

      // Only add where clause if we have conditions
      const results = await (conditions.length > 0 
        ? query.where(and(...conditions))
        : query);

      // Map results to remove duplicates and format properly
      const restaurantMap = new Map<number, RestaurantAuth & { profile?: RestaurantProfile, branches: RestaurantBranch[] }>();

      for (const row of results) {
        if (row.restaurant) {
          const restaurantId = row.restaurant.id;
          if (!restaurantMap.has(restaurantId)) {
            restaurantMap.set(restaurantId, {
              ...row.restaurant,
              profile: row.profile || undefined,
              branches: []
            });
          }

          if (row.branches) {
            const restaurant = restaurantMap.get(restaurantId);
            const branch = row.branches;
            if (restaurant && branch && !restaurant.branches.some((existingBranch: RestaurantBranch) => existingBranch.id === branch.id)) {
              restaurant.branches.push(branch);
            }
          }
        }
      }

      return Array.from(restaurantMap.values());
    } catch (error) {
      console.error('Error getting restaurants:', error);
      throw error;
    }
  }

  // Find a restaurant by ID
  async getRestaurant(id: number): Promise<(RestaurantAuth & { profile?: RestaurantProfile, branches: RestaurantBranch[] }) | undefined> {
    try {
      const [restaurantData] = await db.select()
        .from(restaurantAuth)
        .where(eq(restaurantAuth.id, id))
        .leftJoin(restaurantProfiles, eq(restaurantAuth.id, restaurantProfiles.restaurantId));

      if (!restaurantData?.restaurant_auth) {
        console.log("No restaurant found for id:", id);
        return undefined;
      }

      // Get the restaurant's branches
      const branches = await db
        .select()
        .from(restaurantBranches)
        .where(eq(restaurantBranches.restaurantId, id));

      console.log("Found branches for restaurant:", id, branches);

      return {
        ...restaurantData.restaurant_auth,
        profile: restaurantData.restaurant_profiles || undefined,
        branches
      };
    } catch (error) {
      console.error("Error in getRestaurant:", error);
      throw error;
    }
  }

  // Get all branches of a restaurant
  async getRestaurantBranches(restaurantId: number): Promise<RestaurantBranch[]> {
    try {
      // Find the restaurant by ID
      const [restaurant] = await db
        .select()
        .from(restaurantAuth)
        .where(eq(restaurantAuth.id, restaurantId));

      // If no restaurant found, throw an error
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      // Get the restaurant's branches
      const branches = await db
        .select()
        .from(restaurantBranches)
        .where(eq(restaurantBranches.restaurantId, restaurantId));

      console.log('Fetched branches from database:', branches);

      // Map the branches to the desired format
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

  // Create a new booking
  async createBooking(booking: Omit<ExtendedBooking, "id" | "confirmed">): Promise<ExtendedBooking> {
    try {
      console.log('Creating booking:', booking);
      const date = booking.date instanceof Date ? booking.date : new Date(booking.date);

      // Find the branch by ID
      const [branch] = await db
        .select()
        .from(restaurantBranches)
        .where(eq(restaurantBranches.id, booking.branchId));

      // If no branch found, throw an error
      if (!branch) {
        throw new Error('Branch not found');
      }

      console.log('Inserting booking with values:', {
        ...booking,
        date,
        confirmed: true
      });

      // Create the booking
      const [newBooking] = await db
        .insert(bookings)
        .values({
          ...booking,
          date,
          confirmed: true
        })
        .returning();

      console.log('Created booking:', newBooking);
      return newBooking;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  // Get all bookings for a user
  async getUserBookings(userId: number): Promise<ExtendedBooking[]> {
    try {
      console.log('Fetching bookings for user:', userId);
      
      // Get the bookings with restaurant information
      const bookingsWithRestaurants = await db
        .select({
          id: bookings.id,
          userId: bookings.userId,
          branchId: bookings.branchId,
          date: bookings.date,
          partySize: bookings.partySize,
          confirmed: bookings.confirmed,
          arrived: bookings.arrived,
          arrivedAt: bookings.arrivedAt,
          completed: bookings.completed,
          restaurantName: restaurantAuth.name,
          restaurantId: restaurantAuth.id,
          branchRestaurantId: restaurantBranches.restaurantId
        })
        .from(bookings)
        .innerJoin(restaurantBranches, eq(bookings.branchId, restaurantBranches.id))
        .innerJoin(restaurantAuth, eq(restaurantBranches.restaurantId, restaurantAuth.id))
        .where(eq(bookings.userId, userId));

      console.log('Found bookings with restaurants:', bookingsWithRestaurants);
      return bookingsWithRestaurants;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  }

  // Get all bookings for a restaurant
  async getRestaurantBookings(restaurantId: number): Promise<ExtendedBooking[]> {
    try {
      console.log(`Fetching bookings for restaurant ${restaurantId}`);

      // Find the restaurant by ID
      const [restaurant] = await db
        .select()
        .from(restaurantAuth)
        .where(eq(restaurantAuth.id, restaurantId));

      // If no restaurant found, throw an error
      if (!restaurant) {
        throw new Error(`Restaurant ${restaurantId} not found`);
      }

      // Get the bookings with user and branch information
      const bookingsWithDetails = await db
        .select({
          id: bookings.id,
          userId: bookings.userId,
          branchId: bookings.branchId,
          date: bookings.date,
          partySize: bookings.partySize,
          confirmed: bookings.confirmed,
          arrived: bookings.arrived,
          arrivedAt: bookings.arrivedAt,
          completed: bookings.completed,
          user: {
            firstName: users.firstName,
            lastName: users.lastName,
          },
          branch: {
            address: restaurantBranches.address,
            city: restaurantBranches.city,
          }
        })
        .from(bookings)
        .innerJoin(restaurantBranches, eq(bookings.branchId, restaurantBranches.id))
        .innerJoin(users, eq(bookings.userId, users.id))
        .where(eq(restaurantBranches.restaurantId, restaurantId));

      return bookingsWithDetails;
    } catch (error) {
      console.error("Error fetching restaurant bookings:", error);
      throw error;
    }
  }

  // Create a new restaurant login
  async createRestaurantAuth(auth: InsertRestaurantAuth): Promise<RestaurantAuth> {
    const [newAuth] = await db.insert(restaurantAuth)
      .values({ ...auth, verified: false, createdAt: new Date() })
      .returning();
    return newAuth;
  }

  // Create or update a restaurant's profile
  async createRestaurantProfile(profile: InsertRestaurantProfile): Promise<void> {
    try {
      const now = new Date();
      await db.insert(restaurantProfiles).values({
        restaurantId: profile.restaurantId,
        about: profile.about,
        description: profile.about.slice(0, 100) + (profile.about.length > 100 ? '...' : ''),
        cuisine: profile.cuisine,
        priceRange: profile.priceRange,
        logo: profile.logo || "",
        isProfileComplete: true,
        createdAt: now,
        updatedAt: now
      });
    } catch (error) {
      console.error('Error creating restaurant profile:', error);
      throw error;
    }
  }

  // Get a restaurant's profile
  async getRestaurantProfile(restaurantId: number): Promise<RestaurantProfile | undefined> {
    try {
      const [profile] = await db
        .select()
        .from(restaurantProfiles)
        .where(eq(restaurantProfiles.restaurantId, restaurantId));

      return profile || undefined;
    } catch (error) {
      console.error('Error getting restaurant profile:', error);
      throw error;
    }
  }

  // Check if a restaurant's profile is complete
  async isRestaurantProfileComplete(restaurantId: number): Promise<boolean> {
    try {
      const profile = await this.getRestaurantProfile(restaurantId);
      if (!profile) return false;

      const isComplete = Boolean(
        profile.isProfileComplete &&
        profile.about &&
        profile.cuisine &&
        profile.priceRange
      );

      return isComplete;
    } catch (error) {
      console.error('Error checking restaurant profile completion:', error);
      throw error;
    }
  }

  // Search for restaurants
  async searchRestaurants(query: string, city?: string): Promise<RestaurantAuth[]> {
    const restaurants = await this.getRestaurants();
    const normalizedQuery = query.toLowerCase().trim();

    return restaurants.filter(restaurant => {
      // Filter by city if specified
      if (city) {
        const branchCities = (restaurant as any).branches?.map((b: RestaurantBranch) => b.city) || [];
        if (!branchCities.includes(city as "Alexandria" | "Cairo")) {
          return false;
        }
      }

      const matchesName = restaurant.name.toLowerCase().includes(normalizedQuery);
      const matchesCuisine = (restaurant as any).profile?.cuisine.toLowerCase().includes(normalizedQuery);
      const matchesLocation = (restaurant as any).branches?.some((branch: RestaurantBranch) => {
        const addressPart = branch.address.split(',')[0].trim().toLowerCase();
        return addressPart.includes(normalizedQuery);
      });

      return matchesName || matchesCuisine || matchesLocation;
    });
  }

  // Create a password reset token for a user
  async createPasswordResetToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
      used: false,
    });

    return token;
  }

  // Create a password reset token for a restaurant
  async createRestaurantPasswordResetToken(restaurantId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    await db.insert(restaurantPasswordResetTokens).values({
      restaurantId,
      token,
      expiresAt,
      used: false,
    });

    return token;
  }

  // Validate a password reset token for a user
  async validatePasswordResetToken(token: string): Promise<number | null> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      );

    return resetToken?.userId ?? null;
  }

  // Validate a password reset token for a restaurant
  async validateRestaurantPasswordResetToken(token: string): Promise<number | null> {
    const [resetToken] = await db
      .select()
      .from(restaurantPasswordResetTokens)
      .where(
        and(
          eq(restaurantPasswordResetTokens.token, token),
          eq(restaurantPasswordResetTokens.used, false),
          gt(restaurantPasswordResetTokens.expiresAt, new Date())
        )
      );

    return resetToken?.restaurantId ?? null;
  }

  // Mark a password reset token as used
  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  // Mark a restaurant password reset token as used
  async markRestaurantPasswordResetTokenAsUsed(token: string): Promise<void> {
    await db
      .update(restaurantPasswordResetTokens)
      .set({ used: true })
      .where(eq(restaurantPasswordResetTokens.token, token));
  }

  // Update a user's password
  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  // Update a restaurant's password
  async updateRestaurantPassword(restaurantId: number, hashedPassword: string): Promise<void> {
    await db
      .update(restaurantAuth)
      .set({ password: hashedPassword })
      .where(eq(restaurantAuth.id, restaurantId));
  }

  // Get booking details by ID
  async getBookingById(bookingId: number): Promise<ExtendedBooking | undefined> {
    const [booking] = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        branchId: bookings.branchId,
        date: bookings.date,
        partySize: bookings.partySize,
        confirmed: bookings.confirmed,
        arrived: bookings.arrived,
        arrivedAt: bookings.arrivedAt,
        completed: bookings.completed
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId));
    return booking;
  }

  // Get booking details by ID and restaurant ID
  async getBookingByIdAndRestaurant(bookingId: number, restaurantId: number): Promise<ExtendedBooking | undefined> {
    const [booking] = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        branchId: bookings.branchId,
        date: bookings.date,
        partySize: bookings.partySize,
        confirmed: bookings.confirmed,
        arrived: bookings.arrived,
        arrivedAt: bookings.arrivedAt,
        completed: bookings.completed
      })
      .from(bookings)
      .innerJoin(
        restaurantBranches,
        eq(bookings.branchId, restaurantBranches.id)
      )
      .where(
        and(
          eq(bookings.id, bookingId),
          eq(restaurantBranches.restaurantId, restaurantId)
        )
      );
    return booking;
  }

  // Get booking details by ID and user ID
  async getBookingByIdAndUser(bookingId: number, userId: number): Promise<ExtendedBooking | undefined> {
    const [booking] = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        branchId: bookings.branchId,
        date: bookings.date,
        partySize: bookings.partySize,
        confirmed: bookings.confirmed,
        arrived: bookings.arrived,
        arrivedAt: bookings.arrivedAt,
        completed: bookings.completed
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.id, bookingId),
          eq(bookings.userId, userId)
        )
      );
    return booking;
  }

  // Mark booking as arrived
  async markBookingArrived(bookingId: number, arrivedAt: Date): Promise<ExtendedBooking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({
        arrived: true,
        arrivedAt
      })
      .where(eq(bookings.id, bookingId))
      .returning();
    return booking;
  }

  // Mark booking as complete
  async markBookingComplete(bookingId: number): Promise<ExtendedBooking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({
        completed: true
      })
      .where(eq(bookings.id, bookingId))
      .returning();
    return booking;
  }

  // Cancel booking
  async cancelBooking(bookingId: number): Promise<ExtendedBooking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({
        confirmed: false
      })
      .where(eq(bookings.id, bookingId))
      .returning();
    return booking;
  }

  /**
   * Get branch details by ID and restaurant ID
   */
  async getBranchById(branchId: number, restaurantId: number): Promise<RestaurantBranch | undefined> {
    const [branch] = await db
      .select()
      .from(restaurantBranches)
      .where(
        and(
          eq(restaurantBranches.id, branchId),
          eq(restaurantBranches.restaurantId, restaurantId)
        )
      );
    return branch;
  }

  /**
   * Get branch availability for a specific date
   */
  async getBranchAvailability(branchId: number, date: Date): Promise<{ tablesCount: number, bookingsCount: number } | undefined> {
    const [branch] = await db
      .select({
        tablesCount: restaurantBranches.tablesCount,
        bookingsCount: sql<number>`count(${bookings.id})`
      })
      .from(restaurantBranches)
      .leftJoin(
        bookings,
        and(
          eq(bookings.branchId, restaurantBranches.id),
          eq(sql`DATE(${bookings.date})`, sql`DATE(${date})`)
        )
      )
      .where(eq(restaurantBranches.id, branchId))
      .groupBy(restaurantBranches.id);
    return branch;
  }

  /**
   * Check if a restaurant branch is saved by a user
   */
  async isRestaurantSaved(userId: number, restaurantId: number, branchIndex: number): Promise<boolean> {
    const [saved] = await db
      .select()
      .from(savedRestaurants)
      .where(
        and(
          eq(savedRestaurants.userId, userId),
          eq(savedRestaurants.restaurantId, restaurantId),
          eq(savedRestaurants.branchIndex, branchIndex)
        )
      );
    return !!saved;
  }

  /**
   * Remove a restaurant from user's saved list
   */
  async removeSavedRestaurant(userId: number, restaurantId: number, branchIndex: number): Promise<boolean> {
    const result = await db
      .delete(savedRestaurants)
      .where(
        and(
          eq(savedRestaurants.userId, userId),
          eq(savedRestaurants.restaurantId, restaurantId),
          eq(savedRestaurants.branchIndex, branchIndex)
        )
      )
      .returning();
    return result.length > 0;
  }

  /**
   * Get detailed restaurant data for saved restaurants
   */
  async getDetailedRestaurantData(restaurantId: number): Promise<RestaurantAuth & { profile?: RestaurantProfile } | undefined> {
    const [restaurantData] = await db
      .select({
        id: restaurantAuth.id,
        email: restaurantAuth.email,
        name: restaurantAuth.name,
        about: restaurantProfiles.about,
        description: restaurantProfiles.description,
        cuisine: restaurantProfiles.cuisine,
        priceRange: restaurantProfiles.priceRange,
        logo: restaurantProfiles.logo,
        isProfileComplete: restaurantProfiles.isProfileComplete,
        createdAt: restaurantProfiles.createdAt,
        updatedAt: restaurantProfiles.updatedAt
      })
      .from(restaurantAuth)
      .leftJoin(restaurantProfiles, eq(restaurantAuth.id, restaurantProfiles.restaurantId))
      .where(eq(restaurantAuth.id, restaurantId));

    if (!restaurantData) return undefined;

    const { about, description, cuisine, priceRange, logo, isProfileComplete, createdAt: profileCreatedAt, updatedAt, ...auth } = restaurantData;

    const now = new Date();
    return {
      ...auth,
      password: "",  // We don't want to expose the password
      verified: false,  // Default to false if not present
      createdAt: now,  // Use current date since auth.createdAt doesn't exist
      profile: {
        id: restaurantId,
        restaurantId,
        about: about || "",
        description: description || "",
        cuisine: cuisine || "",
        priceRange: priceRange || "$",
        logo: logo || "",
        isProfileComplete: isProfileComplete || false,
        createdAt: profileCreatedAt || now,
        updatedAt: updatedAt || now
      }
    };
  }
}

// Create a new instance of the DatabaseStorage class
export const storage = new DatabaseStorage();