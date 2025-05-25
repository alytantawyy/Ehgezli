import { Request, Response } from "express";
import { createRestaurantBranch, deleteRestaurantBranch, getAllBranches, getBranchById, getRestaurantBranchAvailability, getRestaurantBranchById, getRestaurantBranches, searchBranches, updateRestaurantBranch } from "@server/services/branchService";
import { getDetailedRestaurant } from "@server/services/restaurantService";
import {deleteBookingSettings, deleteTimeSlots, deleteBooking, deleteBookingOverride} from "@server/services/bookingService";

//--Get All Branches--

export const getAllBranchesController = async (req: Request, res: Response) => {
  const branches = await getAllBranches();
  res.json(branches);
};

//--- Get Restaurant Branches ---

export const getRestaurantBranchesController = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.params.restaurantId;
    
    // Validate restaurantId is a valid number
    if (!restaurantId || isNaN(Number(restaurantId))) {
      return res.status(400).json({ message: "Valid restaurant ID is required" });
    }
    
    const branches = await getRestaurantBranches(Number(restaurantId));
    res.json(branches);
  } catch (error) {
    console.error('Error fetching restaurant branches:', error);
    res.status(500).json({ message: "Failed to fetch restaurant branches" });
  }
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
  const restaurantId = (req as any).user.id;
  if (!restaurantId) return res.status(401).json({ message: "Unauthorized - Restaurant ID is required" });
  
  try {
    // Verify the restaurant exists
    const restaurant = await getDetailedRestaurant(Number(restaurantId));
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    
    // Extract booking settings and generateDays from request
    const { bookingSettings, generateDays = 30, ...branchData } = req.body;
    
    // Validate booking settings are provided
    if (!bookingSettings || typeof bookingSettings !== 'object') {
      return res.status(400).json({ message: "Booking settings are required" });
    }
    
    // Required booking settings fields
    const requiredFields = ['openTime', 'closeTime', 'interval', 'maxSeatsPerSlot', 'maxTablesPerSlot'];
    const missingFields = requiredFields.filter(field => !(field in bookingSettings));
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required booking settings: ${missingFields.join(', ')}` 
      });
    }
    
    // Create branch with booking settings and time slots
    const result = await createRestaurantBranch(
      { ...branchData, restaurantId },
      bookingSettings,
      generateDays
    );
    
    // Return success response with created data
    res.json({
      ...result.branch,
      bookingSettings: result.settings,
      message: `Branch created successfully with booking settings and ${result.slotsGenerated} time slots`
    });
  } catch (error) {
    console.error('Error creating branch:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create branch';
    res.status(500).json({ message: errorMessage });
  }
};

//--- Update Restaurant Branch ---

export const updateRestaurantBranchController = async (req: Request, res: Response) => {
  const branchId = req.params.branchId;
  const restaurantId = (req as any).user.id;
  if (!branchId || !restaurantId) return res.status(400).json({ message: "Branch ID and Restaurant ID are required" });

  const restaurant = await getDetailedRestaurant(Number(restaurantId));
  if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

  const branchIsOwned = restaurant.branches.some(branch => branch.id === Number(branchId));
  if (!branchIsOwned) return res.status(403).json({ message: "Unauthorized" });
  
  const branch = await updateRestaurantBranch(Number(branchId), Number(restaurantId), req.body);
  res.json(branch);
};
  
//--- Delete Restaurant Branch ---

export const deleteRestaurantBranchController = async (req: Request, res: Response) => {
  const branchId = req.params.branchId;
  const restaurantId = (req as any).user.id;
  if (!branchId || !restaurantId) return res.status(400).json({ message: "Branch ID and Restaurant ID are required" });
  
  const restaurant = await getDetailedRestaurant(Number(restaurantId));
  if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
  
  const branchIsOwned = restaurant.branches.some(branch => branch.id === Number(branchId));
  if (!branchIsOwned) return res.status(403).json({ message: "Unauthorized" });
  
  await deleteBookingSettings(Number(branchId));
  await deleteBookingOverride(Number(branchId));
  await deleteBooking(Number(branchId));
  await deleteTimeSlots(Number(branchId));
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

export const getBranchByIdController = async (req: Request, res: Response) => {
  const branchId = req.params.branchId;
  if (!branchId) return res.status(400).json({ message: "Branch ID is required" });
  
  try {
    const branch = await getBranchById(Number(branchId));
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json(branch);
  } catch (error) {
    console.error("Error fetching branch:", error);
    res.status(500).json({ message: "Failed to fetch branch details" });
  }
}
  

//-- Search Branches --

export const searchBranchesController = async (req: Request, res: Response) => {
  const branches = await searchBranches(req.body);
  if (!branches) return res.status(404).json({ message: "Branches not found" });
  res.json(branches);
};