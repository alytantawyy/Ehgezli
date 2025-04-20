import { Express } from "express";
import * as userController from "@server/controllers/userController";

export function registerUserRoutes(app: Express) {
  app.get("/api/user", userController.getUserProfileController);
  app.put("/api/user/:id", userController.updateUserProfileController);
  app.delete("/api/user/:id", userController.deleteUserController);
  app.get("/api/user/location", userController.getUserLocationController);
  app.put("/api/user/location", userController.updateUserLocationController);
}