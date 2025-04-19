// // ==================== Imports and Setup ====================
// // Import all the types and database tables we need
// // These come from our shared schema file that both client and server use
// import {  
//   InsertUser, User, RestaurantBranch, RestaurantUser, InsertRestaurantUser,
//   restaurantProfiles, restaurantBranches, bookings, users,
//   restaurantUsers, RestaurantProfile, ExtendedBooking, 
//   savedBranches, userPasswordResetTokens, restaurantPasswordResetTokens, 
//   InsertRestaurantProfile
// } from "server/db/schema";

// // Import our database connection
// import { db, pool } from "./db/db";

// // Import helper functions from Drizzle ORM for writing SQL queries
// import { eq, and, gt, sql, or, ilike, exists, type SQL, inArray } from "drizzle-orm";

// import * as crypto from 'crypto';  // For generating secure tokens

// // Define an interface that describes all the database operations our app can do
// // This is like a contract that says "here are all the things we can do with our data"
// export interface IStorage {
//   // User operations
//   getUser(id: number): Promise<User | undefined>;  // Find a user by their ID
//   getUserByEmail(email: string): Promise<User | undefined>;  // Find a user by their email
//   createUser(user: InsertUser): Promise<User>;  // Create a new user
//   getUserById(id: number): Promise<User | undefined>;  // Get a user by their ID
//   updateUserProfile(userId: number, profileData: { 
//     firstName: string; 
//     lastName: string; 
//     city: string; 
//     gender: string; 
//     favoriteCuisines: string[] 
//   }): Promise<void>;  // Update a user's profile information

//   // Restaurant operations
//   getRestaurants(filters?: { 
//     search?: string;
//     city?: string;
//     cuisine?: string;
//     priceRange?: string;
//   }): Promise<RestaurantUser[]>;  // Get all restaurants
//   getRestaurant(id: number): Promise<(RestaurantUser & { profile?: RestaurantProfile, branches: RestaurantBranch[] }) | undefined>;  // Find a restaurant by ID
//   getRestaurantBranches(restaurantId: number): Promise<RestaurantBranch[]>;  // Get all branches of a restaurant

//   // Booking operations
//   createBooking(booking: Omit<ExtendedBooking, "id" | "confirmed">): Promise<ExtendedBooking>;  // Create a new booking
//   getUserBookings(userId: number): Promise<ExtendedBooking[]>;  // Get all bookings for a user
//   getRestaurantBookings(restaurantId: number): Promise<ExtendedBooking[]>;  // Get all bookings for a restaurant
//   getBookingById(bookingId: number): Promise<ExtendedBooking | undefined>;  // Get booking by ID
//   getBookingByIdAndRestaurant(bookingId: number, restaurantId: number): Promise<ExtendedBooking | undefined>;  // Get booking by ID and restaurant ID
//   getBookingByIdAndUser(bookingId: number, userId: number): Promise<ExtendedBooking | undefined>;  // Get booking by ID and user ID
//   markBookingArrived(bookingId: number, arrivedAt: Date): Promise<ExtendedBooking | undefined>;  // Mark booking as arrived
//   markBookingComplete(bookingId: number): Promise<ExtendedBooking | undefined>;  // Mark booking as complete
//   cancelBooking(bookingId: number): Promise<ExtendedBooking | undefined>;  // Cancel booking
//   updateBooking(bookingId: number, data: {
//     date?: Date;
//     time?: string;
//     partySize?: number;
//   }): Promise<ExtendedBooking | undefined>;

//   // Restaurant authentication operations
//   getRestaurantUser(id: number): Promise<RestaurantUser | undefined>;  // Get restaurant login info by ID
//   getRestaurantUserByEmail(email: string): Promise<RestaurantUser | undefined>;  // Get restaurant login info by email
//   createRestaurantUser(auth: InsertRestaurantUser): Promise<RestaurantUser>;  // Create new restaurant login
//   createRestaurantProfile(profile: InsertRestaurantProfile): Promise<void>;  // Create restaurant profile


//   // Additional restaurant operations
//   searchRestaurants(query: string, city?: string): Promise<RestaurantUser[]>;  // Search for restaurants
//   isRestaurantProfileComplete(restaurantId: number): Promise<boolean>;  // Check if profile is complete

//   // Password reset operations for users
//   createPasswordResetToken(userId: number): Promise<string>;  // Create reset token
//   validatePasswordResetToken(token: string): Promise<number | null>;  // Check if token is valid
//   markPasswordResetTokenAsUsed(token: string): Promise<void>;  // Mark token as used
//   updateUserPassword(userId: number, hashedPassword: string): Promise<void>;  // Update password

//   // Password reset operations for restaurants
//   createRestaurantPasswordResetToken(restaurantId: number): Promise<string>;
//   validateRestaurantPasswordResetToken(token: string): Promise<number | null>;
//   markRestaurantPasswordResetTokenAsUsed(token: string): Promise<void>;
//   updateRestaurantPassword(restaurantId: number, hashedPassword: string): Promise<void>;

//   // Branch operations
//   getBranchById(branchId: number, restaurantId: number): Promise<RestaurantBranch | undefined>;
//   getBranchAvailability(branchId: number, date: Date): Promise<Record<string, number>>;
//   isRestaurantSaved(userId: number, restaurantId: number, branchIndex: number): Promise<boolean>;
//   removeSavedRestaurant(userId: number, restaurantId: number, branchIndex: number): Promise<boolean>;
//   getDetailedRestaurantData(restaurantId: number): Promise<RestaurantUser & { profile?: RestaurantProfile } | undefined>;

//   // Saved restaurant operations
//   saveRestaurant(userId: number, restaurantId: number, branchIndex: number): Promise<boolean>;
//   getsavedBranches(userId: number): Promise<any[]>;

//   // Find restaurants with their closest available time slots
//   findRestaurantsWithAvailability(
//     date?: Date,
//     partySize?: number,
//     filters?: { 
//       city?: string; 
//       cuisine?: string; 
//       priceRange?: string; 
//       search?: string;
//     },
//     requestedTime?: string
//   ): Promise<(RestaurantUser & { 
//     profile?: RestaurantProfile;
//     branches: (RestaurantBranch & { 
//       availableSlots: Array<{ time: string; seats: number }> 
//     })[];
//   })[]>;

//   // Get a user by their ID
//   getUserById(id: number): Promise<User | undefined>;

//   // Update a user's profile information
//   updateUserProfile(userId: number, profileData: { 
//     firstName: string; 
//     lastName: string; 
//     city: string; 
//     gender: string; 
//     favoriteCuisines: string[] 
//   }): Promise<void>;

//   // Update a user's location information
//   updateUserLocation(userId: number, locationData: {
//     lastLatitude: string;
//     lastLongitude: string;
//     locationUpdatedAt: Date;
//     locationPermissionGranted: boolean;
//   }): Promise<void>;
// }

