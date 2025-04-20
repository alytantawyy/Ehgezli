// Import necessary tools for database and validation
import { pgTable, text, serial, integer, timestamp, boolean, doublePrecision} from "drizzle-orm/pg-core";  // PostgreSQL table definitions
import { createInsertSchema } from "drizzle-zod";  // Tool to create validation schemas
import { z } from "zod";  // Zod is our validation library
import { relations } from "drizzle-orm";  // For defining relationships between tables

// ==================== Authentication Schemas ====================

// Schema for regular user login
export const userLoginSchema = z.object({
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
  nationality: text("nationality").notNull(),                    // User's nationality
  city: text("city").notNull(),                                  // User's city
  favoriteCuisines: text("favorite_cuisines").array().notNull(), // Array of favorite food types
  lastLatitude: doublePrecision("last_latitude"),                           // Last known latitude
  lastLongitude: doublePrecision("last_longitude"),                          // Last known longitude
  locationUpdatedAt: timestamp("location_updated_at"),            // When location was last updated
  locationPermissionGranted: boolean("location_permission_granted").default(false), // If user granted location permission
  createdAt: timestamp("created_at").notNull().defaultNow(),     // Account creation date
  updatedAt: timestamp("updated_at").notNull().defaultNow(),     // Last update date
});

// ==================== Password Reset Tables ====================

