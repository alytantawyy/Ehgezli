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
      secure: false, // Set to false in development
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      path: '/'
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Restaurant authentication strategy
  passport.use('restaurant-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      console.log('Attempting restaurant login:', email);
      const restaurant = await storage.getRestaurantAuthByEmail(email);
      if (!restaurant || !(await comparePasswords(password, restaurant.password))) {
        console.log('Restaurant authentication failed:', email);
        return done(null, false);
      }
      console.log('Restaurant authenticated successfully:', restaurant.id);
      return done(null, { ...restaurant, type: 'restaurant' });
    } catch (err) {
      console.error('Restaurant authentication error:', err);
      return done(err);
    }
  }));

  // User authentication strategy
  passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      console.log('Attempting user login:', email);
      const user = await storage.getUserByEmail(email);
      if (!user || !(await comparePasswords(password, user.password))) {
        console.log('User authentication failed:', email);
        return done(null, false);
      }
      console.log('User authenticated successfully:', user.id);
      return done(null, { ...user, type: 'user' });
    } catch (err) {
      console.error('User authentication error:', err);
      return done(err);
    }
  }));

  passport.serializeUser((user: Express.User, done) => {
    if (!user || !user.id || !user.type) {
      console.error('Invalid user data for serialization:', user);
      return done(new Error('Invalid user data for serialization'));
    }
    console.log('Serializing user:', { id: user.id, type: user.type });
    done(null, { id: user.id, type: user.type });
  });

  passport.deserializeUser(async (data: { id: number, type: 'user' | 'restaurant' }, done) => {
    try {
      console.log('Deserializing user:', data);
      if (data.type === 'restaurant') {
        const restaurant = await storage.getRestaurantAuth(data.id);
        if (!restaurant) {
          console.error('Restaurant not found during deserialization:', data.id);
          return done(new Error('Restaurant not found'));
        }
        done(null, { ...restaurant, type: 'restaurant' });
      } else {
        const user = await storage.getUser(data.id);
        if (!user) {
          console.error('User not found during deserialization:', data.id);
          return done(new Error('User not found'));
        }
        done(null, { ...user, type: 'user' });
      }
    } catch (err) {
      console.error('Deserialization error:', err);
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
        console.log('Restaurant registered and logged in:', restaurant.id);
        res.status(201).json(restaurant);
      });
    } catch (error: any) {
      console.error('Restaurant registration error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Restaurant login endpoint
  app.post("/api/restaurant/login", (req, res, next) => {
    passport.authenticate("restaurant-local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        console.log('Restaurant logged in successfully:', user.id);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  // User login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        console.log('User logged in successfully:', user.id);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Common logout route
  app.post("/api/logout", (req, res, next) => {
    const userId = req.user?.id;
    const userType = req.user?.type;
    req.logout((err) => {
      if (err) return next(err);
      console.log('User logged out:', { id: userId, type: userType });
      res.sendStatus(200);
    });
  });

  // Current restaurant route
  app.get("/api/restaurant", (req, res) => {
    if (!req.isAuthenticated() || req.user?.type !== 'restaurant') {
      console.log('Unauthorized restaurant access:', { 
        isAuthenticated: req.isAuthenticated(),
        userType: req.user?.type 
      });
      return res.sendStatus(401);
    }
    console.log('Restaurant data accessed:', req.user.id);
    res.json(req.user);
  });

  // Current user route
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || req.user?.type !== 'user') {
      console.log('Unauthorized user access:', { 
        isAuthenticated: req.isAuthenticated(),
        userType: req.user?.type 
      });
      return res.sendStatus(401);
    }
    console.log('User data accessed:', req.user.id);
    res.json(req.user);
  });
  // Add the restaurant bookings endpoint
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
}