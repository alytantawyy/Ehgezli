import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { and, eq } from "drizzle-orm";
import { bookings, restaurantBranches } from "@shared/schema";
import { parse as parseCookie } from 'cookie';

// Define WebSocket message types
type WebSocketMessage = {
  type: 'new_booking' | 'booking_cancelled' | 'heartbeat';
  data?: any;
};

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Track active connections
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
      url: req.url
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

      // Verify session using callback pattern
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

        // Set up message handlers
        ws.on('pong', () => {
          const client = clients.get(ws);
          if (client) {
            client.isAlive = true;
          }
        });

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message.toString()) as WebSocketMessage;
            console.log('Received WebSocket message:', {
              type: data.type,
              sessionID: cleanSessionId,
              userId: id
            });

            if (data.type === 'heartbeat') {
              ws.send(JSON.stringify({ type: 'heartbeat' }));
            }
          } catch (error) {
            console.error('WebSocket message parsing error:', error);
          }
        });

        ws.on('error', (error) => {
          console.error('WebSocket error:', {
            error,
            sessionID: cleanSessionId,
            userId: id
          });
        });

        ws.on('close', () => {
          console.log('WebSocket connection closed:', {
            sessionID: cleanSessionId,
            userId: id
          });
          clients.delete(ws);
        });
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

  setupAuth(app);

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

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      message: err.message || "Internal server error"
    });
  });

  return httpServer;
}