import { Express } from "express";
import * as authController from "@server/controllers/authController";
import { createUserController } from "@server/controllers/userController";
import { createRestaurantController } from "@server/controllers/restaurantController";

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/login", authController.verifyUserLoginController);
  app.post("/api/auth/restaurant-login", authController.verifyRestaurantLoginController);
  app.post("/api/auth/register", createUserController);
  app.post("/api/auth/restaurant-register", createRestaurantController);
  app.post("/api/auth/password-reset", authController.createPasswordResetTokenController);
  app.post("/api/auth/restaurant-password-reset", authController.createRestaurantPasswordResetTokenController);
  app.post("/api/auth/validate-password-reset-token", authController.validatePasswordResetTokenController);
  app.post("/api/auth/validate-restaurant-password-reset-token", authController.validateRestaurantPasswordResetTokenController);
  app.post("/api/auth/mark-password-reset-token-as-used", authController.markPasswordResetTokenAsUsedController);
  app.post("/api/auth/mark-restaurant-password-reset-token-as-used", authController.markRestaurantPasswordResetTokenAsUsedController);
  app.post("/api/auth/update-user-password", authController.updateUserPasswordController);
  app.post("/api/auth/update-restaurant-password", authController.updateRestaurantPasswordController);
}