// // This class implements all the database operations defined in IStorage
// export class DatabaseStorage implements IStorage {

//   // Constructor - initialize database connections
//   constructor() {
//     // Session store has been removed as we've migrated to token-based authentication
//   }


//   // ==================== User Operations ====================
//   // - getUser, getUserByEmail, createUser, getUserById, updateUserProfile, updateUserLocation
//   async getUser(id: number): Promise<User | undefined> {
//     // Simple SELECT query to find a user by ID
//     const [user] = await db.select().from(users).where(eq(users.id, id));
//     return user;
//   }

//   async getUserByEmail(email: string): Promise<User | undefined> {
//     try {
//       console.log(`Looking up user with email: ${email}`);
//       // Select all fields explicitly to ensure we get the password
//       const [user] = await db.select({
//         id: users.id,
//         firstName: users.firstName,
//         lastName: users.lastName,
//         email: users.email,
//         password: users.password,
//         gender: users.gender,
//         birthday: users.birthday,
//         city: users.city,
//         favoriteCuisines: users.favoriteCuisines,
//         lastLatitude: users.lastLatitude,
//         lastLongitude: users.lastLongitude,
//         locationUpdatedAt: users.locationUpdatedAt,
//         locationPermissionGranted: users.locationPermissionGranted,
//         createdAt: users.createdAt,
//         updatedAt: users.updatedAt
//       }).from(users).where(eq(users.email, email));
      
//       if (!user) {
//         console.log(`No user found with email: ${email}`);
//         return undefined;
//       }
      
//       console.log(`Found user: ${user.id}, password exists: ${Boolean(user.password)}`);
//       return user;
//     } catch (error) {
//       console.error('Error in getUserByEmail:', error);
//       throw error;
//     }
//   }

//   async createUser(insertUser: InsertUser): Promise<User> {
//     // Convert the birthday string to a Date object
//     const userWithDateBirthday = {
//       ...insertUser,
//       birthday: new Date(insertUser.birthday),
//     };

//     // INSERT INTO users ... RETURNING *
//     const [user] = await db.insert(users).values(userWithDateBirthday).returning();
//     return user;
//   }

//   async getUserById(id: number): Promise<User | undefined> {
//     try {
//       console.log(`Looking up user with ID: ${id}`);
      
//       const user = await db.select({
//         id: users.id,
//         firstName: users.firstName,
//         lastName: users.lastName,
//         email: users.email,
//         password: users.password,
//         gender: users.gender,
//         birthday: users.birthday,
//         city: users.city,
//         favoriteCuisines: users.favoriteCuisines,
//         lastLatitude: users.lastLatitude,
//         lastLongitude: users.lastLongitude,
//         locationUpdatedAt: users.locationUpdatedAt,
//         locationPermissionGranted: users.locationPermissionGranted,
//         createdAt: users.createdAt,
//         updatedAt: users.updatedAt
//       }).from(users).where(eq(users.id, id));
      
//       if (!user || user.length === 0) {
//         console.log(`No user found with ID: ${id}`);
//         return undefined;
//       }
      
//       console.log(`Found user: ${user[0].id}`);
//       return user[0];
//     } catch (error) {
//       console.error('Error in getUserById:', error);
//       throw error;
//     }
//   }

//   async updateUserProfile(userId: number, profileData: { 
//     firstName: string; 
//     lastName: string; 
//     city: string; 
//     gender: string; 
//     favoriteCuisines: string[] 
//   }): Promise<void> {
//     try {
//       console.log('Storage: Updating user profile in database:', {
//         userId,
//         profileData
//       });
      
//       await db.update(users).set({
//         firstName: profileData.firstName,
//         lastName: profileData.lastName,
//         city: profileData.city,
//         gender: profileData.gender,
//         favoriteCuisines: profileData.favoriteCuisines,
//         updatedAt: new Date(),
//       }).where(eq(users.id, userId));
      
//       // Verify the update by fetching the updated user
//       const updatedUser = await db.query.users.findFirst({
//         where: eq(users.id, userId),
//       });
      
//       console.log('Storage: User profile after update:', updatedUser);
//     } catch (error) {
//       console.error("Error updating user profile:", error);
//       throw error;
//     }
//   }

//   async updateUserLocation(userId: number, locationData: {
//     lastLatitude: string;
//     lastLongitude: string;
//     locationUpdatedAt: Date;
//     locationPermissionGranted: boolean;
//   }): Promise<void> {
//     try {
//       await db.update(users)
//         .set({
//           lastLatitude: locationData.lastLatitude,
//           lastLongitude: locationData.lastLongitude,
//           locationUpdatedAt: locationData.locationUpdatedAt,
//           locationPermissionGranted: locationData.locationPermissionGranted
//         })
//         .where(eq(users.id, userId));
      
//       console.log(`Updated location for user ${userId}`);
//     } catch (error) {
//       console.error('Error updating user location:', error);
//       throw new Error('Failed to update user location');
//     }
//   }

//   // ==================== Restaurant User Operations ====================
//   // - getRestaurantUser, getRestaurantUserByEmail, createRestaurantUser
//   async getRestaurantUserByEmail(email: string): Promise<RestaurantUser | undefined> {
//     try {
//       console.log(`Looking up restaurant with email: ${email}`);
//       // Select all fields explicitly to ensure we get the password
//       const [auth] = await db.select({
//         id: restaurantUsers.id,
//         email: restaurantUsers.email,
//         password: restaurantUsers.password,
//         name: restaurantUsers.name,
//         verified: restaurantUsers.verified,
//         createdAt: restaurantUsers.createdAt,
//         updatedAt: restaurantUsers.updatedAt
//       }).from(restaurantUsers).where(eq(restaurantUsers.email, email));
      
//       if (!auth) {
//         console.log(`No restaurant found with email: ${email}`);
//         return undefined;
//       }
      
//       console.log(`Found restaurant: ${auth.id}, password exists: ${Boolean(auth.password)}`);
//       return auth;
//     } catch (error) {
//       console.error('Error in getRestaurantUserByEmail:', error);
//       throw error;
//     }
//   }

//   async getRestaurantUser(id: number): Promise<RestaurantUser | undefined> {
//     try {
//       // Similar to getRestaurantUserByEmail but searches by ID instead
//       const [auth] = await db
//         .select()
//         .from(restaurantUsers)
//         .where(eq(restaurantUsers.id, id));
//       return auth;
//     } catch (error) {
//       console.error('Error getting restaurant by id:', error);
//       return undefined;
//     }
//   }

//   async createRestaurantUser(auth: InsertRestaurantUser): Promise<RestaurantUser> {
//     const [newAuth] = await db.insert(restaurantUsers)
//       .values({ ...auth, verified: false, createdAt: new Date() })
//       .returning();
//     return newAuth;
//   }

