import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // API-only server, no client-side rendering needed
  app.use("*", (req, res, next) => {
    // Only handle API routes, return 404 for any other routes
    if (req.originalUrl.startsWith('/api')) {
      next();
    } else {
      res.status(404).json({ error: "Not found", message: "API server only" });
    }
  });
}

export function serveStatic(app: Express) {
  // API-only server, no static files to serve
  app.use("*", (req, res, next) => {
    // Only handle API routes, return 404 for any other routes
    if (req.originalUrl.startsWith('/api')) {
      next();
    } else {
      res.status(404).json({ error: "Not found", message: "API server only" });
    }
  });
}
