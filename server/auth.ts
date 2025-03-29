// Import required packages for authentication and session management
import passport from "passport";  // Main authentication middleware
import { Strategy as LocalStrategy } from "passport-local";  // Username/password authentication strategy
import { Express } from "express";  // Type definition for Express app
import session from "express-session";  // Session middleware
import { scrypt, randomBytes, timingSafeEqual } from "crypto";  // Cryptographic functions for password hashing
import { promisify } from "util";  // Convert callback-based functions to Promise-based
import { storage } from "./storage";  // Database operations
import { 
  User as SelectUser, 
  RestaurantAuth as SelectRestaurantAuth, 
  passwordResetRequestSchema, 
  passwordResetSchema, 
  restaurantPasswordResetRequestSchema, 
  restaurantPasswordResetSchema 
} from "@shared/schema";  // Type definitions and validation schemas
import connectPg from "connect-pg-simple";  // PostgreSQL session store
import { pool } from "./db";  // Database connection pool
import { sendPasswordResetEmail } from "./email";  // Email functionality

// Extend Express.User interface to support both user and restaurant types
// This tells TypeScript that req.user can be either a regular user or a restaurant
declare global {
  namespace Express {
    interface User extends Partial<SelectUser>, Partial<SelectRestaurantAuth> {
      type: 'user' | 'restaurant';  // Discriminator field to distinguish between types
    }
  }
}

// Convert scrypt to use Promises instead of callbacks for cleaner async code
const scryptAsync = promisify(scrypt);

// Function to hash passwords before storing in database
// Uses cryptographic salt to prevent rainbow table attacks
/**
 * Hashes a password using scrypt and a random salt.
 * 
 * @param password The password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt for each password
  const salt = randomBytes(16).toString('hex');
  // Hash the password with the salt using scrypt
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  // Combine salt and hashed password for storage
  return salt + ':' + derivedKey.toString('hex');
}

// Function to securely compare a supplied password with a stored hash
// Uses timing-safe comparison to prevent timing attacks
/**
 * Compares a supplied password with a stored hash.
 * 
 * @param supplied The password to compare.
 * @param stored The stored hash.
 * @returns A promise that resolves to true if the passwords match, false otherwise.
 */
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  // Split stored value into salt and hash
  const [salt, hashed] = stored.split(":");
  // Convert stored hash to Buffer
  const hashedBuf = Buffer.from(hashed, "hex");
  // Hash supplied password with same salt
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  // Compare hashes in constant time
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Settings for session cookies
/**
 * Configuration for session cookies.
 */
export const cookieSettings = {
  maxAge: 30 * 24 * 60 * 60 * 1000,  // Cookie expires in 30 days
  httpOnly: true,  // Prevent JavaScript access to cookie
  secure: false,   // Allow HTTP in development (should be true in production)
  sameSite: 'lax' as const,  // CSRF protection
  path: '/'  // Cookie is valid for all paths
};

// Main function to set up authentication
/**
 * Sets up authentication for the Express app.
 * 
 * @param app The Express app.
 * @returns The Express app with authentication set up.
 */
