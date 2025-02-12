import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  cuisine: text("cuisine").notNull(),
  image: text("image").notNull(),
  priceRange: text("price_range").notNull(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  restaurantId: integer("restaurant_id").notNull(),
  date: timestamp("date").notNull(),
  partySize: integer("party_size").notNull(),
  confirmed: boolean("confirmed").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRestaurantSchema = createInsertSchema(restaurants);
export const insertBookingSchema = createInsertSchema(bookings);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Restaurant = typeof restaurants.$inferSelect;
export type Booking = typeof bookings.$inferSelect;

export const mockRestaurants: Restaurant[] = [
  {
    id: 1,
    name: "La Maison Dorée",
    description: "Experience fine French dining in an elegant setting",
    cuisine: "French",
    image: "https://images.unsplash.com/photo-1505275350441-83dcda8eeef5",
    priceRange: "$$$"
  },
  {
    id: 2,
    name: "Sakura Garden",
    description: "Authentic Japanese cuisine with a modern twist",
    cuisine: "Japanese",
    image: "https://images.unsplash.com/photo-1525648199074-cee30ba79a4a",
    priceRange: "$$"
  },
  {
    id: 3,
    name: "Olive & Thyme",
    description: "Mediterranean flavors in a cozy atmosphere",
    cuisine: "Mediterranean",
    image: "https://images.unsplash.com/photo-1470256699805-a29e1b58598a",
    priceRange: "$$"
  }
];
