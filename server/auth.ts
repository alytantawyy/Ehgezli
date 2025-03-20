import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, RestaurantAuth as SelectRestaurantAuth, passwordResetRequestSchema, passwordResetSchema, restaurantPasswordResetRequestSchema, restaurantPasswordResetSchema } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { setupEmailTransporter, sendPasswordResetEmail } from "./email";
import nodemailer from 'nodemailer';

declare global {
  namespace Express {
    interface User extends Partial<SelectUser>, Partial<SelectRestaurantAuth> {
      type: 'user' | 'restaurant';
    }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return salt + ':' + derivedKey.toString('hex');
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [salt, hashed] = stored.split(":");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Cookie settings
export const cookieSettings = {
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  httpOnly: true,
  secure: false, // Set to false for development
  sameSite: 'lax' as const,
  path: '/'
};

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

  // Session configuration
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: true,
    saveUninitialized: false,
    store: sessionStore,
    cookie: cookieSettings,
    name: 'connect.sid',
    rolling: true,
    proxy: true
  };

  app.use(session(sessionSettings));

  app.use(passport.initialize());
  app.use(passport.session());

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

  // Password reset request endpoint
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = passwordResetRequestSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      
      if (user) {
        const token = await storage.createPasswordResetToken(user.id);
        const info = await sendPasswordResetEmail(email, token);
        
        if (process.env.NODE_ENV !== 'production') {
          return res.json({
            message: "Password reset email sent (development mode)",
            previewUrl: nodemailer.getTestMessageUrl(info)
          });
        }
      }

      // Always return success to prevent email enumeration
      res.json({ message: "If an account exists with that email, a password reset link has been sent." });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Restaurant password reset request endpoint
  app.post("/api/restaurant/forgot-password", async (req, res) => {
    try {
      const { email } = restaurantPasswordResetRequestSchema.parse(req.body);
      const restaurant = await storage.getRestaurantAuthByEmail(email);
      
      if (restaurant) {
        const token = await storage.createRestaurantPasswordResetToken(restaurant.id);
        const info = await sendPasswordResetEmail(email, token, true);
        
        if (process.env.NODE_ENV !== 'production') {
          return res.json({
            message: "Password reset email sent (development mode)",
            previewUrl: nodemailer.getTestMessageUrl(info)
          });
        }
      }

      // Always return success to prevent email enumeration
      res.json({ message: "If a restaurant account exists with that email, a password reset link has been sent." });
    } catch (error) {
      console.error("Restaurant password reset request error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Password reset endpoint
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = passwordResetSchema.parse(req.body);
      const userId = await storage.validatePasswordResetToken(token);

      if (!userId) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(userId, hashedPassword);
      await storage.markPasswordResetTokenAsUsed(token);

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Restaurant password reset endpoint
  app.post("/api/restaurant/reset-password", async (req, res) => {
    try {
      const { token, password } = restaurantPasswordResetSchema.parse(req.body);
      const restaurantId = await storage.validateRestaurantPasswordResetToken(token);

      if (!restaurantId) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await hashPassword(password);
      await storage.updateRestaurantPassword(restaurantId, hashedPassword);
      await storage.markRestaurantPasswordResetTokenAsUsed(token);

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Restaurant password reset error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  return app;
}