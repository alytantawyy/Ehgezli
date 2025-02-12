import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  gender: text("gender").notNull(),
  age: integer("age").notNull(),
  birthday: timestamp("birthday").notNull(),
  city: text("city").notNull(),
  favoriteCuisines: text("favorite_cuisines").array().notNull(),
});

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  about: text("about").notNull(),
  logo: text("logo").notNull(),
  cuisine: text("cuisine").notNull(),
  locations: jsonb("locations").notNull().default([]).array(),
});

export const restaurantBranches = pgTable("restaurant_branches", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  address: text("address").notNull(),
  capacity: integer("capacity").notNull(),
  tablesCount: integer("tables_count").notNull(),
  openingTime: text("opening_time").notNull(),
  closingTime: text("closing_time").notNull(),
  reservationDuration: integer("reservation_duration").notNull(), // in minutes
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  branchId: integer("branch_id").notNull(),
  date: timestamp("date").notNull(),
  partySize: integer("party_size").notNull(),
  confirmed: boolean("confirmed").notNull().default(false),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true 
}).extend({
  favoriteCuisines: z.array(z.string()).min(1).max(3)
});

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({ 
  id: true 
}).extend({
  about: z.string().max(100), // max 100 words
  locations: z.array(z.object({
    address: z.string(),
    capacity: z.number(),
    tablesCount: z.number(),
    openingTime: z.string(),
    closingTime: z.string(),
    reservationDuration: z.number()
  }))
});

export const insertBranchSchema = createInsertSchema(restaurantBranches).omit({ 
  id: true 
});

export const insertBookingSchema = createInsertSchema(bookings).omit({ 
  id: true,
  confirmed: true
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Restaurant = typeof restaurants.$inferSelect;
export type RestaurantBranch = typeof restaurantBranches.$inferSelect;
export type Booking = typeof bookings.$inferSelect;

// Mock data for development
export const mockRestaurants: Restaurant[] = [
  {
    id: 1,
    name: "La Maison Dorée",
    description: "Experience fine French dining in an elegant setting",
    about: "A family owned restaurant bringing authentic French cuisine to your neighborhood since 1995.",
    logo: "https://example.com/logo1.png",
    cuisine: "French",
    locations: [
      {
        address: "123 Main St",
        capacity: 60,
        tablesCount: 15,
        openingTime: "11:00",
        closingTime: "23:00",
        reservationDuration: 90
      }
    ]
  },
  {
    id: 2,
    name: "Sakura Garden",
    description: "Authentic Japanese cuisine with a modern twist",
    about: "Modern Japanese restaurant offering both traditional and fusion dishes in a contemporary setting.",
    logo: "https://example.com/logo2.png",
    cuisine: "Japanese",
    locations: [
      {
        address: "456 Oak Ave",
        capacity: 40,
        tablesCount: 10,
        openingTime: "12:00",
        closingTime: "22:00",
        reservationDuration: 60
      }
    ]
  }
];