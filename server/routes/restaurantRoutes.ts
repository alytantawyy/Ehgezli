import { Express } from "express";
import * as restaurantController from "@server/controllers/restaurantController";

export function registerRestaurantRoutes(app: Express) {
  app.post("/api/restaurant", restaurantController.createRestaurantController);
  app.get("/api/restaurant", restaurantController.getRestaurantsController);
  app.get("/api/restaurant/:id", restaurantController.getRestaurantProfileController);
  app.put("/api/restaurant/:id", restaurantController.updateRestaurantController);
  app.delete("/api/restaurant/:id", restaurantController.deleteRestaurantController);
  app.get("/api/restaurant/:id/detailed", restaurantController.getDetailedRestaurantController);
  app.post("/api/restaurant/search", restaurantController.searchRestaurantsController);
}