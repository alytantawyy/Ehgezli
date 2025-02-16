import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { and, eq } from "drizzle-orm";
import { bookings, restaurantBranches, users } from "@shared/schema";
import { parse as parseCookie } from 'cookie';

// Define WebSocket message types
type WebSocketMessage = {
  type: 'new_booking' | 'booking_cancelled' | 'heartbeat' | 'connection_established';
  data?: any;
};

export function registerRoutes(app: Express): Server {
  // Add JSON and URL-encoded body parsing before any routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Add error handling middleware for JSON parsing errors
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && 'body' in err) {
      console.error('JSON parsing error:', err);
      return res.status(400).json({ message: 'Invalid JSON in request body' });
    }
    next(err);
  });

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Set up authentication after body parsing but before routes
  setupAuth(app);

  // Track active connections with their authentication state
  const clients = new Map<WebSocket, {
    sessionID: string;
    userId?: number;
    userType?: 'user' | 'restaurant';
    isAlive: boolean;
  }>();

  // Heartbeat interval
  const heartbeatInterval = setInterval(() => {
    clients.forEach((client, ws) => {
      if (!client.isAlive) {
        console.log('Terminating inactive WebSocket connection');
        clients.delete(ws);
        return ws.terminate();
      }
      client.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('connection', async (ws, req) => {
    console.log('New WebSocket connection attempt:', {
      headers: req.headers,
      url: req.url,
      cookie: req.headers.cookie
    });

    try {
      // Extract and parse cookie
      const cookieHeader = req.headers.cookie;
      if (!cookieHeader) {
        console.error('No cookie header found');
        ws.close(1008, 'No session cookie');
        return;
      }

      const cookies = parseCookie(cookieHeader);
      const sessionID = cookies['connect.sid'];
      if (!sessionID) {
        console.error('No session ID found in cookies');
        ws.close(1008, 'No session ID');
        return;
      }

      // Clean the session ID (remove 's:' prefix and decode)
      const cleanSessionId = decodeURIComponent(
        sessionID.startsWith('s:') ? sessionID.slice(2).split('.')[0] : sessionID
      );

      // Verify session
      storage.sessionStore.get(cleanSessionId, (err, session) => {
        if (err) {
          console.error('Session store error:', err);
          ws.close(1008, 'Session store error');
          return;
        }

        if (!session?.passport?.user) {
          console.error('Invalid or expired session:', cleanSessionId);
          ws.close(1008, 'Invalid session');
          return;
        }

        const { id, type } = session.passport.user;

        // Add client to tracked connections
        clients.set(ws, {
          sessionID: cleanSessionId,
          userId: id,
          userType: type,
          isAlive: true
        });

        console.log('WebSocket connected with session:', {
          sessionID: cleanSessionId,
          userId: id,
          userType: type
        });

        // Set up event handlers
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
              ws.send(JSON.stringify({ type: 'heartbeat' }));
            }
          } catch (error) {
            console.error('WebSocket message parsing error:', error);
          }
        });

        ws.on('close', () => {
          console.log('WebSocket connection closed:', {
            sessionID: cleanSessionId,
            userId: id
          });
          clients.delete(ws);
        });

        // Send initial connection success message
        ws.send(JSON.stringify({
          type: 'connection_established',
          data: { userId: id, userType: type }
        }));
      });
    } catch (error) {
      console.error('WebSocket setup error:', error);
      ws.close(1008, 'Connection setup failed');
    }
  });

  // Clean up on server close
  httpServer.on('close', () => {
    clearInterval(heartbeatInterval);
    for (const ws of clients.keys()) {
      ws.terminate();
    }
    clients.clear();
  });


  // Get restaurant bookings endpoint
  app.get("/api/restaurant/bookings/:restaurantId", async (req, res) => {
    console.log('Restaurant bookings request:', {
      restaurantId: req.params.restaurantId,
      user: req.user,
      sessionID: req.sessionID
    });

    if (!req.isAuthenticated() || req.user?.type !== 'restaurant') {
      console.log('Authentication failed:', {
        isAuthenticated: req.isAuthenticated(),
        userType: req.user?.type,
        sessionID: req.sessionID
      });
      return res.status(401).json({ message: "Not authenticated as restaurant" });
    }

    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (restaurantId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to access these bookings" });
      }

      const bookings = await storage.getRestaurantBookings(restaurantId);
      res.json(bookings);
    } catch (error: any) {
      console.error('Error fetching restaurant bookings:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add restaurant profile endpoint
  app.get("/api/restaurant/profile/:id", async (req, res, next) => {
    try {
      const profile = await storage.getRestaurantProfile(parseInt(req.params.id));
      if (!profile) {
        res.status(404).json({ message: "Profile not found" });
        return;
      }
      res.json({
        ...profile,
        isProfileComplete: await storage.isRestaurantProfileComplete(parseInt(req.params.id))
      });
    } catch (error) {
      next(error);
    }
  });

  // Add profile completion status endpoint
  app.get("/api/restaurant/profile-status/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        res.status(401).json({ message: "Please log in to access profile status" });
        return;
      }
      const isComplete = await storage.isRestaurantProfileComplete(parseInt(req.params.id));
      res.json({ isComplete });
    } catch (error) {
      next(error);
    }
  });

  // Add the cancel booking endpoint
  app.post("/api/restaurant/bookings/:bookingId/cancel", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.type !== 'restaurant' || !req.user?.id) {
        return res.status(401).json({ message: "Not authenticated as restaurant" });
      }

      const bookingId = parseInt(req.params.bookingId);
      const restaurantId = req.user.id;

      // First get the booking
      const [booking] = await db.select()
        .from(bookings)
        .innerJoin(
          restaurantBranches,
          eq(bookings.branchId, restaurantBranches.id)
        )
        .where(
          and(
            eq(bookings.id, bookingId),
            eq(restaurantBranches.restaurantId, restaurantId)
          )
        );

      if (!booking) {
        return res.status(404).json({ message: "Booking not found or unauthorized" });
      }

      // Update the booking to be cancelled (confirmed = false)
      await db.update(bookings)
        .set({ confirmed: false })
        .where(eq(bookings.id, bookingId));

      // Notify connected clients about the cancelled booking
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'booking_cancelled',
            data: { bookingId }
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

  // Add this endpoint before the booking creation endpoints
  app.get("/api/restaurants/availability/:branchId", async (req, res, next) => {
    try {
      const branchId = parseInt(req.params.branchId);
      const date = new Date(req.query.date as string);
      const partySize = parseInt(req.query.partySize as string);

      if (isNaN(branchId) || isNaN(date.getTime()) || isNaN(partySize)) {
        return res.status(400).json({ message: "Invalid parameters" });
      }

      const availability = await storage.getAvailableSeats(branchId, date);
      const isAvailable = availability.availableSeats >= partySize;

      res.json({
        ...availability,
        isAvailable,
        requestedPartySize: partySize
      });
    } catch (error) {
      next(error);
    }
  });

  // Update the POST /api/bookings endpoint
  app.post("/api/bookings", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user?.type !== 'user') {
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

      // Check availability before creating booking
      const isAvailable = await storage.isTimeSlotAvailable(branchId, new Date(date), partySize);
      if (!isAvailable) {
        return res.status(400).json({ 
          message: "Selected time slot is not available for the requested party size" 
        });
      }

      // Create the booking
      const booking = await storage.createBooking({
        userId: req.user.id,
        branchId,
        date: new Date(date),
        partySize,
      });

      // Notify connected clients about the new booking
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
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
  app.put("/api/restaurant/profile", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Please log in to update profile" });
      }

      if (!req.user?.type || req.user.type !== 'restaurant') {
        return res.status(403).json({ message: "Not authorized as restaurant" });
      }

      await storage.createRestaurantProfile({
        ...req.body,
        restaurantId: req.user.id
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