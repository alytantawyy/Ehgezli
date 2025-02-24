import { pgTable, text, serial, integer, timestamp, boolean, jsonb, time, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Add WebSocket message types
export interface SeatAvailabilityUpdate {
  type: 'seatAvailability';
  branchId: number;
  date: string;
  time: string;
  availableSeats: number;
}

export interface BookingUpdate {
  type: 'bookingUpdate';
  branchId: number;
  action: 'created' | 'cancelled' | 'completed';
  booking: Booking;
}

export type WebSocketMessage = SeatAvailabilityUpdate | BookingUpdate;

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
  address: string;
  tablesCount: number;
  seatsCount: number;
  openingTime: string;
  closingTime: string;
  city: "Alexandria" | "Cairo";
};

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  authId: integer("auth_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  about: text("about").notNull(),
  logo: text("logo").notNull(),
  cuisine: text("cuisine").notNull(),
  locations: jsonb("locations").notNull().$type<Location[]>(),
  priceRange: text("price_range").notNull().$default(() => "$"),
});

export const restaurantProfiles = pgTable("restaurant_profiles", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().unique(),
  about: text("about").notNull(),
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
  restaurant: one(restaurants, {
    fields: [restaurantBranches.restaurantId],
    references: [restaurants.id],
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
  completed: boolean("completed").notNull().default(false), // Add this new field
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
  restaurant: one(restaurants, {
    fields: [savedRestaurants.restaurantId],
    references: [restaurants.id],
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

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true
}).extend({
  about: z.string().max(100),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]), // Add price range validation
  locations: z.array(z.object({
    address: z.string(),
    tablesCount: z.number(),
    openingTime: z.string(),
    closingTime: z.string(),
    city: z.enum(["Alexandria", "Cairo"])
  }))
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
  cuisine: z.string().min(1, "Cuisine type is required"),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"], {
    required_error: "Price range is required",
  }),
  branches: z.array(z.object({
    address: z.string().min(1, "Address is required"),
    city: z.enum(["Alexandria", "Cairo"], {
      required_error: "City is required",
      invalid_type_error: "Please select a valid city"
    }),
    tablesCount: z.number().min(1, "Must have at least 1 table"),
    seatsCount: z.number().min(1, "Must have at least 1 seat"),
    openingTime: z.string().min(1, "Opening time is required"),
    closingTime: z.string().min(1, "Closing time is required"),
  })).min(1, "At least one branch is required"),
});

// Add schema for inserting unavailable dates
export const insertBranchUnavailableDatesSchema = createInsertSchema(branchUnavailableDates).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.string()
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRestaurantAuth = z.infer<typeof insertRestaurantAuthSchema>;
export type User = typeof users.$inferSelect;
export type RestaurantAuth = typeof restaurantAuth.$inferSelect;
export type Restaurant = typeof restaurants.$inferSelect;
export type RestaurantBranch = typeof restaurantBranches.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type RestaurantProfile = typeof restaurantProfiles.$inferSelect;
export type InsertRestaurantProfile = z.infer<typeof restaurantProfileSchema>;
export type InsertBranchUnavailableDates = z.infer<typeof insertBranchUnavailableDatesSchema>;
export type BranchUnavailableDate = typeof branchUnavailableDates.$inferSelect;

export const mockRestaurants: Restaurant[] = [];