// Import necessary tools for database and validation
import { pgTable, text, serial, integer, timestamp, boolean, jsonb, time, date } from "drizzle-orm/pg-core";  // PostgreSQL table definitions
import { createInsertSchema } from "drizzle-zod";  // Tool to create validation schemas
import { z } from "zod";  // Zod is our validation library
import { relations } from "drizzle-orm";  // For defining relationships between tables

// ==================== Authentication Schemas ====================

// Schema for regular user login
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Schema for restaurant owner login
export const restaurantLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ==================== User-Related Tables ====================

// Main users table - stores customer information
export const users = pgTable("users", {
  id: serial("id").primaryKey(),                                    // Unique identifier
  firstName: text("first_name").notNull(),                         // User's first name
  lastName: text("last_name").notNull(),                          // User's last name
  email: text("email").notNull().unique(),                        // Unique email address
  password: text("password").notNull(),                           // Hashed password
  gender: text("gender").notNull(),                               // User's gender
  birthday: timestamp("birthday").notNull(),                      // User's birthday
  city: text("city").notNull(),                                  // User's city
  favoriteCuisines: text("favorite_cuisines").array().notNull(), // Array of favorite food types
});

// ==================== Password Reset Tables ====================

// Table for storing user password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),  // Links to user
  token: text("token").notNull().unique(),                          // Unique reset token
  expiresAt: timestamp("expires_at").notNull(),                     // When token expires
  used: boolean("used").notNull().default(false),                   // If token was used
  createdAt: timestamp("created_at").notNull().defaultNow(),        // When token was created
});

// Similar table for restaurant password resets
export const restaurantPasswordResetTokens = pgTable("restaurant_password_reset_tokens", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantAuth.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==================== Password Reset Request Schemas ====================

// Schema for user requesting password reset
export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// Schema for restaurant requesting password reset
export const restaurantPasswordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// Schema for user setting new password
export const passwordResetSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Schema for restaurant setting new password
export const restaurantPasswordResetSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ==================== Restaurant Tables ====================

// Restaurant authentication table - stores login credentials
export const restaurantAuth = pgTable("restaurant_auth", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),                    // Restaurant's email
  password: text("password").notNull(),                       // Hashed password
  name: text("name").notNull(),                               // Restaurant name
  verified: boolean("verified").notNull().default(false),     // If email is verified
  createdAt: timestamp("created_at").notNull().defaultNow(), // Account creation date
});

// Restaurant profile information
export const restaurantProfiles = pgTable("restaurant_profiles", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().unique().references(() => restaurantAuth.id),
  about: text("about").notNull(),                    // Short description
  description: text("description").notNull(),        // Detailed description
  cuisine: text("cuisine").notNull(),                // Type of food
  priceRange: text("price_range").notNull(),        // Price category ($, $$, etc)
  logo: text("logo").notNull().default(""),         // Restaurant logo (base64)
  isProfileComplete: boolean("is_profile_complete").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Restaurant branches/locations
export const restaurantBranches = pgTable("restaurant_branches", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  tablesCount: integer("tables_count").notNull(),
  seatsCount: integer("seats_count").notNull(),
  openingTime: text("opening_time").notNull(),
  closingTime: text("closing_time").notNull(),
  reservationDuration: integer("reservation_duration").notNull().default(120), // 2 hours default
});

// ==================== Table Relationships ====================

// Link branches to restaurant profiles and bookings
export const branchRelations = relations(restaurantBranches, ({ one, many }) => ({
  restaurant: one(restaurantProfiles, {
    fields: [restaurantBranches.restaurantId],
    references: [restaurantProfiles.restaurantId],
  }),
  bookings: many(bookings),
}));

// ==================== Bookings ====================

// Table for storing reservations
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),              // Who made the booking
  branchId: integer("branch_id").notNull(),          // Which branch
  date: timestamp("date").notNull(),                 // When is the booking for
  partySize: integer("party_size").notNull(),        // How many people
  confirmed: boolean("confirmed").notNull().default(false),  // If confirmed
  arrived: boolean("arrived").notNull().default(false),      // If customer arrived
  arrivedAt: timestamp("arrived_at"),                        // When they arrived
  completed: boolean("completed").notNull().default(false),  // If booking completed
});

