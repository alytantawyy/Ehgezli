/**
 * routes.ts - Main Server Routes Configuration
 * This file sets up all the server endpoints (URLs) that our application responds to.
 * It handles user authentication, restaurant management, bookings, and real-time updates.
 */

// === Core Server Packages ===
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import express from 'express';
// WebSocket enables real-time updates (e.g., instant booking notifications)
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { z } from 'zod';

// === Authentication & Security ===
import { setupAuth, authenticateJWT, generateToken, hashPassword } from "./auth";
import jwt from 'jsonwebtoken';

// === Database & Storage ===
import { DatabaseStorage } from "./storage";

// === Utilities ===
// Haversine formula to calculate distance between two points on Earth
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

// Initialize our database operations helper
const storage = new DatabaseStorage();

/**
 * WebSocket Message Format
 * Defines the structure of real-time messages sent between server and clients
 */
type WebSocketMessage = {
  type: 'new_booking' |      // When a new booking is made
        'booking_cancelled' | // When a booking is cancelled
        'heartbeat' |        // Keep-alive check
        'connection_established' | // Initial connection success
        'booking_arrived' |  // When a customer arrives
        'booking_completed' | // When a booking is finished
        'init' |            // Initial connection setup
        'logout';           // User logging out (e.g., tab close)
  data?: any;  // Optional data associated with the message
};

/**
 * WebSocket Client Information
 * Tracks information about connected clients for real-time updates
 */
interface WebSocketClient {
  userId: number;         // User's database ID
  userType: 'user' | 'restaurant';  // Type of user connected
  isAlive: boolean;      // Connection health status
}

// Track connected WebSocket clients
const clients = new Map<WebSocket, WebSocketClient & { isAlive: boolean }>();

// Define user types
interface AuthenticatedUser {
  id: number;
  type: 'user' | 'restaurant';
}

interface WebSocketClient {
  userId: number;
  userType: 'user' | 'restaurant';
  isAlive: boolean;
}

// Extend Express Request type
declare global {
  namespace Express {
    // Ensure the User interface has a non-optional id property
    interface User {
      id: number;
      type: 'user' | 'restaurant';
    }
  }
}

// Helper function to get user ID safely
function getUserId(req: Request): number {
  if (!req.user) {
    throw new Error("User not authenticated");
  }
  return Number(req.user.id);
}

// Define authentication middleware
const requireRestaurantAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.type !== 'restaurant') {
    return res.status(401).json({ message: "Not authenticated as restaurant" });
  }
  next();
};

const requireUserAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.type !== 'user') {
    return res.status(401).json({ message: "Not authenticated as user" });
  }
  next();
};

/**
 * Main Routes Configuration Function
 * Sets up all server endpoints and WebSocket functionality
 */
