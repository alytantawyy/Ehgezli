
import { Request, Response } from "express";
import { createRestaurantBranch, deleteRestaurantBranch, getRestaurantBranchAvailability, getRestaurantBranchById, getRestaurantBranches, updateRestaurantBranch } from "@server/services/branchService";

//--- Get Restaurant Branches ---

export const getRestaurantBranchesController = async (req: Request, res: Response) => {
  const restaurantId = req.params.restaurantId;
  if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required" });
  
  const branches = await getRestaurantBranches(Number(restaurantId));
  if (!branches) return res.status(404).json({ message: "Branches not found" });
  res.json(branches);
};

//--- Get Restaurant Branch by ID ---

export const getRestaurantBranchByIdController = async (req: Request, res: Response) => {
  const branchId = req.params.branchId;
  const restaurantId = req.params.restaurantId;
  if (!branchId || !restaurantId) return res.status(400).json({ message: "Branch ID and Restaurant ID are required" });
  
  const branch = await getRestaurantBranchById(Number(branchId), Number(restaurantId));
  if (!branch) return res.status(404).json({ message: "Branch not found" });
  res.json(branch);
};
    
//--- Create Restaurant Branch ---

export const createRestaurantBranchController = async (req: Request, res: Response) => {
  const branch = await createRestaurantBranch(req.body);
  res.json(branch);
};
  
//--- Update Restaurant Branch ---

export const updateRestaurantBranchController = async (req: Request, res: Response) => {
  const branchId = req.params.branchId;
  const restaurantId = req.params.restaurantId;
  if (!branchId || !restaurantId) return res.status(400).json({ message: "Branch ID and Restaurant ID are required" });
  
  const branch = await updateRestaurantBranch(Number(branchId), Number(restaurantId), req.body);
  res.json(branch);
};
  
//--- Delete Restaurant Branch ---

export const deleteRestaurantBranchController = async (req: Request, res: Response) => {
  const branchId = req.params.branchId;
  const restaurantId = req.params.restaurantId;
  if (!branchId || !restaurantId) return res.status(400).json({ message: "Branch ID and Restaurant ID are required" });
  
  await deleteRestaurantBranch(Number(branchId), Number(restaurantId));
  res.json({ message: "Branch deleted successfully" });
};
  
//--- Get Restaurant Branch Availability ---

export const getRestaurantBranchAvailabilityController = async (req: Request, res: Response) => {
  const branchId = req.params.branchId;
  const date = new Date(req.params.date);
  if (!branchId || !date) return res.status(400).json({ message: "Branch ID and Date are required" });
  
  const availability = await getRestaurantBranchAvailability(Number(branchId), date);
  res.json(availability);
};
  