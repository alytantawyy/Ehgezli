
import { getSavedBranchIds, getUserSavedBranches, removeSavedBranch, saveBranch } from "@server/services/savedBranchService";
import { Request, Response } from "express";

//--- Get User Saved Branches ---

export const getUserSavedBranchesController = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  
  const savedBranches = await getUserSavedBranches(userId);
  res.json(savedBranches);
};

//--- Save Branch ---

export const saveBranchController = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const branchId = (req as any).params.branchId;
  
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  
  if (!branchId) return res.status(400).json({ message: "Branch ID is required" });
  
  await saveBranch(userId, branchId);
  res.json({ message: "Branch saved successfully" });
};

//--- Remove Saved Branch ---

export const removeSavedBranchController = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const branchId = (req as any).params.branchId;
  
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  
  if (!branchId) return res.status(400).json({ message: "Branch ID is required" });
  
  await removeSavedBranch(userId, branchId);
  res.json({ message: "Branch removed successfully" });
};

//--- Get Saved Branch IDs ---

export const getSavedBranchIdsController = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  
  const savedBranchIds = await getSavedBranchIds(userId);
  res.json(savedBranchIds);
};
  
  
    