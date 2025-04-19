// ==================== Imports ====================

// === Core Server Packages ===
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import express from 'express';
// WebSocket enables real-time updates (e.g., instant booking notifications)
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { z } from 'zod';

// === Authentication & Security ===
import { setupAuth, authenticateJWT } from "./auth";
import jwt from 'jsonwebtoken';

// === Database & Storage ===
import { DatabaseStorage } from "./storage";

// === Utilities ===


// Initialize our database operations helper
const storage = new DatabaseStorage();

// ==================== Middleware Functions ====================

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

// ==================== Controller Imports ====================
// No controllers are imported in this example

// ==================== Main Routes Registration ====================

/**
 * Main Routes Configuration Function
 * Sets up all server endpoints and WebSocket functionality
 */
export function registerRoutes(app: Express): Server {
  // ----- Basic Middleware Setup -----
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

  // ----- Authentication Setup -----
  // Set up authentication (from auth.ts)
  // This needs to be called before defining other routes to avoid conflicts
  setupAuth(app);

  // ----- Public Routes (No Login Required) -----
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

  // ... (other routes)

  // === WebSocket Server Setup ===
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