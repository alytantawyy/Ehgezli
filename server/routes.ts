import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { and, eq, sql } from "drizzle-orm";
import { bookings, restaurantBranches, users, savedRestaurants, restaurants, restaurantAuth, restaurantProfiles } from "@shared/schema";
import { parse as parseCookie } from 'cookie';
import { format, parseISO, addMinutes } from 'date-fns';

// Define WebSocket message types
type WebSocketMessage = {
  type: 'new_booking' | 'booking_cancelled' | 'heartbeat' | 'connection_established' | 'booking_arrived' | 'booking_completed';
  data?: any;
};

type WebSocketClient = {
  sessionID: string;
  userId: number;
  userType: 'user' | 'restaurant';
  isAlive: boolean;
};

export function registerRoutes(app: Express): Server {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Add error handling middleware for JSON parsing errors
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ message: 'Invalid JSON in request body' });
    }
    next(err);
  });

  // Set up authentication first to ensure session is available for WebSocket
  setupAuth(app);

  // Add availability endpoint
  app.get("/api/restaurants/:restaurantId/branches/:branchId/availability", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const branchId = parseInt(req.params.branchId);
      const dateStr = req.query.date as string;

      console.log('Calculating availability:', { restaurantId, branchId, dateStr });

      if (!dateStr) {
        return res.status(400).json({ message: "Date parameter is required" });
      }

      // Get branch details
      const [branch] = await db
        .select()
        .from(restaurantBranches)
        .where(
          and(
            eq(restaurantBranches.id, branchId),
            eq(restaurantBranches.restaurantId, restaurantId)
          )
        );

      if (!branch) {
        console.log('Branch not found:', { branchId, restaurantId });
        return res.status(404).json({ message: "Branch not found" });
      }

      // Parse the requested date
      const date = parseISO(dateStr);

      // Get all bookings for this branch on the requested date
      const existingBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.branchId, branchId),
            eq(bookings.confirmed, true),
            sql`DATE(${bookings.date}) = DATE(${date})`
          )
        );

      console.log('Found existing bookings:', existingBookings);

      // Calculate availability for each time slot
      const availability: Record<string, number> = {};
      const openingTime = branch.openingTime;
      const closingTime = branch.closingTime;

      // Generate all possible time slots
      const [openHour, openMinute] = openingTime.split(':').map(Number);
      const [closeHour, closeMinute] = closingTime.split(':').map(Number);

      let currentTime = new Date(date);
      currentTime.setHours(openHour, openMinute, 0, 0);

      const endTime = new Date(date);
      endTime.setHours(closeHour, closeMinute, 0, 0);

      while (currentTime < endTime) {
        const timeSlot = format(currentTime, 'HH:mm');

        // Calculate booked seats for this time slot
        const bookedSeats = existingBookings
          .filter(booking => {
            const bookingTime = new Date(booking.date);
            return format(bookingTime, 'HH:mm') === timeSlot;
          })
          .reduce((total, booking) => total + booking.partySize, 0);

        // Calculate available seats
        availability[timeSlot] = branch.seatsCount - bookedSeats;

        // Move to next time slot (30 minutes)
        currentTime = addMinutes(currentTime, 30);
      }

      console.log('Calculated availability:', availability);
      res.json(availability);
    } catch (error) {
      console.error('Error calculating availability:', error);
      res.status(500).json({ message: "Failed to calculate availability" });
    }
  });

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: async (info, callback) => {
      try {
        const cookies = info.req.headers.cookie ? parseCookie(info.req.headers.cookie) : null;
        if (!cookies?.['connect.sid']) {
          return callback(false, 401, 'Authentication required');
        }

        const sessionID = cookies['connect.sid'];
        const cleanSessionId = sessionID.split('.')[0].replace(/^s:/, '');

        // Get session from store
        const session = await new Promise((resolve) => {
          storage.sessionStore.get(cleanSessionId, (err, session) => {
            resolve(err ? null : session);
          });
        });

        if (!session) {
          return callback(false, 401, 'Invalid session');
        }

        // Safely access passport data
        const passportData = (session as any).passport;
        if (!passportData?.user?.id || !passportData?.user?.type) {
          return callback(false, 401, 'Invalid user data');
        }

        // Store user info in request
        (info.req as any).user = {
          id: passportData.user.id,
          type: passportData.user.type
        };

        callback(true);
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        callback(false, 500, 'Authentication failed');
      }
    }
  });

  // Track active connections by WebSocket instances
  const clients = new Map<WebSocket, WebSocketClient>();

  // Heartbeat interval
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = clients.get(ws);
      if (!client || !client.isAlive) {
        clients.delete(ws);
        return ws.terminate();
      }
      client.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // WebSocket connection handler
  wss.on('connection', async (ws, req) => {
    const user = (req as any).user;
    if (!user?.id || !user?.type || !['user', 'restaurant'].includes(user.type)) {
      ws.close(1008, 'Invalid user data');
      return;
    }

    const cookies = req.headers.cookie ? parseCookie(req.headers.cookie) : null;
    if (!cookies?.['connect.sid']) {
      ws.close(1008, 'No session found');
      return;
    }

    const sessionID = cookies['connect.sid'];
    const cleanSessionId = sessionID.split('.')[0].replace(/^s:/, '');

    // Add client to tracked connections
    clients.set(ws, {
      sessionID: cleanSessionId,
      userId: user.id,
      userType: user.type as 'user' | 'restaurant',
      isAlive: true
    });

    // Set up client event handlers
    ws.on('pong', () => {
      const client = clients.get(ws);
      if (client) {
        client.isAlive = true;
      }
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString()) as WebSocketMessage;
        if (data.type === 'heartbeat') {
          const client = clients.get(ws);
          if (client) {
            client.isAlive = true;
            ws.send(JSON.stringify({ type: 'heartbeat' }));
          }
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    // Send initial connection success message
    ws.send(JSON.stringify({
      type: 'connection_established',
      data: { userId: user.id, userType: user.type }
    }));
  });

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

  // Add type-specific authentication middleware
  const requireRestaurantAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user?.type !== 'restaurant') {
      return res.status(401).json({ message: "Not authenticated as restaurant" });
    }
    next();
  };

  // Update restaurant bookings endpoint with enhanced auth
  app.get("/api/restaurant/bookings/:restaurantId", requireRestaurantAuth, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (restaurantId !== req.user?.id) {
        return res.status(403).json({ message: "Unauthorized to access these bookings" });
      }

      const bookings = await storage.getRestaurantBookings(restaurantId);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update arrive endpoint with enhanced auth and proper type checking
  app.post("/api/restaurant/bookings/:bookingId/arrive", requireRestaurantAuth, async (req, res, next) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Verify booking belongs to this restaurant
      const [booking] = await db.select()
        .from(bookings)
        .innerJoin(restaurantBranches, eq(bookings.branchId, restaurantBranches.id))
        .where(
          and(
            eq(bookings.id, bookingId),
            eq(restaurantBranches.restaurantId, sql`${userId}`)
          )
        );

      if (!booking) {
        return res.status(404).json({ message: "Booking not found or unauthorized" });
      }

      await storage.markBookingArrived(bookingId);

      // Notify connected clients about the arrival update
      clients.forEach((client, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'booking_arrived',
            data: { bookingId, restaurantId: userId }
          }));
        }
      });

      res.json({ message: "Booking marked as arrived" });
    } catch (error) {
      next(error);
    }
  });

  // Add new endpoint to mark booking as complete
  app.post("/api/restaurant/bookings/:bookingId/complete", requireRestaurantAuth, async (req, res, next) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Verify booking belongs to this restaurant
      const [booking] = await db.select()
        .from(bookings)
        .innerJoin(restaurantBranches, eq(bookings.branchId, restaurantBranches.id))
        .where(
          and(
            eq(bookings.id, bookingId),
            eq(restaurantBranches.restaurantId, sql`${userId}`)
          )
        );

      if (!booking) {
        return res.status(404).json({ message: "Booking not found or unauthorized" });
      }

      await storage.markBookingComplete(bookingId);

      // Notify connected clients about the completion update
      clients.forEach((client, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'booking_completed',
            data: { bookingId, restaurantId: userId }
          }));
        }
      });

      res.json({ message: "Booking marked as complete" });
    } catch (error) {
      next(error);
    }
  });

  // Add restaurant booking cancellation endpoint
  app.post("/api/restaurant/bookings/:bookingId/cancel", requireRestaurantAuth, async (req, res, next) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Verify booking belongs to this restaurant
      const [booking] = await db.select()
        .from(bookings)
        .innerJoin(restaurantBranches, eq(bookings.branchId, restaurantBranches.id))
        .where(
          and(
            eq(bookings.id, bookingId),
            eq(restaurantBranches.restaurantId, sql`${userId}`)
          )
        );

      if (!booking) {
        return res.status(404).json({ message: "Booking not found or unauthorized" });
      }

      await storage.cancelBooking(bookingId);

      // Notify connected clients about the cancelled booking
      clients.forEach((client, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'booking_cancelled',
            data: { bookingId, restaurantId: userId }
          }));
        }
      });

      res.json({ message: "Booking cancelled successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/bookings/:bookingId/cancel", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.type !== 'user' || !req.user?.id) {
        return res.status(401).json({ message: "Not authenticated as user" });
      }

      const bookingId = parseInt(req.params.bookingId);

      // First get the booking to verify ownership
      const [booking] = await db.select()
        .from(bookings)
        .where(
          and(
            eq(bookings.id, bookingId),
            eq(bookings.userId, req.user.id)
          )
        );

      if (!booking) {
        return res.status(404).json({ message: "Booking not found or unauthorized" });
      }

      await storage.cancelBooking(bookingId);

      // Notify connected clients about the cancelled booking
      clients.forEach((client, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'booking_cancelled',
            data: { bookingId, userId: req.user?.id }
          }));
        }
      });

      res.json({ message: "Booking cancelled successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/restaurants", async (req, res, next) => {
    try {
      const query = req.query.q as string;
      const restaurants = query
        ? await storage.searchRestaurants(query)
        : await storage.getRestaurants();
      res.json(restaurants);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/restaurants/:id", async (req, res, next) => {
    try {
      const restaurant = await storage.getRestaurant(parseInt(req.params.id));
      if (!restaurant) {
        res.status(404).json({ message: "Restaurant not found" });
        return;
      }
      res.json(restaurant);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/restaurants/:id/branches", async (req, res, next) => {
    try {
      const branches = await storage.getRestaurantBranches(parseInt(req.params.id));
      res.json(branches);
    } catch (error) {
      next(error);
    }
  });

  // Update the POST /api/bookings endpoint with proper type checking
  app.post("/api/bookings", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.type !== 'user' || typeof req.user?.id !== 'number') {
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

      // Create the booking
      const booking = await storage.createBooking({
        userId: req.user.id,
        branchId,
        date: new Date(date),
        partySize,
        arrived: false,
        completed: false
      });

      // Notify connected clients about the new booking
      clients.forEach((client, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'new_booking',
            data: booking
          }));
        }
      });

      return res.status(201).json(booking);
    } catch (error) {
      console.error('Error creating booking:', error);
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to create booking"
      });
    }
  });

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

      res.status(200).json({ message: "Restaurant removed from saved list" });
    } catch (error) {
      next(error);
    }
  });

  // Error handling middleware should be last
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Error:', err);
    // Ensure we always send JSON response
    res.status(err.status || 500).json({
      message: err.message || "Internal server error"
    });
  });

  return httpServer;
}