export function setupAuth(app: Express) {
  // Trust first proxy in production environments
  app.set("trust proxy", 1);

  // Set up PostgreSQL session store
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool,  // Database connection pool
    tableName: 'session',  // Table to store sessions
    createTableIfMissing: true,  // Auto-create session table
    pruneSessionInterval: 60 * 15,  // Clean up expired sessions every 15 minutes
    errorLog: (err) => console.error('Session store error:', err)
  });

  // Give storage access to session store for operations
  storage.setSessionStore(sessionStore);

  // Configure session middleware
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',  // Key to sign session ID cookie
    resave: true,  // Save session even if unmodified
    saveUninitialized: false,  // Don't save empty sessions
    store: sessionStore,  // Use PostgreSQL to store sessions
    cookie: cookieSettings,  // Use cookie settings defined above
    name: 'connect.sid',  // Name of session ID cookie
    rolling: true,  // Reset cookie expiration on activity
    proxy: true  // Trust proxy headers
  };

  // Apply session middleware
  app.use(session(sessionSettings));

  // Initialize Passport and restore authentication state from session
  app.use(passport.initialize());
  app.use(passport.session());

  // Tell Passport how to serialize user for storage in session
  /**
   * Serializes a user for storage in the session.
   * 
   * @param user The user to serialize.
   * @param done A callback to call when serialization is complete.
   */
  passport.serializeUser((user, done) => {
    // Only store user ID and type in session
    done(null, {
      id: user.id,
      type: user.type
    });
  });

  // Tell Passport how to get user data from stored session ID
  /**
   * Deserializes a user from the session.
   * 
   * @param serialized The serialized user data.
   * @param done A callback to call when deserialization is complete.
   */
  passport.deserializeUser(async (serialized: { id: number; type: string }, done) => {
    try {
      // Validate session data
      if (!serialized?.id || !serialized?.type) {
        throw new Error('Invalid session data');
      }

      // Handle restaurant users
      if (serialized.type === 'restaurant') {
        const auth = await storage.getRestaurantAuth(serialized.id);
        if (!auth) {
          throw new Error('Restaurant not found');
        }
        const restaurant = await storage.getRestaurant(serialized.id);
        if (!restaurant) {
          throw new Error('Restaurant profile not found');
        }
        return done(null, { ...auth, ...restaurant, type: 'restaurant' as const });
      } 
      // Handle regular users
      else {
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

  // Set up restaurant login strategy
  /* *
   * Sets up the restaurant login strategy.
   */
  passport.use('restaurant-local', new LocalStrategy({
    usernameField: 'email',  // Use email instead of username
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      // Find restaurant by email
      const restaurant = await storage.getRestaurantAuthByEmail(email);
      if (!restaurant) {
        return done(null, false, { message: 'Restaurant not found' });
      }

      // Verify password
      const isPasswordValid = await comparePasswords(password, restaurant.password);
      if (!isPasswordValid) {
        return done(null, false, { message: 'Invalid password' });
      }

      // Login successful
      return done(null, { ...restaurant, type: 'restaurant' as const });
    } catch (err) {
      return done(err);
    }
  }));

  // Set up regular user login strategy
  /**
   * Sets up the regular user login strategy.
   */
  passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      // Verify password
      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return done(null, false, { message: 'Invalid password' });
      }

      // Login successful
      return done(null, { ...user, type: 'user' as const });
    } catch (err) {
      return done(err);
    }
  }));

  // Get current user data endpoint
  /**
   * Returns the current user's data.
   */
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Get current restaurant data endpoint
  /**
   * Returns the current restaurant's data.
   */
  app.get("/api/restaurant", (req, res) => {
    if (!req.isAuthenticated() || req.user?.type !== 'restaurant') {
      return res.status(401).json({ message: "Not authenticated as restaurant" });
    }
    res.json(req.user);
  });

  // Password reset request endpoint
  /**
   * Handles password reset requests.
   */
  app.post("/api/forgot-password", async (req, res) => {
    try {
      // Validate request body
      const { email } = passwordResetRequestSchema.parse(req.body);
      // Find user by email
      const user = await storage.getUserByEmail(email);
      let emailInfo;
      
      if (user) {
        // Create reset token and send email
        const token = await storage.createPasswordResetToken(user.id);
        emailInfo = await sendPasswordResetEmail(email, token);
      }
      
      // Always return success to prevent email enumeration
      res.json({
        message: "If an account exists with that email, a password reset link has been sent.",
        ...(process.env.NODE_ENV !== 'production' && emailInfo?.previewUrl && { 
          previewUrl: emailInfo.previewUrl 
        })
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Restaurant password reset request endpoint
  /**
   * Handles restaurant password reset requests.
   */
  app.post("/api/restaurant/forgot-password", async (req, res) => {
    try {
      // Validate request body
      const { email } = restaurantPasswordResetRequestSchema.parse(req.body);
      // Find restaurant by email
      const restaurant = await storage.getRestaurantAuthByEmail(email);
      
      if (restaurant) {
        // Create reset token and send email
        const token = await storage.createRestaurantPasswordResetToken(restaurant.id);
        const info = await sendPasswordResetEmail(email, token, true);
      }
      
      // Always return success to prevent email enumeration
      res.json({ message: "If a restaurant account exists with that email, a password reset link has been sent." });
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Password reset endpoint
  /**
   * Handles password resets.
   */
  app.post("/api/reset-password", async (req, res) => {
    try {
      // Validate request body
      const { token, password } = passwordResetSchema.parse(req.body);
      // Validate reset token
      const userId = await storage.validatePasswordResetToken(token);

      if (!userId) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Update user password
      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(userId, hashedPassword);
      await storage.markPasswordResetTokenAsUsed(token);

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Restaurant password reset endpoint
  /**
   * Handles restaurant password resets.
   */
  app.post("/api/restaurant/reset-password", async (req, res) => {
    try {
      // Validate request body
      const { token, password } = restaurantPasswordResetSchema.parse(req.body);
      // Validate reset token
      const restaurantId = await storage.validateRestaurantPasswordResetToken(token);

      if (!restaurantId) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Update restaurant password
      const hashedPassword = await hashPassword(password);
      await storage.updateRestaurantPassword(restaurantId, hashedPassword);
      await storage.markRestaurantPasswordResetTokenAsUsed(token);

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Error during logout" });
      }
      
      // Clear the session cookie
      res.clearCookie("connect.sid", {
        ...cookieSettings,
        expires: new Date(0)
      });
      
      res.json({ message: "Logged out successfully" });
    });
  });

  return app;
}