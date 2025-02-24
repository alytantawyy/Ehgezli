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
import { format } from 'date-fns';

// Define WebSocket message types
type WebSocketMessage = {
  type: 'seatAvailability' | 'new_booking' | 'booking_cancelled' | 'heartbeat' | 'connection_established' | 'booking_arrived' | 'booking_completed';
  data?: any;
};

type WebSocketClient = {
  sessionID: string;
  userId: number;
  userType: 'user' | 'restaurant';
  isAlive: boolean;
};

// Authentication middleware
const requireRestaurantAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated() || req.user?.type !== 'restaurant') {
    return res.status(401).json({ message: "Not authenticated as restaurant" });
  }
  next();
};

// Function to calculate available seats
async function calculateAvailableSeats(branchId: number, date: Date, time: string): Promise<number> {
  const branch = await db.query.restaurantBranches.findFirst({
    where: eq(restaurantBranches.id, branchId)
  });

  if (!branch) return 0;

  // Get all bookings for this time slot
  const startTime = new Date(date);
  startTime.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]));

  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + (branch.reservationDuration || 120));

  const existingBookings = await db
    .select({ partySize: bookings.partySize })
    .from(bookings)
    .where(
      and(
        eq(bookings.branchId, branchId),
        sql`${bookings.date} >= ${startTime} AND ${bookings.date} < ${endTime}`,
        eq(bookings.confirmed, true)
      )
    );

  const totalBooked = existingBookings.reduce((sum, booking) => sum + booking.partySize, 0);
  return Math.max(0, branch.seatsCount - totalBooked);
}

// Function to broadcast availability update
async function broadcastAvailability(
  wss: WebSocketServer,
  clients: Map<WebSocket, WebSocketClient>,
  branchId: number,
  date: Date,
  time: string
) {
  const availableSeats = await calculateAvailableSeats(branchId, date, time);
  console.log('Broadcasting availability:', {
    branchId,
    date: format(date, 'yyyy-MM-dd'),
    time,
    availableSeats
  });

  const message = JSON.stringify({
    type: 'seatAvailability',
    branchId,
    date: format(date, 'yyyy-MM-dd'),
    time,
    availableSeats
  });

  clients.forEach((client, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

export function registerRoutes(app: Express): Server {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Set up authentication first to ensure session is available for WebSocket
  setupAuth(app);

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: async (info, callback) => {
      try {
        const cookieHeader = info.req.headers.cookie;
        console.log('WebSocket connection request:', {
          cookieHeader,
          url: info.req.url,
          timestamp: new Date().toISOString()
        });

        if (!cookieHeader) {
          console.log('WebSocket connection rejected: No cookies in request');
          return callback(false, 401, 'Authentication required');
        }

        const cookies = parseCookie(cookieHeader);
        if (!cookies['connect.sid']) {
          console.log('WebSocket connection rejected: No session cookie found in:', cookies);
          return callback(false, 401, 'Authentication required');
        }

        const sessionID = cookies['connect.sid'];
        const cleanSessionId = sessionID.split('.')[0].replace(/^s:/, '');
        console.log('Processing session:', {
          sessionID,
          cleanSessionId,
          timestamp: new Date().toISOString()
        });

        // Get session from store
        const session = await new Promise((resolve) => {
          storage.sessionStore.get(cleanSessionId, (err, session) => {
            if (err) {
              console.error('Session fetch error:', err);
            }
            resolve(err ? null : session);
          });
        });

        if (!session) {
          console.log('WebSocket connection rejected: Invalid session');
          return callback(false, 401, 'Invalid session');
        }

        console.log('Session data found:', {
          hasSession: !!session,
          passport: (session as any).passport,
          timestamp: new Date().toISOString()
        });

        // Safely access passport data
        const passportData = (session as any).passport;
        if (!passportData?.user?.id || !passportData?.user?.type) {
          console.log('WebSocket connection rejected: Invalid user data in session');
          return callback(false, 401, 'Invalid user data');
        }

        // Store user info in request
        (info.req as any).user = {
          id: passportData.user.id,
          type: passportData.user.type
        };

        console.log('WebSocket connection authenticated:', {
          userId: passportData.user.id,
          userType: passportData.user.type,
          timestamp: new Date().toISOString()
        });
        callback(true);
      } catch (error) {
        console.error('WebSocket authentication error:', {
          error,
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
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
    console.log('New WebSocket connection:', {
      userId: user?.id,
      userType: user?.type,
      timestamp: new Date().toISOString()
    });

    if (!user?.id || !user?.type || !['user', 'restaurant'].includes(user.type)) {
      console.log('Invalid user data, closing connection');
      ws.close(1008, 'Invalid user data');
      return;
    }

    const cookies = req.headers.cookie ? parseCookie(req.headers.cookie) : null;
    if (!cookies?.['connect.sid']) {
      console.log('No session found, closing connection');
      ws.close(1008, 'No session found');
      return;
    }

    const sessionID = cookies['connect.sid'];
    const cleanSessionId = sessionID.split('.')[0].replace(/^s:/, '');

    // Add client to tracked connections with proper typing
    clients.set(ws, {
      sessionID: cleanSessionId,
      userId: user.id,
      userType: user.type as 'user' | 'restaurant',
      isAlive: true
    });

    console.log('Client added to tracking:', {
      userId: user.id,
      userType: user.type,
      totalClients: clients.size
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
        console.log('WebSocket message received:', {
          type: data.type,
          userId: user.id,
          timestamp: new Date().toISOString()
        });

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
      console.log('WebSocket connection closed:', {
        userId: user.id,
        userType: user.type,
        timestamp: new Date().toISOString()
      });
      clients.delete(ws);
    });

    // Send initial connection success message
    ws.send(JSON.stringify({
      type: 'connection_established',
      data: { userId: user.id, userType: user.type }
    }));
  });

  // Update booking endpoints to broadcast availability updates
  app.post("/api/bookings", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.type !== 'user' || typeof req.user?.id !== 'number') {
        return res.status(401).json({ message: "Not authenticated as user" });
      }

      const { branchId, date, partySize, time } = req.body;

      // Validate required fields
      if (!branchId || !date || !partySize || !time) {
        return res.status(400).json({
          message: "Missing required fields",
          required: ['branchId', 'date', 'partySize', 'time']
        });
      }

      // Validate data types
      if (typeof partySize !== 'number' || partySize < 1) {
        return res.status(400).json({ message: "Party size must be a positive number" });
      }

      const bookingDate = new Date(date);
      if (isNaN(bookingDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      // Check current availability
      const bookingTime = `${bookingDate.getHours().toString().padStart(2, '0')}:${bookingDate.getMinutes().toString().padStart(2, '0')}`;
      const availableSeats = await calculateAvailableSeats(branchId, bookingDate, bookingTime);

      if (availableSeats < partySize) {
        return res.status(400).json({ message: "Not enough seats available" });
      }

      // Create the booking
      const booking = await storage.createBooking({
        userId: req.user.id,
        branchId,
        date: bookingDate,
        partySize,
        arrived: false,
        completed: false
      });

      // Broadcast updated availability
      await broadcastAvailability(wss, clients, branchId, bookingDate, bookingTime);

      // Notify about new booking
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