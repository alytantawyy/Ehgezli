import { Express } from "express";
import * as savedBranchController from "@server/controllers/savedBranchController";
import { authenticate } from "@server/middleware/authMiddleware";

export function registerSavedBranchRoutes(app: Express) {
  app.get("/api/saved-branch", authenticate, savedBranchController.getUserSavedBranchesController);
  app.get("/api/saved-branch/ids", authenticate, savedBranchController.getSavedBranchIdsController);
  app.post("/api/saved-branch/:branchId", authenticate, savedBranchController.saveBranchController);
  app.delete("/api/saved-branch/:branchId", authenticate, savedBranchController.removeSavedBranchController);
}