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

// === Authentication & Security ===
import { setupAuth, hashPassword, cookieSettings } from "./auth";
import passport from 'passport';

// === Database & Storage ===
import { DatabaseStorage } from "./storage";
import { pool } from "./db";

// === Utilities ===
import { parseISO} from 'date-fns';

// === Session Management ===
import connectPg from 'connect-pg-simple';
import session from 'express-session';

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
  sessionID: string;      // Unique session identifier
  userId: number;         // User's database ID
  userType: 'user' | 'restaurant';  // Type of user connected
  isAlive: boolean;      // Connection health status
}

// Create PostgreSQL session store for persistent sessions
const PgStore = connectPg(session) as any;

// Track connected WebSocket clients
const clients = new Map<WebSocket, WebSocketClient & { isAlive: boolean }>();

// Define user types
interface AuthenticatedUser {
  id: number;
  type: 'user' | 'restaurant';
}

interface WebSocketClient {
  sessionID: string;
  userId: number;
  userType: 'user' | 'restaurant';
  isAlive: boolean;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
  }
}

// Define authentication middleware
const requireRestaurantAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user || req.user.type !== 'restaurant') {
    return res.status(401).json({ message: "Not authenticated as restaurant" });
  }
  next();
};

const requireUserAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user || req.user.type !== 'user') {
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

  // === BASIC MIDDLEWARE SETUP ===
  
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

  // === SESSION CONFIGURATION ===

  // Set up database-backed session storage
  const sessionStore = new PgStore({
    pool,                           // Database connection
    tableName: 'session',          // Where to store sessions
    createTableIfMissing: true,    // Auto-create table
    pruneSessionInterval: 60 * 15,  // Clean up every 15 mins
    errorLog: console.error.bind(console, 'Session store error:')
  });

  // Give our storage class access to sessions
  storage.setSessionStore(sessionStore);

  // Configure session behavior
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',  // For security
    resave: true,              // Save all sessions
    saveUninitialized: false,  // Don't save empty sessions
    store: sessionStore,       // Use PostgreSQL storage
    cookie: cookieSettings,    // Cookie configuration
    name: 'connect.sid',       // Cookie name
    rolling: true,            // Extend session on activity
    proxy: true               // Trust our proxy server
  };

  // Enable session handling
  app.use(session(sessionSettings));

  // Initialize authentication
  app.use(passport.initialize());
  app.use(passport.session());

  // === PUBLIC ROUTES (No Login Required) ===

  /**
   * Register New User
   * POST /api/register
   * 
   * Creates a new user account with the provided information and logs them in.
   * 
   * Request body:
   * - email: User's email address
   * - password: User's chosen password
   * - firstName: User's first name
   * - lastName: User's last name
   * - gender: User's gender
   * - birthday: User's date of birth
   * - city: User's city
   * - favoriteCuisines: Array of user's preferred cuisine types
   * 
   * Returns:
   * - 200: User created successfully (includes user data)
   * - 400: Email already registered
   * - 500: Server error
   */
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      // Get user information from request
      const { email, password, firstName, lastName, gender, birthday, 
              city, favoriteCuisines } = req.body;
      
      // Check if email is already registered
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Securely hash the password
      const hashedPassword = await hashPassword(password);
      
      // Create new user in database
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        gender,
        birthday,
        city,
        favoriteCuisines: Array.isArray(favoriteCuisines) ? favoriteCuisines : []
      });

      // Log the new user in automatically
      req.login({ ...user, type: 'user' as const }, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login error occurred" });
        }
        // Set their session cookie
        res.cookie('connect.sid', req.sessionID, cookieSettings);
        // Send back the user data
        res.status(200).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  /**
   * Restaurant Login
   * POST /api/restaurant/login
   * 
   * Authenticates restaurant accounts using their credentials.
   * Uses a special passport strategy for restaurant authentication.
   * 
   * Request body:
   * - email: Restaurant's email address
   * - password: Restaurant's password
   * 
   * Returns:
   * - 200: Login successful (includes restaurant data)
   * - 401: Invalid credentials
   * - 500: Server error
   */
  app.post("/api/restaurant/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('restaurant-local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error occurred" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      // Log the restaurant in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login error occurred" });
        }

        // Set their session cookie and return their data
        res.cookie('connect.sid', req.sessionID, cookieSettings);
        res.status(200).json({ ...user, type: 'restaurant' });
      });
    })(req, res, next);
  });

  /**
   * User Login
   * POST /api/login
   * 
   * Authenticates regular user accounts using their credentials.
   * Uses the default passport local strategy for authentication.
   * 
   * Request body:
   * - email: User's email address
   * - password: User's password
   * 
   * Returns:
   * - 200: Login successful (includes user data)
   * - 401: Invalid credentials
   * - 500: Server error
   */
  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error occurred" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login error occurred" });
        }

        // Set their session cookie and return their data
        res.cookie('connect.sid', req.sessionID, cookieSettings);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

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
      '/restaurants/availability'
    ];
    
    // If it's a public path, let them through
    if (publicPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // If not logged in, stop here
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // If logged in, continue to the route
    next();
  });

  // Set up authentication (from auth.ts)
  setupAuth(app);

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
   * Get Restaurant Details
   * GET /api/restaurant/:id
   * 
   * Public endpoint to get details of a specific restaurant
   * 
   * URL parameters:
   * - id: Restaurant ID
   * 
   * Returns:
   * - 200: Restaurant details
   * - 404: Restaurant not found
   * - 500: Server error
   */
  app.get("/api/restaurant/:id", async (req: Request, res: Response) => {
    console.log('[Debug] GET /api/restaurant/:id', {
      params: req.params,
      headers: req.headers
    });
    
    try {
      const { id } = req.params;
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
   * Get restaurants with availability
   */
  app.get('/api/restaurants/availability', async (req, res) => {
    try {
      console.log('SERVER: Received availability request:', {
        query: req.query,
        params: req.params,
        body: req.body
      });

      const { date, time, partySize, city, cuisine, priceRange, search } = req.query;
      
      // All parameters are now optional - using defaults from storage layer
      const parsedDate = date ? parseISO(date as string) : new Date();
      const parsedPartySize = partySize ? parseInt(partySize as string) : 2;

      console.log('SERVER: Parsed parameters:', {
        parsedDate,
        time,
        parsedPartySize,
        city,
        cuisine,
        priceRange,
        search
      });

      const restaurants = await storage.findRestaurantsWithAvailability(
        parsedDate,
        parsedPartySize,
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

  // PROTECTED ROUTES (login required)

  /**
   * Get Restaurant Branch Details
   */
  app.get("/api/restaurant/branches/:branchId", requireRestaurantAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { branchId } = req.params;
      
      // Get user ID from authenticated request
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const restaurantId = req.user.id;

      // Parse and validate branchId
      const branchIdNum = parseInt(branchId, 10);
      if (isNaN(branchIdNum)) {
        return res.status(400).json({ message: "Invalid branch ID" });
      }

      // Get the branch details from database
      const branch = await storage.getBranchById(branchIdNum, restaurantId);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      // Get branch availability
      const availability = await storage.getBranchAvailability(branchIdNum, new Date());

      res.json({ ...branch, availability });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get Booking Details
   */
  app.get("/api/bookings/:bookingId", requireUserAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookingId } = req.params;
      
      // Get user ID from authenticated request
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = req.user.id;

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

  // === WEBSOCKET SETUP ===
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws' // Dedicated path for our WebSocket connections
  });

  // Heartbeat interval to keep connections alive (check every 60 seconds)
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      const client = clients.get(ws);
      if (!client || !client.isAlive) {
        clients.delete(ws);
        ws.terminate();
        return;
      }
      client.isAlive = false;
      try {
        ws.ping();
      } catch (error) {
        console.error('Error sending ping:', error);
        clients.delete(ws);
        ws.terminate();
      }
    });
  }, 60000); // 60 seconds

  // Clean up interval on server close
  httpServer.on('close', () => {
    clearInterval(heartbeatInterval);
    wss.clients.forEach((ws) => {
      ws.terminate();
    });
    clients.clear();
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection on /ws path');

    // Send connection established message
    ws.send(JSON.stringify({
      type: 'connection_established',
      data: { message: 'Connected to server' }
    }));

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
            if (!message.data?.sessionID || !message.data?.userId || !message.data?.userType) {
              console.error('Invalid init message:', message);
              return;
            }
            // Initialize client connection
            clients.set(ws, {
              sessionID: message.data.sessionID,
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
            const clientToLogout = clients.get(ws);
            if (clientToLogout?.sessionID) {
              // Find and destroy the session
              sessionStore.destroy(clientToLogout.sessionID, (err: Error | null) => {
                if (err) console.error('Error destroying session:', err);
                clients.delete(ws);
                ws.close();
              });
            }
            break;

          case 'new_booking':
          case 'booking_cancelled':
          case 'booking_arrived':
          case 'booking_completed':
            // Forward booking-related messages to relevant clients
            const { restaurantId, userId } = message.data;
            clients.forEach((clientInfo, clientWs) => {
              if (
                clientInfo.userType === 'restaurant' && clientInfo.userId === restaurantId ||
                clientInfo.userType === 'user' && clientInfo.userId === userId
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

    ws.on('close', () => {
      console.log('Client disconnected from /ws');
      const client = clients.get(ws);
      if (client?.sessionID) {
        // Clean up session when tab closes
        sessionStore.destroy(client.sessionID, (err: Error | null) => {
          if (err) console.error('Error destroying session:', err);
        });
      }
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
      ws.terminate();
    });

    ws.on('pong', () => {
      const client = clients.get(ws);
      if (client) {
        client.isAlive = true;
      }
    });
  });

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  });

  return httpServer;
}