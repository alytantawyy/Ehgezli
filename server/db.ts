import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon database
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true; // Enable secure WebSocket
neonConfig.pipelineTLS = true; // Enable TLS pipeline
neonConfig.pipelineConnect = false; // Don't enable connection pipelining to avoid issues

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });