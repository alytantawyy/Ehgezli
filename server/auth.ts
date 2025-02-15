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

  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      path: '/',
      httpOnly: true
    },
    name: 'connect.sid'
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

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

  // Restaurant authentication strategy
  passport.use('restaurant-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      console.log('Attempting restaurant login:', email);
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

  // Restaurant login endpoint
  app.post("/api/restaurant/login", (req, res, next) => {
    console.log('Restaurant login attempt:', req.body.email);
    passport.authenticate("restaurant-local", (err: any, user: any, info: any) => {
      if (err) {
        console.error('Restaurant authentication error:', err);
        return next(err);
      }
      if (!user) {
        console.log('Restaurant authentication failed:', info?.message);
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      req.login(user, (err) => {
        if (err) {
          console.error('Restaurant login error:', err);
          return next(err);
        }

        // Log session information after successful login
        console.log('Restaurant logged in successfully:', {
          id: user.id,
          sessionID: req.sessionID,
          cookie: req.session.cookie
        });

        res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Current restaurant route
  app.get("/api/restaurant", (req, res) => {
    console.log('Restaurant data request:', {
      isAuthenticated: req.isAuthenticated(),
      userType: req.user?.type,
      userId: req.user?.id,
      sessionID: req.sessionID
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

  // Add middleware to log authentication state for all requests
  app.use((req, res, next) => {
    console.log('Request authentication state:', {
      path: req.path,
      method: req.method,
      isAuthenticated: req.isAuthenticated(),
      sessionID: req.sessionID,
      userType: req.user?.type,
      userId: req.user?.id
    });
    next();
  });

  // Logout endpoint with enhanced session cleanup
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
        return next(err);
      }

      // Destroy the session completely
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return next(err);
        }
        console.log('User logged out successfully:', { id: userId, type: userType });
        res.sendStatus(200);
      });
    });
  });
  // User authentication strategy
  passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      console.log('Attempting user login:', email);
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

  // Restaurant registration endpoint
  app.post("/api/restaurant/register", async (req, res, next) => {
    try {
      console.log('Restaurant registration attempt:', req.body.email);

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

      req.login({ ...restaurant, type: 'restaurant' }, (err) => {
        if (err) {
          console.error('Restaurant login error after registration:', err);
          return res.status(500).json({ 
            message: "Registration successful but login failed. Please try logging in." 
          });
        }
        console.log('Restaurant registered and logged in:', restaurant.id);
        res.status(201).json(restaurant);
      });
    } catch (error: any) {
      console.error('Restaurant registration error:', error);
      // Ensure we always return JSON, even for errors
      res.status(400).json({ 
        message: error.message || "Registration failed. Please try again." 
      });
    }
  });

  // User login endpoint
  app.post("/api/login", (req, res, next) => {
    console.log('User login attempt:', req.body.email);
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error('User authentication error:', err);
        return next(err);
      }
      if (!user) {
        console.log('User authentication failed:', info?.message);
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          console.error('User login error:', err);
          return next(err);
        }
        console.log('User logged in successfully:', user.id);
        res.status(200).json(user);
      });
    })(req, res, next);
  });


  // Current user route
  app.get("/api/user", (req, res) => {
    console.log('User data request:', {
      isAuthenticated: req.isAuthenticated(),
      userType: req.user?.type,
      userId: req.user?.id,
      sessionID: req.sessionID
    });

    if (!req.isAuthenticated() || req.user?.type !== 'user') {
      console.log('Unauthorized user access:', {
        isAuthenticated: req.isAuthenticated(),
        userType: req.user?.type,
        sessionID: req.sessionID
      });
      return res.status(401).json({ message: "Not authenticated as user" });
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