//   // ==================== Restaurant Profile Operations ====================
//   // - createRestaurantProfile, getRestaurantProfile, isRestaurantProfileComplete
//   async createRestaurantProfile(profile: InsertRestaurantProfile): Promise<void> {
//     try {
//       const now = new Date();
//       await db.insert(restaurantProfiles).values({
//         restaurantId: profile.restaurantId,
//         about: profile.about,
//         description: profile.about.slice(0, 100) + (profile.about.length > 100 ? '...' : ''),
//         cuisine: profile.cuisine,
//         priceRange: profile.priceRange,
//         logo: profile.logo || "",
//         isProfileComplete: true,
//         createdAt: now,
//         updatedAt: now
//       });
//     } catch (error) {
//       console.error('Error creating restaurant profile:', error);
//       throw error;
//     }
//   }

//   async getRestaurantProfile(restaurantId: number): Promise<RestaurantProfile | undefined> {
//     try {
//       const [profile] = await db
//         .select()
//         .from(restaurantProfiles)
//         .where(eq(restaurantProfiles.restaurantId, restaurantId));

//       return profile || undefined;
//     } catch (error) {
//       console.error('Error getting restaurant profile:', error);
//       throw error;
//     }
//   }

//   async isRestaurantProfileComplete(restaurantId: number): Promise<boolean> {
//     try {
//       const profile = await this.getRestaurantProfile(restaurantId);
//       if (!profile) return false;

//       const isComplete = Boolean(
//         profile.isProfileComplete &&
//         profile.about &&
//         profile.cuisine &&
//         profile.priceRange
//       );

//       return isComplete;
//     } catch (error) {
//       console.error('Error checking restaurant profile completion:', error);
//       throw error;
//     }
//   }

//   // ==================== Restaurant Branch Operations ====================
//   // - getRestaurantBranches, getBranchById, getBranchAvailability
//   async getRestaurantBranches(restaurantId: number): Promise<RestaurantBranch[]> {
//     try {
//       // Find the restaurant by ID
//       const [restaurant] = await db
//         .select()
//         .from(restaurantUsers)
//         .where(eq(restaurantUsers.id, restaurantId));

//       // If no restaurant found, throw an error
//       if (!restaurant) {
//         throw new Error('Restaurant not found');
//       }

//       // Get the restaurant's branches
//       const branches = await db
//         .select({
//           id: restaurantBranches.id,
//           restaurantId: restaurantBranches.restaurantId,
//           address: restaurantBranches.address,
//           city: restaurantBranches.city,
//           tablesCount: restaurantBranches.tablesCount,
//           seatsCount: restaurantBranches.seatsCount,
//           openingTime: restaurantBranches.openingTime,
//           closingTime: restaurantBranches.closingTime,
//           reservationDuration: restaurantBranches.reservationDuration,
//           latitude: restaurantBranches.latitude,
//           longitude: restaurantBranches.longitude
//         })
//         .from(restaurantBranches)
//         .where(eq(restaurantBranches.restaurantId, restaurantId));

//       console.log('Fetched branches from database:', branches);

//       // Map the branches to the desired format
//       return branches.map(branch => ({
//         id: branch.id,
//         restaurantId: branch.restaurantId,
//         address: branch.address,
//         city: branch.city as "Alexandria" | "Cairo",
//         tablesCount: branch.tablesCount,
//         seatsCount: branch.seatsCount,
//         openingTime: branch.openingTime,
//         closingTime: branch.closingTime,
//         reservationDuration: branch.reservationDuration || 120,
//         latitude: branch.latitude,
//         longitude: branch.longitude
//       }));
//     } catch (error) {
//       console.error('Error fetching restaurant branches:', error);
//       throw new Error('Failed to fetch restaurant branches');
//     }
//   }

//   async getBranchById(branchId: number, restaurantId: number): Promise<RestaurantBranch | undefined> {
//     const [branch] = await db
//       .select()
//       .from(restaurantBranches)
//       .where(
//         and(
//           eq(restaurantBranches.id, branchId),
//           eq(restaurantBranches.restaurantId, restaurantId)
//         )
//       );
//     return branch;
//   }

//   async getBranchAvailability(branchId: number, date: Date): Promise<Record<string, number>> {
//     // First get the branch details
//     const [branch] = await db
//       .select()
//       .from(restaurantBranches)
//       .where(eq(restaurantBranches.id, branchId));

//     if (!branch) return {};

//     // Get all bookings for this date
//     const branchBookings = await db
//       .select({
//         time: sql<string>`DATE_TRUNC('minute', ${bookings.date})::time::text`,
//         totalBooked: sql<number>`SUM(${bookings.partySize})`
//       })
//       .from(bookings)
//       .where(
//         and(
//           eq(bookings.branchId, branchId),
//           eq(sql`DATE(${bookings.date})`, sql`DATE(${sql.param(date)})`)
//         )
//       )
//       .groupBy(sql`DATE_TRUNC('minute', ${bookings.date})`);

//     // Create a map of time slots to booked seats
//     const bookedSeats = new Map<string, number>();
//     branchBookings.forEach(booking => {
//       bookedSeats.set(booking.time, booking.totalBooked);
//     });

//     // Generate time slots from opening to closing time
//     const timeSlots: Record<string, number> = {};
//     const [openHour, openMinute] = branch.openingTime.split(':').map(Number);
//     const [closeHour, closeMinute] = branch.closingTime.split(':').map(Number);
    
//     // Convert opening and closing times to minutes for easier comparison
//     const openingMinutes = openHour * 60 + openMinute;
//     // Adjust closing minutes for times after midnight
//     const closingMinutes = (closeHour < openHour ? closeHour + 24 : closeHour) * 60 + closeMinute;
    
//     // Generate slots every 30 minutes
//     for (let minutes = openingMinutes; minutes <= closingMinutes - 30; minutes += 30) {
//       const hour = Math.floor(minutes / 60);
//       const minute = minutes % 60;
//       const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
//       const bookedSeatsForSlot = bookedSeats.get(time) || 0;
//       const availableSeats = Math.max(0, branch.seatsCount - bookedSeatsForSlot);
//       timeSlots[time] = availableSeats;
//     }

//     return timeSlots;
//   }

//   // ==================== Booking Operations ====================
//   // - createBooking, getUserBookings, getRestaurantBookings, getBookingById, getBookingByIdAndRestaurant, getBookingByIdAndUser, markBookingArrived, markBookingComplete, cancelBooking, updateBooking
//   async createBooking(booking: Omit<ExtendedBooking, "id" | "confirmed">): Promise<ExtendedBooking> {
//     try {
//       console.log('Creating booking:', booking);
//       const date = booking.date instanceof Date ? booking.date : new Date(booking.date);

//       // Find the branch by ID
//       const [branch] = await db
//         .select()
//         .from(restaurantBranches)
//         .where(eq(restaurantBranches.id, booking.branchId));

//       // If no branch found, throw an error
//       if (!branch) {
//         throw new Error('Branch not found');
//       }

