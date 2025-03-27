import { pgTable, text, serial, integer, timestamp, boolean, jsonb, time, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Add loginSchema for authentication
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Add restaurantLoginSchema for restaurant authentication
export const restaurantLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  gender: text("gender").notNull(),
  birthday: timestamp("birthday").notNull(),
  city: text("city").notNull(),
  favoriteCuisines: text("favorite_cuisines").array().notNull(),
});

// Add password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Add restaurant password reset tokens table
export const restaurantPasswordResetTokens = pgTable("restaurant_password_reset_tokens", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantAuth.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Add password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// Add restaurant password reset request schema
export const restaurantPasswordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// Add password reset schema
export const passwordResetSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Add restaurant password reset schema
export const restaurantPasswordResetSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const restaurantAuth = pgTable("restaurant_auth", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define Location type first, before the restaurant schema
export type Location = {
  id: number;
  restaurantId: number;
  address: string;
  tablesCount: number;
  seatsCount: number;
  openingTime: string;
  closingTime: string;
  city: "Alexandria" | "Cairo";
  reservationDuration: number;
};

export const restaurantProfiles = pgTable("restaurant_profiles", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().unique().references(() => restaurantAuth.id),
  about: text("about").notNull(),
  description: text("description").notNull(),
  cuisine: text("cuisine").notNull(),
  priceRange: text("price_range").notNull(),
  logo: text("logo").notNull().default(""), // Add logo field
  isProfileComplete: boolean("is_profile_complete").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const restaurantBranches = pgTable("restaurant_branches", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  tablesCount: integer("tables_count").notNull(),
  seatsCount: integer("seats_count").notNull(),
  openingTime: text("opening_time").notNull(),
  closingTime: text("closing_time").notNull(),
  reservationDuration: integer("reservation_duration").notNull().default(120), // 2 hours in minutes
});

export const branchUnavailableDates = pgTable("branch_unavailable_dates", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const branchUnavailableDatesRelations = relations(branchUnavailableDates, ({ one }) => ({
  branch: one(restaurantBranches, {
    fields: [branchUnavailableDates.branchId],
    references: [restaurantBranches.id],
  }),
}));

export const branchRelations = relations(restaurantBranches, ({ one, many }) => ({
  restaurant: one(restaurantProfiles, {
    fields: [restaurantBranches.restaurantId],
    references: [restaurantProfiles.restaurantId],
  }),
  bookings: many(bookings),
  unavailableDates: many(branchUnavailableDates),
}));

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  branchId: integer("branch_id").notNull(),
  date: timestamp("date").notNull(),
  partySize: integer("party_size").notNull(),
  confirmed: boolean("confirmed").notNull().default(false),
  arrived: boolean("arrived").notNull().default(false),
  arrivedAt: timestamp("arrived_at"),  // Add arrivedAt field
  completed: boolean("completed").notNull().default(false),
});

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

export const savedRestaurants = pgTable("saved_restaurants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  restaurantId: integer("restaurant_id").notNull(),
  branchIndex: integer("branch_index").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Add relations for saved restaurants
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

export const insertRestaurantAuthSchema = createInsertSchema(restaurantAuth).omit({
  id: true,
  verified: true,
  createdAt: true
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email format")
});

export const insertRestaurantProfileSchema = createInsertSchema(restaurantProfiles).omit({
  id: true
}).extend({
  about: z.string().max(100),
  description: z.string().max(100),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]), // Add price range validation
});

export const insertBranchSchema = createInsertSchema(restaurantBranches).omit({
  id: true
}).extend({
  seatsCount: z.number().min(1, "Must have at least 1 seat per table")
});

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

// Add schema for inserting unavailable dates
export const insertBranchUnavailableDatesSchema = z.object({
  branchId: z.number(),
  date: z.date(),
  reason: z.string().optional()
});

// Extended booking type that includes restaurant details
export interface ExtendedBooking extends Booking {
  restaurantName?: string;
  restaurantId?: number;
  branchRestaurantId?: number;
}

// Add BookingWithDetails type
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
export type InsertBranchUnavailableDates = typeof branchUnavailableDates.$inferInsert;
export type BranchUnavailableDate = typeof branchUnavailableDates.$inferSelect;

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