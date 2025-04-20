import { Express } from "express";
import * as savedBranchController from "@server/controllers/savedBranchController";

export function registerSavedBranchRoutes(app: Express) {
  app.get("/api/saved-branch", savedBranchController.getSavedBranchIdsController);
  app.post("/api/saved-branch", savedBranchController.saveBranchController);
  app.delete("/api/saved-branch", savedBranchController.removeSavedBranchController);
}