//       console.log('Inserting booking with values:', {
//         ...booking,
//         date,
//         confirmed: true
//       });

//       // Create the booking
//       const [newBooking] = await db
//         .insert(bookings)
//         .values({
//           ...booking,
//           date,
//           confirmed: true
//         })
//         .returning();

//       console.log('Created booking:', newBooking);
//       return newBooking;
//     } catch (error) {
//       console.error('Error creating booking:', error);
//       throw error;
//     }
//   }

//   async getUserBookings(userId: number): Promise<ExtendedBooking[]> {
//     try {
//       console.log('Fetching bookings for user:', userId);
      
//       // Get the bookings with restaurant information
//       const bookingsWithRestaurants = await db
//         .select({
//           id: bookings.id,
//           userId: bookings.userId,
//           restaurantId: restaurantBranches.restaurantId,
//           restaurantName: restaurantUsers.name,
//           branchId: bookings.branchId,
//           branchCity: restaurantBranches.city,
//           branchAddress: restaurantBranches.address,
//           date: bookings.date,
//           partySize: bookings.partySize,
//           confirmed: bookings.confirmed,
//           arrived: bookings.arrived,
//           arrivedAt: bookings.arrivedAt,
//           completed: bookings.completed
//         })
//         .from(bookings)
//         .innerJoin(
//           restaurantBranches,
//           eq(bookings.branchId, restaurantBranches.id)
//         )
//         .innerJoin(
//           restaurantUsers,
//           eq(restaurantBranches.restaurantId, restaurantUsers.id)
//         )
//         .where(eq(bookings.userId, userId));

//       console.log('Found bookings with restaurants:', bookingsWithRestaurants);
//       return bookingsWithRestaurants;
//     } catch (error) {
//       console.error('Error fetching user bookings:', error);
//       throw error;
//     }
//   }

//   async getRestaurantBookings(restaurantId: number): Promise<ExtendedBooking[]> {
//     try {
//       console.log(`Fetching bookings for restaurant ${restaurantId}`);

//       // Find the restaurant by ID
//       const [restaurant] = await db
//         .select()
//         .from(restaurantUsers)
//         .where(eq(restaurantUsers.id, restaurantId));

//       // If no restaurant found, throw an error
//       if (!restaurant) {
//         throw new Error(`Restaurant ${restaurantId} not found`);
//       }

//       // Get all branches for this restaurant
//       const branches = await db
//         .select()
//         .from(restaurantBranches)
//         .where(eq(restaurantBranches.restaurantId, restaurantId));

//       if (!branches.length) {
//         console.log(`No branches found for restaurant ${restaurantId}`);
//         return [];
//       }

//       const branchIds = branches.map(branch => branch.id);
//       console.log(`Found branches for restaurant ${restaurantId}:`, branchIds);

//       // Get the bookings with user and branch information
//       const bookingsWithDetails = await db
//         .select({
//           id: bookings.id,
//           userId: bookings.userId,
//           restaurantId: restaurantBranches.restaurantId,
//           branchId: bookings.branchId,
//           date: bookings.date,
//           partySize: bookings.partySize,
//           confirmed: bookings.confirmed,
//           arrived: bookings.arrived,
//           arrivedAt: bookings.arrivedAt,
//           completed: bookings.completed,
//           user: {
//             firstName: users.firstName,
//             lastName: users.lastName,
//           },
//           branch: {
//             address: restaurantBranches.address,
//             city: restaurantBranches.city,
//           }
//         })
//         .from(bookings)
//         .innerJoin(restaurantBranches, eq(bookings.branchId, restaurantBranches.id))
//         .innerJoin(users, eq(bookings.userId, users.id))
//         .where(inArray(bookings.branchId, branchIds));

//       console.log(`Found ${bookingsWithDetails.length} bookings for restaurant ${restaurantId}`);
//       return bookingsWithDetails;
//     } catch (error) {
//       console.error("Error fetching restaurant bookings:", error);
//       throw error;
//     }
//   }

//   async getBookingById(bookingId: number): Promise<ExtendedBooking | undefined> {
//     const [booking] = await db
//       .select({
//         id: bookings.id,
//         userId: bookings.userId,
//         branchId: bookings.branchId,
//         date: bookings.date,
//         partySize: bookings.partySize,
//         confirmed: bookings.confirmed,
//         arrived: bookings.arrived,
//         arrivedAt: bookings.arrivedAt,
//         completed: bookings.completed
//       })
//       .from(bookings)
//       .where(eq(bookings.id, bookingId));
//     return booking;
//   }

//   async getBookingByIdAndRestaurant(bookingId: number, restaurantId: number): Promise<ExtendedBooking | undefined> {
//     const [booking] = await db
//       .select({
//         id: bookings.id,
//         userId: bookings.userId,
//         branchId: bookings.branchId,
//         date: bookings.date,
//         partySize: bookings.partySize,
//         confirmed: bookings.confirmed,
//         arrived: bookings.arrived,
//         arrivedAt: bookings.arrivedAt,
//         completed: bookings.completed
//       })
//       .from(bookings)
//       .innerJoin(
//         restaurantBranches,
//         eq(bookings.branchId, restaurantBranches.id)
//       )
//       .where(
//         and(
//           eq(bookings.id, bookingId),
//           eq(restaurantBranches.restaurantId, restaurantId)
//         )
//       );
//     return booking;
//   }

//   async getBookingByIdAndUser(bookingId: number, userId: number): Promise<ExtendedBooking | undefined> {
//     const [booking] = await db
//       .select({
//         id: bookings.id,
//         userId: bookings.userId,
//         branchId: bookings.branchId,
//         date: bookings.date,
//         partySize: bookings.partySize,
//         confirmed: bookings.confirmed,
//         arrived: bookings.arrived,
//         arrivedAt: bookings.arrivedAt,
//         completed: bookings.completed
//       })
//       .from(bookings)
//       .where(
//         and(
//           eq(bookings.id, bookingId),
//           eq(bookings.userId, userId)
//         )
//       );
//     return booking;
//   }

//   async markBookingArrived(bookingId: number, arrivedAt: Date): Promise<ExtendedBooking | undefined> {
//     const [booking] = await db
//       .update(bookings)
//       .set({
//         arrived: true,
//         arrivedAt
//       })
//       .where(eq(bookings.id, bookingId))
//       .returning();
//     return booking;
//   }

//   async markBookingComplete(bookingId: number): Promise<ExtendedBooking | undefined> {
//     const [booking] = await db
//       .update(bookings)
//       .set({
//         completed: true
//       })
//       .where(eq(bookings.id, bookingId))
//       .returning();
//     return booking;
//   }

//   async cancelBooking(bookingId: number): Promise<ExtendedBooking | undefined> {
//     const [booking] = await db
//       .update(bookings)
//       .set({
//         confirmed: false
//       })
//       .where(eq(bookings.id, bookingId))
//       .returning();
//     return booking;
//   }

