import { Express } from "express";
import * as restaurantController from "@server/controllers/restaurantController";
import { authenticate } from "@server/middleware/authMiddleware";

export function registerRestaurantRoutes(app: Express) {
  app.get("/api/restaurants", restaurantController.getRestaurantsController);
  app.get("/api/restaurant", authenticate, restaurantController.getRestaurantProfileController);
  app.put("/api/restaurant", authenticate, restaurantController.updateRestaurantController);
  app.get("/api/restaurant/detailed/:restaurantId", restaurantController.getDetailedRestaurantController);
  app.post("/api/restaurant/search", restaurantController.searchRestaurantsController);
}