export function registerRoutes(app: Express): Server {
  // Create HTTP server
  const httpServer = createServer(app);

  // === BASIC MIDDLEWARE SETUP
  
  // Parse JSON request bodies
  app.use(express.json());
  // Parse URL-encoded form data
  app.use(express.urlencoded({ extended: true }));

  // Handle malformed JSON gracefully
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ message: 'Invalid JSON in request body' });
    }
    next(err);
  });

  // Set up authentication (from auth.ts)
  // This needs to be called before defining other routes to avoid conflicts
  setupAuth(app);

  // === PUBLIC ROUTES (No Login Required) ===

  /**
   * Restaurant Login and User Login endpoints are now defined in auth.ts
   * They use JWT token-based authentication instead of session-based authentication
   */

  // AUTHENTICATION MIDDLEWARE
  // This protects all routes that come after it
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    // List of routes that don't need login
    const publicPaths = [
      '/register',
      '/login',
      '/restaurant/login',
      '/forgot-password',
      '/reset-password',
      '/restaurant/forgot-password',
      '/restaurant/reset-password',
      '/restaurants', 
      '/restaurant',
      '/restaurant/branch', 
      '/restaurants',
      '/restaurants/availability',
      '/default-time-slots',
      '/restaurants/nearby'
    ];
    
    // If it's a public path, let them through
    if (publicPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Apply JWT authentication middleware
    authenticateJWT(req, res, (err: any) => {
      if (err) return res.status(401).json({ message: "Authentication required" });
      
      // If not authenticated after JWT check, stop here
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // If authenticated, continue to the route
      next();
    });
  });

  // Get current user data endpoint
  app.get("/api/user", authenticateJWT, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get complete user information from the database
      if (req.user.type === 'user') {
        const user = await storage.getUserById(req.user.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        // Don't send password to the client
        //delete user.password;
        res.json(user);
      } else if (req.user.type === 'restaurant') {
        const restaurant = await storage.getRestaurant(req.user.id);
        if (!restaurant) {
          return res.status(404).json({ message: "Restaurant not found" });
        }
        // Don't send password to the client
        //delete restaurant.password;
        res.json(restaurant);
      } else {
        return res.status(400).json({ message: "Invalid user type" });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get current restaurant data endpoint
  app.get("/api/restaurant", authenticateJWT, (req, res) => {
    if (!req.user || req.user.type !== 'restaurant') {
      return res.status(401).json({ message: "Not authenticated as restaurant" });
    }
    res.json(req.user);
  });

  /**
   * Get All Restaurants
   * GET /api/restaurants
   * 
   * Public endpoint to get a list of all restaurants with their branches
   * 
   * Query parameters:
   * - search (optional): Search by restaurant name, description, or cuisine
   * - city (optional): Filter by city (Alexandria or Cairo)
   * - cuisine (optional): Filter by cuisine type
   * - priceRange (optional): Filter by price range ($, $$, $$$, $$$$)
   * 
   * Returns:
   * - 200: List of restaurants
   * - 500: Server error
   */
  app.get("/api/restaurants", async (req: Request, res: Response) => {
    try {
      const { search, city, cuisine, priceRange } = req.query;
      
      // Validate city if provided
      if (city && !["Alexandria", "Cairo", "all"].includes(city as string)) {
        return res.status(400).json({ message: "Invalid city. Must be Alexandria or Cairo" });
      }

      // Validate price range if provided
      if (priceRange && !["$", "$$", "$$$", "$$$$", "all"].includes(priceRange as string)) {
        return res.status(400).json({ message: "Invalid price range. Must be $, $$, $$$, or $$$$" });
      }

      const restaurants = await storage.getRestaurants({
        search: search as string,
        city: city === "all" ? undefined : city as string,
        cuisine: cuisine === "all" ? undefined : cuisine as string,
        priceRange: priceRange === "all" ? undefined : priceRange as string
      });

      res.json(restaurants);
    } catch (error) {
      console.error("Error getting restaurants:", error);
      res.status(500).json({ message: "Error retrieving restaurants" });
    }
  });

  /**
   * Get Restaurants with Availability
   * GET /api/restaurants/availability
   * 
   * Get restaurants with availability for a specific date and party size
   * 
   * Query parameters:
   * - date: Date to check availability for (YYYY-MM-DD format)
   * - partySize: Number of people in the party
   * - city: Filter by city
   * - cuisine: Filter by cuisine
   * - priceRange: Filter by price range
   * - search: Search term
   * - time: Specific time to check (HH:MM format)
   * 
   * Returns:
   * - 200: List of restaurants with availability
   * - 400: Invalid parameters
   * - 500: Server error
   */
  app.get('/api/restaurants/availability', async (req, res) => {
    try {
      console.log('SERVER: Availability request:', req.query);
      
      // Parse query parameters
      const { date, partySize, city, cuisine, priceRange, search, time } = req.query;
      
      // Default to current date if not provided
      let searchDate = date ? new Date(date as string) : new Date();
      
      // Default to 2 people if not provided
      let searchPartySize = partySize ? parseInt(partySize as string) : 2;
      
      // Find restaurants with availability
      const restaurants = await storage.findRestaurantsWithAvailability(
        searchDate,
        searchPartySize,
        {
          city: city as string,
          cuisine: cuisine as string,
          priceRange: priceRange as string,
          search: search as string
        },
        time as string | undefined
      );

      console.log('SERVER: Found restaurants:', {
        count: restaurants.length,
        restaurants: restaurants.map(r => ({
          id: r.id,
          name: r.name,
          branchCount: r.branches.length,
          totalSlots: r.branches.reduce((acc, b) => acc + b.availableSlots.length, 0)
        }))
      });

      res.json(restaurants);
    } catch (error) {
      console.error('SERVER: Error in availability endpoint:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Get Nearby Restaurants
   * GET /api/restaurants/nearby
   * 
   * Finds restaurants within a specified radius of the given coordinates
   * If no coordinates are provided, it uses the authenticated user's last known location
   * If user location is not available, it uses default coordinates for Alexandria
   * 
   * Query parameters:
   * - latitude: string (optional) - Center latitude
   * - longitude: string (optional) - Center longitude
   * - radius: number (optional) - Search radius in kilometers (default: 5)
   * - limit: number (optional) - Maximum number of results (default: 20)
   * 
   * Returns:
   * - 200: List of nearby restaurants with distance information
   * - 400: Invalid input
   * - 500: Server error
   */
  app.get("/api/restaurants/nearby", async (req: Request, res: Response) => {
    try {
      console.log("[Debug] GET /api/restaurants/nearby query params:", req.query);
      
      // Validate input
      const querySchema = z.object({
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        radius: z.string().transform(Number).default("5"),
        limit: z.string().transform(Number).default("20")
      });

      const result = querySchema.safeParse(req.query);
      if (!result.success) {
        console.log("[Debug] Invalid nearby restaurants query:", result.error.format());
        return res.status(400).json({ 
          error: "Invalid input", 
          details: result.error.format() 
        });
      }

      let { latitude, longitude, radius, limit } = result.data;
      
      // If coordinates are not provided, try to use the authenticated user's location
      if (!latitude || !longitude) {
        try {
          // Check if user is authenticated
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);
            
            if (decoded && decoded.type === 'user') {
              // Get user's last known location
              const user = await storage.getUserById(decoded.id);
              
              if (user && user.lastLatitude && user.lastLongitude) {
                latitude = user.lastLatitude;
                longitude = user.lastLongitude;
                console.log(`[Debug] Using user's location: lat=${latitude}, lng=${longitude}`);
              }
            }
          }
        } catch (error) {
          console.log("[Debug] Error getting user location:", error);
          // Continue with default coordinates if there's an error
        }
      }
      
      // If still no coordinates (user not logged in or no location saved), use default
      if (!latitude || !longitude) {
        latitude = "31.2156400";  // Default to Alexandria
        longitude = "29.9553200";
        console.log(`[Debug] Using default location: lat=${latitude}, lng=${longitude}`);
      } else {
        console.log(`[Debug] Using provided coordinates: lat=${latitude}, lng=${longitude}`);
      }
      
      console.log(`[Debug] Final search parameters: lat=${latitude}, lng=${longitude}, radius=${radius}, limit=${limit}`);
      
      // Get all restaurant IDs
      const restaurantIds = (await storage.getRestaurants()).map(r => r.id);
      
      // Calculate distance for each restaurant branch and filter by radius
      const nearbyRestaurants: Array<{ id: number; name: string; branches: Array<{ id: number; address: string; city: string; latitude: string; longitude: string; distance: number }> }> = [];
      
      // Process each restaurant with its branches
      for (const restaurantId of restaurantIds) {
        // Get the restaurant with full details including branches
        const restaurant = await storage.getRestaurantById(restaurantId);
        if (!restaurant) continue;
        
        const nearbyBranches: Array<{ id: number; address: string; city: string; latitude: string; longitude: string; distance: number }> = [];
        
        for (const branch of restaurant.branches) {
          if (branch.latitude && branch.longitude) {
            const distance = calculateDistance(
              parseFloat(latitude), 
              parseFloat(longitude), 
              parseFloat(branch.latitude), 
              parseFloat(branch.longitude)
            );
            
            if (distance <= radius) {
              nearbyBranches.push({
                id: branch.id,
                address: branch.address,
                city: branch.city,
                latitude: branch.latitude,
                longitude: branch.longitude,
                distance: parseFloat(distance.toFixed(2))
              } as const);
            }
          }
        }
        
        if (nearbyBranches.length > 0) {
          nearbyRestaurants.push({
            id: restaurant.id,
            name: restaurant.auth.name,
            branches: nearbyBranches
          } as const);
        }
      }
      
      // Sort by distance (closest first) and limit results
      nearbyRestaurants.sort((a, b) => {
        const minDistanceA = Math.min(...a.branches.map(branch => branch.distance || Infinity));
        const minDistanceB = Math.min(...b.branches.map(branch => branch.distance || Infinity));
        return minDistanceA - minDistanceB;
      });
      
      const limitedResults = nearbyRestaurants.slice(0, limit);
      
      res.json({
        success: true,
        count: limitedResults.length,
        restaurants: limitedResults
      });
    } catch (error) {
      console.error("Error finding nearby restaurants:", error);
      res.status(500).json({ error: "Server error finding nearby restaurants" });
    }
  });

  /**
   * Get Restaurant Details (Plural Route)
   * GET /api/restaurants/:id
   * 
   * Public endpoint to get details of a specific restaurant
   * This is an alternative route to match client expectations
   * 
   * URL parameters:
   * - id: Restaurant ID
   * 
   * Returns:
   * - 200: Restaurant details
   * - 404: Restaurant not found
   * - 500: Server error
   */
  app.get("/api/restaurants/:id", async (req: Request, res: Response) => {
    console.log('[Debug] GET /api/restaurants/:id', {
      params: req.params,
      headers: req.headers
    });
    
    try {
      const { id } = req.params;
      
      // Validate that id is a number
      if (isNaN(parseInt(id))) {
        console.log('[Debug] Invalid restaurant ID:', id);
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const restaurant = await storage.getRestaurant(parseInt(id));
      
      console.log('[Debug] Restaurant data:', restaurant);
      
      if (!restaurant) {
        console.log('[Debug] Restaurant not found');
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Set content type header explicitly
      res.setHeader('Content-Type', 'application/json');
      console.log('[Debug] Sending response with headers:', res.getHeaders());
      res.json(restaurant);
    } catch (error) {
      console.error("[Debug] Error getting restaurant:", error);
      res.status(500).json({ message: "Error retrieving restaurant" });
    }
  });


  app.get("/api/restaurant/:id", async (req: Request, res: Response) => {
    console.log('[Debug] GET /api/restaurant/:id', {
      params: req.params,
      headers: req.headers
    });
    
    try {
      const { id } = req.params;
      
      // Validate that id is a number
      if (isNaN(parseInt(id))) {
        console.log('[Debug] Invalid restaurant ID:', id);
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const restaurant = await storage.getRestaurant(parseInt(id));
      
      console.log('[Debug] Restaurant data:', restaurant);
      
      if (!restaurant) {
        console.log('[Debug] Restaurant not found');
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Set content type header explicitly
      res.setHeader('Content-Type', 'application/json');
      console.log('[Debug] Sending response with headers:', res.getHeaders());
      res.json(restaurant);
    } catch (error) {
      console.error("[Debug] Error getting restaurant:", error);
      res.status(500).json({ message: "Error retrieving restaurant" });
    }
  });

  /**
   * Get Branch Availability
   * GET /api/restaurant/:restaurantId/branch/:branchId/availability
   * 
   * Get available time slots for a specific branch on a given date
   * 
   * Query parameters:
   * - date: Date to check availability for (YYYY-MM-DD format)
   * 
   * Returns:
   * - 200: Object with time slots and their available seats
   * - 400: Invalid parameters
   * - 404: Branch not found
   * - 500: Server error
   */
  app.get("/api/restaurant/:restaurantId/branch/:branchId/availability", async (req: Request, res: Response) => {
    try {
      const { restaurantId, branchId } = req.params;
      const { date } = req.query;

      console.log('[Debug] Checking availability:', { restaurantId, branchId, date });

      if (!date || typeof date !== 'string') {
        return res.status(400).json({ message: "Date parameter is required (YYYY-MM-DD format)" });
      }

      const restaurantIdNum = parseInt(restaurantId);
      const branchIdNum = parseInt(branchId);

      if (isNaN(restaurantIdNum) || isNaN(branchIdNum)) {
        return res.status(400).json({ message: "Invalid restaurant or branch ID" });
      }

      // First verify the branch belongs to the restaurant
      const branch = await storage.getBranchById(branchIdNum, restaurantIdNum);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      // Get availability for the date
      const availability = await storage.getBranchAvailability(branchIdNum, new Date(date));

      // Set content type header explicitly
      res.setHeader('Content-Type', 'application/json');
      res.json(availability);
    } catch (error) {
      console.error("[Debug] Error getting branch availability:", error);
      res.status(500).json({ message: "Error retrieving branch availability" });
    }
  });

  /**
   * Save a Restaurant
   * POST /api/saved-branches
   * 
   * Save a restaurant to the user's favorites
   * 
   * Request body:
   * - restaurantId: ID of the restaurant to save
   * - branchIndex: Index of the branch to save
   * 
   * Returns:
   * - 200: Success message
   * - 401: Unauthorized (not logged in)
   * - 400: Invalid parameters
   * - 500: Server error
   */
  app.post("/api/saved-branches", requireUserAuth, async (req: Request, res: Response) => {
    try {
      // Get user ID safely
      const userId = getUserId(req);
      
      const { restaurantId, branchIndex } = req.body;

      // Validate input
      if (!restaurantId || branchIndex === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Ensure restaurantId and branchIndex are numbers
      const restaurantIdNum = Number(restaurantId);
      const branchIndexNum = Number(branchIndex);

      // Check if already saved
      const alreadySaved = await storage.isRestaurantSaved(userId, restaurantIdNum, branchIndexNum);
      if (alreadySaved) {
        return res.json({ message: "Restaurant already saved", alreadySaved: true });
      }

      // Save to database
      await storage.saveRestaurant(userId, restaurantIdNum, branchIndexNum);
      
      console.log(`User ${userId} saved restaurant ${restaurantIdNum} branch ${branchIndexNum}`);
      res.status(201).json({ success: true, message: "Restaurant saved successfully" });
    } catch (error) {
      console.error("Error saving restaurant:", error);
      res.status(500).json({ message: "Failed to save restaurant" });
    }
  });

  /**
   * Delete Saved Restaurant
   * DELETE /api/saved-branches/:restaurantId/:branchIndex
   * 
   * Remove a restaurant from the user's favorites
   * 
   * URL parameters:
   * - restaurantId: ID of the restaurant to remove
   * - branchIndex: Index of the branch to remove
   * 
   * Returns:
   * - 200: Success message
   * - 401: Unauthorized (not logged in)
   * - 404: Restaurant not found in saved list
   * - 500: Server error
   */
  app.delete("/api/saved-branches/:restaurantId/:branchIndex", requireUserAuth, async (req: Request, res: Response) => {
    try {
      // Get user ID safely
      const userId = getUserId(req);
      
      const { restaurantId, branchIndex } = req.params;

      // Ensure restaurantId and branchIndex are numbers
      const restaurantIdNum = parseInt(restaurantId);
      const branchIndexNum = parseInt(branchIndex);

      // Remove from database
      await storage.removeSavedRestaurant(userId, restaurantIdNum, branchIndexNum);
      
      console.log(`User ${userId} removed restaurant ${restaurantIdNum} branch ${branchIndexNum}`);
      res.json({ success: true, message: "Restaurant removed from saved list" });
    } catch (error) {
      console.error("Error removing saved restaurant:", error);
      res.status(500).json({ message: "Failed to remove saved restaurant" });
    }
  });

  /**
   * Get Saved Restaurants
   * GET /api/saved-branches
   * 
   * Get all restaurants saved by the current user
   * 
   * Returns:
   * - 200: Array of saved restaurants
   * - 401: Unauthorized (not logged in)
   * - 500: Server error
   */
  app.get("/api/saved-branches", requireUserAuth, async (req: Request, res: Response) => {
    try {
      // Get user ID safely
      const userId = getUserId(req);
      
      // Get saved restaurants
      const saved = await storage.getSavedRestaurants(userId);
      
      res.json(saved);
    } catch (error) {
      console.error("Error getting saved restaurants:", error);
      res.status(500).json({ message: "Failed to get saved restaurants" });
    }
  });

  /**
   * Check if Restaurant is Saved
   * GET /api/saved-branches/:restaurantId/:branchIndex
   * 
   * Check if a specific restaurant is saved by the current user
   * 
   * URL parameters:
   * - restaurantId: ID of the restaurant to check
   * - branchIndex: Index of the branch to check
   * 
   * Returns:
   * - 200: { saved: boolean }
   * - 401: Unauthorized (not logged in)
   * - 500: Server error
   */
  app.get("/api/saved-branches/:restaurantId/:branchIndex", requireUserAuth, async (req: Request, res: Response) => {
    try {
      // Get user ID safely
      const userId = getUserId(req);
      
      const { restaurantId, branchIndex } = req.params;

      // Ensure restaurantId and branchIndex are numbers
      const restaurantIdNum = parseInt(restaurantId);
      const branchIndexNum = parseInt(branchIndex);

      // Check if restaurant is saved
      const saved = await storage.isRestaurantSaved(userId, restaurantIdNum, branchIndexNum);
      
      res.json({ saved });
    } catch (error) {
      console.error("Error checking if restaurant is saved:", error);
      res.status(500).json({ message: "Failed to check if restaurant is saved" });
    }
  });

  /**
   * Get Default Time Slots
   * GET /api/default-time-slots
   * 
   * Get default time slots based on current time + 5 hours
   * 
   * Returns:
   * - 200: Array of time slots in HH:MM format
   */
  app.get("/api/default-time-slots", (req: Request, res: Response) => {
    try {
      // Use the existing getDefaultTimeSlots method from storage
      const timeSlots = storage.getDefaultTimeSlots();
      console.log("Sending default time slots:", timeSlots);
      res.json(timeSlots);
    } catch (error) {
      console.error("Error getting default time slots:", error);
      res.status(500).json({ message: "Failed to get default time slots" });
    }
  });

  /**
   * Get Restaurant Location Details
   * GET /api/restaurants/:id/location
   * 
   * Gets detailed location information for a specific restaurant
   * 
   * URL parameters:
   * - id: number - Restaurant ID
   * 
   * Query parameters:
   * - branchId: number (optional) - Specific branch ID
   * - userLatitude: string (optional) - User's current latitude for distance calculation
   * - userLongitude: string (optional) - User's current longitude for distance calculation
   * 
   * Returns:
   * - 200: Restaurant location details including coordinates and distance
   * - 404: Restaurant not found
   * - 500: Server error
   */
  app.get("/api/restaurants/:id/location", async (req: Request, res: Response) => {
    try {
      console.log("[Debug] GET /api/restaurants/:id/location params:", req.params, "query:", req.query);
      
      const restaurantId = parseInt(req.params.id);
      
      // Validate restaurant ID
      if (isNaN(restaurantId)) {
        console.log(`[Debug] Invalid restaurant ID: ${req.params.id}`);
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
      const userLatitude = req.query.userLatitude as string | undefined;
      const userLongitude = req.query.userLongitude as string | undefined;
      
      // Get restaurant data
      const restaurant = await storage.getRestaurantById(restaurantId);
      
      if (!restaurant) {
        console.log(`[Debug] Restaurant not found: ${restaurantId}`);
        return res.status(404).json({ error: "Restaurant not found" });
      }
      
      console.log(`[Debug] Found restaurant: ${restaurantId}, branches: ${restaurant.branches.length}`);
      
      // Filter branches if branchId is provided
      let branches = restaurant.branches;
      if (branchId) {
        branches = branches.filter(branch => branch.id === branchId);
        if (branches.length === 0) {
          return res.status(404).json({ error: "Branch not found" });
        }
      }
      
      // Add distance information if user coordinates are provided
      if (userLatitude && userLongitude) {
        branches = branches.map(branch => {
          if (branch.latitude && branch.longitude) {
            const distance = calculateDistance(
              parseFloat(userLatitude),
              parseFloat(userLongitude),
              parseFloat(branch.latitude),
              parseFloat(branch.longitude)
            );
            
            return {
              ...branch,
              distance: parseFloat(distance.toFixed(2))
            };
          }
          return branch;
        });
      }
      
      res.json({
        success: true,
        restaurant: {
          id: restaurant.id,
          name: restaurant.auth.name,
          branches: branches.map(branch => ({
            id: branch.id,
            address: branch.address,
            city: branch.city,
            latitude: branch.latitude,
            longitude: branch.longitude,
            distance: branch.distance
          }))
        }
      });
    } catch (error) {
      console.error("Error getting restaurant location:", error);
      res.status(500).json({ error: "Server error getting restaurant location" });
    }
  });

  // === USER PROFILE ENDPOINTS ===

  /**
   * Get User Profile
   * GET /api/user/profile
   * 
   * Returns the current user's detailed profile information.
   * 
   * Returns:
   * - 200: User profile data
   * - 401: Not authenticated
   * - 500: Server error
   */
  app.get("/api/user/profile", requireUserAuth, async (req: Request, res: Response) => {
    try {
      // Get user ID safely
      const userId = getUserId(req);
      
      const userProfile = await storage.getUserById(userId);
      
      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      // Add created date to the response
      const userWithCreatedDate = {
        ...userProfile,
        createdAt: userProfile.createdAt || new Date().toISOString()
      };
      
      res.json(userWithCreatedDate);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  /**
   * Update User Profile
   * PUT /api/user/profile
   * 
   * Updates the current user's profile information.
   * 
   * Request body:
   * - firstName: User's first name
   * - lastName: User's last name
   * - city: User's city
   * - gender: User's gender
   * - favoriteCuisines: Array of user's preferred cuisine types
   * 
   * Returns:
   * - 200: Profile updated successfully
   * - 400: Invalid request data
   * - 401: Not authenticated
   * - 500: Server error
   */
  app.put("/api/user/profile", requireUserAuth, async (req: Request, res: Response) => {
    try {
      // Get user ID safely
      const userId = getUserId(req);
      
      const { firstName, lastName, city, gender, favoriteCuisines } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName || !city || !gender || !Array.isArray(favoriteCuisines)) {
        console.log('Profile update validation failed:', { firstName, lastName, city, gender, favoriteCuisines });
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Update user profile
      console.log('Server received profile update request:', {
        userId,
        firstName,
        lastName,
        city,
        gender,
        favoriteCuisines
      });
      
      await storage.updateUserProfile(userId, {
        firstName,
        lastName,
        city,
        gender,
        favoriteCuisines
      });
      
      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  /**
   * Update User Location
   * POST /api/users/location
   * 
   * Updates the user's current location
   * 
   * Request body:
   * - latitude: string - User's current latitude
   * - longitude: string - User's current longitude
   * 
   * Returns:
   * - 200: Success message
   * - 400: Invalid input
   * - 401: Unauthorized (not logged in)
   * - 500: Server error
   */
  app.post("/api/users/location", requireUserAuth, async (req: Request, res: Response) => {
    try {
      // Validate input
      const locationSchema = z.object({
        latitude: z.string().refine(val => !isNaN(parseFloat(val)), {
          message: "Latitude must be a valid number"
        }),
        longitude: z.string().refine(val => !isNaN(parseFloat(val)), {
          message: "Longitude must be a valid number"
        })
      });

      const result = locationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: result.error.format() 
        });
      }

      // Get user ID safely
      const userId = getUserId(req);
      
      // Update user location in database
      await storage.updateUserLocation(userId, {
        lastLatitude: result.data.latitude,
        lastLongitude: result.data.longitude,
        locationUpdatedAt: new Date(),
        locationPermissionGranted: true
      });
      
      console.log(`Updated location for user ${userId}: ${result.data.latitude}, ${result.data.longitude}`);
      res.json({ success: true, message: "Location updated successfully" });
    } catch (error) {
      console.error("Error updating user location:", error);
      res.status(500).json({ error: "Server error updating location" });
    }
  });

  // PROTECTED ROUTES (login required)

  /**
   * Get All User Bookings
   */
  app.get("/api/bookings", requireUserAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get user ID safely
      const userId = getUserId(req);

      // Get all bookings for the user
      const bookings = await storage.getUserBookings(userId);
      
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      next(error);
    }
  });

  /**
   * Get Booking Details
   */
  app.get("/api/bookings/:bookingId", requireUserAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookingId } = req.params;
      
      // Get user ID safely
      const userId = getUserId(req);

      // Parse and validate bookingId
      const bookingIdNum = parseInt(bookingId, 10);
      if (isNaN(bookingIdNum)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }

      // Get booking details
      const booking = await storage.getBookingByIdAndUser(bookingIdNum, userId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Create New Booking
   * POST /api/bookings
   * 
   * Creates a new booking for the authenticated user
   * 
   * Request body:
   * - branchId: ID of the restaurant branch
   * - date: ISO string of the booking date and time
   * - partySize: Number of people in the party
   * 
   * Returns:
   * - 201: Booking created successfully (includes booking details)
   * - 400: Invalid parameters
   * - 401: Unauthorized (not logged in)
   * - 409: Conflict (time slot not available)
   * - 500: Server error
   */
  app.post("/api/bookings", requireUserAuth, async (req: Request, res: Response) => {
    try {
      console.log('Creating new booking:', req.body);
      const { branchId, date, partySize } = req.body;
      
      // Get user ID safely
      const userId = getUserId(req);
      
      // Validate input
      if (!branchId || !date || !partySize) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Parse date and validate it's in the future
      const bookingDate = new Date(date);
      if (isNaN(bookingDate.getTime())) {
        return res.status(400).json({ message: "Invalid booking date" });
      }

      // Extract time in HH:MM format for availability check
      const timeString = bookingDate.toTimeString().substring(0, 5);
      console.log('Checking availability for time:', timeString);

      // Check if the time slot is available
      const availability = await storage.getBranchAvailability(branchId, bookingDate);
      console.log('Available seats:', availability[timeString]);
      
      if (!availability[timeString] || availability[timeString] < partySize) {
        return res.status(409).json({ message: "Not enough seats available for this time slot" });
      }

      // Create the booking
      const booking = await storage.createBooking({
        userId,
        branchId,
        date: bookingDate,
        partySize,
        arrived: false,
        arrivedAt: null,  // Add this field to match the ExtendedBooking type
        completed: false
      });
      
      // Set content type header explicitly
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  /**
   * Cancel a booking
   */
  app.post("/api/bookings/:bookingId/cancel", requireUserAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookingId } = req.params;
      
      // Get user ID safely
      const userId = getUserId(req);

      // Parse and validate bookingId
      const bookingIdNum = parseInt(bookingId, 10);
      if (isNaN(bookingIdNum)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }

      // Get the booking to verify ownership
      const booking = await storage.getBookingById(bookingIdNum);
      
      // Check if booking exists
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Verify that the booking belongs to the authenticated user
      if (booking.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to cancel this booking" });
      }

      // Cancel the booking
      const cancelledBooking = await storage.cancelBooking(bookingIdNum);
      
      // Notify clients about the cancellation via WebSocket
      const message = {
        type: 'booking_cancelled',
        data: {
          bookingId: bookingIdNum,
          userId: booking.userId,
          restaurantId: booking.restaurantId
        }
      };
      
      // Broadcast the message to relevant clients
      clients.forEach((clientInfo, clientWs) => {
        if (
          (clientInfo.userType === 'restaurant' && clientInfo.userId === booking.restaurantId) ||
          (clientInfo.userType === 'user' && clientInfo.userId === booking.userId)
        ) {
          try {
            clientWs.send(JSON.stringify(message));
          } catch (error) {
            console.error('Error sending cancellation message to client:', error);
          }
        }
      });

      res.json(cancelledBooking);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      next(error);
    }
  });

  /**
   * Update a booking
   * PUT /api/bookings/:bookingId
   * 
   * Updates an existing booking for the authenticated user
   * 
   * Request body:
   * - date: ISO string of the new booking date and time (optional)
   * - time: Time of the booking in HH:MM format (optional)
   * - partySize: Number of people for the booking (optional)
   * 
   * Responses:
   * - 200: Booking updated successfully (includes updated booking details)
   * - 400: Invalid request parameters
   * - 403: Not authorized to update this booking
   * - 404: Booking not found
   * - 500: Server error
   */
  app.put("/api/bookings/:bookingId", requireUserAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookingId } = req.params;
      const { date, time, partySize } = req.body;
      
      // Get user ID safely
      const userId = getUserId(req);

      // Parse and validate bookingId
      const bookingIdNum = parseInt(bookingId, 10);
      if (isNaN(bookingIdNum)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }

      // Get the booking to verify ownership
      const booking = await storage.getBookingById(bookingIdNum);
      
      // Check if booking exists
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Verify that the booking belongs to the authenticated user
      if (booking.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this booking" });
      }

      // Prepare the date and time values
      let bookingDate: Date | undefined;
      
      // If both date and time are provided, combine them
      if (date && time) {
        // Validate time format (HH:MM)
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(time)) {
          return res.status(400).json({ message: "Invalid time format. Use HH:MM" });
        }
        
        // Parse the date string
        const dateParts = date.split('-').map(Number);
        if (dateParts.length !== 3) {
          return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
        }
        
        // Parse the time string
        const timeParts = time.split(':').map(Number);
        
        // Create a new Date object with the combined date and time
        bookingDate = new Date(
          dateParts[0],         // year
          dateParts[1] - 1,     // month (0-indexed)
          dateParts[2],         // day
          timeParts[0],         // hours
          timeParts[1]          // minutes
        );
        
        if (isNaN(bookingDate.getTime())) {
          return res.status(400).json({ message: "Invalid date or time" });
        }
      }
      // If only date is provided
      else if (date) {
        bookingDate = new Date(date);
        if (isNaN(bookingDate.getTime())) {
          return res.status(400).json({ message: "Invalid booking date" });
        }
      }

      // Validate party size if provided
      let partySizeNum: number | undefined;
      if (partySize !== undefined) {
        partySizeNum = parseInt(partySize, 10);
        if (isNaN(partySizeNum) || partySizeNum < 1) {
          return res.status(400).json({ message: "Invalid party size" });
        }
      }

      // Update the booking
      const updatedBooking = await storage.updateBooking(bookingIdNum, {
        date: bookingDate,
        partySize: partySizeNum
      });
      
      if (!updatedBooking) {
        return res.status(500).json({ message: "Failed to update booking" });
      }

      // Notify clients about the update via WebSocket
      const message = {
        type: 'booking_updated',
        data: {
          bookingId: bookingIdNum,
          userId: booking.userId,
          restaurantId: booking.restaurantId,
          updatedFields: {
            date: bookingDate ? bookingDate.toISOString() : undefined,
            partySize: partySizeNum
          }
        }
      };

      // Send notification to restaurant
      clients.forEach((client, ws) => {
        if (client.userType === 'restaurant' && client.userId === booking.restaurantId) {
          ws.send(JSON.stringify(message));
        }
      });

      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      next(error);
    }
  });

  /**
   * Get Restaurant Bookings
   * GET /api/restaurant/bookings/:restaurantId
   * 
   * Get all bookings for a specific restaurant
   * 
   * URL parameters:
   * - restaurantId: ID of the restaurant to get bookings for
   * 
   * Returns:
   * - 200: Array of bookings with user details
   * - 401: Unauthorized (not logged in as restaurant)
   * - 404: Restaurant not found
   * - 500: Server error
   */
  app.get("/api/restaurant/bookings/:restaurantId", requireRestaurantAuth, async (req: Request, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const authUser = req.user as AuthenticatedUser;
      
      // Verify that the authenticated restaurant is requesting their own bookings
      if (authUser.type !== 'restaurant' || authUser.id !== parseInt(restaurantId)) {
        return res.status(403).json({ message: "Unauthorized access to restaurant bookings" });
      }
      
      // Get all bookings for the restaurant
      const bookings = await storage.getRestaurantBookings(parseInt(restaurantId));
      
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching restaurant bookings:", error);
      res.status(500).json({ message: "Failed to fetch restaurant bookings" });
    }
  });

  /**
   * Mark Booking as Arrived
   * POST /api/restaurant/bookings/:bookingId/arrive
   * 
   * Mark a booking as arrived (customer has arrived at the restaurant)
   * 
   * URL parameters:
   * - bookingId: ID of the booking to mark as arrived
   * 
   * Returns:
   * - 200: Success message
   * - 401: Unauthorized (not logged in as restaurant)
   * - 404: Booking not found
   * - 500: Server error
   */
  app.post("/api/restaurant/bookings/:bookingId/arrive", requireRestaurantAuth, async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.params;
      const authUser = req.user as AuthenticatedUser;
      
      // Verify booking exists and belongs to this restaurant
      const booking = await storage.getBookingById(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Verify restaurant owns this booking
      if (booking.restaurantId !== authUser.id) {
        return res.status(403).json({ message: "Unauthorized access to booking" });
      }
      
      // Mark booking as arrived
      await storage.markBookingArrived(parseInt(bookingId), new Date());
      
      res.json({ success: true, message: "Booking marked as arrived" });
    } catch (error) {
      console.error("Error marking booking as arrived:", error);
      res.status(500).json({ message: "Failed to mark booking as arrived" });
    }
  });

  /**
   * Mark Booking as Complete
   * POST /api/restaurant/bookings/:bookingId/complete
   * 
   * Mark a booking as complete (customer has finished their meal)
   * 
   * URL parameters:
   * - bookingId: ID of the booking to mark as complete
   * 
   * Returns:
   * - 200: Success message
   * - 401: Unauthorized (not logged in as restaurant)
   * - 404: Booking not found
   * - 500: Server error
   */
  app.post("/api/restaurant/bookings/:bookingId/complete", requireRestaurantAuth, async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.params;
      const authUser = req.user as AuthenticatedUser;
      
      // Verify booking exists and belongs to this restaurant
      const booking = await storage.getBookingById(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Verify restaurant owns this booking
      if (booking.restaurantId !== authUser.id) {
        return res.status(403).json({ message: "Unauthorized access to booking" });
      }
      
      // Mark booking as complete
      await storage.markBookingComplete(parseInt(bookingId));
      
      res.json({ success: true, message: "Booking marked as complete" });
    } catch (error) {
      console.error("Error marking booking as complete:", error);
      res.status(500).json({ message: "Failed to mark booking as complete" });
    }
  });

  /**
   * Cancel Restaurant Booking
   * POST /api/restaurant/bookings/:bookingId/cancel
   * 
   * Cancel a booking from the restaurant side
   * 
   * URL parameters:
   * - bookingId: ID of the booking to cancel
   * 
   * Returns:
   * - 200: Success message
   * - 401: Unauthorized (not logged in as restaurant)
   * - 404: Booking not found
   * - 500: Server error
   */
  app.post("/api/restaurant/bookings/:bookingId/cancel", requireRestaurantAuth, async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.params;
      const authUser = req.user as AuthenticatedUser;
      
      // Verify booking exists and belongs to this restaurant
      const booking = await storage.getBookingById(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Verify restaurant owns this booking
      if (booking.restaurantId !== authUser.id) {
        return res.status(403).json({ message: "Unauthorized access to booking" });
      }
      
      // Cancel booking
      await storage.cancelBooking(parseInt(bookingId));
      
      res.json({ success: true, message: "Booking cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // === WEBSOCKET SERVER SETUP ===
  const wss = new WebSocketServer({ server: httpServer });

  // Handle new WebSocket connections
  wss.on('connection', async (ws: WebSocket, req) => {
    try {
      // Extract token from URL query parameters
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
        ws.close();
        return;
      }
      
      // Verify token and get user info
      let userId: number;
      let userType: 'user' | 'restaurant';
      
      try {
        // Verify token (you'll need to implement this function)
        const decoded = verifyToken(token);
        userId = decoded.id;
        userType = decoded.type;
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
        ws.close();
        return;
      }

      // Store client information
      clients.set(ws, {
        userId,
        userType,
        isAlive: true
      });

      // Send confirmation message
      ws.send(JSON.stringify({
        type: 'connection_established',
        data: { userId, userType }
      }));

      // Handle incoming messages
      ws.on('message', (data: string) => {
        try {
          const message: WebSocketMessage = JSON.parse(data);
          console.log('Received message:', message.type);
          
          // Handle different message types
          switch (message.type) {
            case 'heartbeat':
              const client = clients.get(ws);
              if (client) {
                client.isAlive = true;
              }
              break;

            case 'init':
              if (!message.data?.userId || !message.data?.userType) {
                console.error('Invalid init message:', message);
                return;
              }
              // Initialize client connection
              clients.set(ws, {
                userId: message.data.userId,
                userType: message.data.userType as 'user' | 'restaurant',
                isAlive: true
              });
              // Send confirmation
              ws.send(JSON.stringify({
                type: 'connection_established',
                data: { message: 'Successfully initialized connection' }
              }));
              break;

            case 'logout':
              clients.delete(ws);
              ws.close();
              break;

            case 'new_booking':
            case 'booking_cancelled':
            case 'booking_arrived':
            case 'booking_completed':
              // Forward booking-related messages to relevant clients
              const { restaurantId, userId } = message.data;
              clients.forEach((clientInfo, clientWs) => {
                if (
                  (clientInfo.userType === 'restaurant' && clientInfo.userId === restaurantId) ||
                  (clientInfo.userType === 'user' && clientInfo.userId === userId)
                ) {
                  try {
                    clientWs.send(JSON.stringify(message));
                  } catch (error) {
                    console.error('Error sending message to client:', error);
                    clients.delete(clientWs);
                    clientWs.terminate();
                  }
                }
              });
              break;

            default:
              console.warn('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });

      // Handle WebSocket close event
      ws.on('close', () => {
        console.log('Client disconnected from /ws');
        clients.delete(ws);
      });

      // Handle WebSocket error event
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
        ws.terminate();
      });

      // Handle WebSocket pong event
      ws.on('pong', () => {
        const client = clients.get(ws);
        if (client) {
          client.isAlive = true;
        }
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close();
    }
  });

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  });

  return httpServer;
}

// Helper function to verify JWT token
function verifyToken(token: string): { id: number; type: 'user' | 'restaurant' } {
  try {
    // This should match the JWT verification in authenticateJWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key');
    
    if (typeof decoded !== 'object' || !decoded.id || !decoded.type) {
      throw new Error('Invalid token data');
    }
    
    return {
      id: decoded.id,
      type: decoded.type as 'user' | 'restaurant'
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}