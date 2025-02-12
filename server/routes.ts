import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.get("/api/restaurants", async (req, res) => {
    const query = req.query.q as string;
    const restaurants = query 
      ? await storage.searchRestaurants(query)
      : await storage.getRestaurants();
    res.json(restaurants);
  });

  app.get("/api/restaurants/:id", async (req, res) => {
    const restaurant = await storage.getRestaurant(parseInt(req.params.id));
    if (!restaurant) {
      res.status(404).send("Restaurant not found");
      return;
    }
    res.json(restaurant);
  });

  // Add restaurant profile endpoint
  app.get("/api/restaurant/profile/:id", async (req, res) => {
    const profile = await storage.getRestaurantProfile(parseInt(req.params.id));
    if (!profile) {
      res.status(404).send("Profile not found");
      return;
    }
    res.json(profile);
  });

  app.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).send("Unauthorized");
      return;
    }

    const booking = await storage.createBooking({
      ...req.body,
      userId: req.user!.id,
    });

    res.status(201).json(booking);
  });

  app.get("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      res.status(401).send("Unauthorized");
      return;
    }

    const bookings = await storage.getUserBookings(req.user!.id);
    res.json(bookings);
  });

  const httpServer = createServer(app);
  return httpServer;
}