//   async updateBooking(bookingId: number, data: {
//     date?: Date;
//     time?: string;
//     partySize?: number;
//   }): Promise<ExtendedBooking | undefined> {
//     try {
//       // Prepare update data
//       const updateData: any = {};
      
//       if (data.date) {
//         updateData.date = data.date;
//       }
      
//       if (data.time) {
//         updateData.time = data.time;
//       }
      
//       if (data.partySize) {
//         updateData.partySize = data.partySize;
//       }
      
//       // Only proceed if there's data to update
//       if (Object.keys(updateData).length === 0) {
//         const booking = await this.getBookingById(bookingId);
//         return booking;
//       }
      
//       // Update the booking
//       const [updatedBooking] = await db
//         .update(bookings)
//         .set(updateData)
//         .where(eq(bookings.id, bookingId))
//         .returning();
      
//       return updatedBooking;
//     } catch (error) {
//       console.error(`Error updating booking ${bookingId}:`, error);
//       return undefined;
//     }
//   }

//   // ==================== Saved Branches Operations ====================
//   // - saveRestaurant, getsavedBranches, isRestaurantSaved, removeSavedRestaurant, getDetailedRestaurantData
//   async saveRestaurant(userId: number, restaurantId: number, branchIndex: number): Promise<boolean> {
//     try {
//       // Check if already saved
//       const existing = await db.select()
//         .from(savedBranches)
//         .where(and(
//           eq(savedBranches.userId, userId),
//           eq(savedBranches.restaurantId, restaurantId),
//           eq(savedBranches.branchIndex, branchIndex)
//         ));

//       if (existing.length > 0) {
//         return true; // Already saved
//       }

//       // Save to database
//       await db.insert(savedBranches).values({
//         userId,
//         restaurantId,
//         branchIndex
//       });

//       return true;
//     } catch (error) {
//       console.error('Error saving restaurant:', error);
//       return false;
//     }
//   }

//   async getsavedBranches(userId: number): Promise<any[]> {
//     try {
//       // Get saved restaurants with restaurant details
//       const saved = await db.select({
//         id: savedBranches.id,
//         userId: savedBranches.userId,
//         restaurantId: savedBranches.restaurantId,
//         branchIndex: savedBranches.branchIndex,
//         createdAt: savedBranches.createdAt
//       })
//       .from(savedBranches)
//       .where(eq(savedBranches.userId, userId));

//       // Fetch restaurant details for each saved restaurant
//       const result = await Promise.all(saved.map(async (item) => {
//         const restaurant = await this.getRestaurant(item.restaurantId);
//         return {
//           ...item,
//           restaurant
//         };
//       }));

//       return result;
//     } catch (error) {
//       console.error('Error getting saved restaurants:', error);
//       return [];
//     }
//   }

//   async isRestaurantSaved(userId: number, restaurantId: number, branchIndex: number): Promise<boolean> {
//     try {
//       const result = await db.select()
//         .from(savedBranches)
//         .where(and(
//           eq(savedBranches.userId, userId),
//           eq(savedBranches.restaurantId, restaurantId),
//           eq(savedBranches.branchIndex, branchIndex)
//         ));

//       return result.length > 0;
//     } catch (error) {
//       console.error('Error checking if restaurant is saved:', error);
//       return false;
//     }
//   }

//   async removeSavedRestaurant(userId: number, restaurantId: number, branchIndex: number): Promise<boolean> {
//     try {
//       const result = await db.delete(savedBranches)
//         .where(and(
//           eq(savedBranches.userId, userId),
//           eq(savedBranches.restaurantId, restaurantId),
//           eq(savedBranches.branchIndex, branchIndex)
//         ))
//         .returning();
//       return result.length > 0;
//     } catch (error) {
//       console.error('Error removing saved restaurant:', error);
//       return false;
//     }
//   }

//   async getDetailedRestaurantData(restaurantId: number): Promise<RestaurantUser & { profile?: RestaurantProfile } | undefined> {
//     try {
//       // First, get the restaurant auth data
//       const [restaurantData] = await db
//         .select()
//         .from(restaurantUsers)
//         .leftJoin(restaurantProfiles, eq(restaurantUsers.id, restaurantProfiles.restaurantId))
//         .where(eq(restaurantUsers.id, restaurantId));

//       if (!restaurantData) {
//         return undefined;
//       }

//       // Extract profile data from the joined result
//       const auth = restaurantData.restaurant_users;
//       const profile = restaurantData.restaurant_profiles;

//       const now = new Date();
//       return {
//         id: auth.id,
//         email: auth.email,
//         password: "",  // We don't want to expose the password
//         name: auth.name,
//         verified: auth.verified,
//         createdAt: auth.createdAt,
//         updatedAt: auth.updatedAt,
//         profile: profile ? {
//           id: profile.id,
//           restaurantId: profile.restaurantId,
//           about: profile.about,
//           description: profile.description,
//           cuisine: profile.cuisine,
//           priceRange: profile.priceRange,
//           logo: profile.logo,
//           isProfileComplete: profile.isProfileComplete,
//           createdAt: profile.createdAt,
//           updatedAt: profile.updatedAt
//         } : undefined
//       };
//     } catch (error) {
//       console.error("Error getting detailed restaurant data:", error);
//       return undefined;
//     }
//   }

//   // ==================== Restaurant Search and Availability ====================
//   // - getRestaurants, searchRestaurants, findRestaurantsWithAvailability
//   async getRestaurants(filters?: { 
//     search?: string;
//     city?: string;
//     cuisine?: string;
//     priceRange?: string;
//   }): Promise<RestaurantUser[]> {
//     try {
//       const conditions: SQL<unknown>[] = [];
      
//       if (filters?.search) {
//         const searchTerm = `%${filters.search}%`;
//         const searchCondition = or(
//           // Search in restaurant name
//           ilike(restaurantUsers.name, searchTerm),
//           // Search in cuisine
//           exists(
//             db.select()
//               .from(restaurantProfiles)
//               .where(and(
//                 eq(restaurantProfiles.restaurantId, restaurantUsers.id),
//                 ilike(restaurantProfiles.cuisine, searchTerm)
//               ))
//           ),
//           // Search in branch locations
//           exists(
//             db.select()
//               .from(restaurantBranches)
//               .where(and(
//                 eq(restaurantBranches.restaurantId, restaurantUsers.id),
//                 or(
//                   ilike(restaurantBranches.address, searchTerm),
//                   ilike(restaurantBranches.city, searchTerm)
//                 )
//               ))
//           )
//         ) as SQL<unknown>;
//         conditions.push(searchCondition);
//       }
      
//       if (filters?.city && filters.city !== 'all') {
//         const cityCondition = eq(restaurantBranches.city, filters.city as "Alexandria" | "Cairo") as SQL<unknown>;
//         conditions.push(cityCondition);
//       }
      
