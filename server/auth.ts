// Import required packages for authentication and token management
import passport from "passport";  // Main authentication middleware
import { Strategy as LocalStrategy } from "passport-local";  // Username/password authentication strategy
import { Express, Request, Response, NextFunction } from "express";  // Type definitions for Express
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
import { sendPasswordResetEmail } from "./email";  // Email functionality
import jwt from 'jsonwebtoken';  // JSON Web Token library for token generation and verification
import bcrypt from 'bcrypt';  // Bcrypt library for password hashing and comparison

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
// Uses bcrypt's built-in compare function
/**
 * Compares a supplied password with a stored hash.
 * 
 * @param supplied The password to compare.
 * @param stored The stored hash.
 * @returns A promise that resolves to true if the passwords match, false otherwise.
 */
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    // Check if the stored password is in the format we expect
    if (!stored) {
      console.error('Stored password is undefined or empty');
      return false;
    }
    
    console.log('Comparing password with stored hash');
    
    // If the stored password contains a colon, it's using our custom format
    if (stored.includes(':')) {
      // Split stored value into salt and hash
      const [salt, hashed] = stored.split(':');
      
      if (!hashed) {
        console.error('Invalid stored password format');
        return false;
      }
      
      // Convert stored hash to Buffer
      const hashedBuf = Buffer.from(hashed, 'hex');
      // Hash supplied password with same salt
      const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
      // Compare hashes in constant time
      return timingSafeEqual(hashedBuf, suppliedBuf);
    } 
    // Otherwise, assume it's a bcrypt hash
    else {
      return bcrypt.compare(supplied, stored);
    }
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const JWT_EXPIRES_IN = '30d'; // Token expires in 30 days

/**
 * Generates a JWT token for a user or restaurant.
 * 
 * @param user The user or restaurant to generate a token for.
 * @returns A JWT token.
 */
export function generateToken(user: { id: number; type: 'user' | 'restaurant' }): string {
  try {
    console.log('Generating token for:', JSON.stringify(user, null, 2));
    
    if (!user || typeof user.id !== 'number') {
      console.error('Invalid user object:', user);
      throw new Error('Invalid user object provided to generateToken');
    }
    
    // Create a payload with minimal user information
    const payload = {
      id: user.id,
      type: user.type
    };
    
    // Sign the token with our secret key and set expiration
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    console.log('Token generated successfully');
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
}

/**
 * Middleware to verify JWT token and set req.user.
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  // Get the token from the Authorization header
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Format: 'Bearer TOKEN'
    
    jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      
      try {
        // Validate token data
        if (!decoded?.id || !decoded?.type) {
          throw new Error('Invalid token data');
        }

        // Handle restaurant users
        if (decoded.type === 'restaurant') {
          const auth = await storage.getRestaurantAuth(decoded.id);
          if (!auth) {
            throw new Error('Restaurant not found');
          }
          const restaurant = await storage.getRestaurant(decoded.id);
          if (!restaurant) {
            throw new Error('Restaurant profile not found');
          }
          req.user = { ...auth, ...restaurant, type: 'restaurant' as const };
        } 
        // Handle regular users
        else {
          const user = await storage.getUser(decoded.id);
          if (!user) {
            throw new Error('User not found');
          }
          req.user = { ...user, type: 'user' as const };
        }
        
        next();
      } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ message: 'Authentication failed' });
      }
    });
  } else {
    // No token provided
    req.user = undefined;
    next();
  }
}

// Main function to set up authentication
/**
 * Sets up authentication for the Express app.
 * 
 * @param app The Express app.
 * @returns The Express app with authentication set up.
 */
export function setupAuth(app: Express) {
  // Initialize Passport
  app.use(passport.initialize());

  // Set up restaurant login strategy
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

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    console.log('Login attempt with:', { email: req.body.email });
    
    passport.authenticate('local', { session: false }, (err: any, user: any, info: any) => {
      if (err) {
        console.error('Passport authentication error:', err);
        return res.status(500).json({ message: "Authentication error occurred" });
      }
      
      if (!user) {
        console.log('Authentication failed:', info?.message || 'Invalid credentials');
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      try {
        console.log('Generating token for user:', { id: user.id, type: user.type });
        const token = generateToken(user);
        console.log('Token generated successfully');
        return res.json({ token });
      } catch (tokenError) {
        console.error('Token generation error:', tokenError);
        return res.status(500).json({ message: "Login error occurred" });
      }
    })(req, res, next);
  });

  // Restaurant login endpoint
  app.post("/api/restaurant/login", passport.authenticate('restaurant-local', { session: false }), (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = generateToken(req.user);
    res.json({ token });
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

  // Password reset request endpoint
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
  app.post("/api/restaurant/forgot-password", async (req, res) => {
    try {
      console.log('Restaurant password reset request received:', req.body);
      // Validate request body
      const { email } = restaurantPasswordResetRequestSchema.parse(req.body);
      console.log('Email validated:', email);
      
      // Find restaurant by email
      const restaurant = await storage.getRestaurantAuthByEmail(email);
      console.log('Restaurant found:', restaurant ? `ID: ${restaurant.id}` : 'Not found');
      
      if (restaurant) {
        // Create reset token and send email
        const token = await storage.createRestaurantPasswordResetToken(restaurant.id);
        console.log('Reset token created:', token);
        
        const info = await sendPasswordResetEmail(email, token, true);
        console.log('Email sent:', info.messageId, 'Preview URL:', info.previewUrl);
        
        // Always return success, but include previewUrl in development mode
        if (process.env.NODE_ENV !== 'production' && info.previewUrl) {
          return res.json({
            message: "If a restaurant account exists with that email, a password reset link has been sent.",
            previewUrl: info.previewUrl
          });
        }
      }
      
      // Always return success to prevent email enumeration
      res.json({ message: "If a restaurant account exists with that email, a password reset link has been sent." });
    } catch (error) {
      console.error('Error in restaurant password reset:', error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Password reset endpoint
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

  return app;
}