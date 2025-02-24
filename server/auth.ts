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

  // Enhanced session store configuration
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool,
    tableName: 'session',
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 60,
    schemaName: 'public',
    errorLog: (err) => {
      console.error('Session store error:', {
        code: err.code,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
    }
  });

  // More detailed store event handling
  sessionStore.on('connect', () => {
    console.log('Session store connected successfully:', {
      timestamp: new Date().toISOString()
    });
  });

  sessionStore.on('disconnect', () => {
    console.error('Session store disconnected:', {
      timestamp: new Date().toISOString()
    });
  });

  sessionStore.on('error', (error) => {
    console.error('Session store error:', {
      error,
      timestamp: new Date().toISOString()
    });
  });

  storage.setSessionStore(sessionStore);

  // Updated cookie settings to work with both HTTP and WebSocket
  const cookieSettings = {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };

  // Updated session configuration
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID!,
    resave: false, // Changed to false to prevent race conditions
    saveUninitialized: false,
    store: sessionStore,
    cookie: cookieSettings,
    name: 'connect.sid',
    rolling: true,
    proxy: true
  };

  // Set up session middleware before passport
  app.use(session(sessionSettings));

  // Enhanced serialization with better error handling
  passport.serializeUser((user, done) => {
    console.log('Serializing user:', {
      id: user.id,
      type: user.type,
      timestamp: new Date().toISOString()
    });
    done(null, {
      id: user.id,
      type: user.type
    });
  });

  // Enhanced deserialization with more detailed error handling
  passport.deserializeUser(async (serialized: { id: number; type: string }, done) => {
    console.log('Deserializing user:', {
      serialized,
      timestamp: new Date().toISOString()
    });

    try {
      if (!serialized?.id || !serialized?.type) {
        throw new Error('Invalid session data');
      }

      const user = serialized.type === 'restaurant' 
        ? await storage.getRestaurantAuth(serialized.id)
        : await storage.getUser(serialized.id);

      if (!user) {
        throw new Error(`${serialized.type} not found`);
      }

      done(null, { ...user, type: serialized.type });
    } catch (error) {
      console.error('Deserialization error:', error);
      done(error);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  // Authentication strategies setup
  passport.use('restaurant-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const restaurant = await storage.getRestaurantAuthByEmail(email);
      if (!restaurant) {
        return done(null, false, { message: 'Restaurant not found' });
      }

      const isPasswordValid = await comparePasswords(password, restaurant.password);
      if (!isPasswordValid) {
        return done(null, false, { message: 'Invalid password' });
      }

      return done(null, { ...restaurant, type: 'restaurant' });
    } catch (err) {
      return done(err);
    }
  }));

  passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return done(null, false, { message: 'Invalid password' });
      }

      return done(null, { ...user, type: 'user' });
    } catch (err) {
      return done(err);
    }
  }));

  // Authentication endpoints
  app.post("/api/login", (req, res, next) => {
    passport.authenticate(['local', 'restaurant-local'], (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error occurred" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login error occurred" });
        }
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
        res.clearCookie('connect.sid', { path: '/' });
        res.sendStatus(200);
      });
    });
  });

  // Authentication check endpoints
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  app.get("/api/restaurant", (req, res) => {
    if (!req.isAuthenticated() || req.user?.type !== 'restaurant') {
      return res.status(401).json({ message: "Not authenticated as restaurant" });
    }
    res.json(req.user);
  });

  // Registration endpoints with proper error handling
  app.post("/api/restaurant/register", async (req, res) => {
    try {
      const existingRestaurant = await storage.getRestaurantAuthByEmail(req.body.email);
      if (existingRestaurant) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const restaurant = await storage.createRestaurantAuth({
        ...req.body,
        password: hashedPassword,
      });

      await new Promise<void>((resolve, reject) => {
        req.login({ ...restaurant, type: 'restaurant' }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.cookie('connect.sid', req.sessionID, cookieSettings);
      res.status(201).json(restaurant);
    } catch (error: any) {
      res.status(500).json({
        message: error.message || "Registration failed"
      });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      await new Promise<void>((resolve, reject) => {
        req.login({ ...user, type: 'user' }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.cookie('connect.sid', req.sessionID, cookieSettings);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(500).json({
        message: error.message || "Registration failed"
      });
    }
  });
}