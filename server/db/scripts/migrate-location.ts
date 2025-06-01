import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in .env file');
}

const sql_client = neon(process.env.DATABASE_URL);
const db = drizzle(sql_client);

async function migrate() {
  console.log('Starting location features migration...');

  try {
    // Add location columns to restaurant_branches table
    console.log('Adding location columns to restaurant_branches table...');
    await db.execute(sql`
      ALTER TABLE restaurant_branches 
      ADD COLUMN IF NOT EXISTS latitude TEXT,
      ADD COLUMN IF NOT EXISTS longitude TEXT;
    `);
    console.log('Successfully added location columns to restaurant_branches table');

    // Add location columns to users table
    console.log('Adding location columns to users table...');
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_latitude TEXT,
      ADD COLUMN IF NOT EXISTS last_longitude TEXT,
      ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS location_permission_granted BOOLEAN DEFAULT FALSE;
    `);
    console.log('Successfully added location columns to users table');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
