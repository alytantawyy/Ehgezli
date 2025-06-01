// Load environment variables from .env file into process.env
import "dotenv/config";

// Import required packages and types
// express: Web framework for Node.js
// Request, Response, NextFunction: Types for Express request handling
import express from "express";

// Import our custom functions from other files
import { setupVite, serveStatic, log } from "@server/vite";  // Development and static file serving utilities
import { setupEmailTransporter } from "@server/services/emailService";  // Email service setup
import { createServer } from "http";
import { setupWebSocket } from "@server/websocket";
import { corsMiddleware, jsonMiddleware, urlencodedMiddleware } from "./middleware/global";
import { loggingMiddleware } from "./middleware/logging";
import { errorHandler } from "./middleware/errorHandling";
import { registerAuthRoutes } from "./routes/authRoutes";
import { registerUserRoutes } from "./routes/userRoutes";
import { registerRestaurantRoutes } from "./routes/restaurantRoutes";
import { registerBranchRoutes } from "./routes/branchRoutes";
import { registerSavedBranchRoutes } from "./routes/savedBranchRoutes";
import { registerBookingRoutes } from "./routes/bookingRoutes";
import { registerRestaurantUserRoutes } from "./routes/restaurantUserRoutes";

  // Create a new Express application
const app = express();

export const httpServer = createServer(app);

// Setup WebSocket
setupWebSocket(httpServer);

// Middleware

app.use(corsMiddleware);
app.use(jsonMiddleware);
app.use(urlencodedMiddleware);
app.use(loggingMiddleware);

// Register authentication routes
registerAuthRoutes(app);

// Register user routes
registerUserRoutes(app);

// Register restaurant user routes
registerRestaurantUserRoutes(app);

// Register restaurant routes
registerRestaurantRoutes(app);

// Register branch routes
registerBranchRoutes(app);

// Register saved branch routes
registerSavedBranchRoutes(app);

// Register booking routes
registerBookingRoutes(app);

// Initialize the email service for sending notifications
// Using .catch() to handle any errors during setup
setupEmailTransporter().catch((err) => {
  console.error("Failed to initialize email service:", err);
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});


// Error handling middleware
app.use(errorHandler);

// Development vs Production setup
// In development: Set up Vite for hot reloading
// In production: Serve static files
(async () => {
  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  const PORT = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(PORT, "0.0.0.0", () => {
    log(`🚀 Serving on http://localhost:${PORT}`);
  });
})();


export default app;


