// Load environment variables from .env file into process.env
import "dotenv/config";

// Import required packages and types
// express: Web framework for Node.js
// Request, Response, NextFunction: Types for Express request handling
import express, { type Request, Response, NextFunction } from "express";

// Import our custom functions from other files
import { registerRoutes } from "./routes";        // Function to set up all API routes
import { setupVite, serveStatic, log } from "./vite";  // Development and static file serving utilities
import { setupEmailTransporter } from "./email";  // Email service setup

// Create a new Express application
const app = express();

// Middleware to parse JSON bodies
// This allows us to read JSON data sent in POST requests
app.use(express.json());

// Middleware to parse URL-encoded bodies (form data)
// extended: false means use the simple algorithm for parsing
app.use(express.urlencoded({ extended: false }));

// Initialize the email service for sending notifications
// Using .catch() to handle any errors during setup
setupEmailTransporter().catch((err) => {
  console.error("Failed to initialize email service:", err);
});

// Logging middleware - tracks request duration and response data
app.use((req, res, next) => {
  // Record the start time of the request
  const start = Date.now();
  const path = req.path;
  
  // Variable to store the JSON response for logging
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Override the default res.json method to capture the response
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    // Store the response body for logging
    capturedJsonResponse = bodyJson;
    // Call the original json method with the same context and arguments
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // When the response is finished, calculate duration and log details
  res.on("finish", () => {
    // Calculate how long the request took
    const duration = Date.now() - start;
    
    // Only log API requests (paths starting with /api)
    if (path.startsWith("/api")) {
      // Create the log message with method, path, status code, and duration
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Add the response body to the log if it exists
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // Truncate long log lines for readability
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      // Output the log line
      log(logLine);
    }
  });

  // Continue to the next middleware
  next();
});

// Immediately Invoked Function Expression (IIFE) to use async/await
(async () => {
  // Set up all routes and get the HTTP server instance
  const server = registerRoutes(app);

  // Error handling middleware
  // This catches any errors thrown in route handlers
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Get the status code from the error or default to 500
    const status = err.status || err.statusCode || 500;
    // Get the error message or use a default
    const message = err.message || "Internal Server Error";

    // Send the error response to the client
    res.status(status).json({ message });
    // Re-throw the error for logging purposes
    throw err;
  });

  // Development vs Production setup
  // In development: Set up Vite for hot reloading
  // In production: Serve static files
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start the server
  // Get port from environment variable or use 5000 as default
  const PORT = parseInt(process.env.PORT || "5000", 10);
  
  // Listen on all network interfaces (0.0.0.0)
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
