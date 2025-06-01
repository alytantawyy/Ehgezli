import { deleteRestaurantUser, getRestaurantUser, updateRestaurantUserDetails } from "@server/services/restaurantUserService";
import { Request, Response } from "express";

//--- Get Restaurant User ---

export const getRestaurantUserController = async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  
  // Check if user exists and is a restaurant
  if (!authUser || authUser.type !== 'restaurant') {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const restaurantUserId = authUser.id;
  
  try {
    const restaurantUser = await getRestaurantUser(restaurantUserId);
    res.json(restaurantUser);
  } catch (error) {
    console.error('Error getting restaurant user:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



//--- Update Restaurant User ---

export const updateRestaurantUserController = async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  
  // Check if user exists and is a restaurant
  if (!authUser || authUser.type !== 'restaurant') {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const restaurantUserId = authUser.id;
  
  try {
    const { email, name } = req.body;
    const restaurantUser = await updateRestaurantUserDetails(restaurantUserId, { email, name });
    res.json(restaurantUser);
  } catch (error) {
    console.error('Error updating restaurant user:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//--- Delete Restaurant User ---

export const deleteRestaurantUserController = async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  
  // Check if user exists and is a restaurant
  if (!authUser || authUser.type !== 'restaurant') {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const restaurantUserId = authUser.id;
  
  try {
    await deleteRestaurantUser(restaurantUserId);
    res.json({ message: "Restaurant user deleted successfully" });
  } catch (error) {
    console.error('Error deleting restaurant user:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};