//       if (filters?.cuisine) {
//         const cuisineCondition = eq(restaurantProfiles.cuisine, filters.cuisine) as SQL<unknown>;
//         conditions.push(cuisineCondition);
//       }
      
//       if (filters?.priceRange) {
//         const priceCondition = eq(restaurantProfiles.priceRange, filters.priceRange) as SQL<unknown>;
//         conditions.push(priceCondition);
//       }

//       // Execute query with all conditions
//       const query = db
//         .select({
//           restaurant: restaurantUsers,
//           profile: restaurantProfiles,
//           branches: restaurantBranches
//         })
//         .from(restaurantUsers)
//         .leftJoin(
//           restaurantProfiles,
//           eq(restaurantUsers.id, restaurantProfiles.restaurantId)
//         )
//         .leftJoin(
//           restaurantBranches,
//           eq(restaurantUsers.id, restaurantBranches.restaurantId)
//         );

//       // Only add where clause if we have conditions
//       const results = await (conditions.length > 0 
//         ? query.where(and(...conditions))
//         : query);

//       // Map results to remove duplicates and format properly
//       const restaurantMap = new Map<number, RestaurantUser & { profile?: RestaurantProfile, branches: RestaurantBranch[] }>();

//       for (const row of results) {
//         if (row.restaurant) {
//           const restaurantId = row.restaurant.id;
//           if (!restaurantMap.has(restaurantId)) {
//             restaurantMap.set(restaurantId, {
//               ...row.restaurant,
//               profile: row.profile || undefined,
//               branches: []
//             });
//           }

//           if (row.branches) {
//             const restaurant = restaurantMap.get(restaurantId);
//             const branch = row.branches;
//             if (restaurant && branch && !restaurant.branches.some((existingBranch: RestaurantBranch) => existingBranch.id === branch.id)) {
//               restaurant.branches.push(branch);
//             }
//           }
//         }
//       }

//       return Array.from(restaurantMap.values());
//     } catch (error) {
//       console.error('Error getting restaurants:', error);
//       throw error;
//     }
//   }

//   async searchRestaurants(query: string, city?: string): Promise<RestaurantUser[]> {
//     const restaurants = await this.getRestaurants();
//     const normalizedQuery = query.toLowerCase().trim();

//     return restaurants.filter(restaurant => {
//       // Filter by city if specified
//       if (city) {
//         const branchCities = (restaurant as any).branches?.map((b: RestaurantBranch) => b.city) || [];
//         if (!branchCities.includes(city as "Alexandria" | "Cairo")) {
//           return false;
//         }
//       }

//       const matchesName = restaurant.name.toLowerCase().includes(normalizedQuery);
//       const matchesCuisine = (restaurant as any).profile?.cuisine.toLowerCase().includes(normalizedQuery);
//       const matchesLocation = (restaurant as any).branches?.some((branch: RestaurantBranch) => {
//         const addressPart = branch.address.split(',')[0].trim().toLowerCase();
//         return addressPart.includes(normalizedQuery);
//       });

//       return matchesName || matchesCuisine || matchesLocation;
//     });
//   }

//   async findRestaurantsWithAvailability(
//     date?: Date,
//     partySize?: number,
//     filters?: { 
//       city?: string; 
//       cuisine?: string; 
//       priceRange?: string; 
//       search?: string;
//     },
//     requestedTime?: string
//   ): Promise<(RestaurantUser & { 
//     profile?: RestaurantProfile;
//     branches: (RestaurantBranch & { 
//       availableSlots: Array<{ time: string; seats: number }> 
//     })[];
//   })[]> {
//     console.log('DEBUG: Starting search with params:', {
//       date: date?.toISOString(),
//       partySize,
//       filters,
//       requestedTime
//     });

//     // Build search conditions
//     const conditions: SQL<unknown>[] = [];

//     if (filters?.search) {
//       const searchTerm = `%${filters.search}%`;
//       conditions.push(
//         or(
//           // Search in restaurant name
//           ilike(restaurantUsers.name, searchTerm),
//           // Search in cuisine
//           exists(
//             db.select()
//               .from(restaurantProfiles)
//               .where(and(
//                 eq(restaurantProfiles.restaurantId, restaurantUsers.id),
//                 ilike(restaurantProfiles.cuisine, searchTerm)
//               ))
//           ),
//           // Search in branch locations
//           exists(
//             db.select()
//               .from(restaurantBranches)
//               .where(and(
//                 eq(restaurantBranches.restaurantId, restaurantUsers.id),
//                 or(
//                   ilike(restaurantBranches.address, searchTerm),
//                   ilike(restaurantBranches.city, searchTerm)
//                 )
//               ))
//           )
//         ) as SQL<unknown>
//       );
//     }

//     // Get initial list of restaurants with profiles
//     const query = db
//       .select({
//         id: restaurantUsers.id,
//         email: restaurantUsers.email,
//         name: restaurantUsers.name,
//         password: restaurantUsers.password,
//         verified: restaurantUsers.verified,
//         createdAt: restaurantUsers.createdAt,
//         updatedAt: restaurantUsers.updatedAt,
//         profile: restaurantProfiles
//       })
//       .from(restaurantUsers)
//       .leftJoin(restaurantProfiles, eq(restaurantUsers.id, restaurantProfiles.restaurantId));

//     // Apply conditions if we have any
//     const rawRestaurants = await (conditions.length > 0
//       ? query.where(and(...conditions))
//       : query);

//     // Transform raw data to match expected types
//     const initialRestaurants = rawRestaurants.map(restaurant => ({
//       ...restaurant,
//       // Ensure all required fields have values
//       verified: restaurant.verified ?? false,
//       createdAt: restaurant.createdAt ?? new Date(),
//       updatedAt: restaurant.updatedAt ?? new Date(),
//       password: restaurant.password ?? "",
//       // Transform null profile to undefined and ensure all profile fields
//       profile: restaurant.profile ? {
//         ...restaurant.profile,
//         about: restaurant.profile.about ?? "",
//         description: restaurant.profile.description ?? "",
//         cuisine: restaurant.profile.cuisine ?? "",
//         priceRange: restaurant.profile.priceRange ?? "$",
//         logo: restaurant.profile.logo ?? "",
//         isProfileComplete: restaurant.profile.isProfileComplete ?? false,
//         createdAt: restaurant.profile.createdAt ?? new Date(),
//         updatedAt: restaurant.profile.updatedAt ?? new Date()
//       } : undefined
//     }));

//     console.log('DEBUG: Initial restaurants:', initialRestaurants.map(r => ({
//       id: r.id,
//       name: r.name,
//       priceRange: r.profile?.priceRange
//     })));

//     // For each restaurant, get branch availability
//     const restaurantsWithSlots = await Promise.all(
//       initialRestaurants.map(async (restaurant) => {
//         console.log(`DEBUG: Processing restaurant ${restaurant.id} (${restaurant.name})`);

