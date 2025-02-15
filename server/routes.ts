import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { and, eq } from "drizzle-orm";
import { bookings, restaurantBranches } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection attempt:', {
      headers: req.headers,
      url: req.url
    });

    // Get session from the upgrade request
    const sessionID = req.headers.cookie?.split(';')
      .find(cookie => cookie.trim().startsWith('connect.sid='))
      ?.split('=')[1];

    if (!sessionID) {
      console.error('WebSocket connection rejected: No session ID found');
      ws.close(1008, 'Authentication required');
      return;
    }

    console.log('WebSocket connected with session:', sessionID);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  setupAuth(app);

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      message: err.message || "Internal server error"
    });
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

  app.post("/api/bookings", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user?.id) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const booking = await storage.createBooking({
        ...req.body,
        userId: req.user.id,
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

      res.status(201).json(booking);
    } catch (error) {
      next(error);
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

  return httpServer;
}