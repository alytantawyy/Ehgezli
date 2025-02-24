import type { Express } from "express";
import express from 'express';
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { and, eq, sql } from "drizzle-orm";
import { bookings, restaurantBranches, restaurantAuth, restaurantProfiles, savedRestaurants } from "@shared/schema";
import { parse as parseCookie } from 'cookie';

export function registerRoutes(app: Express): any {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Set up authentication first
  setupAuth(app);

  // Add authentication middleware for all /api routes
  app.use('/api', (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    // Add user type check for restaurant-only endpoints
    if (req.path.startsWith('/restaurant/') && req.user?.type !== 'restaurant') {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  });

  // Restaurant dashboard bookings endpoint
  app.get("/api/restaurant/bookings/:restaurantId", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.type !== 'restaurant') {
        return res.status(401).json({ message: "Not authenticated as restaurant" });
      }

      const restaurantId = parseInt(req.params.restaurantId);
      if (restaurantId !== req.user?.id) {
        return res.status(403).json({ message: "Unauthorized to access these bookings" });
      }

      const bookings = await storage.getRestaurantBookings(restaurantId);
      res.json(bookings);
    } catch (error: any) {
      next(error);
    }
  });

  // Update booking status endpoints
  app.post("/api/restaurant/bookings/:bookingId/arrive", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.type !== 'restaurant' || !req.user?.id) {
        return res.status(401).json({ message: "Not authenticated as restaurant" });
      }

      const bookingId = parseInt(req.params.bookingId);
      await storage.markBookingArrived(bookingId);
      res.json({ message: "Booking marked as arrived" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/restaurant/bookings/:bookingId/complete", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.type !== 'restaurant' || !req.user?.id) {
        return res.status(401).json({ message: "Not authenticated as restaurant" });
      }

      const bookingId = parseInt(req.params.bookingId);
      await storage.markBookingComplete(bookingId);
      res.json({ message: "Booking marked as complete" });
    } catch (error) {
      next(error);
    }
  });

  // Booking creation endpoint
  app.post("/api/bookings", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.type !== 'user' || !req.user?.id) {
        return res.status(401).json({ message: "Not authenticated as user" });
      }

      const { branchId, date, partySize } = req.body;

      // Validate required fields
      if (!branchId || !date || !partySize) {
        return res.status(400).json({
          message: "Missing required fields",
          required: ['branchId', 'date', 'partySize']
        });
      }

      // Validate data types
      if (typeof partySize !== 'number' || partySize < 1) {
        return res.status(400).json({ message: "Party size must be a positive number" });
      }

      if (isNaN(Date.parse(date))) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      // Get branch information
      const [branch] = await db
        .select()
        .from(restaurantBranches)
        .where(eq(restaurantBranches.id, branchId));

      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      // Check for overlapping bookings
      const bookingStart = new Date(date);
      const twoHoursFromStart = new Date(bookingStart.getTime() + (120 * 60000)); // 2 hours after booking

      const overlappingBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.branchId, branchId),
            eq(bookings.confirmed, true),
            eq(bookings.completed, false),
            sql`
              (${bookings.date} >= ${bookingStart} AND ${bookings.date} < ${twoHoursFromStart})
            `
          )
        );

      // Calculate total seats occupied during the requested time
      const seatsOccupied = overlappingBookings.reduce((sum, booking) => sum + booking.partySize, 0);
      const availableSeats = branch.seatsCount - seatsOccupied;

      if (availableSeats < partySize) {
        return res.status(400).json({
          message: "Not enough seats available for this time slot",
          availableSeats,
          requestedSeats: partySize
        });
      }

      // Create the booking
      const [booking] = await db
        .insert(bookings)
        .values({
          userId: req.user.id,
          branchId,
          date: bookingStart,
          partySize,
          confirmed: true,
          arrived: false,
          completed: false
        })
        .returning();

      return res.status(201).json(booking);
    } catch (error) {
      console.error('Error creating booking:', error);
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to create booking"
      });
    }
  });

  // Get user bookings
  app.get("/api/bookings", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user?.id) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const bookings = await storage.getUserBookings(req.user.id);
      res.json(bookings);
    } catch (error) {
      next(error);
    }
  });

  // Get restaurant availability endpoint
  app.get("/api/restaurants/:restaurantId/branches/:branchId/availability", async (req, res, next) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const branchId = parseInt(req.params.branchId);
      const date = req.query.date as string;

      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }

      // Get branch information
      const [branch] = await db
        .select()
        .from(restaurantBranches)
        .where(eq(restaurantBranches.id, branchId));

      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      // Get all confirmed, not completed bookings for this branch on the specified date
      const branchBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.branchId, branchId),
            eq(bookings.confirmed, true),
            eq(bookings.completed, false),
            sql`DATE(${bookings.date}) = DATE(${date})`
          )
        );

      // Calculate availability for each time slot
      const timeSlots = {};
      const startTime = branch.openingTime.split(':').map(Number);
      const endTime = branch.closingTime.split(':').map(Number);

      // Generate 30-minute slots
      for (let hour = startTime[0]; hour < endTime[0]; hour++) {
        for (let minute of [0, 30]) {
          if (hour === startTime[0] && minute < startTime[1]) continue;
          if (hour === endTime[0] && minute > endTime[1]) continue;

          const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const slotDateTime = new Date(date);
          slotDateTime.setHours(hour, minute, 0, 0);

          // For each time slot, check bookings that affect its availability
          const affectingBookings = branchBookings.filter(booking => {
            const bookingTime = new Date(booking.date);
            const twoHoursFromBooking = new Date(bookingTime.getTime() + (120 * 60000)); // 2 hours after booking

            // This slot is affected if it falls within the 2-hour window after any booking
            return slotDateTime >= bookingTime && slotDateTime <= twoHoursFromBooking;
          });

          const seatsOccupied = affectingBookings.reduce((sum, booking) => sum + booking.partySize, 0);
          const availableSeats = Math.max(0, branch.seatsCount - seatsOccupied);

          timeSlots[timeSlot] = availableSeats;
        }
      }

      res.json({
        branchId,
        date,
        availability: timeSlots,
        totalSeats: branch.seatsCount
      });
    } catch (error) {
      console.error('Error calculating availability:', error);
      next(error);
    }
  });

  // Add restaurant profile endpoints
  app.put("/api/restaurant/profile", requireRestaurantAuth, async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      await storage.createRestaurantProfile({
        ...req.body,
        restaurantId: userId
      });

      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      next(error);
    }
  });


  // Add saved restaurants endpoints
  app.post("/api/saved-restaurants", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.type !== 'user' || !req.user?.id) {
        console.log('Authentication failed:', {
          isAuthenticated: req.isAuthenticated(),
          userType: req.user?.type,
          userId: req.user?.id
        });
        return res.status(401).json({ message: "Not authenticated as user" });
      }

      const { restaurantId, branchIndex } = req.body;
      console.log('Saving restaurant:', {
        userId: req.user.id,
        restaurantId,
        branchIndex
      });

      if (typeof restaurantId !== 'number' || typeof branchIndex !== 'number') {
        console.log('Invalid request body:', req.body);
        return res.status(400).json({ message: "Invalid request body" });
      }

      // Verify that the restaurant exists before saving
      const [restaurant] = await db
        .select()
        .from(restaurantAuth)
        .where(eq(restaurantAuth.id, restaurantId));

      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const [saved] = await db.insert(savedRestaurants)
        .values({
          userId: req.user.id,
          restaurantId,
          branchIndex,
          createdAt: new Date()
        })
        .returning();

      console.log('Restaurant saved successfully:', saved);
      res.status(201).json(saved);
    } catch (error) {
      console.error('Error saving restaurant:', error);
      next(error);
    }
  });

  app.get("/api/saved-restaurants", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.type !== 'user' || !req.user?.id) {
        return res.status(401).json({ message: "Not authenticated as user" });
      }

      const userId = req.user.id;
      console.log('Fetching saved restaurants for user:', userId);

      // First get the saved restaurant records
      const savedRecords = await db
        .select()
        .from(savedRestaurants)
        .where(eq(savedRestaurants.userId, userId));

      console.log('Found saved records:', savedRecords);

      // Then fetch complete restaurant data for each saved record
      const results = await Promise.all(
        savedRecords.map(async (saved) => {
          // Get restaurant auth and profile data
          const [restaurantData] = await db
            .select({
              id: restaurantAuth.id,
              name: restaurantAuth.name,
              description: restaurantProfiles.about,
              about: restaurantProfiles.about,
              logo: restaurantProfiles.logo,
              cuisine: restaurantProfiles.cuisine,
              priceRange: restaurantProfiles.priceRange,
            })
            .from(restaurantAuth)
            .innerJoin(
              restaurantProfiles,
              eq(restaurantAuth.id, restaurantProfiles.restaurantId)
            )
            .where(eq(restaurantAuth.id, saved.restaurantId));

          // Get branches data
          const branches = await db
            .select()
            .from(restaurantBranches)
            .where(eq(restaurantBranches.restaurantId, saved.restaurantId));

          // Map branches to locations format
          const locations = branches.map(branch => ({
            id: branch.id,
            address: branch.address,
            tablesCount: branch.tablesCount,
            seatsCount: branch.seatsCount,
            openingTime: branch.openingTime,
            closingTime: branch.closingTime,
            city: branch.city as "Alexandria" | "Cairo"
          }));

          return {
            id: saved.id,
            restaurantId: saved.restaurantId,
            branchIndex: saved.branchIndex,
            createdAt: saved.createdAt,
            restaurant: {
              ...restaurantData,
              locations
            }
          };
        })
      );

      console.log('Mapped saved restaurants results:', results);
      res.json(results);
    } catch (error) {
      console.error('Error fetching saved restaurants:', error);
      next(error);
    }
  });

  app.get("/api/saved-restaurants/:restaurantId/:branchIndex", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.type !== 'user' || !req.user?.id) {
        return res.status(401).json({ message: "Not authenticated as user" });
      }

      const userId = req.user.id;
      const restaurantId = parseInt(req.params.restaurantId);
      const branchIndex = parseInt(req.params.branchIndex);

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

      res.json(Boolean(saved));
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/saved-restaurants/:restaurantId/:branchIndex", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.type !== 'user' || !req.user?.id) {
        return res.status(401).json({ message: "Not authenticated as user" });
      }

      const userId = req.user.id;
      const restaurantId = parseInt(req.params.restaurantId);
      const branchIndex = parseInt(req.params.branchIndex);

      await db
        .delete(savedRestaurants)
        .where(
          and(
            eq(savedRestaurants.userId, userId),
            eq(savedRestaurants.restaurantId, restaurantId),
            eq(savedRestaurants.branchIndex, branchIndex)
          )
        );

      res.json({ message: "Restaurant removed from saved list" });
    } catch (error) {
      next(error);
    }
  });

  // Add enhanced logging to debug the availability calculation
  app.get("/api/restaurants/:restaurantId/branches/:branchId/availability", async (req, res, next) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const branchId = parseInt(req.params.branchId);
      const date = req.query.date as string;

      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }

      // Get branch information
      const [branch] = await db
        .select()
        .from(restaurantBranches)
        .where(eq(restaurantBranches.id, branchId));

      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      // Get all confirmed, not completed bookings for this branch on the specified date
      const branchBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.branchId, branchId),
            eq(bookings.confirmed, true),
            eq(bookings.completed, false),
            sql`DATE(${bookings.date}) = DATE(${date})`
          )
        );

      // Calculate availability for each time slot
      const timeSlots = {};
      const startTime = branch.openingTime.split(':').map(Number);
      const endTime = branch.closingTime.split(':').map(Number);

      // Generate 30-minute slots
      for (let hour = startTime[0]; hour < endTime[0]; hour++) {
        for (let minute of [0, 30]) {
          if (hour === startTime[0] && minute < startTime[1]) continue;
          if (hour === endTime[0] && minute > endTime[1]) continue;

          const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const slotDateTime = new Date(date);
          slotDateTime.setHours(hour, minute, 0, 0);

          // For each time slot, check bookings that affect its availability
          const affectingBookings = branchBookings.filter(booking => {
            const bookingTime = new Date(booking.date);
            const twoHoursFromBooking = new Date(bookingTime.getTime() + (120 * 60000)); // 2 hours after booking

            // This slot is affected if it falls within the 2-hour window after any booking
            return slotDateTime >= bookingTime && slotDateTime <= twoHoursFromBooking;
          });

          const seatsOccupied = affectingBookings.reduce((sum, booking) => sum + booking.partySize, 0);
          const availableSeats = Math.max(0, branch.seatsCount - seatsOccupied);

          timeSlots[timeSlot] = availableSeats;
        }
      }

      res.json({
        branchId,
        date,
        availability: timeSlots,
        totalSeats: branch.seatsCount
      });
    } catch (error) {
      console.error('Error calculating availability:', error);
      next(error);
    }
  });

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      message: err.message || "Internal server error"
    });
  });

  return app;
}