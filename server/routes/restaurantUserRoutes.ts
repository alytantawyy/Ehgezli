import { Express } from "express";
import * as restaurantUserController from "@server/controllers/restaurantUserController";
import { authenticate } from "@server/middleware/authMiddleware";

export function registerRestaurantUserRoutes(app: Express) {
  app.get("/api/restaurant-user", authenticate, restaurantUserController.getRestaurantUserController);
  app.put("/api/restaurant-user", authenticate, restaurantUserController.updateRestaurantUserController);
  app.delete("/api/restaurant-user", authenticate, restaurantUserController.deleteRestaurantUserController);
}