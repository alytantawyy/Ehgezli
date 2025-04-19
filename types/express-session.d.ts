

// server/types/express.d.ts (or just express.d.ts in your root/server directory)
import { User, RestaurantUser } from "@server/db/schema";

declare global {
  namespace Express {
    interface Request {
      user?: User | RestaurantUser & { type: 'user' | 'restaurant' };
    }
  }
}