import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { setupAuth } from "./auth";
import { storage } from "./storage";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Error handling middleware - Add this at the top
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
      if (!req.isAuthenticated()) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const booking = await storage.createBooking({
        ...req.body,
        userId: req.user!.id,
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
      if (!req.isAuthenticated()) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const bookings = await storage.getUserBookings(req.user!.id);
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

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received:', data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}