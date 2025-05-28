import { Express } from "express";
import * as userController from "@server/controllers/userController";
import { authenticate } from "@server/middleware/authMiddleware";

export function registerUserRoutes(app: Express) {
  app.get("/api/user", authenticate, userController.getUserProfileController);
  app.put("/api/user", authenticate, userController.updateUserProfileController);
  app.delete("/api/user", authenticate, userController.deleteUserController);
  app.put("/api/user/location-permission", authenticate, userController.updateLocationPermissionController);
  app.get("/api/user/location-permission", authenticate, userController.getLocationPermissionController);
}