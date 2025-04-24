import { Express } from "express";
import * as branchController from "@server/controllers/branchController";
import { authenticate } from "@server/middleware/authMiddleware";

export function registerBranchRoutes(app: Express) {
  app.post("/api/branch", authenticate, branchController.createRestaurantBranchController);
  app.get("/api/branch/:restaurantId", branchController.getRestaurantBranchesController);
  app.get("/api/branches/all", branchController.getAllRestaurantBranchesController);
  app.put("/api/branch/:branchId", authenticate, branchController.updateRestaurantBranchController);
  app.delete("/api/branch/:branchId", authenticate, branchController.deleteRestaurantBranchController);
  app.get("/api/branch/:branchId/availability/:date", branchController.getRestaurantBranchAvailabilityController);
}