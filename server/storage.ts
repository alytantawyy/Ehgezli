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
  getBranchAvailability(branchId: number, date: Date): Promise<Record<string, number>>;
  isRestaurantSaved(userId: number, restaurantId: number, branchIndex: number): Promise<boolean>;
  removeSavedRestaurant(userId: number, restaurantId: number, branchIndex: number): Promise<boolean>;
  getDetailedRestaurantData(restaurantId: number): Promise<RestaurantAuth & { profile?: RestaurantProfile } | undefined>;

  // Find restaurants with their closest available time slots
  findRestaurantsWithAvailability(
    date: Date,
    requestedTime: string,
    partySize: number,
    filters: { city?: string; cuisine?: string; priceRange?: string }
  ): Promise<(RestaurantAuth & { 
    profile?: RestaurantProfile;
    branches: (RestaurantBranch & { 
      availableSlots: Array<{ time: string; seats: number }> 
    })[];
  })[]>;
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
      
      if (filters?.city && filters.city !== 'all') {
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
      console.log('[Debug] getRestaurant called with id:', id);
      
      const [restaurantData] = await db.select({
        auth: restaurantAuth,
        profile: restaurantProfiles
      })
        .from(restaurantAuth)
        .where(eq(restaurantAuth.id, id))
        .leftJoin(restaurantProfiles, eq(restaurantAuth.id, restaurantProfiles.restaurantId));

      console.log('[Debug] Query result:', restaurantData);

      if (!restaurantData?.auth) {
        console.log('[Debug] No restaurant found');
        return undefined;
      }

      // Get the restaurant's branches
      const branches = await db
        .select()
        .from(restaurantBranches)
        .where(eq(restaurantBranches.restaurantId, id));

      console.log('[Debug] Found branches:', branches);

      // Return properly structured data
      const result = {
        ...restaurantData.auth,
        profile: restaurantData.profile || undefined,
        branches
      };
      
      console.log('[Debug] Returning result:', result);
      return result;
    } catch (error) {
      console.error("[Debug] Error in getRestaurant:", error);
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
  async getBranchAvailability(branchId: number, date: Date): Promise<Record<string, number>> {
    // First get the branch details
    const [branch] = await db
      .select()
      .from(restaurantBranches)
      .where(eq(restaurantBranches.id, branchId));

    if (!branch) return {};

    // Get all bookings for this date
    const branchBookings = await db
      .select({
        time: sql<string>`DATE_TRUNC('minute', ${bookings.date})::time::text`,
        totalBooked: sql<number>`SUM(${bookings.partySize})`
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.branchId, branchId),
          eq(sql`DATE(${bookings.date})`, sql`DATE(${sql.param(date)})`)
        )
      )
      .groupBy(sql`DATE_TRUNC('minute', ${bookings.date})`);

    // Create a map of time slots to booked seats
    const bookedSeats = new Map<string, number>();
    branchBookings.forEach(booking => {
      bookedSeats.set(booking.time, booking.totalBooked);
    });

    // Generate time slots from opening to closing time
    const timeSlots: Record<string, number> = {};
    const [openHour, openMinute] = branch.openingTime.split(':').map(Number);
    const [closeHour, closeMinute] = branch.closingTime.split(':').map(Number);
    
    // Convert opening and closing times to minutes for easier comparison
    const openingMinutes = openHour * 60 + openMinute;
    // Adjust closing minutes for times after midnight
    const closingMinutes = (closeHour < openHour ? closeHour + 24 : closeHour) * 60 + closeMinute;
    
    // Generate slots every 30 minutes
    for (let minutes = openingMinutes; minutes <= closingMinutes - 30; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const bookedSeatsForSlot = bookedSeats.get(time) || 0;
      const availableSeats = Math.max(0, branch.seatsCount - bookedSeatsForSlot);
      timeSlots[time] = availableSeats;
    }

    return timeSlots;
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

  /**
   * Find restaurants with their closest available time slots
   */
  async findRestaurantsWithAvailability(
    date: Date,
    requestedTime: string,
    partySize: number,
    filters: { city?: string; cuisine?: string; priceRange?: string }
  ): Promise<(RestaurantAuth & { 
    profile?: RestaurantProfile;
    branches: (RestaurantBranch & { 
      availableSlots: Array<{ time: string; seats: number }> 
    })[];
  })[]> {
    console.log('DEBUG: Starting search with params:', {
      date: date.toISOString(),
      requestedTime,
      partySize,
      filters
    });

    // Get all restaurants matching filters
    const restaurants = await this.getRestaurants(filters);
    
    // Get initial restaurant data with profiles
    const initialRestaurants = await Promise.all(
      restaurants.map(async restaurant => ({
        ...restaurant,
        profile: await this.getRestaurantProfile(restaurant.id)
      }))
    );

    console.log('DEBUG: Initial restaurants:', initialRestaurants.map(r => ({
      id: r.id,
      name: r.name,
      priceRange: r.profile?.priceRange
    })));
    
    // For each restaurant, get branch availability
    const restaurantsWithSlots = await Promise.all(
      initialRestaurants.map(async (restaurant) => {
        console.log(`DEBUG: Processing restaurant ${restaurant.id} (${restaurant.name})`);
        
        const branches = await this.getRestaurantBranches(restaurant.id);
        
        console.log(`DEBUG: Restaurant ${restaurant.id} data:`, {
          branches: branches.map(b => ({
            id: b.id,
            city: b.city,
            seatsCount: b.seatsCount,
            openingTime: b.openingTime,
            closingTime: b.closingTime
          })),
          profile: restaurant.profile ? {
            cuisine: restaurant.profile.cuisine,
            priceRange: restaurant.profile.priceRange
          } : null
        });
        
        // Get availability for each branch
        const branchesWithSlots = await Promise.all(
          branches.map(async (branch) => {
            console.log('----------------------------------------');
            console.log(`DEBUG: Starting availability check for Restaurant ${restaurant.id}, Branch ${branch.id}`);
            console.log('Branch details:', {
              openingTime: branch.openingTime,
              closingTime: branch.closingTime,
              seatsCount: branch.seatsCount
            });
            console.log('Request details:', {
              date,
              requestedTime,
              partySize
            });
            
            // Get all bookings for this date and time
            const branchBookings = await db
              .select({
                time: sql<string>`DATE_TRUNC('minute', ${bookings.date})::time::text`,
                totalBooked: sql<number>`SUM(${bookings.partySize})`
              })
              .from(bookings)
              .where(
                and(
                  eq(bookings.branchId, branch.id),
                  eq(sql`DATE(${bookings.date})`, sql`DATE(${sql.param(date)})`),
                  eq(sql`DATE_TRUNC('minute', ${bookings.date})::time::text`, sql.param(requestedTime))
                )
              )
              .groupBy(sql`DATE_TRUNC('minute', ${bookings.date})`);

            console.log('SQL Query results:', {
              bookings: branchBookings,
              sql: sql`
                SELECT DATE_TRUNC('minute', "date")::time::text as time,
                       SUM(party_size) as total_booked
                FROM bookings
                WHERE branch_id = ${branch.id}
                  AND DATE("date") = DATE(${date})
                  AND DATE_TRUNC('minute', "date")::time::text = ${requestedTime}
                GROUP BY DATE_TRUNC('minute', "date")
              `.toString()
            });

            console.log(`DEBUG: Branch ${branch.id} bookings:`, branchBookings);

            // Calculate available seats
            const totalBooked = branchBookings[0]?.totalBooked || 0;
            const availableSeats = Math.max(0, branch.seatsCount - totalBooked);
            
            // Convert times to minutes for comparison
            const [openHour, openMinute] = branch.openingTime.split(':').map(Number);
            const [closeHour, closeMinute] = branch.closingTime.split(':').map(Number);
            const [requestHour, requestMinute] = requestedTime.split(':').map(Number);
            
            const openingMinutes = openHour * 60 + openMinute;
            const closingMinutes = (closeHour < openHour ? closeHour + 24 : closeHour) * 60 + closeMinute;
            const requestedMinutes = (requestHour < openHour ? requestHour + 24 : requestHour) * 60 + requestMinute;
            
            const isWithinHours = requestedMinutes >= openingMinutes && requestedMinutes <= closingMinutes - 30;
            const hasEnoughSeats = availableSeats >= partySize;
            
            console.log(`DEBUG: Branch ${branch.id} availability check:`, {
              openingTime: branch.openingTime,
              closingTime: branch.closingTime,
              requestedTime,
              seatsCount: branch.seatsCount,
              totalBooked,
              availableSeats,
              partySize,
              isWithinHours,
              hasEnoughSeats,
              openingMinutes,
              closingMinutes,
              requestedMinutes
            });

            // Check if the requested time is within operating hours and has enough seats
            if (isWithinHours && hasEnoughSeats) {
              return {
                ...branch,
                availableSlots: [{ time: requestedTime, seats: availableSeats }]
              };
            }

            // No availability at the requested time
            return {
              ...branch,
              availableSlots: []
            };
          })
        );

        // Filter out branches with no availability
        const availableBranches = branchesWithSlots.filter(b => b.availableSlots.length > 0);
        console.log(`DEBUG: Restaurant ${restaurant.id} has ${availableBranches.length} available branches`);

        return {
          ...restaurant,
          branches: branchesWithSlots
        };
      })
    );

    // Only return restaurants that have at least one branch with availability
    const availableRestaurants = restaurantsWithSlots.filter(r => 
      r.branches.some(b => b.availableSlots.length > 0)
    );

    console.log('DEBUG: Final available restaurants:', availableRestaurants.map(r => ({
      id: r.id,
      name: r.name,
      availableBranches: r.branches.filter(b => b.availableSlots.length > 0).length
    })));

    return availableRestaurants;
  }
}

// Create a new instance of the DatabaseStorage class
export const storage = new DatabaseStorage();