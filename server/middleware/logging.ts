import { log } from "console";
import { NextFunction, Request, Response } from "express";


// Logging middleware - tracks request duration and response data
export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Record the start time of the request
  const start = Date.now();
  const path = req.path;
  
  // Variable to store the JSON response for logging
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Override the default res.json method to capture the response
  const originalResJson = res.json;
  res.json = function (bodyJson: any) {
    // Store the response body for logging
    capturedJsonResponse = bodyJson;
    // Call the original json method with the same context and arguments
    return originalResJson.apply(res, [bodyJson]);
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
};