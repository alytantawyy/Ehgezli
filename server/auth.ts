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

  // Configure session store
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool,
    tableName: 'session',
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 15,
    errorLog: (err) => console.error('Session store error:', err)
  });

  storage.setSessionStore(sessionStore);

  // Cookie settings
  const cookieSettings = {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: false, // Set to false for development
    sameSite: 'lax' as const,
    path: '/'
  };

  // Session configuration
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID!,
    resave: true,
    saveUninitialized: false,
    store: sessionStore,
    cookie: cookieSettings,
    name: 'connect.sid',
    rolling: true,
    proxy: true
  };

  app.use(session(sessionSettings));

  passport.serializeUser((user, done) => {
    done(null, {
      id: user.id,
      type: user.type
    });
  });

  passport.deserializeUser(async (serialized: { id: number; type: string }, done) => {
    try {
      if (!serialized?.id || !serialized?.type) {
        throw new Error('Invalid session data');
      }

      if (serialized.type === 'restaurant') {
        const restaurant = await storage.getRestaurantAuth(serialized.id);
        if (!restaurant) {
          throw new Error('Restaurant not found');
        }
        return done(null, { ...restaurant, type: 'restaurant' as const });
      } else {
        const user = await storage.getUser(serialized.id);
        if (!user) {
          throw new Error('User not found');
        }
        return done(null, { ...user, type: 'user' as const });
      }
    } catch (error) {
      console.error('Deserialization error:', error);
      done(error);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  // Restaurant authentication strategy
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

      return done(null, { ...restaurant, type: 'restaurant' as const });
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
      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return done(null, false, { message: 'Invalid password' });
      }

      return done(null, { ...user, type: 'user' as const });
    } catch (err) {
      return done(err);
    }
  }));

  // Restaurant login endpoint
  app.post("/api/restaurant/login", (req, res, next) => {
    passport.authenticate('restaurant-local', (err: any, user: any, info: any) => {
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

        res.cookie('connect.sid', req.sessionID, cookieSettings);
        res.status(200).json({ ...user, type: 'restaurant' });
      });
    })(req, res, next);
  });

  // User login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
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

        res.cookie('connect.sid', req.sessionID, cookieSettings);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(200);
    }

    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }

      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Session cleanup failed" });
        }
        res.clearCookie('connect.sid', { path: '/' });
        res.sendStatus(200);
      });
    });
  });

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
}