import { Express } from "express";
import * as branchController from "@server/controllers/branchController";

export function registerBranchRoutes(app: Express) {
  app.post("/api/branch", branchController.createRestaurantBranchController);
  app.get("/api/branch", branchController.getRestaurantBranchesController);
  app.get("/api/branch/all", branchController.getAllRestaurantBranchesController);
  app.get("/api/branch/:id", branchController.getRestaurantBranchByIdController);
  app.put("/api/branch/:id", branchController.updateRestaurantBranchController);
  app.delete("/api/branch/:id", branchController.deleteRestaurantBranchController);
  app.get("/api/branch/:id/availability", branchController.getRestaurantBranchAvailabilityController);
}