//         // Get branches with filters applied
//         const conditions: SQL<unknown>[] = [eq(restaurantBranches.restaurantId, restaurant.id)];

//         // Add city filter if it exists
//         if (filters?.city && filters.city !== 'all') {
//           conditions.push(ilike(restaurantBranches.city, `%${filters.city}%`) as SQL<unknown>);
//         }

//         // Add cuisine filter if it exists
//         if (filters?.cuisine && filters.cuisine !== 'all') {
//           // We need to join with restaurant profiles to filter by cuisine
//           conditions.push(exists(
//             db.select()
//               .from(restaurantProfiles)
//               .where(and(
//                 eq(restaurantProfiles.restaurantId, restaurant.id),
//                 ilike(restaurantProfiles.cuisine, `%${filters.cuisine}%`)
//               ))
//           ) as SQL<unknown>);
//         }

//         // Add price range filter if it exists
//         if (filters?.priceRange && filters.priceRange !== 'all') {
//           // We need to join with restaurant profiles to filter by price range
//           conditions.push(exists(
//             db.select()
//               .from(restaurantProfiles)
//               .where(and(
//                 eq(restaurantProfiles.restaurantId, restaurant.id),
//                 eq(restaurantProfiles.priceRange, filters.priceRange)
//               ))
//           ) as SQL<unknown>);
//         }

//         // Add search filter to branches if it exists
//         if (filters?.search) {
//           const searchTerm = `%${filters.search}%`;
//           conditions.push(
//             or(
//               ilike(restaurantBranches.address, searchTerm),
//               ilike(restaurantBranches.city, searchTerm),
//               ilike(restaurantUsers.name, searchTerm),
//               ilike(restaurantProfiles.cuisine, searchTerm)
//             ) as SQL<unknown>
//           );
//         }
        
//         const branches = await db
//           .select({
//             id: restaurantBranches.id,
//             restaurantId: restaurantBranches.restaurantId,
//             address: restaurantBranches.address,
//             city: restaurantBranches.city,
//             tablesCount: restaurantBranches.tablesCount,
//             seatsCount: restaurantBranches.seatsCount,
//             openingTime: restaurantBranches.openingTime,
//             closingTime: restaurantBranches.closingTime,
//             reservationDuration: restaurantBranches.reservationDuration,
//             latitude: restaurantBranches.latitude,
//             longitude: restaurantBranches.longitude
//           })
//           .from(restaurantBranches)
//           .leftJoin(restaurantUsers, eq(restaurantBranches.restaurantId, restaurantUsers.id))
//           .leftJoin(restaurantProfiles, eq(restaurantUsers.id, restaurantProfiles.restaurantId))
//           .where(and(...conditions));

//         console.log(`DEBUG: Restaurant ${restaurant.id} data:`, {
//           branches: branches.map(b => ({
//             id: b.id,
//             city: b.city,
//             seatsCount: b.seatsCount,
//             openingTime: b.openingTime,
//             closingTime: b.closingTime
//           })),
//           profile: restaurant.profile ? {
//             cuisine: restaurant.profile.cuisine,
//             priceRange: restaurant.profile.priceRange
//           } : null
//         });

//         // Get availability for each branch
//         const branchesWithSlots = await Promise.all(
//           branches.map(async (branch) => {
//             console.log('----------------------------------------');
//             console.log(`DEBUG: Starting availability check for Restaurant ${restaurant.id}, Branch ${branch.id}`);
//             console.log('Branch details:', {
//               openingTime: branch.openingTime,
//               closingTime: branch.closingTime,
//               seatsCount: branch.seatsCount
//             });
//             console.log('Request details:', {
//               date: date?.toISOString(),
//               requestedTime,
//               partySize
//             });

//             // Calculate 30 minutes before and after
//             const [requestHour, requestMinute] = requestedTime ? requestedTime.split(':').map(Number) : this.getDefaultTimeSlots().map(t => t.split(':').map(Number))[1];

//             // Calculate time slots in minutes since midnight
//             const requestMinutes = requestHour * 60 + requestMinute;
//             const beforeMinutes = requestMinutes - 30;
//             const afterMinutes = requestMinutes + 30;

//             // Convert minutes back to HH:MM format
//             const formatTimeSlot = (minutes: number) => {
//               // Handle day wrapping
//               const wrappedMinutes = ((minutes % 1440) + 1440) % 1440; // 1440 = 24 * 60
//               const hour = Math.floor(wrappedMinutes / 60);
//               const minute = wrappedMinutes % 60;
//               return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
//             };

//             const timeSlots = [
//               formatTimeSlot(beforeMinutes),
//               requestedTime || this.getDefaultTimeSlots()[1],
//               formatTimeSlot(afterMinutes)
//             ];

//             console.log('DEBUG: Generated time slots:', {
//               requestedTime,
//               timeSlots,
//               requestMinutes,
//               beforeMinutes,
//               afterMinutes
//             });

//             console.log('DEBUG: Time calculations:', {
//               requestHour,
//               requestMinute,
//               beforeTime: {
//                 raw: beforeMinutes.toString(),
//                 hours: Math.floor(beforeMinutes / 60),
//                 minutes: beforeMinutes % 60,
//                 formatted: formatTimeSlot(beforeMinutes)
//               },
//               afterTime: {
//                 raw: afterMinutes.toString(),
//                 hours: Math.floor(afterMinutes / 60),
//                 minutes: afterMinutes % 60,
//                 formatted: formatTimeSlot(afterMinutes)
//               },
//               timeSlots
//             });

//             // Get all bookings for the time slots we're interested in
//             const branchBookings = await db
//               .select({
//                 time: sql<string>`DATE_TRUNC('minute', ${bookings.date})::time::text`,
//                 totalBooked: sql<number>`SUM(${bookings.partySize})`
//               })
//               .from(bookings)
//               .where(
//                 and(
//                   eq(bookings.branchId, branch.id),
//                   eq(sql`DATE(${bookings.date})`, sql`DATE(${sql.param(date || new Date())})`),
//                   sql`DATE_TRUNC('minute', ${bookings.date})::time = ANY(${sql.raw(`ARRAY[${timeSlots.map(t => `'${t}'::time`).join(',')}]`)})`
//                 )
//               )
//               .groupBy(sql`DATE_TRUNC('minute', ${bookings.date})`);

//             console.log('DEBUG: SQL Query results:', {
//               bookings: branchBookings,
//               sql: sql`
//                 SELECT DATE_TRUNC('minute', "date")::time::text as time,
//                        SUM(party_size) as total_booked
//                 FROM bookings
//                 WHERE branch_id = ${branch.id}
//                   AND DATE("date") = DATE(${date || new Date()})
//                   AND DATE_TRUNC('minute', "date")::time = ANY(${sql.raw(`ARRAY[${timeSlots.map(t => `'${t}'::time`).join(',')}]`)})
//                 GROUP BY DATE_TRUNC('minute', "date")
//               `.toString()
//             });

