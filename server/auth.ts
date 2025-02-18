import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, RestaurantAuth as SelectRestaurantAuth } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User extends Partial<SelectUser>, Partial<SelectRestaurantAuth> {
      type: 'user' | 'restaurant';
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
  app.set("trust proxy", 1);

  // Initialize PostgreSQL session store with debug logs
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool,
    tableName: 'session',
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 15,
    errorLog: (err) => console.error('Session store error:', err)
  });

  // Verify session store is working
  sessionStore.on('connect', () => {
    console.log('Session store connected successfully');
  });

  sessionStore.on('disconnect', () => {
    console.error('Session store disconnected');
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID!,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      path: '/',
      httpOnly: true
    },
    name: 'connect.sid'
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Debug middleware for tracking authentication state
  app.use((req, res, next) => {
    console.log('Auth Debug -', {
      path: req.path,
      method: req.method,
      isAuthenticated: req.isAuthenticated(),
      sessionID: req.sessionID,
      userType: req.user?.type,
      userId: req.user?.id,
      headers: {
        cookie: req.headers.cookie,
        authorization: req.headers.authorization
      }
    });
    next();
  });

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
          return done(null, false);
        }
        console.log('Restaurant deserialized successfully:', restaurant.id);
        return done(null, { ...restaurant, type: 'restaurant' });
      } else {
        const user = await storage.getUser(data.id);
        if (!user) {
          console.error('User not found during deserialization:', data.id);
          return done(null, false);
        }
        console.log('User deserialized successfully:', user.id);
        return done(null, { ...user, type: 'user' });
      }
    } catch (err) {
      console.error('Deserialization error:', err);
      done(err);
    }
  });

  // User authentication strategy with detailed logging
  passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      console.log('User auth attempt:', email);
      const user = await storage.getUserByEmail(email);

      if (!user) {
        console.log('User not found:', email);
        return done(null, false, { message: 'User not found' });
      }

      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        console.log('Invalid password for user:', email);
        return done(null, false, { message: 'Invalid password' });
      }

      console.log('User authenticated successfully:', user.id);
      return done(null, { ...user, type: 'user' });
    } catch (err) {
      console.error('User authentication error:', err);
      return done(err);
    }
  }));

  // Restaurant authentication strategy with detailed logging
  passport.use('restaurant-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      console.log('Restaurant auth attempt:', email);
      const restaurant = await storage.getRestaurantAuthByEmail(email);

      if (!restaurant) {
        console.log('Restaurant not found:', email);
        return done(null, false, { message: 'Restaurant not found' });
      }

      const isPasswordValid = await comparePasswords(password, restaurant.password);
      if (!isPasswordValid) {
        console.log('Invalid password for restaurant:', email);
        return done(null, false, { message: 'Invalid password' });
      }

      console.log('Restaurant authenticated successfully:', restaurant.id);
      return done(null, { ...restaurant, type: 'restaurant' });
    } catch (err) {
      console.error('Restaurant authentication error:', err);
      return done(err);
    }
  }));

  // Unified login endpoint with better error handling
  app.post("/api/login", (req, res, next) => {
    console.log('Login attempt:', {
      email: req.body.email,
      sessionID: req.sessionID,
      headers: req.headers
    });

    passport.authenticate(['local', 'restaurant-local'], (err: any, user: any, info: any) => {
      if (err) {
        console.error('Authentication error:', err);
        return res.status(500).json({ message: "Authentication error occurred" });
      }
      if (!user) {
        console.log('Authentication failed:', info?.message);
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      req.login(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ message: "Login error occurred" });
        }

        console.log('Login successful:', {
          id: user.id,
          type: user.type,
          sessionID: req.sessionID
        });

        // Set session cookie explicitly
        res.cookie('connect.sid', req.sessionID, {
          maxAge: 24 * 60 * 60 * 1000,
          httpOnly: true,
          secure: false,
          sameSite: 'lax'
        });

        res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Logout endpoint with session cleanup
  app.post("/api/logout", (req, res, next) => {
    const userId = req.user?.id;
    const userType = req.user?.type;
    console.log('Logout attempt:', { id: userId, type: userType });

    if (!req.isAuthenticated()) {
      console.log('Logout requested for unauthenticated session');
      return res.sendStatus(200);
    }

    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }

      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({ message: "Session cleanup failed" });
        }
        console.log('Logout successful:', { id: userId, type: userType });
        res.clearCookie('connect.sid');
        res.sendStatus(200);
      });
    });
  });

  // User verification endpoint with session checks
  app.get("/api/user", (req, res) => {
    console.log('User verification request:', {
      isAuthenticated: req.isAuthenticated(),
      userType: req.user?.type,
      userId: req.user?.id,
      sessionID: req.sessionID,
      cookie: req.headers.cookie
    });

    if (!req.isAuthenticated()) {
      console.log('User not authenticated');
      return res.status(401).json({ message: "Not authenticated" });
    }

    console.log('User verified:', req.user);
    res.json(req.user);
  });

  // Restaurant registration endpoint with improved error handling
  app.post("/api/restaurant/register", async (req, res) => {
    try {
      console.log('Restaurant registration attempt:', req.body);

      // Basic validation
      if (!req.body.email || !req.body.password || !req.body.name) {
        return res.status(400).json({
          message: "Missing required fields: email, password, and name are required"
        });
      }

      const existingRestaurant = await storage.getRestaurantAuthByEmail(req.body.email);
      if (existingRestaurant) {
        console.log('Restaurant registration failed - email exists:', req.body.email);
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const restaurant = await storage.createRestaurantAuth({
        ...req.body,
        password: hashedPassword,
      });

      // Login after registration using a Promise
      await new Promise<void>((resolve, reject) => {
        req.login({ ...restaurant, type: 'restaurant' }, (err) => {
          if (err) {
            console.error('Restaurant login error after registration:', err);
            reject(err);
          } else {
            console.log('Restaurant registered and logged in:', restaurant.id);
            resolve();
          }
        });
      });

      // Send the response only after login is complete
      res.status(201).json(restaurant);

    } catch (error: any) {
      console.error('Restaurant registration error:', error);
      res.status(500).json({
        message: error.message || "Registration failed. Please try again."
      });
    }
  });

  // Add user registration endpoint with proper error handling
  app.post("/api/register", async (req, res) => {
    try {
      console.log('User registration attempt:', req.body);

      // Basic validation
      if (!req.body.email || !req.body.password) {
        return res.status(400).json({
          message: "Missing required fields: email and password are required"
        });
      }

      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        console.log('User registration failed - email exists:', req.body.email);
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Login after registration using a Promise
      await new Promise<void>((resolve, reject) => {
        req.login({ ...user, type: 'user' }, (err) => {
          if (err) {
            console.error('User login error after registration:', err);
            reject(err);
          } else {
            console.log('User registered and logged in:', user.id);
            resolve();
          }
        });
      });

      // Send the response only after login is complete
      res.status(201).json(user);

    } catch (error: any) {
      console.error('User registration error:', error);
      res.status(500).json({
        message: error.message || "Registration failed. Please try again."
      });
    }
  });


  // Current restaurant route
  app.get("/api/restaurant", (req, res) => {
    console.log('Restaurant data request:', {
      isAuthenticated: req.isAuthenticated(),
      userType: req.user?.type,
      userId: req.user?.id,
      sessionID: req.sessionID,
      headers: {
        cookie: req.headers.cookie,
        authorization: req.headers.authorization
      }
    });

    if (!req.isAuthenticated() || req.user?.type !== 'restaurant') {
      console.log('Unauthorized restaurant access:', {
        isAuthenticated: req.isAuthenticated(),
        userType: req.user?.type,
        sessionID: req.sessionID
      });
      return res.status(401).json({ message: "Not authenticated as restaurant" });
    }
    console.log('Restaurant data accessed:', req.user.id);
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