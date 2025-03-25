// Import required packages for database connection and management
import { Pool, neonConfig } from '@neondatabase/serverless';  // Neon is our PostgreSQL database provider
import { drizzle } from 'drizzle-orm/neon-serverless';       // Drizzle is our SQL toolkit/ORM
import ws from "ws";                                         // WebSocket package for real-time database connections
import * as schema from "@shared/schema";                    // Our database schema definitions

// Configure WebSocket settings for Neon database connection
// WebSockets allow for real-time, persistent connections to the database
neonConfig.webSocketConstructor = ws;  // Tell Neon to use the 'ws' package for WebSocket connections

// Security settings for database connection
neonConfig.useSecureWebSocket = true;   // Enable WSS (WebSocket Secure) - like HTTPS for WebSockets
neonConfig.pipelineTLS = true;          // Enable TLS (Transport Layer Security) for encrypted data transfer
neonConfig.pipelineConnect = false;     // Disable connection pipelining to prevent potential connection issues

// Check if database connection string exists in environment variables
// This is crucial for connecting to our database
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a connection pool to efficiently manage database connections
// A pool maintains multiple connections and reuses them instead of creating new ones for each query
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize Drizzle ORM with our connection pool and schema
// This creates a database interface we can use throughout our application
// The schema parameter tells Drizzle about our table structures and relationships
export const db = drizzle(pool, { schema });

/*
How this file works in our application:

1. Database Connection:
   - We use Neon, a serverless PostgreSQL provider
   - Connection is made via WebSocket for better performance
   - Security is ensured with TLS encryption

2. Connection Pool:
   - Instead of creating/closing connections for each request
   - Maintains a pool of reusable connections
   - Improves performance and reduces database load

3. ORM (Object-Relational Mapping):
   - Drizzle ORM helps us work with the database using TypeScript
   - Converts our TypeScript code into SQL queries
   - Provides type safety and better developer experience

4. Usage in other files:
   - Other files import { db } from './db'
   - Then use it like: await db.select().from(users)
   - Or: await db.insert(users).values({ ... })

Example usage:
```typescript
import { db } from './db';
import { users } from '@shared/schema';

// Fetch all users
const allUsers = await db.select().from(users);

// Insert new user
await db.insert(users).values({
  email: 'user@example.com',
  name: 'John Doe'
});
```
*/