// Link bookings to branches and users
export const bookingRelations = relations(bookings, ({ one }) => ({
  branch: one(restaurantBranches, {
    fields: [bookings.branchId],
    references: [restaurantBranches.id],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}));

// ==================== Saved Restaurants ====================

// Users can save their favorite restaurants
export const savedRestaurants = pgTable("saved_restaurants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  restaurantId: integer("restaurant_id").notNull(),
  branchIndex: integer("branch_index").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Link saved restaurants to users and restaurants
export const savedRestaurantsRelations = relations(savedRestaurants, ({ one }) => ({
  user: one(users, {
    fields: [savedRestaurants.userId],
    references: [users.id],
  }),
  restaurant: one(restaurantProfiles, {
    fields: [savedRestaurants.restaurantId],
    references: [restaurantProfiles.restaurantId],
  }),
}));

// ==================== Validation Schemas ====================

// Schema for inserting new users
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  favoriteCuisines: z.array(z.string()).min(1, "Select at least one cuisine").max(3, "Maximum 3 cuisines allowed"),
  birthday: z.string()
    .refine((date) => !isNaN(new Date(date).getTime()), {
      message: "Invalid date format"
    })
});

// Schema for inserting new restaurant authentication
export const insertRestaurantAuthSchema = createInsertSchema(restaurantAuth).omit({
  id: true,
  verified: true,
  createdAt: true
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email format")
});

// Schema for inserting new restaurant profiles
export const insertRestaurantProfileSchema = createInsertSchema(restaurantProfiles).omit({
  id: true
}).extend({
  about: z.string().max(100),
  description: z.string().max(100),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]), // Add price range validation
});

// Schema for inserting new branches
export const insertBranchSchema = createInsertSchema(restaurantBranches).omit({
  id: true
}).extend({
  seatsCount: z.number().min(1, "Must have at least 1 seat per table")
});

// Schema for inserting new bookings
export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  confirmed: true
});

// Schema for restaurant profile setup
export const restaurantProfileSchema = createInsertSchema(restaurantProfiles).omit({
  id: true,
  isProfileComplete: true,
  createdAt: true,
  updatedAt: true
}).extend({
  logo: z.string(),
  about: z.string()
    .min(1, "About section is required")
    .refine((val) => val.trim().split(/\s+/).length <= 50, {
      message: "About section must not exceed 50 words"
    }),
  description: z.string()
    .min(1, "Description section is required")
    .refine((val) => val.trim().split(/\s+/).length <= 50, {
      message: "Description section must not exceed 50 words"
    }),
  cuisine: z.string().min(1, "Cuisine type is required"),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"], {
    required_error: "Price range is required",
  }),
});

// ==================== Types and Interfaces ====================

// Extended booking type that includes restaurant details
export interface ExtendedBooking extends Booking {
  restaurantName?: string;
  restaurantId?: number;
  branchRestaurantId?: number;
}

// Type for bookings with additional details
export type BookingWithDetails = {
  id: number;
  date: Date;
  branchId: number;
  userId: number;
  partySize: number;
  confirmed: boolean;
  arrived: boolean;
  arrivedAt: Date | null;
  completed: boolean;
  user: {
    firstName: string;
    lastName: string;
  } | null;
  branch: {
    address: string;
    city: string;
    restaurantName: string;
  };
};

// Export types
export type InsertUser = typeof users.$inferInsert;
export type InsertRestaurantAuth = typeof restaurantAuth.$inferInsert;
export type User = typeof users.$inferSelect;
export type RestaurantAuth = typeof restaurantAuth.$inferSelect;
export type RestaurantProfile = typeof restaurantProfiles.$inferSelect;
export type RestaurantBranch = typeof restaurantBranches.$inferSelect;
export type InsertRestaurantBranch = typeof restaurantBranches.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type InsertRestaurantProfile = typeof restaurantProfiles.$inferInsert;

// Restaurant type combining auth and profile
export type Restaurant = RestaurantAuth & {
  profile?: RestaurantProfile;
  branches: RestaurantBranch[];
};

export interface AvailableSlot {
  time: string;
  seats: number;
}

export interface BranchWithAvailability extends RestaurantBranch {
  availableSlots?: AvailableSlot[];
}

export interface RestaurantWithAvailability extends Omit<Restaurant, 'branches'> {
  branches: BranchWithAvailability[];
}