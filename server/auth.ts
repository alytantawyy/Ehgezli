import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, RestaurantAuth as SelectRestaurantAuth } from "@shared/schema";

declare global {
  namespace Express {
    // Extend Express.User to allow both User and RestaurantAuth types
    interface User extends Partial<SelectUser>, Partial<SelectRestaurantAuth> {
      type?: 'user' | 'restaurant';
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: app.get("env") === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Restaurant authentication strategy
  passport.use('restaurant-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const restaurant = await storage.getRestaurantAuthByEmail(email);
      if (!restaurant || !(await comparePasswords(password, restaurant.password))) {
        return done(null, false);
      }
      return done(null, { ...restaurant, type: 'restaurant' });
    } catch (err) {
      return done(err);
    }
  }));

  // User authentication strategy
  passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      }
      return done(null, { ...user, type: 'user' });
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: Express.User, done) => {
    if (!user || !user.id || !user.type) {
      return done(new Error('Invalid user data for serialization'));
    }
    done(null, { id: user.id, type: user.type });
  });

  passport.deserializeUser(async (data: { id: number, type: 'user' | 'restaurant' }, done) => {
    try {
      if (data.type === 'restaurant') {
        const restaurant = await storage.getRestaurantAuth(data.id);
        if (!restaurant) {
          return done(new Error('Restaurant not found'));
        }
        done(null, { ...restaurant, type: 'restaurant' });
      } else {
        const user = await storage.getUser(data.id);
        if (!user) {
          return done(new Error('User not found'));
        }
        done(null, { ...user, type: 'user' });
      }
    } catch (err) {
      done(err);
    }
  });

  // Restaurant registration endpoint
  app.post("/api/restaurant/register", async (req, res, next) => {
    try {
      const existingRestaurant = await storage.getRestaurantAuthByEmail(req.body.email);
      if (existingRestaurant) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const restaurant = await storage.createRestaurantAuth({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login({ ...restaurant, type: 'restaurant' }, (err) => {
        if (err) return next(err);
        res.status(201).json(restaurant);
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Restaurant login endpoint
  app.post("/api/restaurant/login", passport.authenticate("restaurant-local"), (req, res) => {
    res.status(200).json(req.user);
  });

  // User login endpoint
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  // Add confirm booking endpoint
  app.post("/api/restaurant/bookings/:bookingId/confirm", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.type !== 'restaurant') {
      return res.status(401).json({ message: "Not authenticated as restaurant" });
    }

    try {
      const bookingId = parseInt(req.params.bookingId);
      if (isNaN(bookingId)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
      if (!req.user.id) {
        return res.status(400).json({ message: "Restaurant ID not found" });
      }
      const booking = await storage.confirmBooking(bookingId, req.user.id);
      res.json(booking);
    } catch (error: any) {
      console.error('Error confirming booking:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add restaurant profile status endpoint
  app.get("/api/restaurant/profile-status/:restaurantId", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.type !== 'restaurant') {
      return res.status(401).json({ message: "Not authenticated as restaurant" });
    }

    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (restaurantId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to access this profile" });
      }

      const isComplete = await storage.isRestaurantProfileComplete(restaurantId);
      res.json({ isComplete });
    } catch (error: any) {
      console.error('Error checking profile status:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add the restaurant bookings endpoint with improved logging
  app.get("/api/restaurant/bookings/:restaurantId", async (req, res) => {
    console.log('Restaurant bookings request:', {
      restaurantId: req.params.restaurantId,
      user: req.user
    });

    if (!req.isAuthenticated() || req.user?.type !== 'restaurant') {
      console.log('Authentication failed:', {
        isAuthenticated: req.isAuthenticated(),
        userType: req.user?.type
      });
      return res.status(401).json({ message: "Not authenticated as restaurant" });
    }

    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      if (restaurantId !== req.user.id) {
        console.log('Restaurant ID mismatch:', {
          requestedId: restaurantId,
          userRestaurantId: req.user.id
        });
        return res.status(403).json({ message: "Unauthorized to access these bookings" });
      }

      const bookings = await storage.getRestaurantBookings(restaurantId);
      console.log('Successfully fetched bookings:', bookings);
      res.json(bookings);
    } catch (error: any) {
      console.error('Error fetching restaurant bookings:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Current restaurant route with logging
  app.get("/api/restaurant", (req, res) => {
    if (!req.isAuthenticated() || req.user?.type !== 'restaurant') {
      console.log('Restaurant auth check failed:', {
        isAuthenticated: req.isAuthenticated(),
        userType: req.user?.type
      });
      return res.sendStatus(401);
    }
    res.json(req.user);
  });


  // Common logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Current user route
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || req.user?.type !== 'user') {
      return res.sendStatus(401);
    }
    res.json(req.user);
  });
}