//             // Calculate available seats for each time slot
//             const availableSlots = timeSlots
//               .map(time => {
//                 const bookingForTime = branchBookings.find(b => b.time === time);
//                 const totalBooked = bookingForTime?.totalBooked || 0;
//                 const availableSeats = Math.max(0, branch.seatsCount - totalBooked);

//                 // Convert times to minutes for comparison
//                 const [slotHour, slotMinute] = time.split(':').map(Number);
//                 const [openHour, openMinute] = branch.openingTime.split(':').map(Number);
//                 const [closeHour, closeMinute] = branch.closingTime.split(':').map(Number);

//                 const slotMinutes = slotHour * 60 + slotMinute;
//                 const openMinutes = openHour * 60 + openMinute;
//                 let closeMinutes = closeHour * 60 + closeMinute;

//                 // Handle after-midnight closing times
//                 if (closeHour < openHour) {
//                   closeMinutes += 24 * 60;
//                 }

//                 const isWithinHours = slotMinutes >= openMinutes && slotMinutes <= closeMinutes - 30;
//                 const hasEnoughSeats = availableSeats >= (partySize || 2);

//                 console.log('DEBUG: Evaluating time slot:', {
//                   time,
//                   totalBooked,
//                   availableSeats,
//                   partySize,
//                   slotMinutes,
//                   openMinutes,
//                   closeMinutes,
//                   isWithinHours,
//                   hasEnoughSeats,
//                   branch: {
//                     id: branch.id,
//                     openingTime: branch.openingTime,
//                     closingTime: branch.closingTime,
//                     seatsCount: branch.seatsCount
//                   }
//                 });

//                 return {
//                   time,
//                   seats: availableSeats,
//                   isValid: isWithinHours && hasEnoughSeats
//                 };
//               })
//               .filter(slot => slot.isValid)
//               .map(({ time, seats }) => ({ time, seats }));

//             console.log('DEBUG: Final available slots:', {
//               branchId: branch.id,
//               slots: availableSlots
//             });

//             return {
//               ...branch,
//               latitude: branch.latitude,
//               longitude: branch.longitude,
//               availableSlots
//             };
//           })
//         );

//         // Filter out branches with no availability
//         const availableBranches = branchesWithSlots.filter(b => b.availableSlots.length > 0);
//         console.log(`DEBUG: Restaurant ${restaurant.id} has ${availableBranches.length} available branches`);

//         return {
//           ...restaurant,
//           updatedAt: restaurant.createdAt || new Date(), // Add updatedAt field using createdAt as fallback
//           branches: branchesWithSlots
//         };
//       })
//     );

//     // Only return restaurants that have at least one branch with availability
//     const availableRestaurants = restaurantsWithSlots.filter(r => 
//       r.branches.some(b => b.availableSlots.length > 0)
//     );

//     console.log('DEBUG: Final available restaurants:', availableRestaurants.map(r => ({
//       id: r.id,
//       name: r.name,
//       availableBranches: r.branches.filter(b => b.availableSlots.length > 0).length
//     })));

//     return availableRestaurants;
//   }

//   // ==================== Password Reset Operations ====================
//   // - createPasswordResetToken, validatePasswordResetToken, markPasswordResetTokenAsUsed, updateUserPassword
//   // - createRestaurantPasswordResetToken, validateRestaurantPasswordResetToken, markRestaurantPasswordResetTokenAsUsed, updateRestaurantPassword
//   async createPasswordResetToken(userId: number): Promise<string> {
//     const token = crypto.randomBytes(32).toString('hex');
//     const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

//     await db.insert(passwordResetTokens).values({
//       userId,
//       token,
//       expiresAt,
//       used: false,
//     });

//     return token;
//   }

//   async createRestaurantPasswordResetToken(restaurantId: number): Promise<string> {
//     const token = crypto.randomBytes(32).toString('hex');
//     const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

//     await db.insert(restaurantPasswordResetTokens).values({
//       restaurantId,
//       token,
//       expiresAt,
//       used: false,
//     });

//     return token;
//   }

//   async validatePasswordResetToken(token: string): Promise<number | null> {
//     const [resetToken] = await db
//       .select()
//       .from(passwordResetTokens)
//       .where(
//         and(
//           eq(passwordResetTokens.token, token),
//           eq(passwordResetTokens.used, false),
//           gt(passwordResetTokens.expiresAt, new Date())
//         )
//       );

//     return resetToken?.userId ?? null;
//   }

//   async validateRestaurantPasswordResetToken(token: string): Promise<number | null> {
//     const [resetToken] = await db
//       .select()
//       .from(restaurantPasswordResetTokens)
//       .where(
//         and(
//           eq(restaurantPasswordResetTokens.token, token),
//           eq(restaurantPasswordResetTokens.used, false),
//           gt(restaurantPasswordResetTokens.expiresAt, new Date())
//         )
//       );

//     return resetToken?.restaurantId ?? null;
//   }

//   async markPasswordResetTokenAsUsed(token: string): Promise<void> {
//     await db
//       .update(passwordResetTokens)
//       .set({ used: true })
//       .where(eq(passwordResetTokens.token, token));
//   }

//   async markRestaurantPasswordResetTokenAsUsed(token: string): Promise<void> {
//     await db
//       .update(restaurantPasswordResetTokens)
//       .set({ used: true })
//       .where(eq(restaurantPasswordResetTokens.token, token));
//   }

//   async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
//     await db
//       .update(users)
//       .set({ password: hashedPassword })
//       .where(eq(users.id, userId));
//   }

//   async updateRestaurantPassword(restaurantId: number, hashedPassword: string): Promise<void> {
//     await db
//       .update(restaurantUsers)
//       .set({ password: hashedPassword })
//       .where(eq(restaurantUsers.id, restaurantId));
//   }

//   // ==================== Utility & Miscellaneous ====================
//   // - sessionStore, setSessionStore, getDefaultTimeSlots, formatTime, formatTimeSlot
//   getDefaultTimeSlots(): string[] {
//     // Add 2 hours to current time
//     const now = new Date();
//     const baseTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
//     // Round down to nearest 30 mins
//     const minutes = baseTime.getMinutes();
//     const roundedMinutes = Math.floor(minutes / 30) * 30;
//     baseTime.setMinutes(roundedMinutes);
    
//     // Generate slots
//     const baseSlot = new Date(baseTime);
//     const beforeSlot = new Date(baseTime.getTime() - 30 * 60 * 1000);
//     const afterSlot = new Date(baseTime.getTime() + 30 * 60 * 1000);

//     // Format as HH:mm
//     const formatTime = (date: Date) => {
//       return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
//     };

//     return [formatTime(beforeSlot), formatTime(baseSlot), formatTime(afterSlot)];
//   }

//   // ==================== Exports ====================
//   // Create a new instance of the DatabaseStorage class
//   export const storage = new DatabaseStorage();