// Table for storing user password reset tokens
export const userPasswordResetTokens = pgTable("user_password_reset_tokens", {
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
  restaurantId: integer("restaurant_id").notNull().references(() => restaurantUsers.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==================== Password Reset Request Schemas ====================

// Schema for user requesting password reset
export const userPasswordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// Schema for restaurant requesting password reset
export const restaurantPasswordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// Schema for user setting new password
export const userPasswordResetSchema = z.object({
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
export const restaurantUsers = pgTable("restaurant_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),                    // Restaurant's email
  password: text("password").notNull(),                       // Hashed password
  name: text("name").notNull(),                               // Restaurant name
  verified: boolean("verified").notNull().default(false),     // If email is verified
  createdAt: timestamp("created_at").notNull().defaultNow(), // Account creation date
  updatedAt: timestamp("updated_at").notNull().defaultNow(), // Last update date
});

// Restaurant profile information
export const restaurantProfiles = pgTable("restaurant_profiles", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().unique().references(() => restaurantUsers.id),
  about: text("about").notNull().default(""),                    // Short description
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
  latitude: doublePrecision("latitude"),  // Geographical coordinate
  longitude: doublePrecision("longitude"), // Geographical coordinate
});

export const restaurantUserRelations = relations(restaurantUsers, ({ one, many }) => ({
  profile: one(restaurantProfiles, {
    fields: [restaurantUsers.id],
    references: [restaurantProfiles.restaurantId],
  }),
  branches: many(restaurantBranches),
}));


// ==================== Bookings ====================

// Table for storing reservations
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),              // Who made the booking
  timeSlotId: integer("time_slot_id").notNull().references(() => timeSlots.id),    // Which time slot
  partySize: integer("party_size").notNull(),        // How many people
  status: text("status", {enum: ["pending", "confirmed", "arrived", "cancelled", "completed"]}).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookingSettings = pgTable("booking_settings", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull().unique().references(() => restaurantBranches.id),
  openTime: text("open_time").notNull(),
  closeTime: text("close_time").notNull(),
  interval: integer("interval").notNull().default(90),
  maxSeatsPerSlot: integer("max_seats_per_slot").notNull().default(25),
  maxTablesPerSlot: integer("max_tables_per_slot").notNull().default(10),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const timeSlots = pgTable("time_slots", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull().references(() => restaurantBranches.id),
  date: timestamp("date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  maxSeats: integer("max_seats").notNull(),
  maxTables: integer("max_tables").notNull(),
  isClosed: boolean("is_closed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookingOverrides = pgTable("booking_overrides", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id").notNull().references(() => restaurantBranches.id),
  date: timestamp("date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  overrideType: text("override_type", {enum: ["closed", "capacity", "custom"]}).notNull(),
  newMaxSeats: integer("new_max_seats").notNull(),
  newMaxTables: integer("new_max_tables").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Link bookings to branches and users
export const bookingRelations = relations(bookings, ({ one }) => ({
  timeSlot: one(timeSlots, {
    fields: [bookings.timeSlotId],
    references: [timeSlots.id],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}));

export const timeSlotRelations = relations(timeSlots, ({ one, many }) => ({
  branch: one(restaurantBranches, {
    fields: [timeSlots.branchId],
    references: [restaurantBranches.id],
  }),
  bookings: many(bookings),
}));



// ==================== Saved Restaurants ====================

// Users can save their favorite restaurants
export const savedBranches = pgTable("saved_branches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  branchId: integer("branch_id").notNull().references(() => restaurantBranches.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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
export const insertRestaurantUserSchema = createInsertSchema(restaurantUsers).omit({
  id: true,
  verified: true,
  createdAt: true,
  updatedAt: true
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email format")
});

export const insertBranchSchema = createInsertSchema(restaurantBranches).omit({
  id: true,
}).extend({
  restaurantId: z.number(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  latitude: z.number().refine((val) => val >= -90 && val <= 90, {
    message: "Latitude must be between -90 and 90",
  }),
  longitude: z.number().refine((val) => val >= -180 && val <= 180, {
    message: "Longitude must be between -180 and 180",
  }),
});


export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  userId: z.number(),
  timeSlotId: z.number(),
  partySize: z.number().min(1, "Party size must be at least 1"),
  status: z.enum(["pending", "confirmed", "arrived", "cancelled"]).default("pending"),
});


export const insertRestaurantProfileSchema = createInsertSchema(restaurantProfiles)
  .omit({
    id: true,
    isProfileComplete: true,
    createdAt: true,
    updatedAt: true 
  })
  .extend({
    logo: z.string().default(""),

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

  export const insertBookingSettingsSchema = createInsertSchema(bookingSettings).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }).extend({
    openTime: z.string().min(1, "Open time is required"),
    closeTime: z.string().min(1, "Close time is required"),
    interval: z.number().min(1, "Interval must be at least 1 minute"),
    maxSeatsPerSlot: z.number().min(1, "At least 1 seat required"),
    maxTablesPerSlot: z.number().min(1, "At least 1 table required"),
  });

  export const insertBookingOverrideSchema = createInsertSchema(bookingOverrides).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }).extend({
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    overrideType: z.enum(["closed", "capacity", "custom"]),
    newMaxSeats: z.number().min(0),
    note: z.string().optional(),
  });
  


// ==================== Types and Interfaces ====================

// Extended booking type that includes restaurant details
export interface ExtendedBooking extends Booking {
  timeSlot: {
    startTime: Date;
    endTime: Date;
    date: Date;
  };
  branch: {
    id: number;
    restaurantName: string;
    address: string;
    city: string;
  };
}


// Export types
export type InsertUser = typeof users.$inferInsert;
export type InsertRestaurantUser = typeof restaurantUsers.$inferInsert;
export type User = typeof users.$inferSelect;
export type RestaurantUser = typeof restaurantUsers.$inferSelect;
export type RestaurantProfile = typeof restaurantProfiles.$inferSelect;
export type RestaurantBranch = typeof restaurantBranches.$inferSelect;
export type InsertRestaurantBranch = typeof restaurantBranches.$inferInsert;
export type InsertBooking = typeof bookings.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type InsertRestaurantProfile = typeof restaurantProfiles.$inferInsert;
export type BookingSettings = typeof bookingSettings.$inferSelect;
export type InsertBookingSettings = typeof bookingSettings.$inferInsert;
export type BookingOverride = typeof bookingOverrides.$inferSelect;
export type InsertBookingOverride = typeof bookingOverrides.$inferInsert; 


// Restaurant type combining auth and profile
export type Restaurant = RestaurantUser & {
  profile: RestaurantProfile;
  branches: RestaurantBranch[];
};

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'arrived' | 'completed';

export interface AvailableSlot {
  id: number;
  date: Date;
  startTime: Date;
  endTime: Date;
  remainingSeats: number;
  remainingTables?: number;
}

export interface BranchWithAvailability extends RestaurantBranch {
  availableSlots?: AvailableSlot[];
}

export interface RestaurantWithAvailability extends Omit<Restaurant, 'branches'> {
  branches: BranchWithAvailability[];
}

export type BookingWithDetails = {
  id: number;
  userId: number;
  partySize: number;
  status: string; // e.g., 'pending', 'confirmed'
  createdAt: Date;
  updatedAt: Date;
  timeSlot: {
    startTime: Date;
    endTime: Date;
    date: Date;
  };
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

export interface RestaurantSearchFilter {
  city?: string;
  cuisine?: string;
  priceRange?: string;
  date?: string;       // YYYY-MM-DD
  time?: string;       // HH:mm (24-hour)
  partySize?: number;
  userLatitude?: number;
  userLongitude?: number;
}

export interface UserLocation {
  lastLatitude: number | null;
  lastLongitude: number | null;
  locationUpdatedAt: Date | null;
  locationPermissionGranted: boolean | null;
}


export interface CreateRestaurantInput {
  email: string;
  password: string;
  name: string;
  about: string;
  description: string;
  cuisine: string;
  priceRange: string;
  logo: string;
}
