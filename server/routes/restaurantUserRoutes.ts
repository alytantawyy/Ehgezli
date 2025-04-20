import { Express } from "express";
import * as restaurantUserController from "@server/controllers/restaurantUserController";

export function registerRestaurantUserRoutes(app: Express) {
  app.get("/api/restaurant-user", restaurantUserController.getRestaurantUserController);
  app.post("/api/restaurant-user", restaurantUserController.createRestaurantUserController);
  app.put("/api/restaurant-user", restaurantUserController.updateRestaurantUserController);
  app.delete("/api/restaurant-user", restaurantUserController.deleteRestaurantUserController);
}